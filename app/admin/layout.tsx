import type { Metadata } from 'next';
import { buildPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPrivateMetadata('Admin Atelier Dashboard', '/admin');

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

