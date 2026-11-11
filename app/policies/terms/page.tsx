import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, getCanonicalUrl, getBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms & Conditions — NOTIONS® Opulent Clothing',
  description:
    'Review the official terms of service, atelier purchase agreements, and authenticity standards governing NOTIONS®.',
  path: '/policies/terms',
  keywords: ['terms and conditions', 'terms of service', 'atelier policies', 'NOTIONS terms'],
});

export default function TermsPage() {
  const pageUrl = getCanonicalUrl('/policies/terms');
  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Terms & Conditions', url: pageUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={breadcrumbsJsonLd} />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#7A756D] mb-6">
          <Link href="/" className="hover:text-[#143728] transition">Home</Link>
          <span>/</span>
          <span className="text-[#181818] font-medium" aria-current="page">Terms & Conditions</span>
        </nav>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mb-6">
          Terms & Conditions
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-[#EDE8DE] space-y-4 text-xs text-[#555047] leading-relaxed">
          <p>
            Welcome to NOTIONS® OPULENT CLOTHING. By browsing, placing orders, or utilizing our services, you agree to comply with the terms and conditions outlined herein.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">1. Authenticity & Integrity</h2>
          <p>
            All products displayed in our catalog are original creations crafted by NOTIONS® ateliers with authentic specifications, honest descriptions, and verified pricing.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">2. Pricing & Payments</h2>
          <p>
            Prices are listed in Indian Rupees (INR) inclusive of applicable taxes. Payments are securely processed via Razorpay. Orders are confirmed only upon successful verification.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
