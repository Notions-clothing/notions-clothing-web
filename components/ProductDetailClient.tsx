'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShieldCheck, Truck, RotateCcw, Plus, Minus, Check, ShoppingBag, AlertCircle } from 'lucide-react';
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

  // Product Mode: Variant Mode vs Normal Mode
  const isVariantProduct = product.product_mode === 'variant' || Boolean(product.colors && product.colors.length > 0);
  const hasColors = isVariantProduct && Boolean(product.colors && product.colors.length > 0);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const currentColor = hasColors ? product.colors![selectedColorIndex] : undefined;

  // Active gallery images dynamically derived based on the selected color
  const activeImages = useMemo(() => {
    if (currentColor?.images && currentColor.images.length > 0) {
      return currentColor.images.map((img, idx) => ({
        id: img.id || `col-img-${idx}`,
        image_url: img.url,
        alt_text: `${product.name} - ${currentColor.name}`,
      }));
    }
    if (currentColor?.image_url) {
      return [
        {
          id: 'color-single',
          image_url: currentColor.image_url,
          alt_text: `${product.name} - ${currentColor.name}`,
        },
      ];
    }
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    const colorFallback = product.colors?.find((c) => (c.images && c.images.length > 0) || c.image_url);
    if (colorFallback?.images && colorFallback.images.length > 0) {
      return colorFallback.images.map((img, idx) => ({
        id: img.id || `col-fallback-${idx}`,
        image_url: img.url,
        alt_text: `${product.name} - ${colorFallback.name}`,
      }));
    }
    if (colorFallback?.image_url) {
      return [
        {
          id: 'color-fallback-single',
          image_url: colorFallback.image_url,
          alt_text: `${product.name} - ${colorFallback.name}`,
        },
      ];
    }
    return [
      {
        id: '1',
        image_url: '/logo.png',
        alt_text: product.name,
      },
    ];
  }, [currentColor, product]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [customActiveImage, setCustomActiveImage] = useState<string | null>(null);

  // Available sizes: for Variant Mode uses currentColor.sizes; for Normal Mode uses product.sizes or variants
  const availableSizes = useMemo(() => {
    if (isVariantProduct && currentColor?.sizes && currentColor.sizes.length > 0) {
      return currentColor.sizes;
    }
    if (!isVariantProduct && product.sizes && product.sizes.length > 0) {
      const commonStock = product.stock !== undefined ? product.stock : 25;
      return product.sizes.map((sz, i) => ({
        size_id: `sz-${i}`,
        size: sz,
        stock: commonStock,
      }));
    }
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((v) => ({
        size_id: v.id,
        size: v.size,
        stock: !isVariantProduct && product.stock !== undefined ? product.stock : v.inventory_quantity,
      }));
    }
    return [];
  }, [isVariantProduct, currentColor, product.sizes, product.variants, product.stock]);

  // Selected size state
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (currentColor?.sizes && currentColor.sizes.length > 0) {
      const inStock = currentColor.sizes.find((s) => s.stock > 0);
      return inStock ? inStock.size : currentColor.sizes[0].size;
    }
    return product.variants?.[0]?.size || 'M';
  });

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details');

  // Product Specifications
  const validSpecifications = useMemo(() => {
    if (!product.specifications || !Array.isArray(product.specifications)) return [];
    return product.specifications.filter(
      (s) => s && s.key && s.key.trim() !== '' && s.value !== undefined && s.value !== null && s.value.toString().trim() !== ''
    );
  }, [product.specifications]);

  const hasSpecifications = validSpecifications.length > 0;

  // Exact stock calculation
  const currentSizeObj = availableSizes.find((s) => s.size === selectedSize);
  const exactStock = isVariantProduct
    ? (currentSizeObj !== undefined
        ? Number(currentSizeObj.stock) || 0
        : currentColor !== undefined
        ? Number(currentColor.stock) || 0
        : 0)
    : (product.stock !== undefined
        ? Number(product.stock) || 0
        : (currentSizeObj !== undefined
            ? Number(currentSizeObj.stock) || 0
            : (product.variants?.find((v) => v.size === selectedSize)?.inventory_quantity ?? 25)));

  const isStockAvailable = exactStock > 0;
  const isAvailable = isStockAvailable && quantity <= exactStock;

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : null;

  const isFavorited = isInWishlist(product.id);

  // Handle color selection
  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    setActiveImageIndex(0);
    setCustomActiveImage(null);

    const chosenColor = product.colors?.[index];
    if (chosenColor?.sizes && chosenColor.sizes.length > 0) {
      const sizeStillAvailable = chosenColor.sizes.find(
        (s) => s.size === selectedSize && s.stock > 0
      );
      if (!sizeStillAvailable) {
        const firstInStock = chosenColor.sizes.find((s) => s.stock > 0);
        setSelectedSize(firstInStock ? firstInStock.size : chosenColor.sizes[0].size);
      }
    }
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    const colorThumb =
      currentColor?.images?.[0]?.url ||
      currentColor?.image_url ||
      activeImages[0]?.image_url ||
      product.images?.[0]?.image_url;

    if (isVariantProduct && currentColor) {
      addItem(
        product,
        selectedSize,
        quantity,
        currentColor.name,
        currentColor.hex,
        colorThumb,
        currentColor.color_id,
        currentSizeObj?.size_id
      );
    } else {
      // Normal Product Mode: Add without color metadata, using product thumbnail
      addItem(
        product,
        selectedSize,
        quantity,
        undefined,
        undefined,
        activeImages[0]?.image_url || product.images?.[0]?.image_url,
        undefined,
        currentSizeObj?.size_id
      );
    }
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      setIsCartOpen(true);
    }, 800);
  };

  const displayImageSrc =
    customActiveImage ||
    activeImages[activeImageIndex]?.image_url ||
    product.images?.[0]?.image_url ||
    '/logo.png';

  return (
    <div className="space-y-16">
      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Column (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {activeImages.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[550px] scrollbar-none flex-shrink-0">
              {activeImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setCustomActiveImage(null);
                  }}
                  className={`relative w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                    activeImageIndex === idx && !customActiveImage
                      ? 'border-[#143728] shadow-xs'
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
          <div className="relative flex-1 aspect-[4/4.5] bg-[#F5F3EF] rounded-2xl overflow-hidden shadow-2xs">
            <Image
              src={displayImageSrc}
              alt={product.name}
              fill
              priority
              className="object-cover object-center transition-all duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.is_bestseller && (
                <span className="bg-[#181818] text-white text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  Bestseller
                </span>
              )}
              {product.is_new_arrival && (
                <span className="bg-[#143728] text-white text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  New Arrival
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#181818] flex items-center justify-center shadow-xs transition cursor-pointer z-10"
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
              {product.subcategory_name && (
                <>
                  <span>•</span>
                  <span>{product.subcategory_name}</span>
                </>
              )}
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
              <span className="text-[#888888]">({product.rating_count || 128} verified reviews)</span>
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

            {/* Color Swatches Selector (Variant Product Mode Only) */}
            {isVariantProduct && hasColors && (
              <div className="space-y-3 mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#181818] uppercase tracking-wider flex items-center gap-1.5">
                    Color: <strong className="text-[#143728] normal-case">{currentColor?.name}</strong>
                  </span>
                  <span className="text-[11px] font-semibold text-[#666666]">
                    {currentColor?.images?.length
                      ? `${currentColor.images.length} photos`
                      : 'Exclusive Shade'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {product.colors!.map((color, idx) => {
                    const isSelected = selectedColorIndex === idx;
                    const isOutOfStock = (color.stock ?? 0) <= 0;
                    return (
                      <button
                        key={color.color_id || idx}
                        type="button"
                        onClick={() => handleColorSelect(idx)}
                        className={`group relative p-0.5 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#143728] ring-offset-2 ring-offset-[#FAF9F5]'
                            : 'hover:scale-105'
                        } ${isOutOfStock ? 'opacity-50' : ''}`}
                        title={`${color.name} ${isOutOfStock ? '(Out of Stock)' : `(${color.stock} available)`}`}
                        aria-label={`Select color ${color.name}`}
                      >
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full block border border-black/15 shadow-2xs"
                          style={{ backgroundColor: color.hex }}
                        />
                        {isOutOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-full h-px bg-red-600 rotate-45 transform" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector (Category-specific & Color-specific) */}
            {availableSizes.length > 0 && (
              <div className="space-y-3 mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#181818] uppercase tracking-wider flex items-center gap-1.5">
                    Select Size: <span className="text-[#143728] font-bold">{selectedSize}</span>
                  </span>

                  {/* Real-Time Stock Status */}
                  <div>
                    {isStockAvailable ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#143728] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-[#143728] inline-block animate-pulse" />
                        In Stock ({exactStock} available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {availableSizes.map((szItem) => {
                    const isSelected = selectedSize === szItem.size;
                    const isSzInStock = (Number(szItem.stock) || 0) > 0;
                    return (
                      <button
                        key={szItem.size_id || szItem.size}
                        type="button"
                        disabled={!isSzInStock}
                        onClick={() => setSelectedSize(szItem.size)}
                        className={`min-w-12 h-11 px-3 text-xs font-bold rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'border-[#143728] bg-[#143728] text-white shadow-xs'
                            : isSzInStock
                            ? 'border-[#DDD7CC] bg-white text-[#181818] hover:border-[#143728]'
                            : 'border-[#EAE5DC] bg-[#F5F2EB] text-[#AAAAAA] line-through cursor-not-allowed opacity-60'
                        }`}
                        title={isSzInStock ? `${szItem.size} - ${szItem.stock} in stock` : `${szItem.size} - Out of stock`}
                      >
                        {szItem.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart Row */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-4">
                {/* Quantity selector */}
                <div className="flex items-center rounded-full bg-white px-3 py-2 border border-[#DDD7CC]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-[#666666] hover:text-[#181818] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-semibold text-[#181818]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= exactStock}
                    onClick={() => setQuantity((q) => Math.min(exactStock, q + 1))}
                    className="p-1 text-[#666666] hover:text-[#181818] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 px-6 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer ${
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
                className={`pb-1 font-semibold transition cursor-pointer ${
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
                className={`pb-1 font-semibold transition cursor-pointer ${
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
                className={`pb-1 font-semibold transition cursor-pointer ${
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

      {/* Product Specifications Section */}
      {hasSpecifications && (
        <section className="pt-12 pb-6 border-t border-[#EDE8DE]">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#143728]">
                Craftsmanship & Details
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#181818] mt-1">
                Product Specifications
              </h2>
            </div>
            <span className="text-xs text-[#7A756D]">
              {validSpecifications.length} {validSpecifications.length === 1 ? 'Detail' : 'Details'}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#EDE8DE] p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
              {validSpecifications.map((spec, sIdx) => (
                <div
                  key={spec.id || sIdx}
                  className="flex items-baseline justify-between py-2.5 border-b border-[#EDE8DE]/60 text-xs sm:text-sm"
                >
                  <span className="text-[#7A756D] font-medium pr-4">
                    {spec.key}
                  </span>
                  <span className="text-[#181818] font-semibold text-right break-words">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                className="group bg-white rounded-xl overflow-hidden shadow-xs"
              >
                <Link href={`/product/${rel.slug}`} className="block relative aspect-[4/4.2] bg-[#F5F3EF]">
                  <Image
                    src={
                      rel.images?.[0]?.image_url ||
                      rel.colors?.find((c) => c.image_url || (c.images && c.images.length > 0))?.image_url ||
                      rel.colors?.find((c) => c.images && c.images.length > 0)?.images?.[0]?.url ||
                      '/logo.png'
                    }
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
