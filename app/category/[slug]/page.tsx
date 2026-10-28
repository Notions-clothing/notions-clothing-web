import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getCategoryBySlug, getCategories, getProducts } from '@/lib/db';
import { SlidersHorizontal } from 'lucide-react';

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
    notFound();
  }

  // Find subcategories if this is a parent category
  const subcategories = allCategories.filter((c) => c.parent_id === currentCategory.id);

  // Find products belonging to this category or its subcategories
  const subcategorySlugs = [currentCategory.slug, ...subcategories.map((sc) => sc.slug)];
  const allProducts = await getProducts();

  let filteredProducts = allProducts.filter((p) =>
    subcategorySlugs.includes(p.category_slug || '') ||
    subcategorySlugs.includes(p.category_id)
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
          {currentCategory.parent_id && (
            <>
              <Link href="/category/men" className="hover:text-[#143728]">
                Men's Apparel
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#181818] font-medium">{currentCategory.name}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-[#F3EFE6] border border-[#E6E1D8] p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-xl z-10">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#143728]">
              Opulent Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#181818] mt-2 mb-3">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C574F] leading-relaxed">
              {currentCategory.description || 'Explore our hand-finished collection of opulent luxury apparel and essentials.'}
            </p>
          </div>

          {currentCategory.image_url && (
            <div className="mt-6 md:mt-0 relative w-36 h-36 md:w-48 md:h-48 flex-shrink-0">
              <Image
                src={currentCategory.image_url}
                alt={currentCategory.name}
                fill
                className="object-contain object-center"
              />
            </div>
          )}
        </div>

        {/* Subcategories Filter Chips */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
              Subcategories
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/category/${currentCategory.slug}`}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#143728] text-white transition"
              >
                All {currentCategory.name}
              </Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#F3EFE6] text-[#333333] hover:bg-[#EAE5DC] transition"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Header & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5DC] mb-6 gap-3">
          <p className="text-xs text-[#6B665E]">
            Showing <strong className="text-[#181818]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'item' : 'items'}
          </p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-[#555555]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#143728]" />
              <span>Sort by:</span>
              <div className="flex space-x-1">
                <Link
                  href={`/category/${currentCategory.slug}?sort=newest`}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    sort === 'newest'
                      ? 'bg-[#143728] text-white font-medium'
                      : 'text-[#555555] hover:text-[#181818]'
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={`/category/${currentCategory.slug}?sort=price-low`}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    sort === 'price-low'
                      ? 'bg-[#143728] text-white font-medium'
                      : 'text-[#555555] hover:text-[#181818]'
                  }`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={`/category/${currentCategory.slug}?sort=price-high`}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    sort === 'price-high'
                      ? 'bg-[#143728] text-white font-medium'
                      : 'text-[#555555] hover:text-[#181818]'
                  }`}
                >
                  Price: High to Low
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-[#EDE8DE] p-8">
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

      <CartDrawer />
      <Footer />
    </div>
  );
}
