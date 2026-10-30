'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types/database';

export interface CartItemType {
  id: string; // unique item key: prodId + size + (color || '')
  product: Product;
  variant?: ProductVariant;
  selectedSize: string;
  selectedSizeId?: string;
  selectedColor?: string;
  selectedColorId?: string;
  selectedColorHex?: string;
  selectedColorImage?: string;
  quantity: number;
  unitPrice: number;
}

interface CartContextType {
  items: CartItemType[];
  addItem: (
    product: Product,
    size: string,
    quantity?: number,
    color?: string,
    colorHex?: string,
    colorImage?: string,
    colorId?: string,
    sizeId?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notions_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('notions_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (
    product: Product,
    size: string,
    quantity: number = 1,
    color?: string,
    colorHex?: string,
    colorImage?: string,
    colorId?: string,
    sizeId?: string
  ) => {
    const cleanColor = color?.trim() || '';
    const itemId = cleanColor ? `${product.id}-${cleanColor}-${size}` : `${product.id}-${size}`;
    const variant = product.variants?.find((v) => v.size === size);

    setItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: itemId,
            product,
            variant,
            selectedSize: size,
            selectedSizeId: sizeId || undefined,
            selectedColor: cleanColor || undefined,
            selectedColorId: colorId || undefined,
            selectedColorHex: colorHex || undefined,
            selectedColorImage: colorImage || undefined,
            quantity,
            unitPrice: product.price,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shippingFee,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
