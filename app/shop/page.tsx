import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShopClient from '@/components/ShopClient';
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
            <div className="w-full max-w-7xl mx-auto px-4 py-24 text-center">
              <div className="w-8 h-8 border-2 border-[#143728] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#7A756D] uppercase tracking-wider font-semibold">
                Loading Collections...
              </p>
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

