import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  saveOrder,
  confirmStockReservationAndDeduct,
  getProductBySlug,
  getOrdersAdmin,
} from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { Order } from '@/types/database';

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or missing JSON payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const razorpay_order_id = (body.razorpay_order_id || '').trim();
    const razorpay_payment_id = (body.razorpay_payment_id || '').trim();
    const razorpay_signature = (body.razorpay_signature || '').trim();
    const reservation_token =
      body.reservation_token || body.reservationToken || body.orderData?.reservationToken;

    // 1. Mandatory Payment Credential Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error:
            'Missing required Razorpay payment credentials (razorpay_order_id, razorpay_payment_id, razorpay_signature).',
        },
        { status: 400 }
      );
    }

    // Support both flat payload structure and nested orderData wrapper
    const nestedData = body.orderData || body;
    const orderNumber =
      nestedData.orderNumber ||
      nestedData.order_number ||
      body.orderNumber ||
      `NOT-${Date.now().toString().slice(-6)}`;

    const customer = nestedData.customer || body.customer || {};
    const items = nestedData.items || body.items || [];
    const subtotal = nestedData.subtotal ?? body.subtotal ?? 0;
    const shippingAmount =
      nestedData.shippingAmount ??
      nestedData.shippingFee ??
      body.shippingAmount ??
      body.shippingFee ??
      0;
    const totalAmount =
      nestedData.totalAmount ??
      nestedData.amount ??
      body.totalAmount ??
      subtotal + shippingAmount;

    // 2. Cryptographic Server-Side Signature Verification
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error('RAZORPAY_KEY_SECRET environment variable is missing.');
      return NextResponse.json(
        { error: 'Payment gateway configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(razorpay_signature, 'utf8');

    const isValidSignature =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid Razorpay payment signature. Payment verification failed.' },
        { status: 400 }
      );
    }

    // 3. Idempotency Check: Prevent duplicate payment processing
    const allExistingOrders = await getOrdersAdmin();
    const existingOrder = allExistingOrders.find(
      (o: Order) =>
        (orderNumber && o.order_number === orderNumber) ||
        (razorpay_order_id && o.razorpay_order_id === razorpay_order_id)
    );

    if (existingOrder && existingOrder.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        order: existingOrder,
        alreadyProcessed: true,
      });
    }

    // 4. Atomically confirm stock reservation and deduct physical inventory
    const confirmResult = await confirmStockReservationAndDeduct({
      reservationToken: reservation_token,
      razorpayOrderId: razorpay_order_id,
      orderNumber,
      orderData: {
        ...nestedData,
        orderNumber,
        customer,
        items,
        subtotal,
        shippingAmount,
        totalAmount,
      },
    });

    if (!confirmResult.success && !confirmResult.alreadyProcessed) {
      return NextResponse.json(
        {
          error:
            confirmResult.error ||
            'Your checkout reservation expired and the remaining item was claimed. Please contact support.',
        },
        { status: 409 }
      );
    }

    // 5. Normalize and enrich order items with product details and images
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const prodId = item.product_id || item.productId || item.product?.id || '';
        let realProduct = null;
        if (prodId) {
          try {
            realProduct = await getProductBySlug(prodId);
          } catch (e) {}
        }

        const name =
          item.product_name ||
          item.productName ||
          item.name ||
          realProduct?.name ||
          'Product';

        const colorHex = item.selected_color_hex || item.selectedColorHex;
        const colorName = item.selected_color || item.selectedColor;

        let img =
          item.image_url ||
          item.imageUrl ||
          item.image ||
          item.selectedColorImage;

        if (!img && realProduct) {
          if (colorName && realProduct.colors) {
            const matchedColor = realProduct.colors.find(
              (c: any) => c.name?.toLowerCase() === colorName.toLowerCase()
            );
            if (matchedColor?.images?.[0]?.image_url) {
              img = matchedColor.images[0].image_url;
            }
          }
          if (!img && realProduct.images?.[0]?.image_url) {
            img = realProduct.images[0].image_url;
          }
        }

        const unitPrice = Number(
          item.unit_price ??
          item.unitPrice ??
          item.price ??
          realProduct?.price ??
          0
        );

        const qty = Number(item.quantity || 1);

        return {
          product_id: prodId,
          product_name: name,
          sku: item.sku || realProduct?.sku || '',
          variant_label: item.variant_label || item.variantLabel || item.selectedSize || 'Standard',
          selected_size_id: item.selected_size_id || item.selectedSizeId,
          selected_color: colorName,
          selected_color_id: item.selected_color_id || item.selectedColorId,
          selected_color_hex: colorHex,
          unit_price: unitPrice,
          quantity: qty,
          line_total: unitPrice * qty,
          image_url: img || '',
        };
      })
    );

    // 6. Persist verified order in database with status 'confirmed' and payment_status 'paid'
    const confirmedOrder = await saveOrder({
      order_number: orderNumber,
      customer_name: customer.name || body.customer_name || body.customerName || 'Guest Customer',
      customer_email: (customer.email || body.customer_email || body.customerEmail || '').trim(),
      customer_phone: customer.phone || body.customer_phone || body.customerPhone || '',
      shipping_address: customer.shipping_address || body.shipping_address,
      subtotal,
      shipping_amount: shippingAmount,
      total_amount: totalAmount,
      currency: 'INR',
      status: 'confirmed',
      payment_status: 'paid',
      items: enrichedItems,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
    });

    // 7. Trigger confirmation email safely without blocking order completion
    try {
      const emailRes = await sendOrderConfirmationEmail(confirmedOrder);
      if (!emailRes.success) {
        console.warn('[Order confirmation email warning]:', emailRes.message);
      }
    } catch (emailErr) {
      console.error('Confirmation email dispatch failed:', emailErr);
    }

    // 8. Return response without exposing secrets or signatures
    return NextResponse.json({
      success: true,
      order: confirmedOrder,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification encountered an internal error' },
      { status: 500 }
    );
  }
}
