'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/context/wishlist-context';
import { Heart } from 'lucide-react';
import { Product } from '@/types/database';

export default function WishlistPage() {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const all = await res.json();
          setProducts(all.filter((p: Product) => wishlistIds.includes(p.id)));
        }
      } catch (e) {
        console.error('Failed to fetch wishlist products', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [wishlistIds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE6] mx-auto flex items-center justify-center mb-4">
            <Heart className="w-5 h-5 text-[#143728]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#181818] mb-2">
            Your Private Wishlist
          </h1>
          <p className="text-xs text-[#6B665E]">
            Curated pieces saved for your future wardrobe selections.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#888888]">
            Loading your saved pieces...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#EDE8DE] p-8 max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#181818] mb-2">
              Your wishlist is currently empty
            </p>
            <p className="text-xs text-[#7A756D] mb-6">
              Click the heart icon on any product to save it to your wishlist.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}
