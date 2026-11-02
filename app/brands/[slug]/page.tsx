import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import BrandDetailClient from '@/components/BrandDetailClient';
import { getBrandBySlug, getProducts, getCategories } from '@/lib/db';

export const revalidate = 0;

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrandDetailPage({ params }: BrandDetailPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand || brand.is_active === false) {
    notFound();
  }

  const [products, categories] = await Promise.all([
    getProducts({ brandSlug: brand.slug }),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A756D] mb-6">
          <Link href="/" className="hover:text-[#143728] transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#181818] font-medium truncate max-w-[200px]">
            {brand.name}
          </span>
        </nav>

        {/* Client Interactive Area */}
        <BrandDetailClient
          brand={brand}
          initialProducts={products}
          categories={categories}
        />
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}

