'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Check,
  Grid3X3,
  Filter,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/types/database';

interface ShopClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ShopClient({ initialProducts, categories }: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Query Parameters
  const initialCatParam = searchParams.get('category') || 'all';
  const initialSubcatParam = searchParams.get('subcategory') || 'all';
  const initialSortParam = searchParams.get('sort') || 'newest';

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCatParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcatParam);
  const [priceTier, setPriceTier] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onlyBestsellers, setOnlyBestsellers] = useState<boolean>(false);
  const [onlyNewArrivals, setOnlyNewArrivals] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>(initialSortParam);

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Prevent background scroll when mobile filter is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  // Sync state if searchParams change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Main categories (parent_id is null)
  const mainCategories = useMemo(() => {
    return (categories || []).filter((c) => c.is_published !== false && !c.parent_id);
  }, [categories]);

  // Subcategories belonging to the selected category (or all if "all")
  const subcategoriesForSelected = useMemo(() => {
    if (selectedCategory === 'all') {
      return (categories || []).filter((c) => c.is_published !== false && Boolean(c.parent_id));
    }
    const parentCat = categories.find(
      (c) => c.slug === selectedCategory || c.id === selectedCategory
    );
    if (!parentCat) return [];
    return (categories || []).filter(
      (c) => c.is_published !== false && c.parent_id === parentCat.id
    );
  }, [categories, selectedCategory]);

  // Price Tiers
  const priceTiers = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-1000', label: 'Under ₹1,000', min: 0, max: 999 },
    { id: '1000-2000', label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
    { id: '2000-3000', label: '₹2,000 – ₹3,000', min: 2001, max: 3000 },
    { id: 'above-3000', label: 'Above ₹3,000', min: 3001, max: Infinity },
  ];

  // Reset All Filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setPriceTier('all');
    setInStockOnly(false);
    setOnlyBestsellers(false);
    setOnlyNewArrivals(false);
    setSortBy('newest');
    router.replace('/shop');
  };

  // Check if any filter is active
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSubcategory !== 'all') count++;
    if (priceTier !== 'all') count++;
    if (inStockOnly) count++;
    if (onlyBestsellers) count++;
    if (onlyNewArrivals) count++;
    return count;
  }, [
    selectedCategory,
    selectedSubcategory,
    priceTier,
    inStockOnly,
    onlyBestsellers,
    onlyNewArrivals,
  ]);

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Category Filter
        if (selectedCategory !== 'all') {
          const matchCat =
            product.category_slug === selectedCategory ||
            product.category_id === selectedCategory ||
            (product.category_name &&
              product.category_name.toLowerCase() === selectedCategory.toLowerCase());
          if (!matchCat) return false;
        }

        // Subcategory Filter
        if (selectedSubcategory !== 'all') {
          const matchSub =
            product.subcategory_slug === selectedSubcategory ||
            product.subcategory_id === selectedSubcategory ||
            (product.subcategory_name &&
              product.subcategory_name.toLowerCase() === selectedSubcategory.toLowerCase());
          if (!matchSub) return false;
        }

        // Price Tier Filter
        if (priceTier !== 'all') {
          const tier = priceTiers.find((t) => t.id === priceTier);
          if (tier && tier.min !== undefined && tier.max !== undefined) {
            if (product.price < tier.min || product.price > tier.max) return false;
          }
        }

        // In Stock Filter
        if (inStockOnly) {
          const totalStock =
            product.stock !== undefined
              ? product.stock
              : product.variants?.reduce(
                  (sum, v) => sum + (v.inventory_quantity || 0),
                  0
                ) || 0;
          if (totalStock <= 0) return false;
        }

        // Bestseller Filter
        if (onlyBestsellers && !product.is_bestseller) return false;

        // New Arrival Filter
        if (onlyNewArrivals && !product.is_new_arrival) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating_score || 0) - (a.rating_score || 0);
        if (sortBy === 'bestseller') return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
        // Default 'newest'
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [
    initialProducts,
    selectedCategory,
    selectedSubcategory,
    priceTier,
    inStockOnly,
    onlyBestsellers,
    onlyNewArrivals,
    sortBy,
  ]);

  // Sidebar Filter Component (reused on desktop and inside mobile drawer)
  const FilterControls = () => (
    <div className="space-y-6 text-sm text-[#2E2B26]">
      {/* 1. Categories */}
      <div className="pb-5 border-b border-[#EAE5DC]">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-[#143728] mb-3">
          Department / Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('all');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#143728] text-white'
                : 'text-[#4A463F] hover:bg-[#F3EFE6]'
            }`}
          >
            <span>All Departments</span>
            <span className="text-[11px] opacity-75">{initialProducts.length}</span>
          </button>

          {mainCategories.map((cat) => {
            const count = initialProducts.filter(
              (p) => p.category_id === cat.id || p.category_slug === cat.slug
            ).length;
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? 'all' : cat.slug);
                  setSelectedSubcategory('all');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#143728] text-white'
                    : 'text-[#4A463F] hover:bg-[#F3EFE6]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[11px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Subcategories (if available) */}
      {subcategoriesForSelected.length > 0 && (
        <div className="pb-5 border-b border-[#EAE5DC]">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-[#143728] mb-3">
            Subcategories
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubcategory('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-[#143728] text-white'
                  : 'text-[#4A463F] hover:bg-[#F3EFE6]'
              }`}
            >
              <span>All Subcategories</span>
            </button>
            {subcategoriesForSelected.map((sub) => {
              const count = initialProducts.filter(
                (p) => p.subcategory_id === sub.id || p.subcategory_slug === sub.slug
              ).length;
              const isSelected =
                selectedSubcategory === sub.slug || selectedSubcategory === sub.id;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubcategory(isSelected ? 'all' : sub.slug)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#143728] text-white'
                      : 'text-[#4A463F] hover:bg-[#F3EFE6]'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="text-[11px] opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Price Filter */}
      <div className="pb-5 border-b border-[#EAE5DC]">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-[#143728] mb-3">
          Price Range
        </h3>
        <div className="space-y-1.5">
          {priceTiers.map((tier) => (
            <label
              key={tier.id}
              className="flex items-center gap-2.5 px-2 py-1 rounded-lg text-xs hover:bg-[#F3EFE6] cursor-pointer"
            >
              <input
                type="radio"
                name="priceTier"
                checked={priceTier === tier.id}
                onChange={() => setPriceTier(tier.id)}
                className="w-3.5 h-3.5 text-[#143728] accent-[#143728] cursor-pointer"
              />
              <span className={priceTier === tier.id ? 'font-semibold text-[#181818]' : 'text-[#4A463F]'}>
                {tier.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Availability & Highlights */}
      <div className="pb-5 border-b border-[#EAE5DC] space-y-2.5">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-[#143728] mb-3">
          Highlights & Stock
        </h3>

        <label className="flex items-center gap-2.5 px-2 py-1 rounded-lg text-xs hover:bg-[#F3EFE6] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-[#143728] accent-[#143728] cursor-pointer"
          />
          <span className="text-[#3B3730]">In Stock Only</span>
        </label>

        <label className="flex items-center gap-2.5 px-2 py-1 rounded-lg text-xs hover:bg-[#F3EFE6] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyBestsellers}
            onChange={(e) => setOnlyBestsellers(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-[#143728] accent-[#143728] cursor-pointer"
          />
          <span className="text-[#3B3730]">Best Sellers</span>
        </label>

        <label className="flex items-center gap-2.5 px-2 py-1 rounded-lg text-xs hover:bg-[#F3EFE6] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyNewArrivals}
            onChange={(e) => setOnlyNewArrivals(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-[#143728] accent-[#143728] cursor-pointer"
          />
          <span className="text-[#3B3730]">New Arrivals</span>
        </label>
      </div>

      {/* 5. Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-[#143728] border border-[#143728]/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters ({activeFiltersCount})</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Breadcrumb Navigation (Hidden on Mobile) */}
      <nav className="hidden md:flex items-center space-x-2 text-xs text-[#7A756D] mb-6">
        <Link href="/" className="hover:text-[#143728] transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#181818] font-medium">Shop</span>
        {selectedCategory !== 'all' && (
          <>
            <span>/</span>
            <span className="text-[#181818] font-semibold capitalize">
              {mainCategories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name ||
                selectedCategory}
            </span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 pb-3 md:pb-5 border-b border-[#EAE5DC] flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
        <div>
          {/* Sub-heading (Hidden on Mobile) */}
          <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-[#143728]">
            Curated Catalog
          </span>

          {/* Heading ("Shop All" on Mobile, "Shop All Collections" on Desktop) */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181818] tracking-tight mt-0.5 md:mt-1">
            <span className="md:hidden">Shop All</span>
            <span className="hidden md:inline">Shop All Collections</span>
          </h1>

          {/* Description (Hidden on Mobile) */}
          <p className="hidden md:block text-xs sm:text-sm text-[#5C574F] mt-1.5 max-w-2xl leading-relaxed">
            Discover luxury apparel, fine footwear, and statement essentials handcrafted with timeless bespoke artistry.
          </p>
        </div>

        {/* Desktop-Only Sort By Header (Mobile buttons removed from top) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <span className="text-xs text-[#7A756D]">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#EAE5DC] rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-[#181818] focus:border-[#143728] focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="bestseller">Best Sellers</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters on Left (25%) + Product Listings on Right (75%) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* DESKTOP FILTERS SIDEBAR (Left) */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 bg-white rounded-2xl border border-[#EAE5DC] p-5 shadow-2xs sticky top-24">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE5DC]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#143728]" />
              <span className="font-serif font-bold text-sm text-[#181818]">Filters</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#143728] hover:underline font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <FilterControls />
        </aside>

        {/* MOBILE BOTTOM-TO-TOP FILTER SHEET WITH SLIDE ANIMATION */}
        <div
          className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
            mobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Bottom Sheet that animates from bottom to top */}
          <div
            className={`fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#FAF9F5] rounded-t-3xl shadow-2xl z-10 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
              mobileFilterOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Top Grab Handle */}
            <div className="w-12 h-1 bg-[#D1CBC1] rounded-full mx-auto mt-3" />

            {/* Sheet Header */}
            <div className="px-5 py-3.5 border-b border-[#EAE5DC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#143728]" />
                <span className="font-serif font-bold text-base text-[#181818]">
                  Filters & Sort
                </span>
              </div>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-[#143728] hover:underline font-semibold cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F3EFE6] text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="p-5 overflow-y-auto flex-1 bg-white space-y-6">
              {/* Sort By section inside mobile filter */}
              <div className="pb-5 border-b border-[#EAE5DC]">
                <h3 className="font-semibold text-xs tracking-wider uppercase text-[#143728] mb-3">
                  Sort By
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'price-low', label: 'Price: Low to High' },
                    { id: 'price-high', label: 'Price: High to Low' },
                    { id: 'rating', label: 'Highest Rated' },
                    { id: 'bestseller', label: 'Best Sellers' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition cursor-pointer ${
                        sortBy === opt.id
                          ? 'bg-[#143728] text-white border-[#143728]'
                          : 'bg-white text-[#4A463F] border-[#EAE5DC] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Category, Price, and Stock Filter Options */}
              <FilterControls />
            </div>

            {/* Sticky Bottom Apply Button */}
            <div className="p-4 border-t border-[#EAE5DC] bg-[#FAF9F5] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#143728] hover:bg-[#0c2419] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer uppercase tracking-wider"
              >
                Apply Filters ({filteredProducts.length} Products)
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCT LISTINGS (Right) */}
        <main className="flex-1 min-w-0 w-full">
          {/* Active Filter Chips & Product Count Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="text-xs text-[#6B665E]">
              Showing <strong className="text-[#181818]">{filteredProducts.length}</strong>{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFE6] border border-[#EAE5DC] text-[11px] font-medium text-[#181818]">
                    <span>
                      {mainCategories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name ||
                        selectedCategory}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedSubcategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFE6] border border-[#EAE5DC] text-[11px] font-medium text-[#181818]">
                    <span>
                      {subcategoriesForSelected.find(
                        (s) => s.slug === selectedSubcategory || s.id === selectedSubcategory
                      )?.name || selectedSubcategory}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {priceTier !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFE6] border border-[#EAE5DC] text-[11px] font-medium text-[#181818]">
                    <span>{priceTiers.find((t) => t.id === priceTier)?.label}</span>
                    <button
                      type="button"
                      onClick={() => setPriceTier('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFE6] border border-[#EAE5DC] text-[11px] font-medium text-[#181818]">
                    <span>In Stock</span>
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-[#143728] hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 px-4 bg-white rounded-2xl border border-[#EAE5DC] text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F3EFE6] text-[#143728] mx-auto flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#181818]">
                  No matching products found
                </h3>
                <p className="text-xs text-[#6B665E]">
                  Try adjusting or clearing your filters to discover our available collections.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Center Filter & Sort Button (Mobile Only) */}
      <div className="lg:hidden fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="pointer-events-auto flex items-center gap-2.5 px-6 py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-2xl shadow-black/40 border border-white/20 transition-all active:scale-95 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span>Filters & Sort</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#143728] text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

