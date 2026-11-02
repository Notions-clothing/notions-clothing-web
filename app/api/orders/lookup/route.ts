import { NextRequest, NextResponse } from 'next/server';
import { getOrdersAdmin } from '@/lib/db';
import { Order } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!orderNumber && !email) {
      return NextResponse.json({ error: 'Order Number or Email is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lookup error' }, { status: 500 });
  }
}

