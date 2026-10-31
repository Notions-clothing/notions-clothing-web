'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/database';

interface ShopByCategoryProps {
  categories: Category[];
  title?: string;
}

export default function ShopByCategory({ categories, title = 'Shop by Subcategory' }: ShopByCategoryProps) {
  // Filter subcategories (categories belonging to a parent category with parent_id)
  const subcategories = (categories || []).filter(
    (c) => c.is_published !== false && Boolean(c.parent_id)
  );

  // Prioritize subcategories for display; fallback to published categories if no subcategories exist yet
  const targetCategories = subcategories.length > 0
    ? subcategories
    : (categories || []).filter((c) => c.is_published !== false);

  const displayItems = useMemo(() => {
    return targetCategories
      .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
      .map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        imgSrc: cat.image_url || '/logo.png',
        isUploadedPhoto: Boolean(cat.image_url && cat.image_url.startsWith('http')),
      }));
  }, [targetCategories]);

  // One-by-one slide animation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Stride per card: 105px width + 16px gap = 121px
  const stride = 121;
  const total = displayItems.length;

  // Duplicate items for a continuous seamless loop if there are enough items
  const slides = useMemo(() => {
    if (total > 4) return [...displayItems, ...displayItems];
    return displayItems;
  }, [displayItems, total]);

  // Reset index when categories change
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
  }, [total]);

  // Re-enable CSS transition after instantaneous reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Auto-advance one by one every 2.8 seconds
  useEffect(() => {
    if (total <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 2800);

    return () => clearInterval(timer);
  }, [total, isPaused, currentIndex]);

  const handleNext = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isTransitioning) return;
    if (currentIndex === 0) {
      // Instant jump to duplicate offset, then smoothly slide back by one
      setIsTransitioning(false);
      setCurrentIndex(total);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentIndex(total - 1);
        });
      });
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTransitionEnd = () => {
    if (total <= 4) return;
    // When reaching the duplicated set, smoothly reset back to index 0 with no animation
    if (currentIndex >= total) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNext();
    } else if (distance < -40) {
      handlePrev();
    }
  };

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      {/* Section Header */}
      <div className="pb-3 border-b border-[#EAE5DC] mb-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181818] tracking-tight">
          {title}
        </h2>
      </div>

      {/* SINGLE ROW SLIDER TRACK (Slides One by One with Smooth Animation) */}
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          className="flex items-center gap-4 will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * stride}px)`,
            transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
          }}
        >
          {slides.map((cat, idx) => (
            <Link
              key={`subcat-${cat.slug}-${idx}`}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center transition w-[105px] shrink-0"
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
      </div>
    </section>
  );
}
