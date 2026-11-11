'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { BrandShowcase } from '@/types/database';

interface BrandShowcaseSectionProps {
  brandShowcase?: BrandShowcase | null;
}

export default function BrandShowcaseSection({ brandShowcase }: BrandShowcaseSectionProps) {
  // If disabled in admin or not configured, do not render on homepage
  if (!brandShowcase || !brandShowcase.is_enabled) {
    return null;
  }

  const {
    section_label = 'OUR OWN BRAND',
    heading = 'A Signature of Our Own',
    description = 'Premium everyday wear crafted for modern men. Timeless style, trusted quality.',
    brand_logo_url,
    background_image_url = '/tanay-showcase-bg.jpg',
    button_text = 'Explore TANAY',
    category_slug,
  } = brandShowcase;

  const destinationHref = brandShowcase.brand_slug
    ? `/brands/${brandShowcase.brand_slug}`
    : category_slug
    ? `/category/${category_slug}`
    : '/shop';

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Warm beige / cream editorial showcase card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[400px] lg:min-h-[420px] bg-[#F4EFE6] border border-[#E8DFC0]/80 shadow-xs flex items-end sm:items-center">
        {/* Background Lifestyle & Product Image */}
        {background_image_url && (
          <Image
            src={background_image_url}
            alt={heading}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[70%_center] sm:object-[right_center]"
          />
        )}

        {/* Editorial gradient overlay - Desktop: left-to-right gradient */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#F4EFE6] via-[#F4EFE6]/85 via-50% to-transparent w-full sm:w-2/3 pointer-events-none z-5" />

        {/* Mobile: Subtle soft white gradient strictly behind bottom content for text clarity */}
        <div className="sm:hidden absolute bottom-0 inset-x-0 h-[210px] bg-gradient-to-t from-white/90 via-white/50 to-transparent pointer-events-none z-5" />

        {/* Editorial Content Layer */}
        <div className="relative z-10 w-full px-5 sm:px-12 lg:px-16 py-5 sm:py-8 lg:py-10 flex flex-col justify-end sm:justify-center">
          <div className="max-w-[260px] sm:max-w-[460px]">
            {/* Section Label & Accent Rule */}
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <span className="text-[9.5px] sm:text-xs font-medium tracking-[0.2em] sm:tracking-[0.24em] text-[#7A7165] uppercase">
                {section_label}
              </span>

            </div>
            {/* Brand Logo Display */}
            <div className="my-1 sm:my-2.5">
              {brand_logo_url ? (
                <div className="relative h-8 sm:h-16 w-28 sm:w-52">
                  <Image
                    src={brand_logo_url}
                    alt="TANAY by NOTIONS® Brand Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                /* Stitched fabric patch emblem matching reference */
                <div className="inline-flex flex-col items-center justify-center px-3.5 py-1.5 sm:px-7 sm:py-2.5 rounded border border-dashed border-[#B8A892] bg-[#E8DEC8] shadow-2xs">
                  <span className="font-sans text-[11px] sm:text-xl font-black tracking-[0.3em] sm:tracking-[0.35em] text-[#1E1B18]">
                    T A N A Y
                  </span>
                  <div className="w-10 sm:w-24 h-px bg-[#8C8275] my-0.5" />
                  <span className="text-[7.5px] sm:text-xs text-[#554D43] font-medium tracking-widest">
                    BY notions&reg;
                  </span>
                </div>
              )}
            </div>

            {/* Editorial Serif Italic Headline */}
            <h2 className="font-serif italic font-normal text-lg sm:text-3xl lg:text-[40px] text-[#181818] leading-tight sm:leading-[1.12] tracking-tight mt-0.5 mb-1 sm:mb-2">
              {heading}
            </h2>

            {/* Supporting Description */}
            <p className="text-[10.5px] sm:text-[13.5px] text-[#554F46] leading-snug sm:leading-relaxed mb-3.5 sm:mb-6 font-normal">
              {description}
            </p>

            {/* CTA Button navigating to selected active category */}
            <div>
              <Link
                href={destinationHref}
                className="group inline-flex items-center space-x-1.5 sm:space-x-2.5 px-4 py-2 sm:px-6 sm:py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-[11px] sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
              >
                <span>{button_text}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
