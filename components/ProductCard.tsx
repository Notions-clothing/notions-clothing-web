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
    const defaultColor = product.colors?.[0]?.name;
    const defaultColorHex = product.colors?.[0]?.hex;
    const defaultColorImage = product.colors?.[0]?.image_url;
    addItem(product, selectedSize, 1, defaultColor, defaultColorHex, defaultColorImage);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1800);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/4.2] w-full bg-[#F5F3EF] overflow-hidden">
          <Link href={`/product/${product.slug}`} className="block w-full h-full relative">
            <Image
              src={product.images?.[0]?.image_url || '/logo.png'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover object-center group-hover:scale-104 transition-transform duration-500"
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
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#181818] flex items-center justify-center shadow-xs transition cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorited ? 'fill-[#143728] text-[#143728]' : 'text-[#444444]'
              }`}
            />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-1.5">
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

          {/* Rating and Color swatches preview */}
          <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-0.5">
            <div className="flex items-center space-x-1">
              <span className="text-[#E59819]">★</span>
              <span className="font-medium text-[#222222]">{product.rating_score || 4.6}</span>
              <span>({product.rating_count || 120})</span>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                {product.colors.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                {product.colors.length > 3 && (
                  <span className="text-[9px] text-[#888888]">+{product.colors.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Selector and Quick Add Action */}
      <div className="px-3.5 pb-3.5 pt-1">
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#F5F2EB]">
          {/* Size Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            {product.variants?.map((v) => (
              <button
                key={v.id || v.size}
                type="button"
                onClick={(e) => handleSizeClick(e, v.size)}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition cursor-pointer ${
                  selectedSize === v.size
                    ? 'bg-[#143728] text-white'
                    : 'bg-[#FAF9F5] text-[#444444] hover:bg-[#EAE5DC]'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`text-[10px] uppercase font-semibold px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
              addedNotice
                ? 'bg-[#143728] text-white'
                : 'text-[#143728] hover:bg-[#143728] hover:text-white'
            }`}
          >
            {addedNotice ? <Check className="w-3 h-3 inline" /> : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
