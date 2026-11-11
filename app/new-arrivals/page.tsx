import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { getProducts } from '@/lib/db';
import { Sparkles } from 'lucide-react';
import {
  buildPageMetadata,
  getCanonicalUrl,
  getCollectionJsonLd,
  getBreadcrumbJsonLd,
} from '@/lib/seo';

export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: 'New Arrivals — Seasonal Luxury Menswear & Accessories',
  description:
    'Discover the latest opulent arrivals at NOTIONS®. Fresh seasonal menswear silhouettes, refined shirting, and handcrafted footwear tailored from fine natural fabrics.',
  path: '/new-arrivals',
  image: '/logo.png',
  keywords: ['new arrivals', 'latest menswear', 'luxury new fashion', 'NOTIONS new collection'],
});

export default async function NewArrivalsPage() {
  const allProducts = await getProducts();
  const newArrivals = allProducts.filter((p) => p.is_new_arrival || p.is_bestseller);

  const pageUrl = getCanonicalUrl('/new-arrivals');
  const collectionJsonLd = getCollectionJsonLd({
    name: 'New Arrivals',
    description: 'Fresh seasonal luxury silhouettes tailored from fine natural fabrics.',
    url: pageUrl,
    products: newArrivals,
  });

  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'New Arrivals', url: pageUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={[collectionJsonLd, breadcrumbsJsonLd]} />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE6] mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-[#143728]" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mb-2">
            New Arrivals
          </h1>
          <p className="text-xs text-[#6B665E]">
            Fresh seasonal silhouettes tailored from the finest natural fabrics.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}
