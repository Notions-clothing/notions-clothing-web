'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Shirt, RotateCcw } from 'lucide-react';
import { Banner } from '@/types/database';

interface HeroBannerProps {
  banners?: Banner[];
  banner?: Banner;
}

export default function HeroBanner({ banners: initialBanners, banner: singleBanner }: HeroBannerProps) {
  // Normalize banners array
  const rawBanners = initialBanners && initialBanners.length > 0
    ? initialBanners
    : singleBanner
    ? [singleBanner]
    : [];

  // Filter published hero banners
  const filteredBanners = rawBanners.filter(
    (b) => b.is_published !== false && (b.section === 'hero' || !b.section)
  );

  const banners: Banner[] = useMemo(() => {
    if (filteredBanners.length > 0) return filteredBanners;
    return [
      {
        id: 'default-hero',
        section: 'hero',
        title: 'Every Outfit a Statement.',
        subtitle: 'NEW COLLECTION',
        description: "Premium men's fashion for your everyday journey.",
        cta_url: '/category/men',
        cta_label: 'Shop Now',
        image_url: '/logo.png',
        image_public_id: '',
        sort_order: 1,
        is_published: true,
      },
    ];
  }, [filteredBanners]);

  const [currentIndex, setCurrentIndex] = useState(banners.length > 1 ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const total = banners.length;

  // Clone first and last slides for a seamless infinite loop (no rewind / return back)
  const displaySlides = useMemo(() => {
    if (total <= 1) return banners;
    return [
      banners[total - 1], // clone of last at start
      ...banners,
      banners[0], // clone of first at end
    ];
  }, [banners, total]);

  // Reset index if banners change
  useEffect(() => {
    setCurrentIndex(total > 1 ? 1 : 0);
    setIsTransitioning(false);
  }, [total]);

  // Re-enable CSS transitions after instantaneous snap back
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

  // Swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Fast & reliable auto-advance in the same continuous direction (every 3.5 seconds)
  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [total, currentIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // When transition ends on a cloned slide, jump to the real slide instantly with no transition
  const handleTransitionEnd = () => {
    if (total <= 1) return;

    if (currentIndex >= total + 1) {
      // Reached clone of first slide: snap immediately to real first slide (index 1)
      setIsTransitioning(false);
      setCurrentIndex(1);
    } else if (currentIndex <= 0) {
      // Reached clone of last slide: snap immediately to real last slide (index total)
      setIsTransitioning(false);
      setCurrentIndex(total);
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
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
  };

  // Active slide index for pagination dots (0 to total - 1)
  const activeDotIndex = useMemo(() => {
    if (total <= 1) return 0;
    if (currentIndex === 0) return total - 1;
    if (currentIndex === total + 1) return 0;
    return currentIndex - 1;
  }, [currentIndex, total]);

  // Format headline to match editorial layout
  const renderFormattedTitle = (text: string) => {
    const normalized = (text || '').trim();
    if (
      normalized.toLowerCase() === 'every outfit a statement.' ||
      normalized.toLowerCase() === 'every outfit a statement'
    ) {
      return (
        <>
          <span className="block">Every</span>
          <span className="block">Outfit a</span>
          <span className="block italic font-normal text-[#143728]">Statement.</span>
        </>
      );
    }

    const words = normalized.split(/\s+/);
    if (words.length >= 3) {
      const lastWord = words[words.length - 1];
      const firstPart = words.slice(0, words.length - 1).join(' ');
      return (
        <>
          <span className="block">{firstPart}</span>
          <span className="block italic font-normal text-[#143728]">{lastWord}</span>
        </>
      );
    }

    return normalized;
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6">
      {/* Fixed-Height Container with Horizontal Slider Track */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-[#F6F2E9] h-[520px] sm:h-[520px] lg:h-[560px] shadow-xs select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Carousel Track (Continuous Infinite Loop in Same Direction) */}
        <div
          className="flex w-full h-full"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${total > 1 ? currentIndex * 100 : 0}%)`,
            transition: isTransitioning ? 'transform 700ms ease-in-out' : 'none',
          }}
        >
          {displaySlides.map((item, idx) => {
            const itemSrc = item.image_url || '/logo.png';
            const itemTitle = item.title || 'Every Outfit a Statement.';
            const itemSubtitle = item.subtitle || 'NEW COLLECTION';
            const itemDescription = item.description || "Premium men's fashion for your everyday journey.";
            const itemCtaUrl = item.cta_url || '/category/men';
            const itemCtaLabel = item.cta_label || 'Shop Now';

            return (
              <div
                key={`hero-slide-${item.id || 'slide'}-${idx}`}
                className="relative w-full h-full shrink-0 flex items-end sm:items-center overflow-hidden"
              >
                {/* Background Image */}
                <Image
                  src={itemSrc}
                  alt={itemTitle}
                  fill
                  priority={total > 1 ? idx === 1 : idx === 0}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-[68%_12%] md:object-[center_16%]"
                />

                {/* Readability gradient overlay: soft bottom gradient on mobile so background image stays clearly visible, left-to-right gradient on desktop */}
                <div className="absolute bottom-0 inset-x-0 h-[220px] sm:inset-0 sm:h-full bg-gradient-to-t from-[#FAF7F0]/80 via-[#FAF7F0]/25 to-transparent sm:bg-gradient-to-r sm:from-[#FAF7F0]/85 sm:via-[#FAF7F0]/50 sm:to-transparent w-full sm:w-3/4 pointer-events-none z-5" />

                {/* Editorial Content Overlay */}
                <div className="relative z-10 w-full px-5 sm:px-10 lg:px-16 pb-6 pt-16 sm:py-10 flex flex-col justify-end sm:justify-between">
                  <div className="max-w-[340px] sm:max-w-[420px]">
                    {itemSubtitle && (
                      <span className="inline-block text-[10px] sm:text-xs font-medium tracking-[0.24em] text-[#7A756B] uppercase mb-1.5 sm:mb-2.5">
                        {itemSubtitle}
                      </span>
                    )}

                    <h1 className="font-serif text-[30px] sm:text-[46px] lg:text-[54px] text-[#161616] leading-[1.08] tracking-tight mb-2 sm:mb-4">
                      {renderFormattedTitle(itemTitle)}
                    </h1>

                    {itemDescription && (
                      <p className="text-xs sm:text-[15px] text-[#3B3730] mb-4 sm:mb-6 leading-relaxed font-normal">
                        {itemDescription}
                      </p>
                    )}

                    <Link
                      href={itemCtaUrl}
                      className="inline-flex items-center space-x-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <span>{itemCtaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* 3 Editorial Benefit Indicators */}
                    <div className="flex items-center gap-3 sm:gap-6 mt-5 sm:mt-8 pt-3 sm:pt-4 text-[10px] sm:text-[11px] text-[#2E2B26]">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#143728] stroke-[1.6] shrink-0" />
                        <div className="leading-[1.2] font-medium">
                          <span className="block">Premium</span>
                          <span className="block text-[#5A554C]">Quality</span>
                        </div>
                      </div>

                      <div className="h-6 sm:h-7 w-px bg-[#D5CFC2]" />

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Shirt className="w-4 h-4 sm:w-5 sm:h-5 text-[#143728] stroke-[1.6] shrink-0" />
                        <div className="leading-[1.2] font-medium">
                          <span className="block">Trendy</span>
                          <span className="block text-[#5A554C]">Collections</span>
                        </div>
                      </div>

                      <div className="h-6 sm:h-7 w-px bg-[#D5CFC2]" />

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-[#143728] stroke-[1.6] shrink-0" />
                        <div className="leading-[1.2] font-medium">
                          <span className="block">Easy</span>
                          <span className="block text-[#5A554C]">Returns</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Editorial Tagline ("Style Beyond Trends") */}
                <div className="hidden lg:block absolute right-[5.5%] top-1/2 -translate-y-1/2 z-10 border-l border-[#8C857B]/50 pl-4 py-1">
                  <p className="font-serif text-xl xl:text-[23px] text-[#2B2927] leading-[1.18]">
                    Style
                    <br />
                    Beyond
                    <br />
                    Trends
                  </p>
                  <p className="text-[11px] text-[#555047] mt-2.5 leading-snug">
                    Men&apos;s Fashion
                    <br />
                    Reimagined
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom-Right Slider Numbers & Navigation Arrows (Hidden on Mobile) */}
        {total > 1 && (
          <div className="hidden sm:flex absolute right-5 bottom-4 sm:right-8 sm:bottom-6 z-20 items-center gap-4">
            {/* Numbered slide pills */}
            <div className="flex items-center gap-3 text-xs font-medium text-[#4A463F]">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentIndex(idx + 1);
                  }}
                  className={`pb-0.5 transition cursor-pointer ${
                    activeDotIndex === idx
                      ? 'text-[#161616] font-bold border-b-2 border-[#143728]'
                      : 'text-[#6E695F] hover:text-[#161616]'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#181818] flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#181818] flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
