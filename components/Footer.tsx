'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#FAF9F5] border-t border-[#E6E1D8] text-[#2C2C2C] text-xs pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#E6E1D8]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
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

          {/* Men's Apparel Categories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
              Men's Apparel
            </h4>
            <ul className="space-y-2 text-[#555555]">
              <li><Link href="/category/men-shirts" className="hover:text-[#143728] transition">Shirts</Link></li>
              <li><Link href="/category/men-jeans" className="hover:text-[#143728] transition">Jeans</Link></li>
              <li><Link href="/category/men-trousers" className="hover:text-[#143728] transition">Trousers</Link></li>
              <li><Link href="/category/men-t-shirts" className="hover:text-[#143728] transition">T-shirts</Link></li>
              <li><Link href="/category/men-shorts" className="hover:text-[#143728] transition">Shorts</Link></li>
              <li><Link href="/category/men-jackets" className="hover:text-[#143728] transition">Jackets</Link></li>
              <li><Link href="/category/men-dhothis" className="hover:text-[#143728] transition">Dhothis</Link></li>
              <li><Link href="/category/men-kurta" className="hover:text-[#143728] transition">Kurta</Link></li>
            </ul>
          </div>

          {/* Footwear & Accessories */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
              Footwear & More
            </h4>
            <ul className="space-y-2 text-[#555555]">
              <li><Link href="/category/shoes" className="hover:text-[#143728] transition">Shoes</Link></li>
              <li><Link href="/category/sandals" className="hover:text-[#143728] transition">Sandals</Link></li>
              <li><Link href="/category/caps" className="hover:text-[#143728] transition">Caps</Link></li>
              <li><Link href="/category/rings" className="hover:text-[#143728] transition">Rings</Link></li>
              <li><Link href="/category/bracelet" className="hover:text-[#143728] transition">Bracelet</Link></li>
              <li><Link href="/category/chain" className="hover:text-[#143728] transition">Chain</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-[#143728] transition">New Arrivals</Link></li>
              <li><Link href="/offers" className="hover:text-[#143728] transition">Exclusive Offers</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-[#143728]">
              Newsletter
            </h4>
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
            <div className="pt-3">
              <Link
                href="/admin"
                className="text-[11px] text-[#8C887E] hover:text-[#143728] transition underline underline-offset-2"
              >
                Atelier Administration Portal
              </Link>
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
