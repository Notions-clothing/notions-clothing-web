import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AccountDashboardSkeleton } from '@/components/Skeleton';

export default function AccountLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AccountDashboardSkeleton />
      </main>
      <Footer />
    </div>
  );
}

