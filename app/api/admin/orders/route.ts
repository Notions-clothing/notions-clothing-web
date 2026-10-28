import { NextResponse } from 'next/server';
import { getOrdersAdmin, saveOrder } from '@/lib/db';

export async function GET() {
  const orders = await getOrdersAdmin();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const saved = await saveOrder(data);
    return NextResponse.json({ success: true, order: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
