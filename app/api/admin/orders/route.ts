import { NextResponse } from 'next/server';
import { getOrdersAdmin, saveOrder, deleteOrder } from '@/lib/db';

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
