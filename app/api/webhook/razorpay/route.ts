import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOrdersAdmin, saveOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

const processedEvents = new Set<string>();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Cryptographic validation of raw body with HMAC-SHA256
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || `${event.event}_${Date.now()}`;

    // Enforce idempotency: prevent repeated processing
    if (processedEvents.has(eventId)) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }
    processedEvents.add(eventId);

    // Event handling
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const rzpOrderId = payment.order_id;

      const orders = await getOrdersAdmin();
      const matchedOrder = orders.find((o) => o.razorpay_order_id === rzpOrderId);

      if (matchedOrder && matchedOrder.payment_status !== 'paid') {
        const updated = await saveOrder({
          ...matchedOrder,
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id: payment.id,
        });

        // Trigger Brevo email
        await sendOrderConfirmationEmail(updated);
      }
    } else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const rzpOrderId = payment.order_id;

      const orders = await getOrdersAdmin();
      const matchedOrder = orders.find((o) => o.razorpay_order_id === rzpOrderId);

      if (matchedOrder) {
        await saveOrder({
          ...matchedOrder,
          payment_status: 'failed',
        });
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('Razorpay Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
