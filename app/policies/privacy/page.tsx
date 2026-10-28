import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mb-6">
          Privacy Policy
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-[#EDE8DE] space-y-4 text-xs text-[#555047] leading-relaxed">
          <p>
            At <strong>NOTIONS® — OPULENT CLOTHING</strong>, we respect your privacy and are committed to protecting your personal data. This privacy notice informs you how we look after your personal data when you visit our online store and purchase our garments.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">1. Data We Collect</h2>
          <p>
            We collect identity data (full name), contact data (delivery address, email address, phone number), and transaction records strictly necessary to fulfill your atelier orders.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">2. Payment Security</h2>
          <p>
            Payment transactions are processed securely via encrypted gateway integrations (Razorpay). NOTIONS® never stores sensitive debit or credit card credentials on our servers.
          </p>
          <h2 className="font-serif text-base font-bold text-[#181818] pt-2">3. Atelier Concierge Inquiries</h2>
          <p>
            For questions regarding your private account details, contact our concierge at <a href="mailto:concierge@notionsclothing.com" className="text-[#143728] underline">concierge@notionsclothing.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
