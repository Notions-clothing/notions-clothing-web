import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import BrandDetailClient from '@/components/BrandDetailClient';
import JsonLd from '@/components/JsonLd';
import { getBrandBySlug, getProducts, getCategories } from '@/lib/db';
import {
  buildPageMetadata,
  getCanonicalUrl,
  getCollectionJsonLd,
  getBreadcrumbJsonLd,
} from '@/lib/seo';

export const revalidate = 0;

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BrandDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand || brand.is_active === false) {
    notFound();
  }

  const cleanDescription = brand.description
    ? brand.description.replace(/\s+/g, ' ').trim().slice(0, 160)
    : `Explore the opulent ${brand.name} collection at NOTIONS®. Luxury craftsmanship and modern menswear silhouettes.`;

  return buildPageMetadata({
    title: `${brand.name} Collection — Featured Brand`,
    description: cleanDescription,
    path: `/brands/${brand.slug}`,
    image: brand.banner_url || brand.logo_url || '/logo.png',
    keywords: [
      brand.name,
      `${brand.name} clothing`,
      'luxury brand',
      'menswear',
      'NOTIONS',
    ],
  });
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

  const brandUrl = getCanonicalUrl(`/brands/${brand.slug}`);
  const collectionJsonLd = getCollectionJsonLd({
    name: brand.name,
    description: brand.description || undefined,
    url: brandUrl,
    products,
  });

  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: brand.name, url: brandUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={[collectionJsonLd, breadcrumbsJsonLd]} />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-[#7A756D] mb-6"
        >
          <Link href="/" className="hover:text-[#143728] transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#181818] font-medium truncate max-w-[200px]" aria-current="page">
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
