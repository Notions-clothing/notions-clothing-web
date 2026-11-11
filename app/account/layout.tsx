import type { Metadata } from 'next';
import { buildPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPrivateMetadata('My Account', '/account');

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

