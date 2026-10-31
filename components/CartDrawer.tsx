'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
    shippingFee,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const freeShippingThreshold = 1999;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const diffToFree = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isCartOpen}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isCartOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 pointer-events-none">
        <div
          className={`w-full sm:w-[420px] max-w-full sm:max-w-md bg-[#FAF9F5] shadow-2xl flex flex-col h-[100dvh] max-h-[100dvh] pointer-events-auto transform transition-transform duration-300 ease-out ${
            isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#EAE5DC] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#143728]" />
              <h2 className="text-base font-semibold text-[#181818] tracking-tight">
                Shopping Bag ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 -mr-1 text-[#555555] hover:text-[#181818] transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary Shipping Banner */}
          <div className="px-6 py-3 bg-[#F3EFE6]">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-xs font-medium text-[#143728] flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#143728] inline-block mr-2" />
                Congratulations! You’ve unlocked Complimentary Shipping.
              </p>
            ) : (
              <div>
                <p className="text-xs text-[#404040]">
                  Add <strong className="text-[#143728]">₹{diffToFree.toLocaleString('en-IN')}</strong> more for Complimentary Shipping
                </p>
                <div className="w-full bg-[#E5DFCFC] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#143728] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F3EFE6] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-[#807D75]" />
                </div>
                <h3 className="font-serif text-lg text-[#181818] mb-1">Your bag is empty</h3>
                <p className="text-xs text-[#737373] max-w-xs mb-6">
                  Explore our opulent collection and elevate your everyday wardrobe.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-medium rounded-full transition cursor-pointer"
                >
                  Discover New Arrivals
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex space-x-4 p-3 bg-white rounded-xl shadow-xs"
                >
                  <div className="w-18 h-22 relative bg-[#F5F3EE] rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        item.selectedColorImage ||
                        item.product.images?.[0]?.image_url ||
                        '/logo.png'
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-semibold text-[#181818] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#999999] hover:text-red-600 transition p-0.5 ml-2 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-[#7A7A7A] mt-0.5 flex items-center flex-wrap gap-x-2">
                        <span>
                          Size: <strong className="font-medium text-[#181818]">{item.selectedSize}</strong>
                        </span>
                        {item.selectedColor && (
                          <span className="flex items-center gap-1">
                            • Color:
                            {item.selectedColorHex && (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full border border-black/10"
                                style={{ backgroundColor: item.selectedColorHex }}
                              />
                            )}
                            <strong className="font-medium text-[#181818]">{item.selectedColor}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5F3EE]">
                      <div className="flex items-center rounded-md bg-[#FAF9F5] border border-[#EAE5DC]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-[#555555] hover:text-[#181818] text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-[#181818]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-[#555555] hover:text-[#181818] text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-[#181818]">
                          ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#EAE5DC] space-y-4">
              <div className="space-y-1.5 text-xs text-[#555555]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#181818]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-[#181818]">
                    {shippingFee === 0 ? (
                      <span className="text-[#143728] font-semibold">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#181818] pt-2 border-t border-[#F5F2EB]">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold tracking-wider uppercase rounded-full flex items-center justify-center space-x-2 transition shadow-sm"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 text-xs text-[#666666] hover:text-[#181818] font-medium transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
