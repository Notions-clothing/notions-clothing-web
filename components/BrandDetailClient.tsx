'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { Brand, Product, Category } from '@/types/database';
import ProductCard from '@/components/ProductCard';

interface BrandDetailClientProps {
  brand: Brand;
  initialProducts: Product[];
  categories: Category[];
}

export default function BrandDetailClient({
  brand,
  initialProducts,
  categories,
}: BrandDetailClientProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Categories represented within this brand's product catalog
  const brandCategories = useMemo(() => {
    const catMap = new Map<string, { id: string; name: string; slug: string }>();
    initialProducts.forEach((p) => {
      if (p.category_id && (p.category_slug || p.category_name)) {
        const catObj = categories.find((c) => c.id === p.category_id || c.slug === p.category_slug);
        const name = catObj?.name || p.category_name || 'Collection';
        const slug = catObj?.slug || p.category_slug || p.category_id;
        catMap.set(slug, { id: p.category_id, name, slug });
      }
    });
    return Array.from(catMap.values());
  }, [initialProducts, categories]);

  // Filtered and sorted products (STRICTLY only products belonging to this brand)
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // Filter by category if selected
    if (selectedCategorySlug !== 'all') {
      list = list.filter(
        (p) =>
          p.category_slug === selectedCategorySlug ||
          p.category_id === selectedCategorySlug
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [initialProducts, selectedCategorySlug, sortBy]);

  return (
    <div className="space-y-6">
      {/* ====================================================
          BRAND HEADER BANNER WITH COVER IMAGE (Matches Reference Design)
      ==================================================== */}
      <div className="relative rounded-2xl overflow-hidden bg-[#F3EFE6] p-8 md:p-12 mb-6 min-h-[220px] md:min-h-[280px] flex flex-col justify-center shadow-xs">
        {brand.banner_url && (
          <>
            {/* Full Width & Height Background Cover Image */}
            <Image
              src={brand.banner_url}
              alt={brand.name}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
            {/* Editorial gradient overlay for maximum readability on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/95 via-[#FAF7F0]/75 to-transparent/20 md:w-3/4 pointer-events-none z-5" />
          </>
        )}

        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#143728]">
            Opulent Brand Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#181818] mt-2 mb-3">
            {brand.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#3B3730] leading-relaxed">
            {brand.description ||
              'Explore our hand-finished collection of opulent luxury apparel and essentials.'}
          </p>
        </div>
      </div>

      {/* ====================================================
          CATEGORY FILTER CHIPS (Scrollable along X axis on mobile)
      ==================================================== */}
      {brandCategories.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-nowrap overflow-x-auto scrollbar-none gap-2 pb-2 pt-1 touch-pan-x sm:flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0 whitespace-nowrap cursor-pointer ${
                selectedCategorySlug === 'all'
                  ? 'bg-[#143728] text-white'
                  : 'bg-[#F3EFE6] text-[#333333] hover:bg-[#EAE5DC]'
              }`}
            >
              All {brand.name}
            </button>
            {brandCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-[#143728] text-white'
                    : 'bg-[#F3EFE6] text-[#333333] hover:bg-[#EAE5DC]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================
          PRODUCTS HEADER & SORTING (Matches Reference Screenshot)
      ==================================================== */}
      <div className="flex flex-row items-center justify-between pb-4 border-b border-[#EAE5DC] mb-6 gap-3">
        <p className="text-xs text-[#6B665E]">
          Showing <strong className="text-[#181818]">{filteredProducts.length}</strong>{' '}
          {filteredProducts.length === 1 ? 'item' : 'items'}
        </p>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#EAE5DC] text-[#181818] text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#143728] cursor-pointer shadow-2xs"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ====================================================
          PRODUCTS GRID
      ==================================================== */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl p-8 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F0] flex items-center justify-center mb-4">
            <span className="font-serif text-2xl text-[#143728]">
              {brand.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="font-serif text-xl text-[#181818] mb-2">
            No products found in this brand collection
          </h3>
          <p className="text-xs text-[#737373] max-w-md mx-auto mb-6 leading-relaxed">
            New atelier creations are currently being tailored. Explore our other luxury categories or discover our best sellers.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full transition"
          >
            Explore All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
