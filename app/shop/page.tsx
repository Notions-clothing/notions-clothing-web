import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShopClient from '@/components/ShopClient';
import JsonLd from '@/components/JsonLd';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { getProducts, getCategories } from '@/lib/db';
import { buildPageMetadata, getCollectionJsonLd, getBreadcrumbJsonLd, getCanonicalUrl } from '@/lib/seo';

export const revalidate = 0; // Always serve fresh catalog data

export const metadata: Metadata = buildPageMetadata({
  title: 'Shop All Collections — Luxury Menswear & Accessories',
  description:
    'Explore the complete NOTIONS® luxury catalog: bespoke shirts, fine tailored trousers, raw denim, opulent footwear, and handcrafted jewelry accessories.',
  path: '/shop',
  image: '/logo.png',
  keywords: [
    'shop menswear',
    'luxury apparel catalog',
    "men's designer clothes",
    'bespoke shirts',
    'luxury shoes',
  ],
});

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const shopUrl = getCanonicalUrl('/shop');
  const collectionJsonLd = getCollectionJsonLd({
    name: 'All Collections',
    description: 'Explore the complete NOTIONS® luxury menswear and accessories catalog.',
    url: shopUrl,
    products,
  });

  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Shop', url: shopUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={[collectionJsonLd, breadcrumbsJsonLd]} />
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

