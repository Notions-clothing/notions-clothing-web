'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Shirt, RotateCcw } from 'lucide-react';
import { Banner } from '@/types/database';

interface HeroBannerProps {
  banner?: Banner;
}

export default function HeroBanner({ banner }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(2);
  const totalSlides = 3;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentSlide((prev) => (prev > 1 ? prev - 1 : totalSlides));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentSlide((prev) => (prev < totalSlides ? prev + 1 : 1));
  };

  const title = banner?.title || 'Every Outfit a Statement.';
  const subtitle = banner?.subtitle || 'NEW COLLECTION';
  const description = banner?.description || "Premium men's fashion for your everyday journey.";
  const ctaUrl = banner?.cta_url || '/category/men';
  const ctaLabel = banner?.cta_label || 'Shop Now';

  // Check if admin uploaded a custom image or modified the default headline/subtitle/description
  const hasCustomImage =
    Boolean(banner?.image_url) &&
    !banner!.image_url!.includes('v1793183114/notions/storefront/hero-banner.png') &&
    banner!.image_url !== '/reference-assets/hero-banner-desktop.png';

  const hasCustomText =
    title !== 'Every Outfit a Statement.' ||
    subtitle !== 'NEW COLLECTION' ||
    description !== "Premium men's fashion for your everyday journey.";

  // Format headline to match the 3-line editorial layout with italic "Statement."
  const renderFormattedTitle = () => {
    const normalized = title.trim();
    if (normalized.toLowerCase() === 'every outfit a statement.' || normalized.toLowerCase() === 'every outfit a statement') {
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

  if (hasCustomImage || hasCustomText) {
    const bgSrc = hasCustomImage ? banner!.image_url! : '/reference-assets/hero-banner-clean.png';

    return (
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6">
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E9E4D9] bg-[#F6F2E9] min-h-[430px] sm:min-h-[470px] lg:min-h-[510px] flex items-center shadow-xs">
          {/* Background Campaign Photograph — Full Clarity, Framed to Show Full Model Head & Architecture */}
          <Image
            src={bgSrc}
            alt={title}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[64%_16%] md:object-[center_16%]"
          />

          {/* Subtle mobile-only readability wash so text stays legible on small screens without hiding the photo */}
          <div className="
            absolute inset-0
            bg-gradient-to-r from-[#FAF7F0]/70 via-[#FAF7F0]/30 to-transparent
            w-3/4 md:hidden pointer-events-none
          " />

          {/* Left Editorial Content Column */}
          <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-8 sm:py-10 flex flex-col justify-between">
            <div className="max-w-[320px] sm:max-w-[400px]">
              <span className="inline-block text-[11px] sm:text-xs font-medium tracking-[0.24em] text-[#7A756B] uppercase mb-2.5">
                {subtitle}
              </span>

              <h1 className="font-serif text-[38px] sm:text-[50px] lg:text-[58px] text-[#161616] leading-[1.06] tracking-tight mb-4">
                {renderFormattedTitle()}
              </h1>

              <p className="text-xs sm:text-[15px] text-[#3B3730] mb-6 leading-relaxed font-normal">
                {description}
              </p>

              <Link
                href={ctaUrl}
                className="inline-flex items-center space-x-2.5 px-7 py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all duration-200"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* 3 Editorial Benefit Indicators (No Sparkle Icon) */}
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
          <div className="absolute right-5 bottom-4 sm:right-8 sm:bottom-6 z-20 flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-[#4A463F]">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentSlide(num)}
                  className={`pb-0.5 transition ${
                    currentSlide === num
                      ? 'text-[#161616] font-bold border-b-2 border-[#143728]'
                      : 'text-[#6E695F] hover:text-[#161616]'
                  }`}
                >
                  0{num}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="w-7 h-7 rounded-full bg-white/60 hover:bg-white text-[#181818] border border-[#CCC5B9] flex items-center justify-center transition shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="w-7 h-7 rounded-full bg-white/60 hover:bg-white text-[#181818] border border-[#CCC5B9] flex items-center justify-center transition shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6">
      {/* DESKTOP BANNER CONTAINER */}
      <div className="hidden md:block relative w-full aspect-[735/216] rounded-2xl overflow-hidden border border-[#E9E4D9] bg-[#FAF7F0] shadow-xs group">
        <Image
          src="/reference-assets/hero-banner-desktop.png"
          alt="Every Outfit a Statement — NOTIONS®"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-center"
        />

        {/* Interactive Shop Now CTA Button Overlay */}
        <Link
          href={ctaUrl}
          className="absolute left-[8%] bottom-[19%] z-20 px-6 py-2.5 bg-[#143728] hover:bg-[#0c2419] text-white text-xs sm:text-sm font-medium rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 group-hover:scale-102"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* Interactive Carousel Arrow Buttons Overlay */}
        <div className="absolute right-[3%] bottom-[9%] z-20 flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#181818] border border-[#DDD7CD] flex items-center justify-center transition shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#181818] border border-[#DDD7CD] flex items-center justify-center transition shadow-xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MOBILE BANNER CONTAINER */}
      <div className="md:hidden relative w-full aspect-[195/182] rounded-2xl overflow-hidden border border-[#E9E4D9] bg-[#FAF7F0] shadow-xs group">
        <Image
          src="/reference-assets/hero-banner-mobile.png"
          alt="Every Outfit a Statement — NOTIONS®"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Mobile Interactive Shop Now CTA Button */}
        <Link
          href={ctaUrl}
          className="absolute left-[7%] bottom-[9%] z-20 px-5 py-2 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-medium rounded-lg shadow-md transition-all flex items-center space-x-1.5"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {/* Mobile Interactive Carousel Arrows */}
        <div className="absolute right-[4%] bottom-[5%] z-20 flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="w-6 h-6 rounded-full bg-white/70 hover:bg-white text-[#181818] flex items-center justify-center transition"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="w-6 h-6 rounded-full bg-white/70 hover:bg-white text-[#181818] flex items-center justify-center transition"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
}
