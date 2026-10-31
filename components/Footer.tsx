'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    apparel: false,
    footwear: false,
    newsletter: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#FAF9F5] border-t border-[#E6E1D8] text-[#2C2C2C] text-xs pt-12 md:pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 md:gap-10 pb-8 md:pb-12 border-b border-[#E6E1D8]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4 pb-6 md:pb-0 border-b border-[#E6E1D8] md:border-none">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="NOTIONS® — Opulent Clothing"
                width={160}
                height={46}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-[#666666] leading-relaxed max-w-sm text-xs">
              NOTIONS® creates refined, opulent apparel and accessories designed for the modern discerning gentleman. Elevating everyday journeys with impeccable tailoring and enduring fabrics.
            </p>
            <div className="space-y-2 pt-2 text-[#4A4A4A]">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#143728] mt-0.5 flex-shrink-0" />
                <span>Flagship Atelier, 42 Heritage Promenade, Indiranagar, Bengaluru</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#143728] flex-shrink-0" />
                <span>concierge@notionsclothing.com</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#143728] flex-shrink-0" />
                <span>+91 98765 43210 (Mon – Sat, 10am – 7pm)</span>
              </div>
            </div>
          </div>

          {/* Men's Apparel Categories (Accordion on Mobile) */}
          <div className="border-b border-[#E6E1D8] md:border-none">
            <button
              type="button"
              onClick={() => toggleSection('apparel')}
              className="w-full flex items-center justify-between py-4 md:py-0 text-left md:pointer-events-none cursor-pointer md:cursor-default"
              aria-expanded={openSections.apparel}
            >
              <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
                Men's Apparel
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-[#143728] md:hidden transition-transform duration-300 ease-out ${
                  openSections.apparel ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out md:overflow-visible md:max-h-none md:opacity-100 ${
                openSections.apparel
                  ? 'max-h-96 opacity-100 pt-1 pb-4'
                  : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:pt-3'
              }`}
            >
              <ul className="space-y-2 text-[#555555]">
                <li><Link href="/category/men-shirts" className="hover:text-[#143728] transition block py-0.5">Shirts</Link></li>
                <li><Link href="/category/men-jeans" className="hover:text-[#143728] transition block py-0.5">Jeans</Link></li>
                <li><Link href="/category/men-trousers" className="hover:text-[#143728] transition block py-0.5">Trousers</Link></li>
                <li><Link href="/category/men-t-shirts" className="hover:text-[#143728] transition block py-0.5">T-shirts</Link></li>
                <li><Link href="/category/men-shorts" className="hover:text-[#143728] transition block py-0.5">Shorts</Link></li>
                <li><Link href="/category/men-jackets" className="hover:text-[#143728] transition block py-0.5">Jackets</Link></li>
                <li><Link href="/category/men-dhothis" className="hover:text-[#143728] transition block py-0.5">Dhothis</Link></li>
                <li><Link href="/category/men-kurta" className="hover:text-[#143728] transition block py-0.5">Kurta</Link></li>
              </ul>
            </div>
          </div>

          {/* Footwear & Accessories (Accordion on Mobile) */}
          <div className="border-b border-[#E6E1D8] md:border-none">
            <button
              type="button"
              onClick={() => toggleSection('footwear')}
              className="w-full flex items-center justify-between py-4 md:py-0 text-left md:pointer-events-none cursor-pointer md:cursor-default"
              aria-expanded={openSections.footwear}
            >
              <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
                Footwear & More
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-[#143728] md:hidden transition-transform duration-300 ease-out ${
                  openSections.footwear ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out md:overflow-visible md:max-h-none md:opacity-100 ${
                openSections.footwear
                  ? 'max-h-96 opacity-100 pt-1 pb-4'
                  : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:pt-3'
              }`}
            >
              <ul className="space-y-2 text-[#555555]">
                <li><Link href="/category/shoes" className="hover:text-[#143728] transition block py-0.5">Shoes</Link></li>
                <li><Link href="/category/sandals" className="hover:text-[#143728] transition block py-0.5">Sandals</Link></li>
                <li><Link href="/category/caps" className="hover:text-[#143728] transition block py-0.5">Caps</Link></li>
                <li><Link href="/category/rings" className="hover:text-[#143728] transition block py-0.5">Rings</Link></li>
                <li><Link href="/category/bracelet" className="hover:text-[#143728] transition block py-0.5">Bracelet</Link></li>
                <li><Link href="/category/chain" className="hover:text-[#143728] transition block py-0.5">Chain</Link></li>
                <li><Link href="/new-arrivals" className="hover:text-[#143728] transition block py-0.5">New Arrivals</Link></li>
                <li><Link href="/offers" className="hover:text-[#143728] transition block py-0.5">Exclusive Offers</Link></li>
              </ul>
            </div>
          </div>

          {/* Newsletter (Accordion on Mobile) */}
          <div className="">
            <button
              type="button"
              onClick={() => toggleSection('newsletter')}
              className="w-full flex items-center justify-between py-4 md:py-0 text-left md:pointer-events-none cursor-pointer md:cursor-default"
              aria-expanded={openSections.newsletter}
            >
              <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
                Newsletter
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-[#143728] md:hidden transition-transform duration-300 ease-out ${
                  openSections.newsletter ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out md:overflow-visible md:max-h-none md:opacity-100 space-y-3 ${
                openSections.newsletter
                  ? 'max-h-96 opacity-100 pt-1 pb-4'
                  : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:pt-3'
              }`}
            >
              <p className="text-[#666666] leading-relaxed">
                Subscribe to receive private invitations to seasonal collections and atelier previews.
              </p>
              {subscribed ? (
                <div className="flex items-center space-x-2 text-[#143728] font-medium py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you for subscribing.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F3EFE6] text-[#181818] placeholder-[#807D75] text-xs px-3.5 py-2.5 rounded-full border border-transparent focus:border-[#CFC8BA] focus:outline-none pr-9"
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#143728] text-white rounded-full hover:bg-[#0d281c] transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[#7A7A7A] space-y-4 md:space-y-0 text-[11px]">
          <p>© {new Date().getFullYear()} NOTIONS® OPULENT CLOTHING. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/policies/privacy" className="hover:text-[#143728]">Privacy Policy</Link>
            <Link href="/policies/terms" className="hover:text-[#143728]">Terms & Conditions</Link>
            <Link href="/policies/shipping" className="hover:text-[#143728]">Shipping & Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
