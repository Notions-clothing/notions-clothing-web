'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShieldCheck, Truck, RotateCcw, Plus, Minus, Check, ShoppingBag } from 'lucide-react';
import { Product } from '@/types/database';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.variants?.[0]?.size || 'M'
  );
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details');

  const images = product.images?.length > 0 ? product.images : [
    { id: '1', product_id: product.id, image_url: '/logo.png', image_public_id: 'logo', sort_order: 1, is_primary: true }
  ];

  const currentVariant = product.variants?.find((v) => v.size === selectedSize);
  const isAvailable = currentVariant ? currentVariant.is_available && currentVariant.inventory_quantity > 0 : true;

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : null;

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addItem(product, selectedSize, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      setIsCartOpen(true);
    }, 800);
  };

  return (
    <div className="space-y-16">
      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Column (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[550px] scrollbar-none flex-shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden border-2 transition ${
                    activeImageIndex === idx
                      ? 'border-[#143728]'
                      : 'border-[#EDE8DE] hover:border-[#C5BFB3]'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text || product.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Display Image */}
          <div className="relative flex-1 aspect-[4/4.5] bg-[#F5F3EF] rounded-2xl overflow-hidden border border-[#EDE8DE]">
            <Image
              src={images[activeImageIndex]?.image_url || '/logo.png'}
              alt={product.name}
              fill
              priority
              className="object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.is_bestseller && (
                <span className="bg-[#181818] text-white text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                  Bestseller
                </span>
              )}
              {product.is_new_arrival && (
                <span className="bg-[#143728] text-white text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                  New Arrival
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#181818] flex items-center justify-center shadow-sm transition"
              aria-label="Save to wishlist"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorited ? 'fill-[#143728] text-[#143728]' : 'text-[#444444]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Product Info Column (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            {/* Category / Collection Tag */}
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#736E65] mb-2 font-semibold">
              <span>{product.category_name || 'Opulent Clothing'}</span>
              <span>•</span>
              <span className="text-[#143728]">SKU: {product.sku}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181818] tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2 text-xs text-[#555555] mb-4">
              <span className="text-[#E59819] text-sm">★</span>
              <span className="font-semibold text-[#181818]">{product.rating_score || 4.7}</span>
              <span className="text-[#888888]">({product.rating_count || 128} verified atelier reviews)</span>
            </div>

            {/* Price Row */}
            <div className="flex items-center space-x-3 mb-6 p-4 bg-[#F5F2EB] rounded-xl">
              <span className="text-2xl sm:text-3xl font-bold text-[#181818]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compare_at_price && (
                <span className="text-base text-[#8C887E] line-through">
                  ₹{product.compare_at_price.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && (
                <span className="bg-[#D9EFE0] text-[#143728] text-xs font-bold px-2 py-0.5 rounded-sm">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#4E4A42] leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Size Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#181818] uppercase tracking-wider">
                    Select Size: <span className="text-[#143728]">{selectedSize}</span>
                  </span>
                  <span className="text-[#7A756D] underline cursor-pointer">
                    Size Guide
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id || v.size}
                      type="button"
                      disabled={!v.is_available || v.inventory_quantity <= 0}
                      onClick={() => setSelectedSize(v.size)}
                      className={`min-w-12 h-11 px-3 text-xs font-medium rounded-lg border flex items-center justify-center transition ${
                        selectedSize === v.size
                          ? 'border-[#143728] bg-[#143728] text-white shadow-xs'
                          : v.is_available && v.inventory_quantity > 0
                          ? 'border-[#DDD7CC] bg-white text-[#181818] hover:border-[#143728]'
                          : 'border-[#EAE5DC] bg-[#F5F2EB] text-[#AAAAAA] line-through cursor-not-allowed'
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart Row */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-4">
                {/* Quantity selector */}
                <div className="flex items-center border border-[#DDD7CC] rounded-full bg-white px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-[#666666] hover:text-[#181818]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-semibold text-[#181818]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-[#666666] hover:text-[#181818]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 px-6 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center justify-center space-x-2 transition shadow-sm ${
                    !isAvailable
                      ? 'bg-[#DDD7CC] text-[#888888] cursor-not-allowed'
                      : addedNotice
                      ? 'bg-[#143728] text-white'
                      : 'bg-[#143728] hover:bg-[#0d281c] text-white'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isAvailable ? 'Add to Shopping Bag' : 'Out of Stock'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Atelier Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#EDE8DE] text-[10px] text-[#615C53]">
                <div className="flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#143728] flex-shrink-0" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#143728] flex-shrink-0" />
                  <span>7-Day Easy Returns</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#143728] flex-shrink-0" />
                  <span>100% Authentic Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion / Information Tabs */}
          <div className="border-t border-[#EDE8DE] pt-4">
            <div className="flex space-x-6 border-b border-[#EDE8DE] pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`pb-1 font-semibold transition ${
                  activeTab === 'details'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Materials & Fit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`pb-1 font-semibold transition ${
                  activeTab === 'shipping'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Shipping & Returns
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={`pb-1 font-semibold transition ${
                  activeTab === 'care'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Care Guide
              </button>
            </div>

            <div className="py-4 text-xs text-[#555047] leading-relaxed">
              {activeTab === 'details' && (
                <div className="space-y-1">
                  <p><strong>Fabric:</strong> {product.material || 'Premium organic weave with hand-finished seams'}</p>
                  <p><strong>Silhouette:</strong> Tailored relaxed silhouette with structured shoulders</p>
                  <p><strong>Origin:</strong> Crafted by NOTIONS® Master Ateliers</p>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-1">
                  <p>• Complimentary express shipping on all orders above ₹1,999 across India.</p>
                  <p>• Dispatched within 24 hours via premium insured courier partners.</p>
                  <p>• Hassle-free 7-day doorstep return and size exchange service.</p>
                </div>
              )}
              {activeTab === 'care' && (
                <div className="space-y-1">
                  <p>{product.care_instructions || 'Cold gentle cycle wash inside-out. Do not bleach. Dry in gentle shade. Warm iron on reverse.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-[#EDE8DE]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold text-[#181818]">
              You May Also Admire
            </h2>
            <Link href="/category/men" className="text-xs font-medium text-[#143728] hover:underline">
              View All Collection →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((rel) => (
              <div
                key={rel.id}
                className="group bg-white rounded-lg border border-[#EDE8DE] overflow-hidden"
              >
                <Link href={`/product/${rel.slug}`} className="block relative aspect-[4/4.2] bg-[#F5F3EF]">
                  <Image
                    src={rel.images?.[0]?.image_url || '/logo.png'}
                    alt={rel.name}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform"
                  />
                </Link>
                <div className="p-3">
                  <Link href={`/product/${rel.slug}`}>
                    <h4 className="text-xs font-medium text-[#181818] group-hover:text-[#143728] line-clamp-1">
                      {rel.name}
                    </h4>
                  </Link>
                  <p className="text-xs font-bold text-[#181818] mt-1">
                    ₹{rel.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
