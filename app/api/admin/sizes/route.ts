import { NextResponse } from 'next/server';
import { getAllSizesAdmin, saveSize, deleteSize } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const sizes = await getAllSizesAdmin(categoryId);
    return NextResponse.json(sizes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !data.category_id) {
      return NextResponse.json(
        { error: 'Size name and category selection are required' },
        { status: 400 }
      );
    }
    const saved = await saveSize(data);
    return NextResponse.json({ success: true, size: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Size ID is required' }, { status: 400 });
    }
    await deleteSize(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

