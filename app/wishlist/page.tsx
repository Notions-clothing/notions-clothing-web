'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/wishlist-context';

export default function WishlistPage() {
  const router = useRouter();
  const { setIsWishlistOpen } = useWishlist();

  useEffect(() => {
    setIsWishlistOpen(true);
    router.replace('/');
  }, [router, setIsWishlistOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
      <p className="text-xs text-[#7A756D]">Opening your wishlist...</p>
    </div>
  );
}
