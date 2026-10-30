'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const banners = rawBanners.filter((b) => b.is_published !== false && (b.section === 'hero' || !b.section));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = banners.length;

  // Auto-slide effect (every 5 seconds)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const activeBanner = banners[currentIndex];

  const title = activeBanner?.title || 'Every Outfit a Statement.';
  const subtitle = activeBanner?.subtitle || 'NEW COLLECTION';
  const description = activeBanner?.description || "Premium men's fashion for your everyday journey.";
  const ctaUrl = activeBanner?.cta_url || '/category/men';
  const ctaLabel = activeBanner?.cta_label || 'Shop Now';

  // Format headline to match the editorial layout with italic last word
  const renderFormattedTitle = (text: string) => {
    const normalized = text.trim();
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

  const bgImage = activeBanner?.image_url || '/logo.png';

  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#F6F2E9] min-h-[430px] sm:min-h-[470px] lg:min-h-[510px] flex items-center shadow-xs">
        {/* Background Banners with Smooth Cross-fade Transition */}
        {banners.map((item, idx) => {
          const itemSrc = item.image_url || '/logo.png';
          const isActive = idx === currentIndex;
          return (
            <div
              key={item.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            >
              <Image
                src={itemSrc}
                alt={item.title || 'Hero Banner'}
                fill
                priority={idx === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-[64%_16%] md:object-[center_16%]"
              />
            </div>
          );
        })}

        {/* Readability wash on mobile so editorial text stays legible without hiding model */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/80 via-[#FAF7F0]/40 to-transparent w-full md:w-3/4 pointer-events-none z-5" />

        {/* Editorial Content Overlay */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-8 sm:py-10 flex flex-col justify-between">
          <div className="max-w-[320px] sm:max-w-[420px] transition-all duration-500">
            {subtitle && (
              <span className="inline-block text-[11px] sm:text-xs font-medium tracking-[0.24em] text-[#7A756B] uppercase mb-2.5">
                {subtitle}
              </span>
            )}

            <h1 className="font-serif text-[36px] sm:text-[48px] lg:text-[56px] text-[#161616] leading-[1.06] tracking-tight mb-4">
              {renderFormattedTitle(title)}
            </h1>

            {description && (
              <p className="text-xs sm:text-[15px] text-[#3B3730] mb-6 leading-relaxed font-normal">
                {description}
              </p>
            )}

            <Link
              href={ctaUrl}
              className="inline-flex items-center space-x-2.5 px-7 py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* 3 Editorial Benefit Indicators */}
            <div className="flex items-center gap-4 sm:gap-6 mt-8 pt-4 text-[11px] text-[#2E2B26]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#143728] stroke-[1.6] shrink-0" />
                <div className="leading-[1.2] font-medium">
                  <span className="block">Premium</span>
                  <span className="block text-[#5A554C]">Quality</span>
                </div>
              </div>

              <div className="h-7 w-px bg-[#D5CFC2]" />

              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-[#143728] stroke-[1.6] shrink-0" />
                <div className="leading-[1.2] font-medium">
                  <span className="block">Trendy</span>
                  <span className="block text-[#5A554C]">Collections</span>
                </div>
              </div>

              <div className="h-7 w-px bg-[#D5CFC2]" />

              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#143728] stroke-[1.6] shrink-0" />
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

        {/* Bottom-Right Slider Numbers & Navigation Arrows */}
        {total > 1 && (
          <div className="absolute right-5 bottom-4 sm:right-8 sm:bottom-6 z-20 flex items-center gap-4">
            {/* Numbered slide pills */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-[#4A463F]">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`pb-0.5 transition cursor-pointer ${
                    currentIndex === idx
                      ? 'text-[#161616] font-bold border-b-2 border-[#143728]'
                      : 'text-[#6E695F] hover:text-[#161616]'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#181818] flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#181818] flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
