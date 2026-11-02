import { NextRequest, NextResponse } from 'next/server';
import { getCustomerById, updateCustomerProfile } from '@/lib/db';

const SESSION_COOKIE = 'notions_customer_session';

function getSessionCustomer(req: NextRequest): { id: string; email: string } | null {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) return null;
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf8'));
    if (!sessionData?.id) return null;
    return sessionData;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionCustomer(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCustomerById(session.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSessionCustomer(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, phone } = body;

    const updated = await updateCustomerProfile(session.id, {
      full_name: full_name?.trim(),
      phone: phone?.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

