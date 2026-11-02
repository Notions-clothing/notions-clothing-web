import { NextResponse } from 'next/server';
import {
  getProductBySlug,
  getSiteSettings,
  createStockReservation,
  linkRazorpayOrderIdToReservation,
} from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer, existingReservationToken } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customer || !customer.email || !customer.name || !customer.phone) {
      return NextResponse.json({ error: 'Missing customer contact details' }, { status: 400 });
    }

    const orderNumber = `NOT-${Date.now().toString().slice(-6)}`;

    // 1. Authoritative Database-Level Stock Locking & Reservation
    const reservationResult = await createStockReservation({
      items: items.map((item) => ({
        productId: item.productId || item.product?.id || item.product?.slug,
        selectedColor: item.selectedColor,
        selectedColorId: item.selectedColorId,
        selectedColorHex: item.selectedColorHex,
        selectedSize: item.selectedSize,
        selectedSizeId: item.selectedSizeId,
        variant_label: item.selectedSize || 'Standard',
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      })),
      customerEmail: customer.email,
      orderNumber,
      existingReservationToken,
      durationMinutes: 10,
    });

    if (!reservationResult.success || !reservationResult.reservation) {
      return NextResponse.json(
        {
          error: reservationResult.error || 'One or more items are currently out of stock or reserved.',
          isReserved: reservationResult.isReserved,
          availableStock: reservationResult.availableStock,
        },
        { status: 409 }
      );
    }

    const reservation = reservationResult.reservation;
    const reservationToken = reservation.reservation_token;

    // 2. Compute validated totals from the reserved items
    let subtotal = 0;
    const validatedItems = [];

    for (const resvItem of reservation.items) {
      const realProduct = await getProductBySlug(resvItem.product_id, reservationToken);
      const unitPrice = realProduct?.price ?? resvItem.unit_price ?? 0;
      const lineTotal = unitPrice * resvItem.quantity;
      subtotal += lineTotal;

      const matchingClientItem = items.find(
        (i) => (i.productId || i.product?.id || i.product?.slug) === resvItem.product_id
      );

      validatedItems.push({
        product_id: resvItem.product_id,
        product_name: resvItem.product_name,
        sku: resvItem.sku || realProduct?.sku || '',
        variant_label: resvItem.variant_label || 'Standard',
        selected_size_id: resvItem.selected_size_id,
        selected_color: resvItem.selected_color,
        selected_color_id: resvItem.selected_color_id,
        selected_color_hex: resvItem.selected_color_hex,
        unit_price: unitPrice,
        quantity: resvItem.quantity,
        line_total: lineTotal,
        image_url: matchingClientItem?.selectedColorImage || realProduct?.images?.[0]?.image_url,
      });
    }

    const settings = await getSiteSettings();
    const freeThreshold = Number(settings.free_shipping_threshold ?? 1999);
    const flatRate = Number(settings.flat_shipping_rate ?? 99);

    const shippingAmount = subtotal >= freeThreshold || subtotal === 0 ? 0 : flatRate;
    const totalAmount = subtotal + shippingAmount;

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_sim_${Date.now()}`;
    let rzpCreated = false;

    // Create real Razorpay Order using live/test credentials
    if (razorpayKeyId && razorpaySecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100), // in paise
            currency: 'INR',
            receipt: orderNumber,
            notes: {
              customer_name: customer.name,
              customer_email: customer.email,
              reservation_token: reservationToken,
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
          rzpCreated = true;
        } else {
          console.error('Razorpay API error response:', await rzpRes.text());
        }
      } catch (e) {
        console.error('Failed to create Razorpay order with gateway:', e);
      }
    }

    // Link Razorpay Order ID to the active stock reservation
    await linkRazorpayOrderIdToReservation(reservationToken, razorpayOrderId);

    return NextResponse.json({
      success: true,
      orderNumber,
      razorpayOrderId,
      reservationToken,
      expiresAt: reservation.expires_at,
      keyId: razorpayKeyId || 'rzp_test_placeholder',
      amount: totalAmount,
      amountInPaise: Math.round(totalAmount * 100),
      currency: 'INR',
      subtotal,
      shippingAmount,
      items: validatedItems,
      hasRealCredentials: rzpCreated,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
