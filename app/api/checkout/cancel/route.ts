import { NextResponse } from 'next/server';
import { releaseStockReservation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reservationToken, razorpayOrderId, orderNumber } = body;

    if (reservationToken || razorpayOrderId || orderNumber) {
      await releaseStockReservation({
        reservationToken,
        razorpayOrderId,
        orderNumber,
      });
    }

    return NextResponse.json({ success: true, released: true });
  } catch (err: any) {
    console.error('Cancel/Release Reservation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to release reservation' },
      { status: 500 }
    );
  }
}

