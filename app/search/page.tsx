import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/db';
import { Search } from 'lucide-react';

export const revalidate = 0;

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const results = query ? await getProducts({ search: query }) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE6] mx-auto flex items-center justify-center mb-4">
            <Search className="w-5 h-5 text-[#143728]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#181818] mb-2">
            Search Our Catalog
          </h1>
          <p className="text-xs text-[#6B665E]">
            {query
              ? `Displaying results for "${query}"`
              : 'Enter a keyword to explore shirts, trousers, jackets, footwear and accessories.'}
          </p>
        </div>

        {query && (
          <div className="pb-4 border-b border-[#EAE5DC] mb-6 flex justify-between items-center text-xs text-[#666666]">
            <span>Found <strong className="text-[#181818]">{results.length}</strong> {results.length === 1 ? 'match' : 'matches'}</span>
            <Link href="/" className="text-[#143728] hover:underline">
              Clear search
            </Link>
          </div>
        )}

        {results.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#EDE8DE] p-8 max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#181818] mb-2">
              {query ? `No items found matching "${query}"` : 'Type what you are searching for above'}
            </p>
            <p className="text-xs text-[#7A756D] mb-6">
              Try searching for "Linen", "Jeans", "Sneaker", "Tee", or browse by collection.
            </p>
            <Link
              href="/category/men"
              className="inline-block px-5 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
            >
              Browse Men's Apparel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}
