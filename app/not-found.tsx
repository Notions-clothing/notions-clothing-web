import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, ArrowRight, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Emblem */}
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F3EFE6] border border-[#E6E1D8] flex items-center justify-center text-[#143728] shadow-2xs">
            <Compass className="w-7 h-7" />
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-[0.28em] uppercase text-[#143728]">
              404 — Atelier Archive Notice
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#181818] tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-[#666055] max-w-md mx-auto leading-relaxed">
              The garment, collection, or atelier page you are looking for may have been archived, renamed, or is temporarily unavailable.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="max-w-md mx-auto">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search shirts, trousers, shoes, accessories..."
                className="w-full bg-white text-[#181818] placeholder-[#807D75] text-xs pl-10 pr-12 py-3 rounded-full border border-[#DCD5C9] focus:border-[#143728] focus:outline-none shadow-xs transition"
              />
              <Search className="w-4 h-4 text-[#807D75] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                aria-label="Search catalog"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-[#143728] hover:bg-[#0c2419] text-white rounded-full transition cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Curated Recommendations */}
          <div className="pt-4 border-t border-[#EAE5DC] max-w-lg mx-auto">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8478] mb-3">
              Explore Our Core Collections
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/shop"
                className="px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0c2419] transition"
              >
                Shop All Collections
              </Link>
              <Link
                href="/category/men-s-apparel"
                className="px-4 py-2 bg-white border border-[#DDD7CD] text-[#242424] text-xs font-medium rounded-full hover:border-[#143728] hover:text-[#143728] transition"
              >
                Men's Apparel
              </Link>
              <Link
                href="/category/foot-wear"
                className="px-4 py-2 bg-white border border-[#DDD7CD] text-[#242424] text-xs font-medium rounded-full hover:border-[#143728] hover:text-[#143728] transition"
              >
                Footwear
              </Link>
              <Link
                href="/category/accessories"
                className="px-4 py-2 bg-white border border-[#DDD7CD] text-[#242424] text-xs font-medium rounded-full hover:border-[#143728] hover:text-[#143728] transition"
              >
                Accessories
              </Link>
              <Link
                href="/new-arrivals"
                className="px-4 py-2 bg-white border border-[#DDD7CD] text-[#242424] text-xs font-medium rounded-full hover:border-[#143728] hover:text-[#143728] transition"
              >
                New Arrivals
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-medium text-[#736E65] hover:text-[#143728] transition underline"
            >
              ← Return to Atelier Homepage
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

