'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Sparkles, RotateCcw, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Banner } from '@/types/database';

interface HeroBannerProps {
  banner?: Banner;
}

export default function HeroBanner({ banner }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 3;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 1 ? prev - 1 : totalSlides));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides ? prev + 1 : 1));
  };

  const heroImage =
    banner?.image_url ||
    'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183114/notions/storefront/hero-banner.png';

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      {/* Container with warm backdrop and subtle rounded borders matching the reference */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#FAF7F0] border border-[#E9E4D9] min-h-[460px] md:min-h-[500px] lg:min-h-[520px] flex items-center">
        {/* Full-fill Hero Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={heroImage}
            alt="NOTIONS® — Every Outfit a Statement"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center lg:object-right"
          />
          {/* Subtle gradient overlay to ensure perfect text legibility on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/95 via-[#FAF7F0]/75 to-transparent md:w-3/5" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-8 flex flex-col justify-between min-h-[460px] md:min-h-[500px]">
          {/* Main Editorial Text (Left) */}
          <div className="max-w-md lg:max-w-lg mt-6">
            <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#6B665B] uppercase mb-2">
              {banner?.subtitle || 'NEW COLLECTION'}
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-[#161616] leading-[1.12] tracking-tight mb-4">
              Every <br />
              Outfit a <br />
              <span className="italic font-normal">Statement.</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#4E4A42] max-w-sm mb-6 leading-relaxed">
              {banner?.description || 'Premium men’s fashion for your everyday journey.'}
            </p>

            {/* Shop Now CTA */}
            <div className="flex items-center gap-4">
              <Link
                href={banner?.cta_url || '/category/men'}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#143728] hover:bg-[#0d281c] text-white text-xs sm:text-sm font-medium rounded-full transition shadow-sm group"
              >
                <span>{banner?.cta_label || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Value Propositions / Service Badges */}
            <div className="flex items-center gap-4 sm:gap-6 mt-8 pt-6 border-t border-[#E2DDD2]/60 text-[11px] text-[#3E3A33]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#143728]" />
                <span className="font-medium">Premium Quality</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#143728]" />
                <span className="font-medium">Trendy Collections</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#143728]" />
                <span className="font-medium">Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Right Editorial Text & Carousel Navigation (Desktop) */}
          <div className="hidden lg:flex absolute right-12 top-10 flex-col items-end text-right">
            <h3 className="font-serif text-lg font-medium text-[#181818]">
              Style Beyond Trends
            </h3>
            <p className="text-xs text-[#5C574F]">
              Men's Fashion Reimagined
            </p>
          </div>

          {/* Carousel Pagination & Arrows (Bottom Right) */}
          <div className="absolute right-6 sm:right-12 bottom-6 flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-[#292621]">
              <span className={currentSlide === 1 ? 'font-bold text-[#143728]' : 'text-[#8C877D]'}>01</span>
              <span className={currentSlide === 2 ? 'font-bold text-[#143728]' : 'text-[#8C877D]'}>02</span>
              <span className={currentSlide === 3 ? 'font-bold text-[#143728]' : 'text-[#8C877D]'}>03</span>
            </div>

            <div className="sm:hidden text-xs text-[#292621]">
              <span className="font-bold text-[#143728]">0{currentSlide}</span>
              <span className="text-[#8C877D]"> / 0{totalSlides}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous banner"
                className="w-8 h-8 rounded-full border border-[#D5CDBD] bg-white/80 hover:bg-white text-[#181818] flex items-center justify-center transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next banner"
                className="w-8 h-8 rounded-full border border-[#D5CDBD] bg-white/80 hover:bg-white text-[#181818] flex items-center justify-center transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
