import { NextRequest, NextResponse } from 'next/server';
import { getOrdersAdmin, saveOrder, deleteOrder } from '@/lib/db';
import { sendOrderStatusEmail } from '@/lib/email';
import { Order } from '@/types/database';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * Validates whether the incoming request is from an authorized administrator.
 * Reuses both the existing HTTP-only admin cookie and Supabase session auth.
 * Returns { authorized: true } or appropriate 401/403 status and message.
 */
async function checkAdminAuthorization(
  req: NextRequest
): Promise<{ authorized: boolean; status?: number; error?: string }> {
  // 1. Check HTTP-only admin session cookie established via /api/admin/auth
  const adminCookie = req.cookies.get('notions_admin_auth');
  if (adminCookie?.value === 'authenticated') {
    return { authorized: true };
  }

  // 2. Check Supabase authenticated session
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@notionsclothing.com').toLowerCase();
      const userRole = user.app_metadata?.role || user.user_metadata?.role;
      const isAdmin = userRole === 'admin' || user.email?.toLowerCase() === adminEmail;

      if (isAdmin) {
        return { authorized: true };
      }
      // Authenticated, but lacking administrator role
      return {
        authorized: false,
        status: 403,
        error: 'Forbidden: Administrative privileges required',
      };
    }
  } catch {
    // Non-blocking fallback to customer session check
  }

  // 3. Check customer session cookie (authenticated non-admin)
  const customerSession = req.cookies.get('notions_customer_session');
  if (customerSession?.value) {
    try {
      const sessionData = JSON.parse(Buffer.from(customerSession.value, 'base64').toString('utf8'));
      if (sessionData?.id) {
        return {
          authorized: false,
          status: 403,
          error: 'Forbidden: Administrative privileges required',
        };
      }
    } catch {
      // Invalid format
    }
  }

  // 4. Anonymous / Unauthenticated
  return {
    authorized: false,
    status: 401,
    error: 'Unauthorized: Authentication required',
  };
}

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuthorization(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const orders = await getOrdersAdmin();
  return NextResponse.json(orders);
}

const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuthorization(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const data = await req.json();
    const allOrders = await getOrdersAdmin();
    const existing: Order | undefined = allOrders.find(
      (o) => (data.id && o.id === data.id) || (data.order_number && o.order_number === data.order_number)
    );

    if (!existing && !data.order_number) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 1. Validate Target Status
    if (data.status && !VALID_ORDER_STATUSES.includes(data.status)) {
      return NextResponse.json(
        { error: `Invalid order status '${data.status}'. Valid statuses: ${VALID_ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // 2. Validate Required Shipping Details when selecting 'shipped'
    const targetStatus = data.status || existing?.status;
    if (targetStatus === 'shipped') {
      const carrier = (data.tracking_carrier !== undefined ? data.tracking_carrier : (existing?.tracking_carrier || '')).trim();
      const trackingNum = (data.tracking_number !== undefined ? data.tracking_number : (existing?.tracking_number || '')).trim();

      if (!carrier || !trackingNum) {
        return NextResponse.json(
          {
            error: 'Courier Name and Shipping / Tracking ID (AWB) are required when marking an order as Shipped.',
          },
          { status: 400 }
        );
      }
    }

    // 3. Keep Payment Status Separate from Order Status
    const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const newPaymentStatus =
      data.payment_status && allowedPaymentStatuses.includes(data.payment_status)
        ? data.payment_status
        : (existing?.payment_status || 'pending');

    const mergedData = {
      ...(existing || {}),
      ...data,
      id: existing?.id || data.id,
      order_number: existing?.order_number || data.order_number,
      customer_email: data.customer_email || existing?.customer_email || '',
      customer_name: data.customer_name || existing?.customer_name || 'Guest Customer',
      customer_phone: data.customer_phone || existing?.customer_phone || '',
      shipping_address: data.shipping_address || existing?.shipping_address,
      items: (data.items && data.items.length > 0) ? data.items : (existing?.items || []),
      total_amount: data.total_amount ?? existing?.total_amount ?? 0,
      subtotal: data.subtotal ?? existing?.subtotal ?? 0,
      shipping_amount: data.shipping_amount ?? existing?.shipping_amount ?? 0,
      status: targetStatus,
      payment_status: newPaymentStatus,
      tracking_carrier: data.tracking_carrier !== undefined ? data.tracking_carrier.trim() : (existing?.tracking_carrier || ''),
      tracking_number: data.tracking_number !== undefined ? data.tracking_number.trim() : (existing?.tracking_number || ''),
      tracking_url: data.tracking_url !== undefined ? data.tracking_url.trim() : (existing?.tracking_url || ''),
    };

    const saved = await saveOrder(mergedData);

    // 4. Handle Shipping Notification Email
    const explicitSendRequested = Boolean(data.send_shipping_email);
    const transitionedToShipped = existing && existing.status !== 'shipped' && saved.status === 'shipped';

    let finalOrder = saved;

    if (explicitSendRequested || transitionedToShipped) {
      const orderToEmail: Order = {
        ...saved,
        customer_email: (saved.customer_email || existing?.customer_email || '').trim(),
        customer_name: saved.customer_name || existing?.customer_name || 'Valued Patron',
        tracking_carrier: saved.tracking_carrier || data.tracking_carrier || '',
        tracking_number: saved.tracking_number || data.tracking_number || '',
        tracking_url: saved.tracking_url || data.tracking_url || '',
      };

      try {
        const emailResult = await sendOrderStatusEmail(orderToEmail, { force: true });
        if (emailResult.success) {
          finalOrder = await saveOrder({
            ...saved,
            last_emailed_status: saved.status,
            status_email_sent_at: new Date().toISOString(),
          });
        } else if (explicitSendRequested) {
          return NextResponse.json(
            {
              error: emailResult.message || 'Failed to dispatch shipping notification email via Brevo.',
              order: saved,
            },
            { status: 502 }
          );
        }
      } catch (emailErr: any) {
        console.error('Email status update error:', emailErr);
        if (explicitSendRequested) {
          return NextResponse.json(
            { error: emailErr?.message || 'Failed to dispatch shipping notification email.', order: saved },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, order: finalOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdminAuthorization(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
