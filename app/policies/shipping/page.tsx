import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
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
