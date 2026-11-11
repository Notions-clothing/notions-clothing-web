import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import SplashScreen from '@/components/SplashScreen';
import HeroBanner from '@/components/HeroBanner';
import ShopByCategory from '@/components/ShopByCategory';
import BestSellersSection from '@/components/BestSellersSection';
import { ModernEssentialsCard, PromoBannersRow } from '@/components/EditorialShowcase';
import BrandShowcaseSection from '@/components/BrandShowcaseSection';
import AllProductsSection from '@/components/AllProductsSection';
import Footer from '@/components/Footer';
import { getCategories, getProducts, getBanners, getBrandShowcase } from '@/lib/db';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 0; // Ensure fresh data on every visit

export const metadata: Metadata = buildPageMetadata({
  title: 'NOTIONS® — Opulent Clothing | Luxury Menswear & Accessories',
  description:
    'Discover timeless luxury, opulent menswear, handcrafted footwear, and refined accessories at NOTIONS®. Designed for the modern discerning gentleman.',
  path: '/',
  image: '/logo.png',
  keywords: [
    'luxury menswear',
    'opulent clothing',
    "men's designer fashion",
    'bespoke menswear',
    'luxury footwear',
  ],
});

export default async function HomePage() {
  const categories = await getCategories();
  const products = await getProducts();
  const banners = await getBanners();
  const brandShowcase = await getBrandShowcase();

  const heroBanners = banners.filter((b) => b.section === 'hero');
  const essentialsBanner = banners.find((b) => b.section === 'essentials');
  const footwearBanner = banners.find((b) => b.section === 'footwear');
  const accessoriesBanner = banners.find((b) => b.section === 'accessories');
  const newArrivalsBanner = banners.find((b) => b.section === 'new_arrivals');

  return (
    <>
      <SplashScreen />

      <div id="homepage-content-wrapper" className="min-h-screen flex flex-col bg-[#FAF9F5]">
        <Navbar />

        <main className="flex-1">
          {/* Main Hero Banner Automatic Slider */}
          <HeroBanner banners={heroBanners} />

          {/* Shop by Subcategory Row */}
          <ShopByCategory categories={categories} title="Shop by Category" />

          {/* Two-Column Section: Modern Essentials Banner + Best Sellers Grid */}
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
              {/* Left Feature Banner */}
              <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col">
                <ModernEssentialsCard banner={essentialsBanner} />
              </div>

              {/* Right Best Sellers with Filter Tabs */}
              <BestSellersSection initialProducts={products} categories={categories} />
            </div>
          </section>

          {/* Bottom 3 Editorial Promotional Banners */}
          <PromoBannersRow
            footwearBanner={footwearBanner}
            accessoriesBanner={accessoriesBanner}
            newArrivalsBanner={newArrivalsBanner}
          />

          {/* Brand Showcase Section (TANAY by notions) */}
          <BrandShowcaseSection brandShowcase={brandShowcase} />

          {/* All Products Section with 10 Initial Products (5 + 5 desktop) and Infinite Loading */}
          <AllProductsSection
            initialProducts={products}
            initialTotal={products.length}
            initialHasMore={products.length > 10}
          />
        </main>

        <Footer />
      </div>
    </>
  );
}
