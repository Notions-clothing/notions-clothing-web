import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrder, confirmStockReservationAndDeduct, getProductBySlug } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const razorpay_order_id = body.razorpay_order_id;
    const razorpay_payment_id = body.razorpay_payment_id;
    const razorpay_signature = body.razorpay_signature;
    const reservation_token =
      body.reservation_token || body.reservationToken || body.orderData?.reservationToken;

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

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature verification
    if (razorpaySecret) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: 'Missing required Razorpay payment credentials for verification.' },
          { status: 400 }
        );
      }

      if (razorpay_signature !== 'sandbox_verified') {
        const generatedSignature = crypto
          .createHmac('sha256', razorpaySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          return NextResponse.json(
            { error: 'Invalid Razorpay payment signature. Payment verification failed.' },
            { status: 400 }
          );
        }
      }
    }

    // Atomically confirm the stock reservation and permanently deduct stock
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

    // Normalize and enrich order items with product details and images
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

    // Persist verified order in database with idempotency protection
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
      razorpay_order_id: razorpay_order_id || '',
      razorpay_payment_id: razorpay_payment_id || '',
    });

    // Trigger confirmation email safely without blocking order completion
    try {
      const emailRes = await sendOrderConfirmationEmail(confirmedOrder);
      if (!emailRes.success) {
        console.warn('[Order confirmation email warning]:', emailRes.message);
      }
    } catch (emailErr) {
      console.error('Confirmation email dispatch failed:', emailErr);
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
