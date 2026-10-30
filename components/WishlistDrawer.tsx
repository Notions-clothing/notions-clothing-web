'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types/database';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';

export default function WishlistDrawer() {
  const { wishlistIds, removeFromWishlist, isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const { addItem, setIsCartOpen } = useCart();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Load products when drawer opens if not already loaded
  useEffect(() => {
    if (isWishlistOpen && allProducts.length === 0) {
      setLoading(true);
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAllProducts(data);
          } else if (data?.products && Array.isArray(data.products)) {
            setAllProducts(data.products);
          }
        })
        .catch((err) => console.error('Failed to load products for wishlist drawer:', err))
        .finally(() => setLoading(false));
    }
  }, [isWishlistOpen, allProducts.length]);

  if (!isWishlistOpen) return null;

  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));
  const recommendedProducts = allProducts
    .filter((p) => !wishlistIds.includes(p.id))
    .slice(0, 8);

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.variants?.[0]?.size || 'M';
    const defaultColor = product.colors?.[0]?.name;
    const defaultColorHex = product.colors?.[0]?.hex;
    const defaultColorImage = product.colors?.[0]?.image_url;

    addItem(product, defaultSize, 1, defaultColor, defaultColorHex, defaultColorImage);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F5] shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#EAE5DC] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-[#143728] fill-[#143728]" />
              <h2 className="text-base font-semibold text-[#181818] tracking-tight">
                My Wishlist ({wishlistIds.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 text-[#555555] hover:text-[#181818] transition cursor-pointer"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Container containing Wishlist items + Recommendations */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE5DC]">
            {/* Wishlist Items List */}
            <div className="px-6 py-4 space-y-4">
              {wishlistIds.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F3EFE6] flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-[#807D75]" />
                  </div>
                  <h3 className="font-serif text-lg text-[#181818] mb-1">Your wishlist is empty</h3>
                  <p className="text-xs text-[#737373] max-w-xs mb-6">
                    Save items you love by clicking the heart icon while exploring our collections.
                  </p>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="px-6 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-medium rounded-full transition cursor-pointer"
                  >
                    Explore Collections
                  </button>
                </div>
              ) : (
                wishlistProducts.map((product) => {
                  const hasColors = product.colors && product.colors.length > 0;
                  return (
                    <div
                      key={product.id}
                      className="flex space-x-4 p-3 bg-white rounded-xl shadow-xs"
                    >
                      <Link
                        href={`/product/${product.slug}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="w-20 h-24 relative bg-[#F5F3EE] rounded-lg overflow-hidden shrink-0 block"
                      >
                        <Image
                          src={product.images?.[0]?.image_url || '/logo.png'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={() => setIsWishlistOpen(false)}
                              className="text-xs font-semibold text-[#181818] hover:text-[#143728] line-clamp-1"
                            >
                              {product.name}
                            </Link>
                            <button
                              onClick={() => removeFromWishlist(product.id)}
                              className="text-[#999999] hover:text-red-600 transition p-0.5 ml-2 cursor-pointer"
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-bold text-[#181818]">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.compare_at_price && (
                              <span className="text-[11px] text-[#8C887E] line-through">
                                ₹{product.compare_at_price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {/* Color swatches preview if product has color variants */}
                          {hasColors && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {product.colors!.slice(0, 4).map((c) => (
                                <span
                                  key={c.color_id || c.name}
                                  title={c.name}
                                  className="w-3 h-3 rounded-full border border-black/10 inline-block"
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                              {product.colors!.length > 4 && (
                                <span className="text-[10px] text-[#888888]">
                                  +{product.colors!.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Move / Add to Cart Action */}
                        <div className="pt-2 mt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                          <span className="text-[11px] text-[#143728] font-medium">
                            {product.variants?.[0]?.inventory_quantity
                              ? 'In Stock'
                              : 'Ready to order'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#143728] hover:bg-[#0c2419] text-white text-[11px] font-medium rounded-md shadow-xs transition cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add to Bag</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Horizontal Recommendation Slider */}
            {recommendedProducts.length > 0 && (
              <div className="p-6 bg-[#F8F5EE]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-[#181818] tracking-tight">
                      You May Also Like
                    </h4>
                    <p className="text-[11px] text-[#736E65]">Curated complements for your wardrobe</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => scrollSlider('left')}
                      className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-[#181818] flex items-center justify-center shadow-xs cursor-pointer"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollSlider('right')}
                      className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-[#181818] flex items-center justify-center shadow-xs cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderRef}
                  className="flex space-x-3 overflow-x-auto scrollbar-none pb-2 pt-1 touch-pan-x"
                >
                  {recommendedProducts.map((item) => (
                    <div
                      key={item.id}
                      className="w-40 shrink-0 bg-white rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="relative aspect-[4/4.5] w-full bg-[#F5F3EF] block"
                      >
                        <Image
                          src={item.images?.[0]?.image_url || '/logo.png'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </Link>

                      <div className="p-2.5 flex flex-col justify-between flex-1 space-y-2">
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={() => setIsWishlistOpen(false)}
                            className="text-[11px] font-medium text-[#181818] hover:text-[#143728] line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] font-bold text-[#181818] mt-0.5">
                            ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="w-full py-1.5 px-2 bg-[#F3EFE6] hover:bg-[#143728] text-[#181818] hover:text-white text-[10px] font-semibold rounded-md transition text-center cursor-pointer"
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 bg-white border-t border-[#EAE5DC] shrink-0">
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="w-full py-2.5 text-xs text-[#555555] hover:text-[#181818] font-medium text-center transition cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

