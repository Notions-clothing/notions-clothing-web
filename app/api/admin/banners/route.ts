import { NextResponse } from 'next/server';
import { getAllBannersAdmin, saveBanner } from '@/lib/db';

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
