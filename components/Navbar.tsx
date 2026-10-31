'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const { count: wishlistCount, setIsWishlistOpen } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Men’s Apparel', href: '/category/men-s-apparel' },
    { name: 'Footwear', href: '/category/foot-wear' },
    { name: 'Accessories', href: '/category/accessories' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Offers', href: '/offers' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b border-[#EAE5DC] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Left: Mobile Hamburger + Brand Logo */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#181818] hover:text-[#143728] focus:outline-none cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/" className="inline-block relative">
                <Image
                  src="/logo.png"
                  alt="NOTIONS® — Opulent Clothing"
                  width={170}
                  height={48}
                  className="h-9 sm:h-10 md:h-11 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-5 xl:space-x-7 text-[13px] tracking-wide font-medium text-[#2B2B2B]">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative py-2 transition-colors hover:text-[#143728] ${
                      isActive
                        ? 'text-[#143728] font-semibold'
                        : 'text-[#333333]'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#143728] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Search Input (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-[280px] lg:max-w-[320px] mx-4 lg:mx-6">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Search for shirts, jeans, shoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F3EFE6] text-[#181818] placeholder-[#807D75] text-xs pl-8 pr-4 py-2 rounded-full border border-transparent focus:border-[#CFC8BA] focus:outline-none transition"
                />
                <Search className="w-3.5 h-3.5 text-[#807D75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </form>
            </div>

            {/* Right Icons: Account, Wishlist, Cart */}
            <div className="flex items-center space-x-3 sm:space-x-5 text-[#242424]">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-1.5 text-[#242424] hover:text-[#143728] cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                href="/account"
                className="p-1.5 hover:text-[#143728] transition"
                aria-label="My Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsWishlistOpen(true)}
                className="p-1.5 hover:text-[#143728] transition relative cursor-pointer"
                aria-label="Open Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#143728] text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="p-1.5 hover:text-[#143728] transition relative cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-[#143728] text-white text-[10px] font-semibold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile search drop down with smooth unfold coming animation */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
              mobileSearchOpen
                ? 'max-h-20 opacity-100 py-3 border-t border-[#EAE5DC]'
                : 'max-h-0 opacity-0 py-0 border-transparent pointer-events-none'
            }`}
          >
            <form
              onSubmit={handleSearchSubmit}
              className={`relative transform transition-all duration-300 ease-out ${
                mobileSearchOpen ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-2 opacity-0 scale-98'
              }`}
            >
              <input
                type="text"
                placeholder="Search for shirts, jeans, shoes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3EFE6] text-[#181818] placeholder-[#807D75] text-xs pl-9 pr-4 py-2.5 rounded-full border border-transparent focus:border-[#CFC8BA] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#807D75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden overflow-hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer content with smooth slide animation */}
        <div
          className={`relative w-4/5 max-w-xs bg-[#FAF9F5] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#EAE5DC]">
              <Image
                src="/logo.png"
                alt="NOTIONS®"
                width={136}
                height={38}
                className="h-8 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#333333] hover:text-[#143728] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-[#181818] hover:text-[#143728] py-2 border-b border-[#F0EDE6] flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <span className="text-xs text-[#999999]">→</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#EAE5DC] space-y-3 text-sm">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 text-[#333333] hover:text-[#143728]"
              >
                <User className="w-4 h-4" />
                <span>My Account</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsWishlistOpen(true);
                }}
                className="w-full flex items-center space-x-3 text-[#333333] hover:text-[#143728] cursor-pointer text-left"
              >
                <Heart className="w-4 h-4" />
                <span>Wishlist ({wishlistCount})</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-[#EAE5DC] text-xs text-[#888888]">
            <p>© {new Date().getFullYear()} NOTIONS®. Opulent Clothing.</p>
          </div>
        </div>
      </div>
    </>
  );
}
