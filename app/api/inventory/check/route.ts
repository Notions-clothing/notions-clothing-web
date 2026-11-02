import { NextResponse } from 'next/server';
import { getLiveStockStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, selectedColor, selectedColorId, selectedSize, selectedSizeId, reservationToken } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const status = await getLiveStockStatus(productId, {
      selectedColor,
      selectedColorId,
      selectedSize,
      selectedSizeId,
      excludeReservationToken: reservationToken,
    });

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err: any) {
    console.error('Inventory check error:', err);
    return NextResponse.json({ error: err.message || 'Inventory check failed' }, { status: 500 });
  }
}

