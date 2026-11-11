import { NextRequest, NextResponse } from 'next/server';
import { getOrdersAdmin } from '@/lib/db';
import { Order } from '@/types/database';

// In-memory rate limiting map: IP -> { count, resetAt }
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const lookupAttempts = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LOOKUP_ATTEMPTS = 10; // Max 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now();

  // Periodic cleanup of expired entries
  if (lookupAttempts.size > 1000) {
    for (const [key, entry] of lookupAttempts.entries()) {
      if (now > entry.resetAt) lookupAttempts.delete(key);
    }
  }

  const record = lookupAttempts.get(ip);
  if (!record || now > record.resetAt) {
    lookupAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_LOOKUP_ATTEMPTS;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••••';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  const last4 = digits.slice(-4);
  return `•••••• ${last4}`;
}

export async function GET(req: NextRequest) {
  try {
    // 1. IP-based rate limiting to prevent enumeration attacks
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many lookup requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Extract and validate parameters
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();

    // Check if requester has authenticated admin session
    const adminCookie = req.cookies.get('notions_admin_auth');
    const isAdmin = adminCookie?.value === 'authenticated';

    if (!isAdmin) {
      // Guest lookup strictly requires BOTH order number AND email
      if (!orderNumber || !email) {
        return NextResponse.json(
          { error: 'Both order number and verified customer email are required for order lookup.' },
          { status: 400 }
        );
      }

      // Format validation to prevent malformed or injection payloads
      const cleanNum = orderNumber.replace(/^#/, '');
      if (cleanNum.length < 3 || cleanNum.length > 64 || !/^[a-zA-Z0-9#_-]+$/.test(cleanNum)) {
        return NextResponse.json(
          { error: 'Invalid order number format.' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.length > 255 || !emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid customer email address format.' },
          { status: 400 }
        );
      }
    } else if (!orderNumber && !email) {
      return NextResponse.json(
        { error: 'Order number or email is required.' },
        { status: 400 }
      );
    }

    // 3. Query orders
    const allOrders = await getOrdersAdmin();
    const cleanNum = (orderNumber || '').replace(/^#/, '').toLowerCase();

    const order = allOrders.find((o: Order) => {
      const matchNum =
        !cleanNum ||
        (o.order_number || '').replace(/^#/, '').toLowerCase() === cleanNum ||
        o.id.toLowerCase() === cleanNum;

      const matchEmail =
        !email ||
        (o.customer_email || '').toLowerCase() === email;

      return matchNum && matchEmail;
    });

    if (!order) {
      // Use generic error response to prevent user/order enumeration
      return NextResponse.json(
        { error: 'Order not found with the provided details.' },
        { status: 404 }
      );
    }

    // 4. Sanitize and return minimum required information (Zero unnecessary PII exposure)
    const sanitizedOrder = {
      id: order.id,
      order_number: order.order_number,
      created_at: order.created_at,
      status: order.status,
      customer_name: order.customer_name,
      customer_email: isAdmin ? order.customer_email : maskEmail(order.customer_email || ''),
      customer_phone: isAdmin ? order.customer_phone : maskPhone(order.customer_phone || ''),
      shipping_address: order.shipping_address
        ? {
            street: order.shipping_address.street || '',
            city: order.shipping_address.city || '',
            state: order.shipping_address.state || '',
            postal_code: order.shipping_address.postal_code || '',
            country: order.shipping_address.country || 'India',
          }
        : null,
      subtotal: order.subtotal,
      shipping_amount: order.shipping_amount,
      total_amount: order.total_amount,
      currency: order.currency || 'INR',
      tracking_carrier: order.tracking_carrier || null,
      tracking_number: order.tracking_number || null,
      tracking_url: order.tracking_url || null,
      items: (order.items || []).map((item: any) => ({
        id: item.id || item.product_id,
        product_name: item.product_name || item.productName || item.name || 'Men’s Apparel',
        variant_label: item.variant_label || item.variantLabel || item.selectedSize || '',
        selected_color: item.selected_color || item.selectedColor || '',
        selected_color_hex: item.selected_color_hex || item.selectedColorHex || '',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price ?? item.price ?? 0),
        line_total: Number(item.line_total ?? (item.unit_price ?? item.price ?? 0) * (item.quantity || 1)),
        image_url: item.image_url || item.imageUrl || item.image || item.selectedColorImage || '',
      })),
    };

    return NextResponse.json({
      success: true,
      order: sanitizedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lookup error' }, { status: 500 });
  }
}
