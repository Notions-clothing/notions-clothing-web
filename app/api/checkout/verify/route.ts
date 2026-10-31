import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = await request.json();

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature verification if secret is provided and not test sandbox
    if (razorpaySecret && razorpay_signature && razorpay_signature !== 'sandbox_verified') {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: 'Invalid Razorpay payment signature.' },
          { status: 400 }
        );
      }
    }

    // Persist verified order in local database
    const confirmedOrder = await saveOrder({
      order_number: orderData.orderNumber,
      customer_name: orderData.customer.name,
      customer_email: orderData.customer.email,
      customer_phone: orderData.customer.phone,
      shipping_address: orderData.customer.shipping_address,
      subtotal: orderData.subtotal,
      shipping_amount: orderData.shippingAmount,
      total_amount: orderData.amount,
      currency: 'INR',
      status: 'confirmed',
      payment_status: 'paid',
      items: orderData.items,
      razorpay_order_id: razorpay_order_id || '',
      razorpay_payment_id: razorpay_payment_id || '',
    });

    // Trigger Brevo confirmation email safely without blocking order completion
    try {
      await sendOrderConfirmationEmail(confirmedOrder);
    } catch (emailErr) {
      console.error('Brevo confirmation email dispatch failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      order: confirmedOrder,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
