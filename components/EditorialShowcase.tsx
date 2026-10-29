'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Banner } from '@/types/database';

export function ModernEssentialsCard({ banner }: { banner?: Banner }) {
  const title = banner?.title || 'For Every Version of You.';
  const subtitle = banner?.subtitle || 'MODERN ESSENTIALS';
  const ctaUrl = banner?.cta_url || '/category/men';
  const ctaLabel = banner?.cta_label || 'Explore Collection';

  const hasCustomImage =
    Boolean(banner?.image_url) &&
    !banner!.image_url!.includes('v1793183115') &&
    banner!.image_url !== '/reference-assets/modern-essentials.png';

  const hasCustomText =
    title !== 'For Every Version of You.' || subtitle !== 'MODERN ESSENTIALS';

  const renderFormattedTitle = () => {
    const normalized = title.trim();
    if (
      normalized.toLowerCase() === 'for every version of you.' ||
      normalized.toLowerCase() === 'for every version of you'
    ) {
      return (
        <>
          <span className="block">For</span>
          <span className="block">Every</span>
          <span className="block">Version</span>
          <span className="block">of You.</span>
        </>
      );
    }
    return normalized;
  };

  if (hasCustomImage || hasCustomText) {
    const bgSrc = hasCustomImage
      ? banner!.image_url!
      : '/reference-assets/modern-essentials-clean.png';

    return (
      <div className="relative w-full lg:w-[390px] xl:w-[440px] rounded-xl overflow-hidden border border-[#E2DDD2] bg-[#EFECE3] shadow-xs group flex-shrink-0 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[345px] p-6 sm:p-7 flex flex-col justify-between">
        {/* Background Photograph — Positioned so model sits cleanly on the right half and text sits on the left */}
        <Image
          src={bgSrc}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 440px"
          className="object-cover object-[72%_18%] group-hover:scale-102 transition-transform duration-300"
        />

        {/* Soft left-edge-only readability wash (fades out before reaching the model on the right) */}
        <div className="absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-[#FAF7F0]/75 via-[#FAF7F0]/35 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-[160px] pt-1">
          <span className="block text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase text-[#3A3630]">
            {subtitle}
          </span>
          <h3 className="font-serif text-[28px] sm:text-[34px] text-[#161616] mt-2.5 leading-[1.08] tracking-tight">
            {renderFormattedTitle()}
          </h3>
          <div className="w-8 h-[1.5px] bg-[#2B2927]/65 mt-3.5" />
        </div>

        <div className="relative z-10 pt-4">
          <Link
            href={ctaUrl}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-medium rounded-lg shadow-sm transition-all"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full lg:w-[390px] xl:w-[440px] rounded-xl overflow-hidden border border-[#E2DDD2] bg-[#EFECE3] shadow-xs group flex-shrink-0 aspect-[275/172] lg:aspect-auto lg:h-full min-h-[345px]">
      <Image
        src="/reference-assets/modern-essentials.png"
        alt="Modern Essentials — For Every Version of You"
        fill
        sizes="(max-width: 1024px) 100vw, 440px"
        className="object-cover object-center group-hover:scale-102 transition-transform duration-300"
      />

      {/* Interactive Explore Collection CTA Button */}
      <Link
        href={ctaUrl}
        className="absolute left-[7%] bottom-[8%] z-20 px-5 py-2.5 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-medium rounded-lg shadow-md transition-all flex items-center space-x-2 group-hover:scale-102"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export function PromoBannersRow({
  footwearBanner,
  accessoriesBanner,
  newArrivalsBanner,
}: {
  footwearBanner?: Banner;
  accessoriesBanner?: Banner;
  newArrivalsBanner?: Banner;
}) {
  const cards = [
    {
      id: 'footwear',
      banner: footwearBanner,
      defaultTitle: 'FOOTWEAR THAT MOVES YOU',
      defaultDesc: 'Premium shoes & sandals for every step.',
      defaultCta: 'Shop Footwear',
      defaultUrl: '/category/footwear',
      defaultImg: '/reference-assets/promo-footwear.png',
      cleanImg: '/reference-assets/promo-footwear-clean.png',
      oldHash: 'v1793183117',
    },
    {
      id: 'accessories',
      banner: accessoriesBanner,
      defaultTitle: 'ACCESSORIES FOR A FINER YOU',
      defaultDesc: 'Caps, Rings, Bracelets & Chains',
      defaultCta: 'Explore Accessories',
      defaultUrl: '/category/accessories',
      defaultImg: '/reference-assets/promo-accessories.png',
      cleanImg: '/reference-assets/promo-accessories-clean.png',
      oldHash: 'v1793183116',
    },
    {
      id: 'new_arrivals',
      banner: newArrivalsBanner,
      defaultTitle: 'NEW ARRIVALS',
      defaultDesc: 'Fresh styles. Same confidence.',
      defaultCta: 'Shop Now',
      defaultUrl: '/new-arrivals',
      defaultImg: '/reference-assets/promo-new-arrivals.png',
      cleanImg: '/reference-assets/promo-new-arrivals-clean.png',
      oldHash: 'v1793183118',
    },
  ];

  const renderPromoTitle = (id: string, title: string) => {
    const normalized = title.trim().toUpperCase();
    if (id === 'footwear' && normalized === 'FOOTWEAR THAT MOVES YOU') {
      return (
        <>
          <span className="block">FOOTWEAR</span>
          <span className="block">THAT MOVES YOU</span>
        </>
      );
    }
    if (id === 'accessories' && normalized === 'ACCESSORIES FOR A FINER YOU') {
      return (
        <>
          <span className="block">ACCESSORIES</span>
          <span className="block">FOR A FINER YOU</span>
        </>
      );
    }
    if (id === 'new_arrivals' && normalized === 'NEW ARRIVALS') {
      return (
        <>
          <span className="block">NEW</span>
          <span className="block">ARRIVALS</span>
        </>
      );
    }
    return title;
  };

  const renderPromoDesc = (id: string, desc: string) => {
    const normalized = desc.trim();
    if (id === 'footwear' && normalized.toLowerCase() === 'premium shoes & sandals for every step.') {
      return (
        <>
          <span className="block">Premium shoes &amp; sandals</span>
          <span className="block">for every step.</span>
        </>
      );
    }
    if (id === 'new_arrivals' && normalized.toLowerCase() === 'fresh styles. same confidence.') {
      return (
        <>
          <span className="block">Fresh styles.</span>
          <span className="block">Same confidence.</span>
        </>
      );
    }
    return desc;
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((item) => {
          const title = item.banner?.title || item.defaultTitle;
          const desc = item.banner?.description || item.defaultDesc;
          const ctaLabel = item.banner?.cta_label || item.defaultCta;
          const ctaUrl = item.banner?.cta_url || item.defaultUrl;

          const hasCustomImage =
            Boolean(item.banner?.image_url) &&
            !item.banner!.image_url!.includes(item.oldHash) &&
            item.banner!.image_url !== item.defaultImg;

          const hasCustomText =
            title !== item.defaultTitle || desc !== item.defaultDesc;

          if (hasCustomImage || hasCustomText) {
            const bgSrc = hasCustomImage ? item.banner!.image_url! : item.cleanImg;

            return (
              <div
                key={item.id}
                className="relative w-full min-h-[150px] sm:min-h-[162px] rounded-xl overflow-hidden border border-[#DDD8CD] bg-[#EAE7DE] shadow-xs group p-5 flex flex-col justify-between"
              >
                {/* Full-clarity product photograph */}
                <Image
                  src={bgSrc}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-[center_45%] group-hover:scale-102 transition-transform duration-300"
                />

                {/* Whisper-light left-only wash so text is always crisp while the product on the right is 100% clear */}
                <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-[#F4F0E6]/65 via-[#F4F0E6]/25 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-[175px]">
                  <h4 className="font-sans font-semibold text-sm sm:text-[15px] tracking-[0.04em] uppercase text-[#181818] leading-[1.22]">
                    {renderPromoTitle(item.id, title)}
                  </h4>
                  <p className="text-[11px] text-[#3E3A33] mt-1.5 leading-[1.35]">
                    {renderPromoDesc(item.id, desc)}
                  </p>
                </div>

                <div className="relative z-10 pt-3">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#143728] hover:bg-[#0c2419] text-white text-[11px] font-medium rounded-md shadow-xs transition"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="relative w-full aspect-[255/80] rounded-xl overflow-hidden border border-[#DDD8CD] bg-[#EAE7DE] shadow-xs group"
            >
              <Image
                src={item.defaultImg}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-300"
              />
              <Link
                href={ctaUrl}
                className="absolute left-[5%] bottom-[12%] z-20 px-3.5 py-1.5 bg-[#143728] hover:bg-[#0c2419] text-white text-[11px] font-medium rounded-md shadow-xs transition-all flex items-center space-x-1"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
