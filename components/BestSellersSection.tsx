'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product } from '@/types/database';

interface BestSellersSectionProps {
  initialProducts: Product[];
}

export default function BestSellersSection({ initialProducts }: BestSellersSectionProps) {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Shirts', 'T-shirts', 'Jeans', 'Footwear', 'Accessories'];

  const filteredProducts = initialProducts.filter((product) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Shirts') return product.category_slug?.includes('shirt') || product.name.toLowerCase().includes('shirt');
    if (activeTab === 'T-shirts') return product.category_slug?.includes('t-shirt') || product.name.toLowerCase().includes('tee');
    if (activeTab === 'Jeans') return product.category_slug?.includes('jean') || product.name.toLowerCase().includes('jeans');
    if (activeTab === 'Footwear') return product.category_slug?.includes('shoe') || product.category_slug?.includes('footwear') || product.name.toLowerCase().includes('sneaker');
    if (activeTab === 'Accessories') return product.category_slug?.includes('accessories') || product.category_slug?.includes('cap') || product.category_slug?.includes('ring');
    return true;
  });

  return (
    <div className="flex-1">
      {/* Header with Title and Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5DC] gap-3 mb-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          Best Sellers
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#181818] text-white font-medium'
                  : 'text-[#666666] hover:text-[#181818] hover:bg-[#EFEBE0]'
              }`}
            >
              {tab}
            </button>
          ))}
          <Link
            href="/category/men"
            className="text-xs font-medium text-[#143728] hover:underline whitespace-nowrap pl-2"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#777777] bg-white rounded-lg border border-[#EDE8DE]">
          No products in this category currently.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
