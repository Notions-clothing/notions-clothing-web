import { NextResponse } from 'next/server';
import { releaseStockReservation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid or missing JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { reservationToken, razorpayOrderId, orderNumber } = body;

    if (!reservationToken && !razorpayOrderId && !orderNumber) {
      return NextResponse.json(
        { error: 'At least one identifier (reservationToken, razorpayOrderId, or orderNumber) is required to cancel checkout' },
        { status: 400 }
      );
    }

    await releaseStockReservation({
      reservationToken,
      razorpayOrderId,
      orderNumber,
    });

    return NextResponse.json({ success: true, released: true });
  } catch (err: any) {
    console.error('Cancel/Release Reservation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to release reservation' },
      { status: 500 }
    );
  }
}

