'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product, Category } from '@/types/database';

interface BestSellersSectionProps {
  initialProducts: Product[];
  categories?: Category[];
}

export default function BestSellersSection({ initialProducts, categories }: BestSellersSectionProps) {
  const [activeTab, setActiveTab] = useState('All');

  const defaultTabs = ['All', 'Shirts', 'T-shirts', 'Jeans', 'Footwear', 'Accessories'];

  // Dynamically include any custom DB categories not already covered by defaultTabs
  const tabs = useMemo(() => {
    if (!categories || categories.length === 0) return defaultTabs;
    const extraCats = categories
      .filter((c) => c.is_published !== false && !c.parent_id)
      .map((c) => c.name)
      .filter(
        (name) =>
          !defaultTabs.some(
            (dt) =>
              dt.toLowerCase().replace(/[^a-z0-9]/g, '') ===
              name.toLowerCase().replace(/[^a-z0-9]/g, '')
          )
      );
    return [...defaultTabs, ...extraCats];
  }, [categories]);

  // Robust product matching for category tabs
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      if (activeTab === 'All') return true;

      const tabClean = activeTab.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Normalize all category, subcategory, and product texts
      const catName = (product.category_name || '').toLowerCase();
      const catSlug = (product.category_slug || '').toLowerCase();
      const subName = (product.subcategory_name || '').toLowerCase();
      const subSlug = (product.subcategory_slug || '').toLowerCase();
      const prodName = (product.name || '').toLowerCase();

      const combinedText = `${catName} ${catSlug} ${subName} ${subSlug} ${prodName}`;
      const combinedClean = combinedText.replace(/[^a-z0-9]/g, '');

      // Footwear / Shoes / Sandals / Sneakers / Boots
      if (tabClean === 'footwear' || tabClean === 'foot-wear' || tabClean === 'shoes') {
        return (
          combinedClean.includes('footwear') ||
          combinedClean.includes('foot-wear') ||
          combinedClean.includes('shoe') ||
          combinedClean.includes('shoes') ||
          combinedClean.includes('sneaker') ||
          combinedClean.includes('sandal') ||
          combinedClean.includes('slipper') ||
          combinedClean.includes('boot') ||
          combinedClean.includes('loaf')
        );
      }

      // T-Shirts (Exclude regular formal/casual shirts)
      if (tabClean === 'tshirts' || tabClean === 'tshirt') {
        return (
          combinedClean.includes('tshirt') ||
          combinedClean.includes('tshirts') ||
          combinedClean.includes('tee') ||
          combinedClean.includes('tees') ||
          combinedText.includes('t-shirt') ||
          combinedText.includes('t shirt')
        );
      }

      // Shirts (Exclude T-shirts)
      if (tabClean === 'shirts' || tabClean === 'shirt') {
        const isTShirt =
          combinedClean.includes('tshirt') ||
          combinedClean.includes('tee') ||
          combinedText.includes('t-shirt') ||
          combinedText.includes('t shirt');
        if (isTShirt) return false;
        return combinedClean.includes('shirt');
      }

      // Jeans / Denim / Trousers / Pants
      if (tabClean === 'jeans' || tabClean === 'jean') {
        return (
          combinedClean.includes('jean') ||
          combinedClean.includes('jeans') ||
          combinedClean.includes('denim') ||
          combinedClean.includes('trouser') ||
          combinedClean.includes('pant')
        );
      }

      // Accessories
      if (tabClean === 'accessories' || tabClean === 'accessory') {
        return (
          combinedClean.includes('accessori') ||
          combinedClean.includes('accessory') ||
          combinedClean.includes('cap') ||
          combinedClean.includes('hat') ||
          combinedClean.includes('belt') ||
          combinedClean.includes('wallet') ||
          combinedClean.includes('ring') ||
          combinedClean.includes('chain') ||
          combinedClean.includes('sunglass') ||
          combinedClean.includes('watch')
        );
      }

      // Generic matching for any custom database category/subcategory
      return (
        catName === activeTab.toLowerCase() ||
        subName === activeTab.toLowerCase() ||
        catSlug === tabClean ||
        subSlug === tabClean ||
        combinedClean.includes(tabClean)
      );
    });
  }, [initialProducts, activeTab]);

  // Destination URL for "View All →" based on active tab (pointing to functional Shop page)
  const viewAllUrl = useMemo(() => {
    if (activeTab === 'Footwear') return '/shop?category=foot-wear';
    if (activeTab === 'T-shirts') return '/shop?category=t-shirt';
    if (activeTab === 'Shirts') return '/shop?category=shirts';
    if (activeTab === 'Jeans') return '/shop?category=jeans';
    if (activeTab === 'Accessories') return '/shop?category=accessories';
    return '/shop';
  }, [activeTab]);

  return (
    <div className="flex-1 min-w-0 flex flex-col justify-between">
      <div>
        {/* Header with Title and Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE5DC] gap-2.5 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight whitespace-nowrap shrink-0">
              Best Sellers
            </h2>
            <Link
              href={viewAllUrl}
              className="sm:hidden text-xs font-semibold text-[#143728] hover:underline"
            >
              View All →
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs min-w-0 w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? 'bg-[#181818] text-white font-medium'
                    : 'text-[#666666] hover:text-[#181818] hover:bg-[#EFEBE0]'
                }`}
              >
                {tab}
              </button>
            ))}
            <Link
              href={viewAllUrl}
              className="hidden sm:inline text-xs font-medium text-[#143728] hover:underline whitespace-nowrap pl-2 shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Product Grid (2 columns on mobile, 4 columns on large desktop) */}
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
    </div>
  );
}
