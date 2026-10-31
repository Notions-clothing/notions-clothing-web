'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

interface CategorySortSelectProps {
  categorySlug: string;
  currentSort: string;
}

export default function CategorySortSelect({ categorySlug, currentSort }: CategorySortSelectProps) {
  const router = useRouter();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(`/category/${categorySlug}?sort=${val}`);
  };

  return (
    <div className="flex items-center gap-2 text-xs text-[#555555]">
      <SlidersHorizontal className="w-3.5 h-3.5 text-[#143728] shrink-0" />
      <span className="shrink-0 font-medium text-[#4A463F] hidden xs:inline">Sort by:</span>
      <div className="relative inline-block">
        <select
          value={currentSort}
          onChange={handleSortChange}
          className="appearance-none bg-white border border-[#EAE5DC] rounded-xl px-3 py-1.5 pr-7 text-xs font-medium text-[#181818] focus:border-[#143728] focus:outline-none shadow-2xs cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

