'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface AllProductsSectionProps {
  initialProducts: Product[];
  initialTotal?: number;
  initialHasMore?: boolean;
}

export default function AllProductsSection({
  initialProducts,
  initialTotal,
  initialHasMore = true,
}: AllProductsSectionProps) {
  // Initially show exactly 10 products
  const [products, setProducts] = useState<Product[]>(initialProducts.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(
    initialHasMore !== undefined ? initialHasMore : initialProducts.length > 10
  );
  const [infiniteScrollActive, setInfiniteScrollActive] = useState(false);

  const newProductsAnchorRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Fetch next batch of 15 products
  const fetchNextBatch = async (isFirstViewAll: boolean = false) => {
    if (isFetchingRef.current || (!hasMore && !isFirstViewAll)) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const currentOffset = products.length;
      const res = await fetch(`/api/products?offset=${currentOffset}&limit=15`);
      if (!res.ok) throw new Error('Failed to load products');

      const data = await res.json();
      const newItems: Product[] = Array.isArray(data) ? data : data.products || [];
      const moreAvailable =
        data.hasMore !== undefined ? data.hasMore : newItems.length === 15;

      setProducts((prev) => {
        // Prevent duplicates by ID
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });

      setHasMore(moreAvailable);

      if (isFirstViewAll) {
        setInfiniteScrollActive(true);
        // Scroll smoothly to the newly loaded section
        setTimeout(() => {
          newProductsAnchorRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 150);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading more products');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Infinite Scroll Trigger using IntersectionObserver
  useEffect(() => {
    if (!infiniteScrollActive || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingRef.current && hasMore) {
          fetchNextBatch(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [infiniteScrollActive, hasMore, loading, products.length]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#EAE5DC] gap-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#736E65] font-semibold">
            Curated Atelier
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#181818] tracking-tight mt-1">
            All Products
          </h2>
        </div>
        <p className="text-xs text-[#736E65]">
          Showing {products.length} {initialTotal ? `of ${initialTotal}` : ''} opulent pieces
        </p>
      </div>

      {/* Product Grid: 5 columns on desktop (lg:grid-cols-5) -> 2 rows of 5 = 10 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {products.map((product, idx) => (
          <React.Fragment key={product.id}>
            {/* Anchor for scrolling on first View All click (after the 10th item) */}
            {idx === 10 && <div ref={newProductsAnchorRef} className="col-span-full -mt-4 h-1" />}
            <ProductCard product={product} />
          </React.Fragment>
        ))}
      </div>

      {/* View All Button (visible before infinite scroll is activated) */}
      {!infiniteScrollActive && hasMore && (
        <div className="mt-10 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={() => fetchNextBatch(true)}
            disabled={loading}
            className="px-8 py-3.5 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-semibold tracking-wider uppercase rounded-full shadow-sm transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Products...</span>
              </>
            ) : (
              <span>View All Products</span>
            )}
          </button>
        </div>
      )}

      {/* Infinite Scroll Sentinel and Indicator */}
      {infiniteScrollActive && (
        <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center">
          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#736E65] py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[#143728]" />
              <span>Loading next collection pieces...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-xs text-red-600 mb-2">{error}</p>
              <button
                type="button"
                onClick={() => fetchNextBatch(false)}
                className="text-xs font-medium text-[#143728] underline cursor-pointer"
              >
                Retry loading
              </button>
            </div>
          )}

          {!hasMore && products.length > 10 && (
            <p className="text-xs text-[#8C887E] py-4 uppercase tracking-wider">
              ✦ You have reached the end of the collection ✦
            </p>
          )}
        </div>
      )}
    </section>
  );
}

