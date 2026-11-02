import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from '@/lib/db';

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

    const addresses = await getCustomerAddresses(session.id);
    return NextResponse.json({ success: true, addresses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionCustomer(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, street, apartment, city, state, postal_code, country, is_default } = body;

    if (!name || !phone || !street || !city || !state || !postal_code) {
      return NextResponse.json(
        { error: 'Name, phone, street, city, state, and postal code are required' },
        { status: 400 }
      );
    }

    const newAddress = await addCustomerAddress(session.id, {
      name: name.trim(),
      phone: phone.trim(),
      street: street.trim(),
      apartment: (apartment || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postal_code.trim(),
      country: (country || 'India').trim(),
      is_default: !!is_default,
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
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
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const updated = await updateCustomerAddress(session.id, id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionCustomer(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const deleted = await deleteCustomerAddress(session.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Address not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Address deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionCustomer(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const success = await setDefaultCustomerAddress(session.id, id);
    if (!success) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Default address updated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

