import { NextResponse } from 'next/server';
import { getBrands, getBrandBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const brand = await getBrandBySlug(slug);
      if (!brand || !brand.is_active) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }
      return NextResponse.json(brand);
    }

    const brands = await getBrands();
    return NextResponse.json(brands);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

