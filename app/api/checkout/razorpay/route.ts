import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customer || !customer.email || !customer.name || !customer.phone) {
      return NextResponse.json({ error: 'Missing customer contact details' }, { status: 400 });
    }

    // Server-side authoritative price calculation (never trust client prices!)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const realProduct = await getProductBySlug(item.productId || item.product?.id || item.product?.slug);
      if (!realProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = realProduct.price;
      subtotal += unitPrice * qty;

      validatedItems.push({
        product_id: realProduct.id,
        product_name: realProduct.name,
        sku: realProduct.sku,
        variant_label: item.selectedSize || 'Standard',
        unit_price: unitPrice,
        quantity: qty,
        line_total: unitPrice * qty,
        image_url: realProduct.images?.[0]?.image_url,
      });
    }

    const shippingAmount = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
    const totalAmount = subtotal + shippingAmount;
    const orderNumber = `NOT-${Date.now().toString().slice(-6)}`;

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_sim_${Date.now()}`;

    // If Razorpay live/test credentials are configured, create real Razorpay Order
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
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
        } else {
          console.error('Razorpay API error response:', await rzpRes.text());
        }
      } catch (e) {
        console.error('Failed to create Razorpay order with gateway:', e);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      razorpayOrderId,
      keyId: razorpayKeyId || 'rzp_test_placeholder',
      amount: totalAmount,
      amountInPaise: Math.round(totalAmount * 100),
      currency: 'INR',
      subtotal,
      shippingAmount,
      items: validatedItems,
      hasRealCredentials: !!(razorpayKeyId && razorpaySecret),
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
