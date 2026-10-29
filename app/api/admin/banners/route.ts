import { NextResponse } from 'next/server';
import { getAllBannersAdmin, saveBanner, deleteBanner } from '@/lib/db';

export async function GET() {
  const banners = await getAllBannersAdmin();
  return NextResponse.json(banners);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const saved = await saveBanner(data);
    return NextResponse.json({ success: true, banner: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }
    await deleteBanner(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
