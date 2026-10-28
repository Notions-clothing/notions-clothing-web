'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/database';

interface ShopByCategoryProps {
  categories: Category[];
}

export default function ShopByCategory({ categories }: ShopByCategoryProps) {
  // Ordered categories to match reference design exactly:
  // Shirts, Jeans, Trousers, T-shirts, Shorts, Jackets, Dhothis, Kurta, Footwear, Accessories
  const displayCategories = categories.filter(c =>
    ['men-shirts', 'men-jeans', 'men-trousers', 'men-t-shirts', 'men-shorts',
     'men-jackets', 'men-dhothis', 'men-kurta', 'footwear', 'accessories'].includes(c.slug)
  );

  // If filtered is empty, fallback to available categories
  const finalCategories = displayCategories.length > 0 ? displayCategories : categories;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DC] mb-6">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          Shop by Category
        </h2>
        <Link
          href="/category/men"
          className="text-xs sm:text-sm font-medium text-[#143728] hover:underline"
        >
          View All →
        </Link>
      </div>

      {/* Category Horizontal Row / Scrollable Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2.5 sm:gap-3.5">
        {finalCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center text-center transition"
          >
            {/* Image card with soft ivory/cream background matching reference */}
            <div className="relative w-full aspect-square bg-[#F3EFE6] rounded-xl border border-[#E8E2D5] overflow-hidden p-2 flex items-center justify-center group-hover:border-[#143728]/40 group-hover:shadow-xs transition duration-200">
              <div className="relative w-full h-full">
                <Image
                  src={cat.image_url || '/logo.png'}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 20vw, 10vw"
                  className="object-contain object-center group-hover:scale-106 transition-transform duration-200"
                />
              </div>
            </div>

            {/* Category Name */}
            <span className="mt-2 text-[11px] sm:text-xs font-medium text-[#292621] group-hover:text-[#143728] transition line-clamp-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
