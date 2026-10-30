import { NextResponse } from 'next/server';
import { getProducts, getPaginatedProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') || undefined;
  const categorySlug = searchParams.get('category') || undefined;
  const subcategorySlug = searchParams.get('subcategory') || undefined;
  const subcategoryId = searchParams.get('subcategoryId') || undefined;
  const sort = searchParams.get('sort') || undefined;
  const isBestseller = searchParams.get('isBestseller') === 'true';
  const isFeatured = searchParams.get('isFeatured') === 'true';
  const isNewArrival = searchParams.get('isNewArrival') === 'true';

  const hasPagination =
    searchParams.has('page') || searchParams.has('limit') || searchParams.has('offset');

  if (hasPagination) {
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 15;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : undefined;

    const result = await getPaginatedProducts({
      page,
      limit,
      offset,
      search,
      categorySlug,
      subcategorySlug,
      subcategoryId,
      sort,
      isBestseller: isBestseller || undefined,
      isFeatured: isFeatured || undefined,
      isNewArrival: isNewArrival || undefined,
    });
    return NextResponse.json(result);
  }

  const products = await getProducts({
    search,
    categorySlug,
    subcategorySlug,
    subcategoryId,
    sort,
    isBestseller: isBestseller || undefined,
    isFeatured: isFeatured || undefined,
    isNewArrival: isNewArrival || undefined,
  });
  return NextResponse.json(products);
}
