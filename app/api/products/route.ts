import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') || undefined;
  const categorySlug = searchParams.get('category') || undefined;

  const products = await getProducts({ search, categorySlug });
  return NextResponse.json(products);
}
