import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton, ProductCardSkeleton } from '@/components/Skeleton';

export default function ShopLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Skeleton */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <Skeleton className="w-28 h-3.5 mx-auto" />
          <Skeleton className="w-56 h-8 mx-auto" />
          <Skeleton className="w-72 h-4 mx-auto" />
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

