import { NextResponse } from 'next/server';
import { getAllColorsAdmin, saveColor, deleteColor } from '@/lib/db';

export async function GET() {
  try {
    const colors = await getAllColorsAdmin();
    return NextResponse.json(colors);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !data.hex) {
      return NextResponse.json({ error: 'Color name and HEX value are required' }, { status: 400 });
    }
    const saved = await saveColor(data);
    return NextResponse.json({ success: true, color: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Color ID is required' }, { status: 400 });
    }
    await deleteColor(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

