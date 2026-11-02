import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShopClient from '@/components/ShopClient';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { getProducts, getCategories } from '@/lib/db';

export const revalidate = 0; // Always serve fresh catalog data

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          }
        >
          <ShopClient initialProducts={products} categories={categories} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

