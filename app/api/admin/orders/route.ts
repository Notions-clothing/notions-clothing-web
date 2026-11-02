import { NextResponse } from 'next/server';
import { getOrdersAdmin, saveOrder, deleteOrder } from '@/lib/db';
import { sendOrderStatusEmail } from '@/lib/email';
import { Order } from '@/types/database';

export async function GET() {
  const orders = await getOrdersAdmin();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const allOrders = await getOrdersAdmin();
    const existing: Order | undefined = allOrders.find(
      (o) => (data.id && o.id === data.id) || (data.order_number && o.order_number === data.order_number)
    );

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
    };

    const saved = await saveOrder(mergedData);

    // Send shipping status email only on meaningful status change to avoid duplicate emails
    const isStatusEligible = saved.status === 'shipped' || saved.status === 'delivered';
    const statusChanged = !existing || existing.status !== saved.status || existing.last_emailed_status !== saved.status;
    const trackingAdded = !existing?.tracking_number && saved.tracking_number;

    if (isStatusEligible && (statusChanged || trackingAdded)) {
      try {
        const orderToEmail: Order = {
          ...saved,
          customer_email: saved.customer_email || existing?.customer_email || '',
          customer_name: saved.customer_name || existing?.customer_name || 'Valued Patron',
        };
        const emailResult = await sendOrderStatusEmail(orderToEmail);
        if (emailResult.success) {
          // Record last emailed status to prevent duplicate triggers on repeated saves
          await saveOrder({
            ...saved,
            last_emailed_status: saved.status,
            status_email_sent_at: new Date().toISOString(),
          });
        } else {
          console.error('[Email status update error]:', emailResult.message);
        }
      } catch (emailErr) {
        console.error('Email status update error (non-blocking):', emailErr);
      }
    }

    return NextResponse.json({ success: true, order: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
