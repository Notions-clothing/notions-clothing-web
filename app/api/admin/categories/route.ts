import { NextResponse } from 'next/server';
import { getAllCategoriesAdmin, saveCategory, deleteCategory } from '@/lib/db';

export async function GET() {
  const categories = await getAllCategoriesAdmin();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const saved = await saveCategory(data);
    return NextResponse.json({ success: true, category: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing category ID' }, { status: 400 });

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
