import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetailClient';
import JsonLd from '@/components/JsonLd';
import { getProductBySlug, getProducts } from '@/lib/db';
import {
  buildPageMetadata,
  getCanonicalUrl,
  getProductJsonLd,
  getBreadcrumbJsonLd,
} from '@/lib/seo';

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images?.[0]?.image_url ||
    product.colors?.[0]?.images?.[0]?.url ||
    product.colors?.[0]?.image_url ||
    '/logo.png';

  const cleanDescription = product.description
    ? product.description.replace(/\s+/g, ' ').trim().slice(0, 160)
    : `Discover ${product.name} crafted by ${product.brand_name || 'NOTIONS®'}. Luxury menswear tailoring with opulent finishes.`;

  const brandTitle = product.brand_name ? ` by ${product.brand_name}` : '';
  const priceFormatted = `₹${product.price.toLocaleString('en-IN')}`;

  return buildPageMetadata({
    title: `${product.name}${brandTitle} (${priceFormatted})`,
    description: cleanDescription,
    path: `/product/${product.slug}`,
    image: primaryImage,
    keywords: [
      product.name,
      product.brand_name || '',
      product.category_name || '',
      product.subcategory_name || '',
      product.sku || '',
      'luxury clothing',
      'designer menswear',
    ].filter(Boolean),
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Related products from same category
  const allProducts = await getProducts();
  const relatedProducts = allProducts.filter(
    (p) => p.id !== product.id && p.category_id === product.category_id
  );

  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const productJsonLd = getProductJsonLd(product, canonicalUrl);

  const breadcrumbsList = [
    { name: 'Home', url: getCanonicalUrl('/') },
  ];
  if (product.category_slug) {
    breadcrumbsList.push({
      name: product.category_name || 'Category',
      url: getCanonicalUrl(`/category/${product.category_slug}`),
    });
  }
  breadcrumbsList.push({
    name: product.name,
    url: canonicalUrl,
  });

  const breadcrumbsJsonLd = getBreadcrumbJsonLd(breadcrumbsList);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={[productJsonLd, breadcrumbsJsonLd]} />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-[#7A756D] mb-8"
        >
          <Link href="/" className="hover:text-[#143728] transition">Home</Link>
          <span>/</span>
          {product.category_slug && (
            <>
              <Link href={`/category/${product.category_slug}`} className="hover:text-[#143728] transition">
                {product.category_name || 'Category'}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#181818] font-medium truncate max-w-[200px]" aria-current="page">
            {product.name}
          </span>
        </nav>

        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}
