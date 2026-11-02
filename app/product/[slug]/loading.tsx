import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProductDetailSkeleton } from '@/components/Skeleton';

export default function ProductLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailSkeleton />
      </main>
      <Footer />
    </div>
  );
}

