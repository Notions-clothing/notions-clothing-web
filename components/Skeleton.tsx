'use client';

import React from 'react';

export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-[#EFECE6] rounded-md ${className}`}
      style={style}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE5DC] overflow-hidden p-3 flex flex-col justify-between shadow-2xs">
      <div>
        {/* Image skeleton */}
        <div className="relative aspect-[4/4.2] w-full bg-[#F5F2EB] rounded-xl overflow-hidden animate-pulse mb-3" />
        
        {/* Title & category */}
        <div className="space-y-2 px-1">
          <div className="h-3.5 bg-[#EDE8DE] rounded-full w-3/4 animate-pulse" />
          <div className="h-2.5 bg-[#F2EFE8] rounded-full w-1/2 animate-pulse" />
        </div>
      </div>

      <div className="pt-3 px-1 border-t border-[#F5F2EB] mt-3">
        {/* Price & size pills */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#EDE8DE] rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-[#F2EFE8] rounded-full w-14 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="h-6 w-44 bg-[#EDE8DE] rounded-full animate-pulse mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#EDE8DE] animate-pulse" />
            <div className="h-3 w-14 bg-[#F2EFE8] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BestSellersSkeleton() {
  return (
    <div className="w-full flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-[#EDE8DE] rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-[#F2EFE8] rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function BrandShowcaseSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full h-[320px] sm:h-[380px] bg-[#EFECE6] rounded-3xl animate-pulse flex flex-col justify-center p-8 sm:p-12">
        <div className="space-y-3 max-w-md">
          <div className="h-3 w-28 bg-[#DFDBD2] rounded-full animate-pulse" />
          <div className="h-8 w-64 bg-[#DFDBD2] rounded-full animate-pulse" />
          <div className="h-4 w-80 bg-[#DFDBD2] rounded-full animate-pulse" />
          <div className="h-10 w-36 bg-[#143728]/20 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Gallery Skeleton */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-20 bg-[#EDE8DE] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="flex-1 aspect-[4/5] bg-[#EDE8DE] rounded-2xl animate-pulse" />
        </div>

        {/* Right Info Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-[#EDE8DE] rounded-full animate-pulse" />
            <div className="h-8 w-3/4 bg-[#EDE8DE] rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-[#EDE8DE] rounded-full animate-pulse" />
          </div>
          <div className="h-20 bg-[#F2EFE8] rounded-xl animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-20 bg-[#EDE8DE] rounded-full animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 bg-[#EDE8DE] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-12 w-full bg-[#143728]/20 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AccountDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-[#EAE5DC]">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-[#EDE8DE] rounded-full" />
          <div className="h-7 w-48 bg-[#EDE8DE] rounded-full" />
        </div>
        <div className="h-9 w-24 bg-[#EDE8DE] rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-[#EDE8DE] rounded-xl" />
        ))}
      </div>

      {/* Content Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-[#EDE8DE] space-y-3">
            <div className="h-4 w-40 bg-[#EDE8DE] rounded-full" />
            <div className="h-3 w-64 bg-[#F2EFE8] rounded-full" />
            <div className="h-16 bg-[#F9F7F2] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

