'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Check } from 'lucide-react';
import { Product } from '@/types/database';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>(
    product.variants?.[0]?.size || 'M'
  );
  const [addedNotice, setAddedNotice] = useState(false);

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : null;

  const isFavorited = isInWishlist(product.id);

  const handleSizeClick = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, selectedSize, 1);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1800);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative bg-white rounded-lg border border-[#EDE8DE] hover:border-[#D5CDBD] transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/4.2] w-full bg-[#F5F3EF] overflow-hidden">
          <Link href={`/product/${product.slug}`} className="block w-full h-full relative">
            <Image
              src={product.images?.[0]?.image_url || '/logo.png'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center group-hover:scale-103 transition-transform duration-300"
            />
          </Link>

          {/* Badges on top left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {product.is_bestseller && (
              <span className="bg-[#181818] text-white text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wider uppercase">
                Bestseller
              </span>
            )}
            {product.is_new_arrival && !product.is_bestseller && (
              <span className="bg-[#143728] text-white text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wider uppercase">
                New
              </span>
            )}
          </div>

          {/* Wishlist Button on top right */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#181818] flex items-center justify-center shadow-xs transition"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorited ? 'fill-[#143728] text-[#143728]' : 'text-[#444444]'
              }`}
            />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-2">
          {/* Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-medium text-[#181818] hover:text-[#143728] transition line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Pricing Row */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-[#181818]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && (
              <span className="text-[11px] text-[#8C887E] line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
            {discountPercent && (
              <span className="bg-[#D9EFE0] text-[#143728] text-[10px] font-semibold px-1.5 py-0.2 rounded-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1 text-[11px] text-[#6B6B6B]">
            <span className="text-[#E59819]">★</span>
            <span className="font-medium text-[#222222]">{product.rating_score || 4.6}</span>
            <span>({product.rating_count || 120})</span>
          </div>
        </div>
      </div>

      {/* Size Selector and Quick Add Action */}
      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#F5F2EB]">
        <div className="flex items-center justify-between gap-1">
          {/* Size Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {product.variants?.map((v) => (
              <button
                key={v.id || v.size}
                type="button"
                onClick={(e) => handleSizeClick(e, v.size)}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition ${
                  selectedSize === v.size
                    ? 'border-[#143728] bg-[#143728] text-white'
                    : 'border-[#DDD7CC] bg-[#FAF9F5] text-[#444444] hover:border-[#143728]'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>

          {/* Add to bag quick action */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition flex items-center gap-1 ${
              addedNotice
                ? 'bg-[#143728] text-white'
                : 'bg-[#F3EFE6] text-[#143728] hover:bg-[#143728] hover:text-white'
            }`}
          >
            {addedNotice ? (
              <>
                <Check className="w-3 h-3" />
                <span>Added</span>
              </>
            ) : (
              <span>+ Add</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
