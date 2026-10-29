'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/database';

interface ShopByCategoryProps {
  categories: Category[];
}

const HOMEPAGE_CATEGORY_SLUGS = [
  { slug: 'men-shirts', name: 'Shirts', fallbackImg: '/reference-assets/cat-shirts.png' },
  { slug: 'men-jeans', name: 'Jeans', fallbackImg: '/reference-assets/cat-jeans.png' },
  { slug: 'men-trousers', name: 'Trousers', fallbackImg: '/reference-assets/cat-trousers.png' },
  { slug: 'men-t-shirts', name: 'T-shirts', fallbackImg: '/reference-assets/cat-t-shirts.png' },
  { slug: 'men-shorts', name: 'Shorts', fallbackImg: '/reference-assets/cat-shorts.png' },
  { slug: 'men-jackets', name: 'Jackets', fallbackImg: '/reference-assets/cat-jackets.png' },
  { slug: 'men-dhothis', name: 'Dhothis', fallbackImg: '/reference-assets/cat-dhothis.png' },
  { slug: 'men-kurta', name: 'Kurta', fallbackImg: '/reference-assets/cat-kurta.png' },
  { slug: 'footwear', name: 'Footwear', fallbackImg: '/reference-assets/cat-footwear.png' },
  { slug: 'accessories', name: 'Accessories', fallbackImg: '/reference-assets/cat-accessories.png' },
];

export default function ShopByCategory({ categories }: ShopByCategoryProps) {
  const displayItems = HOMEPAGE_CATEGORY_SLUGS.map((item, idx) => {
    const dbCat = categories.find((c) => c.slug === item.slug);
    // Also check if admin updated "shoes" when looking up "footwear"
    const shoesCat = item.slug === 'footwear' ? categories.find((c) => c.slug === 'shoes') : null;

    const rawUrl = dbCat?.image_url || shoesCat?.image_url || '';
    const isValidImage =
      Boolean(rawUrl) &&
      !rawUrl.includes('logo') &&
      !rawUrl.includes('v17931831') &&
      !rawUrl.includes('v17931868');

    const imgSrc = isValidImage ? rawUrl : item.fallbackImg;
    const isUploadedPhoto = imgSrc.startsWith('http');

    return {
      slug: item.slug,
      name: dbCat?.name || item.name,
      imgSrc,
      isUploadedPhoto,
      sortOrder: dbCat?.sort_order ?? idx + 1,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC] mb-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          Shop by Category
        </h2>
        <Link
          href="/category/men"
          className="text-xs sm:text-sm font-medium text-[#181818] hover:text-[#143728] flex items-center gap-1 transition"
        >
          <span>View All</span>
          <span className="text-sm">→</span>
        </Link>
      </div>

      {/* DESKTOP ROW (10 cards across in exact order) */}
      <div className="hidden md:grid md:grid-cols-10 gap-3">
        {displayItems.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center text-center transition"
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
                  sizes="10vw"
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
