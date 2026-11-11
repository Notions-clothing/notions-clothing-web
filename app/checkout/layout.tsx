import type { Metadata } from 'next';
import { buildPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPrivateMetadata('Checkout', '/checkout');

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

