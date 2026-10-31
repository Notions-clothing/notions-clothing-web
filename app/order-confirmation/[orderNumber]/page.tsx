'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Order } from '@/types/database';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function OrderConfirmationPage() {
  const params = useParams();
  const rawOrderNumber = Array.isArray(params?.orderNumber)
    ? params?.orderNumber[0]
    : params?.orderNumber || '';
  const orderNumber = decodeURIComponent(rawOrderNumber).trim();
  const cleanNum = orderNumber.replace(/^#/, '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try reading from sessionStorage or localStorage
    try {
      const stored =
        sessionStorage.getItem(`notions_order_${orderNumber}`) ||
        sessionStorage.getItem(`notions_order_${cleanNum}`) ||
        sessionStorage.getItem(`notions_order_NOT-${cleanNum}`) ||
        localStorage.getItem('notions_last_order');
      if (stored) {
        const parsed: Order = JSON.parse(stored);
        const parsedNum = (parsed.order_number || '').replace(/^#/, '').toLowerCase();
        if (
          !cleanNum ||
          parsedNum === cleanNum.toLowerCase() ||
          parsed.id === orderNumber
        ) {
          setOrder(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse cached order:', e);
    }

    // 2. Try fetching order from server API
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const match = data.find((o: Order) => {
            const oNum = (o.order_number || '').replace(/^#/, '').toLowerCase();
            return (
              oNum === cleanNum.toLowerCase() ||
              o.id === orderNumber ||
              o.id === cleanNum
            );
          });
          if (match) {
            setOrder(match);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch order:', err))
      .finally(() => setLoading(false));
  }, [orderNumber, cleanNum]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Banner */}
        <div className="text-center mb-10">
         
          <span className="text-xs font-semibold uppercase tracking-widest text-[#143728]">
            Order Confirmed & Paid
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#181818] mt-2 mb-2">
            {order?.customer_name ? `Thank you, ${order.customer_name}` : 'Thank you for your order'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C574F] max-w-md mx-auto">
            Your opulent order <strong className="text-[#181818]">#{order?.order_number || cleanNum}</strong> has been secured.
            {order?.customer_email && (
              <> A confirmation notice has been sent to <strong className="text-[#181818]">{order.customer_email}</strong>.</>
            )}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl border border-[#EDE8DE] p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row justify-between pb-6 border-b border-[#EDE8DE] gap-4 text-xs">
            <div>
              <span className="text-[#7A756D] block">Order Number</span>
              <strong className="text-sm text-[#181818]">#{order?.order_number || cleanNum}</strong>
            </div>
            <div>
              <span className="text-[#7A756D] block">Date Placed</span>
              <strong className="text-sm text-[#181818]">
                {order?.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : new Date().toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
              </strong>
            </div>
            <div>
              <span className="text-[#7A756D] block">Payment Gateway</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D9EFE0] text-[#143728]">
                Razorpay Verified
              </span>
            </div>
            <div>
              <span className="text-[#7A756D] block">Fulfillment Status</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F2EB] text-[#181818]">
                {(order?.status || 'CONFIRMED').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Items List */}
          {order?.items && order.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#143728]">
                Purchased Items
              </h3>
              <div className="divide-y divide-[#EDE8DE]">
                {order.items.map((item) => (
                  <div key={item.id || item.product_name} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-14 relative bg-[#F5F3EF] rounded overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.product_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#888888]">N</div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#181818]">{item.product_name}</h4>
                        <p className="text-[#7A756D] text-[11px] flex items-center flex-wrap gap-1 mt-0.5">
                          {item.variant_label && <span>Size: {item.variant_label}</span>}
                          {item.selected_color && (
                            <span className="flex items-center gap-1">
                              •
                              {item.selected_color_hex && (
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs"
                                  style={{ backgroundColor: item.selected_color_hex }}
                                />
                              )}
                              <span className="text-[#181818] font-medium">{item.selected_color}</span>
                            </span>
                          )}
                          <span>• Qty: {item.quantity}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#181818]">
                      ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals & Delivery Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#EDE8DE] text-xs">
            {/* Delivery Destination */}
            <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#EDE8DE]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#143728] block mb-2">
                Delivery Destination
              </span>
              {order?.shipping_address ? (
                <p className="text-[#333333] leading-relaxed">
                  <strong>{order.customer_name}</strong><br />
                  {order.shipping_address.street}<br />
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}<br />
                  Phone: {order.customer_phone}
                </p>
              ) : (
                <p className="text-[#5C574F] leading-relaxed">
                  Garments dispatched via courier concierge directly to your shipping destination.
                </p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-[#555555]">
                <span>Subtotal</span>
                <span className="font-medium text-[#181818]">
                  ₹{(order?.subtotal || order?.total_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#555555]">
                <span>Shipping</span>
                <span className="font-medium text-[#181818]">
                  {order?.shipping_amount === 0 || !order ? 'Complimentary' : `₹${order.shipping_amount}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#181818] pt-2 border-t border-[#EDE8DE]">
                <span>Amount Paid</span>
                <span className="text-[#143728]">
                  ₹{(order?.total_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full transition shadow-sm"
          >
            <span>Return to Storefront</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
