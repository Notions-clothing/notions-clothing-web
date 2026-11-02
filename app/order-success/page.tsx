import { redirect } from 'next/navigation';

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

