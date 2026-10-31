import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CategorySortSelect from '@/components/CategorySortSelect';
import { getCategoryBySlug, getCategories, getProducts } from '@/lib/db';

export const revalidate = 0;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  const currentCategory = await getCategoryBySlug(slug);
  const allCategories = await getCategories();

  if (!currentCategory) {
    if (slug === 'men' || slug === 'all') {
      redirect('/shop');
    }
    if (slug === 'men-apparel' || slug === 'mens-apparel') {
      redirect('/category/men-s-apparel');
    }
    if (slug === 'footwear') {
      redirect('/category/foot-wear');
    }
    notFound();
  }

  // Find subcategories if this is a parent category
  const subcategories = allCategories.filter((c) => c.parent_id === currentCategory.id);

  // Find parent category if this is a subcategory
  const parentCategory = currentCategory.parent_id
    ? allCategories.find((c) => c.id === currentCategory.parent_id)
    : null;

  // Find products belonging to this category or its subcategories
  const subcategorySlugs = [currentCategory.slug, currentCategory.id, ...subcategories.map((sc) => sc.slug), ...subcategories.map((sc) => sc.id)];
  const allProducts = await getProducts();

  let filteredProducts = allProducts.filter((p) =>
    subcategorySlugs.includes(p.category_slug || '') ||
    subcategorySlugs.includes(p.category_id) ||
    subcategorySlugs.includes(p.subcategory_slug || '') ||
    subcategorySlugs.includes(p.subcategory_id || '')
  );

  // Sorting
  const sort = typeof sParams.sort === 'string' ? sParams.sort : 'newest';
  if (sort === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A756D] mb-6">
          <Link href="/" className="hover:text-[#143728]">Home</Link>
          <span>/</span>
          {parentCategory && (
            <>
              <Link href={`/category/${parentCategory.slug}`} className="hover:text-[#143728]">
                {parentCategory.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#181818] font-medium">{currentCategory.name}</span>
        </nav>

        {/* Category Header Banner with Full Width & Height Cover Image */}
        <div className="relative rounded-2xl overflow-hidden bg-[#F3EFE6] p-8 md:p-12 mb-10 min-h-[220px] md:min-h-[280px] flex flex-col justify-center shadow-xs">
          {currentCategory.image_url && (
            <>
              {/* Full Width & Height Background Image */}
              <Image
                src={currentCategory.image_url}
                alt={currentCategory.name}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
              {/* Editorial gradient overlay for maximum readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/95 via-[#FAF7F0]/75 to-transparent/20 md:w-3/4 pointer-events-none z-5" />
            </>
          )}

          <div className="relative z-10 max-w-xl">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#143728]">
              Opulent Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#181818] mt-2 mb-3">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#3B3730] leading-relaxed">
              {currentCategory.description || 'Explore our hand-finished collection of opulent luxury apparel and essentials.'}
            </p>
          </div>
        </div>

        {/* Subcategories Filter Chips (Scrollable along X axis on mobile) */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
              Subcategories
            </h3>
            <div className="flex flex-nowrap overflow-x-auto scrollbar-none gap-2 pb-2 pt-1 touch-pan-x sm:flex-wrap">
              <Link
                href={`/category/${currentCategory.slug}`}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#143728] text-white transition shrink-0 whitespace-nowrap"
              >
                All {currentCategory.name}
              </Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#F3EFE6] text-[#333333] hover:bg-[#EAE5DC] transition shrink-0 whitespace-nowrap"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Header & Sorting */}
        <div className="flex flex-row items-center justify-between pb-4 border-b border-[#EAE5DC] mb-6 gap-3">
          <p className="text-xs text-[#6B665E]">
            Showing <strong className="text-[#181818]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'item' : 'items'}
          </p>

          <CategorySortSelect categorySlug={currentCategory.slug} currentSort={sort} />
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl p-8 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F0] flex items-center justify-center mb-4">
              <span className="font-serif text-2xl text-[#143728]">N</span>
            </div>
            <h3 className="font-serif text-xl text-[#181818] mb-2">
              No products found in this category
            </h3>
            <p className="text-xs text-[#737373] max-w-md mx-auto mb-6 leading-relaxed">
              New atelier creations are currently being tailored. Explore our other luxury categories or discover our best sellers.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full transition"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
