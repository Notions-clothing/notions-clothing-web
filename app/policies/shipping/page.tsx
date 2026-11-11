import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, getCanonicalUrl, getBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping & Returns — Express Delivery & 7-Day Doorstep Returns',
  description:
    'Review complimentary express shipping details, delivery timelines, and hassle-free 7-day doorstep return policies at NOTIONS®.',
  path: '/policies/shipping',
  keywords: ['shipping policy', 'returns and exchanges', 'express delivery', 'NOTIONS shipping'],
});

export default function ShippingPage() {
  const pageUrl = getCanonicalUrl('/policies/shipping');
  const breadcrumbsJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Shipping & Returns', url: pageUrl },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <JsonLd data={breadcrumbsJsonLd} />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#7A756D] mb-6">
          <Link href="/" className="hover:text-[#143728] transition">Home</Link>
          <span>/</span>
          <span className="text-[#181818] font-medium" aria-current="page">Shipping & Returns</span>
        </nav>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mb-6">
          Shipping & Return Policies
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-[#EDE8DE] space-y-4 text-xs text-[#555047] leading-relaxed">
          <h2 className="font-serif text-base font-bold text-[#181818]">1. Delivery Timelines & Charges</h2>
          <p>
            • Complimentary express shipping on all domestic orders of ₹1,999 and above.
          </p>
          <p>
            • Orders below ₹1,999 incur a nominal flat shipping fee of ₹99.
          </p>
          <p>
            • All garments are dispatched within 24–48 hours of order confirmation via premium couriers (BlueDart, Delhivery) with real-time tracking provided via email.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">2. 7-Day Doorstep Returns & Exchanges</h2>
          <p>
            We offer hassle-free 7-day exchanges and returns for unworn garments with original brand tags attached. To initiate a return, contact our concierge at <a href="mailto:concierge@notionsclothing.com" className="text-[#143728] underline">concierge@notionsclothing.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
