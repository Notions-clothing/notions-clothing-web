import type { Metadata } from 'next';
import { buildPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPrivateMetadata('Order Confirmation', '/order-confirmation');

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

