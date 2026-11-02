import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton, ProductCardSkeleton } from '@/components/Skeleton';

export default function BrandLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <Skeleton className="w-12 h-3.5" />
          <span className="text-[#CFC8BA]">/</span>
          <Skeleton className="w-20 h-3.5" />
        </div>

        {/* Brand Banner Skeleton */}
        <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden mb-8 bg-[#EDE8DE] animate-pulse p-8 flex flex-col justify-end">
          <Skeleton className="w-32 h-8 mb-3" />
          <Skeleton className="w-96 h-4" />
        </div>

        {/* Filter bar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#EAE5DC]">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-40 h-8 rounded-lg" />
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

