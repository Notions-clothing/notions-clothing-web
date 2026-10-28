import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature verification if secret is provided
    if (razorpaySecret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: 'Payment signature verification failed' },
          { status: 400 }
        );
      }
    }

    // Persist verified order to database
    const confirmedOrder = await saveOrder({
      order_number: orderData.orderNumber,
      customer_name: orderData.customer.name,
      customer_email: orderData.customer.email,
      customer_phone: orderData.customer.phone,
      shipping_address: orderData.customer.shipping_address,
      subtotal: orderData.subtotal,
      shipping_amount: orderData.shippingAmount,
      discount_amount: 0,
      total_amount: orderData.amount,
      currency: 'INR',
      status: 'confirmed',
      payment_status: 'paid',
      items: orderData.items,
      razorpay_order_id,
      razorpay_payment_id,
    });

    // Trigger Brevo confirmation email
    await sendOrderConfirmationEmail(confirmedOrder);

    return NextResponse.json({
      success: true,
      order: confirmedOrder,
    });
  } catch (err: any) {
    console.error('Verification error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
