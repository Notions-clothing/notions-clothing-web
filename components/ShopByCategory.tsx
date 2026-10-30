'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/database';

interface ShopByCategoryProps {
  categories: Category[];
}

export default function ShopByCategory({ categories }: ShopByCategoryProps) {
  // Only use database categories (no hardcoded mock arrays or fallback images)
  const displayItems = (categories || [])
    .filter((c) => c.is_published !== false && !c.parent_id)
    .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      imgSrc: cat.image_url || '/logo.png',
      isUploadedPhoto: Boolean(cat.image_url && cat.image_url.startsWith('http')),
    }));

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC] mb-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          Shop by Category
        </h2>
        <Link
          href={`/category/${displayItems[0]?.slug || 'all'}`}
          className="text-xs sm:text-sm font-medium text-[#181818] hover:text-[#143728] flex items-center gap-1 transition"
        >
          <span>View All</span>
          <span className="text-sm">→</span>
        </Link>
      </div>

      {/* DESKTOP ROW (Dynamic flexible responsive layout matching number of DB categories) */}
      <div className="hidden md:flex md:flex-wrap items-center gap-4">
        {displayItems.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center text-center transition w-[105px]"
          >
            <div
              className={`relative w-full aspect-[60/55] bg-[#F1EDE4] rounded-xl border border-[#E2DDD5]/80 overflow-hidden ${
                cat.isUploadedPhoto ? 'p-0' : 'p-1.5'
              } flex items-center justify-center group-hover:border-[#143728]/50 group-hover:shadow-xs transition duration-200`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={cat.imgSrc}
                  alt={cat.name}
                  fill
                  sizes="120px"
                  className={`${
                    cat.isUploadedPhoto ? 'object-cover' : 'object-contain'
                  } object-center group-hover:scale-105 transition-transform duration-200`}
                />
              </div>
            </div>

            <span className="mt-2 text-xs font-medium text-[#222222] group-hover:text-[#143728] transition truncate w-full">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* MOBILE SCROLL ROW */}
      <div className="md:hidden flex items-center space-x-3.5 overflow-x-auto pb-2 scrollbar-none">
        {displayItems.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center flex-shrink-0 w-[72px] text-center"
          >
            <div
              className={`relative w-[68px] h-[68px] rounded-full bg-[#F1EDE4] border border-[#E2DDD5]/80 overflow-hidden ${
                cat.isUploadedPhoto ? 'p-0' : 'p-2'
              } flex items-center justify-center group-hover:border-[#143728]`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={cat.imgSrc}
                  alt={cat.name}
                  fill
                  sizes="68px"
                  className={`${
                    cat.isUploadedPhoto ? 'object-cover' : 'object-contain'
                  } object-center group-hover:scale-105 transition-transform duration-200`}
                />
              </div>
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-[#222222] truncate w-full">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
