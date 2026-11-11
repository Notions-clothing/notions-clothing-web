import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPrivateMetadata('Order Placed Successfully', '/order-success');

interface OrderSuccessPageProps {
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params?.orderNumber;

  if (orderNumber) {
    redirect(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
  }

  redirect('/account');
}
