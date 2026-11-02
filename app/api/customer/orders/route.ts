import { NextRequest, NextResponse } from 'next/server';
import { getCustomerOrders, getCustomerById } from '@/lib/db';

const SESSION_COOKIE = 'notions_customer_session';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf8'));
    if (!sessionData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCustomerById(sessionData.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orders = await getCustomerOrders(customer.email);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

