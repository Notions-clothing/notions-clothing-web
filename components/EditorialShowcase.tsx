'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Banner } from '@/types/database';

interface EditorialShowcaseProps {
  essentialsBanner?: Banner;
  footwearBanner?: Banner;
  accessoriesBanner?: Banner;
  newArrivalsBanner?: Banner;
}

export function ModernEssentialsCard({ banner }: { banner?: Banner }) {
  const bgImage =
    banner?.image_url ||
    'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183115/notions/storefront/modern-essentials.png';

  return (
    <div className="relative w-full lg:w-[320px] rounded-xl overflow-hidden bg-[#EFECE3] border border-[#E2DDD2] flex flex-col justify-between p-6 min-h-[360px] group">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={bgImage}
          alt="Modern Essentials"
          fill
          className="object-cover object-center group-hover:scale-103 transition-transform duration-500"
        />
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[#555047] bg-white/70 px-2 py-0.5 rounded-xs backdrop-blur-xs">
          {banner?.subtitle || 'MODERN ESSENTIALS'}
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl text-[#181818] mt-3 leading-tight max-w-[180px]">
          For Every <br />
          Version <br />
          of You.
        </h3>
      </div>

      <div className="relative z-10 pt-16">
        <Link
          href={banner?.cta_url || '/category/men'}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-medium rounded-full transition shadow-sm"
        >
          <span>{banner?.cta_label || 'Explore Collection'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
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
  const fwImg =
    footwearBanner?.image_url ||
    'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183117/notions/storefront/promo-footwear.png';

  const accImg =
    accessoriesBanner?.image_url ||
    'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183116/notions/storefront/promo-accessories.png';

  const naImg =
    newArrivalsBanner?.image_url ||
    'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183118/notions/storefront/promo-new-arrivals.png';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Footwear Banner */}
        <div className="relative rounded-xl overflow-hidden bg-[#EAE7DE] border border-[#DDD8CD] p-6 flex flex-col justify-between min-h-[180px] group">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={fwImg}
              alt="Footwear"
              fill
              className="object-cover object-right group-hover:scale-103 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EAE7DE] via-[#EAE7DE]/80 to-transparent w-3/4" />
          </div>

          <div className="relative z-10 max-w-[200px]">
            <h4 className="font-sans font-bold text-xs sm:text-sm tracking-wider uppercase text-[#181818] leading-tight">
              {footwearBanner?.title || 'FOOTWEAR THAT MOVES YOU'}
            </h4>
            <p className="text-[11px] text-[#555047] mt-1.5 leading-snug">
              {footwearBanner?.description || 'Premium shoes & sandals for every step.'}
            </p>
          </div>

          <div className="relative z-10 pt-4">
            <Link
              href={footwearBanner?.cta_url || '/category/footwear'}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#143728] hover:bg-[#0d281c] text-white text-[11px] font-medium rounded-full transition"
            >
              <span>{footwearBanner?.cta_label || 'Shop Footwear'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Accessories Banner */}
        <div className="relative rounded-xl overflow-hidden bg-[#EAE7DE] border border-[#DDD8CD] p-6 flex flex-col justify-between min-h-[180px] group">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={accImg}
              alt="Accessories"
              fill
              className="object-cover object-right group-hover:scale-103 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EAE7DE] via-[#EAE7DE]/80 to-transparent w-3/4" />
          </div>

          <div className="relative z-10 max-w-[200px]">
            <h4 className="font-sans font-bold text-xs sm:text-sm tracking-wider uppercase text-[#181818] leading-tight">
              {accessoriesBanner?.title || 'ACCESSORIES FOR A FINER YOU'}
            </h4>
            <p className="text-[11px] text-[#555047] mt-1.5 leading-snug">
              {accessoriesBanner?.description || 'Caps, Rings, Bracelets & Chains'}
            </p>
          </div>

          <div className="relative z-10 pt-4">
            <Link
              href={accessoriesBanner?.cta_url || '/category/accessories'}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#143728] hover:bg-[#0d281c] text-white text-[11px] font-medium rounded-full transition"
            >
              <span>{accessoriesBanner?.cta_label || 'Explore Accessories'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* New Arrivals Banner */}
        <div className="relative rounded-xl overflow-hidden bg-[#EAE7DE] border border-[#DDD8CD] p-6 flex flex-col justify-between min-h-[180px] group">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={naImg}
              alt="New Arrivals"
              fill
              className="object-cover object-right group-hover:scale-103 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EAE7DE] via-[#EAE7DE]/80 to-transparent w-3/4" />
          </div>

          <div className="relative z-10 max-w-[190px]">
            <h4 className="font-sans font-bold text-xs sm:text-sm tracking-wider uppercase text-[#181818] leading-tight">
              {newArrivalsBanner?.title || 'NEW ARRIVALS'}
            </h4>
            <p className="text-[11px] text-[#555047] mt-1.5 leading-snug">
              {newArrivalsBanner?.description || 'Fresh styles. Same confidence.'}
            </p>
          </div>

          <div className="relative z-10 pt-4">
            <Link
              href={newArrivalsBanner?.cta_url || '/new-arrivals'}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#143728] hover:bg-[#0d281c] text-white text-[11px] font-medium rounded-full transition"
            >
              <span>{newArrivalsBanner?.cta_label || 'Shop Now'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
