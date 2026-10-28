import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductBySlug, getProducts } from '@/lib/db';

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A756D] mb-8">
          <Link href="/" className="hover:text-[#143728]">Home</Link>
          <span>/</span>
          {product.category_slug && (
            <>
              <Link href={`/category/${product.category_slug}`} className="hover:text-[#143728]">
                {product.category_name || 'Category'}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#181818] font-medium truncate max-w-[200px]">
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
