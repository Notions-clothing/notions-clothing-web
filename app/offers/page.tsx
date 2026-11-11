import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { getProducts } from '@/lib/db';
import { Tag } from 'lucide-react';
import {
  buildPageMetadata,
  getCanonicalUrl,
  getCollectionJsonLd,
  getBreadcrumbJsonLd,
} from '@/lib/seo';

export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: 'Seasonal Privileges & Offers — Exclusive Menswear Pricing',
  description:
    'Explore curated seasonal privileges and special pricing on opulent menswear, handcrafted shoes, and artisanal accessories at NOTIONS®.',
  path: '/offers',
  image: '/logo.png',
  keywords: ['menswear sale', 'clothing privileges', 'luxury menswear discounts', 'NOTIONS offers'],
});

export default async function OffersPage() {
  const allProducts = await getProducts();
  const discountedProducts = allProducts.filter(
    (p) => p.compare_at_price && p.compare_at_price > p.price
  );

  const pageUrl = getCanonicalUrl('/offers');
  const collectionJsonLd = getCollectionJsonLd({
    name: 'Seasonal Privileges & Offers',
    description: 'Special pricing on selected opulent menswear pieces and handcrafted footwear.',
    url: pageUrl,
    products: discountedProducts,
  });

  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Offers', url: pageUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={[collectionJsonLd, breadcrumbsJsonLd]} />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE6] mx-auto flex items-center justify-center mb-4">
            <Tag className="w-5 h-5 text-[#143728]" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mb-2">
            Seasonal Privileges & Offers
          </h1>
          <p className="text-xs text-[#6B665E]">
            Special pricing on selected opulent menswear pieces and handcrafted footwear.
          </p>
        </div>

        {discountedProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#EDE8DE] p-8 max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#181818] mb-2">
              No active offers at this moment
            </p>
            <p className="text-xs text-[#7A756D] mb-6">
              Sign up for our newsletter below to receive private invitations to exclusive archive sales.
            </p>
            <Link
              href="/category/men-s-apparel"
              className="inline-block px-6 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
            >
              Shop All Menswear
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {discountedProducts.map((product) => (
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
