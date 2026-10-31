'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/cart-context';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, totalAmount, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Your shopping bag is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call server to validate cart and create Razorpay order
      const orderRes = await fetch('/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            selectedSize: item.selectedSize,
            selectedSizeId: item.selectedSizeId,
            selectedColor: item.selectedColor,
            selectedColorId: item.selectedColorId,
            selectedColorHex: item.selectedColorHex,
            selectedColorImage: item.selectedColorImage,
            quantity: item.quantity,
          })),
          customer: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            shipping_address: {
              street: formData.apartment ? `${formData.street}, ${formData.apartment}` : formData.street,
              city: formData.city,
              state: formData.state,
              postal_code: formData.postalCode,
              country: 'India',
            },
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize order');
      }

      const saveOrderLocally = (confirmedOrder: any) => {
        try {
          const o = confirmedOrder || {
            order_number: orderData.orderNumber,
            customer_name: formData.fullName,
            customer_email: formData.email,
            customer_phone: formData.phone,
            shipping_address: {
              street: formData.apartment ? `${formData.street}, ${formData.apartment}` : formData.street,
              city: formData.city,
              state: formData.state,
              postal_code: formData.postalCode,
              country: 'India',
            },
            subtotal: orderData.subtotal,
            shipping_amount: orderData.shippingAmount,
            total_amount: orderData.amount,
            payment_status: 'paid',
            status: 'confirmed',
            created_at: new Date().toISOString(),
            items: orderData.items,
          };
          sessionStorage.setItem(`notions_order_${orderData.orderNumber}`, JSON.stringify(o));
          localStorage.setItem('notions_last_order', JSON.stringify(o));
        } catch (e) {}
      };

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !orderData.hasRealCredentials) {
        // Fallback for environment without live Razorpay API keys yet
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.razorpayOrderId,
            razorpay_payment_id: `pay_sandbox_${Date.now()}`,
            razorpay_signature: 'sandbox_verified',
            orderData: {
              orderNumber: orderData.orderNumber,
              amount: orderData.amount,
              subtotal: orderData.subtotal,
              shippingAmount: orderData.shippingAmount,
              customer: {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                shipping_address: {
                  street: formData.apartment ? `${formData.street}, ${formData.apartment}` : formData.street,
                  city: formData.city,
                  state: formData.state,
                  postal_code: formData.postalCode,
                  country: 'India',
                },
              },
              items: orderData.items,
            },
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          saveOrderLocally(verifyData.order);
          clearCart();
          router.push(`/order-confirmation/${orderData.orderNumber}`);
          return;
        }
      }

      // 3. Open official Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: 'INR',
        name: 'NOTIONS® Opulent Clothing',
        description: `Order #${orderData.orderNumber}`,
        image: '/logo.png',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#143728',
        },
        handler: async function (response: any) {
          // 4. Verify payment signature on backend
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                orderNumber: orderData.orderNumber,
                amount: orderData.amount,
                subtotal: orderData.subtotal,
                shippingAmount: orderData.shippingAmount,
                customer: {
                  name: formData.fullName,
                  email: formData.email,
                  phone: formData.phone,
                  shipping_address: {
                    street: formData.apartment ? `${formData.street}, ${formData.apartment}` : formData.street,
                    city: formData.city,
                    state: formData.state,
                    postal_code: formData.postalCode,
                    country: 'India',
                  },
                },
                items: orderData.items,
              },
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            saveOrderLocally(verifyData.order);
            clearCart();
            router.push(`/order-confirmation/${orderData.orderNumber}`);
          } else {
            setErrorMsg(verifyData.error || 'Payment verification failed. Please contact concierge.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg(response.error.description || 'Payment failed or was cancelled by user.');
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong during checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center text-xs font-semibold text-[#143728] hover:underline space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Shopping Bag</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#181818] mt-3">
            Secure Checkout
          </h1>
          <p className="text-xs text-[#5C574F] mt-1">
            Complete your details below to finalize your acquisition.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE8DE] p-8">
            <p className="text-sm text-[#736E65] mb-4">Your bag is currently empty.</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Delivery Details Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Contact Information */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#143728] pb-2 border-b border-[#EDE8DE]">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#181818] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Arvind Swaminathan"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#181818] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="concierge@example.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#181818] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#143728] pb-2 border-b border-[#EDE8DE]">
                  2. Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#181818] mb-1">
                      Street Address / House No. *
                    </label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Flat 402, Signature Towers, 12th Main"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#181818] mb-1">
                      Apartment, Suite, Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      placeholder="Near Defense Colony Park"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#181818] mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Bengaluru"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#181818] mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Karnataka"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#181818] mb-1">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="560038"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728] transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Payment Button */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-6 sticky top-28 shadow-2xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#181818] pb-3 border-b border-[#EDE8DE]">
                  Order Summary ({items.length})
                </h2>

                {/* Items preview list */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-3 text-xs">
                      <div className="w-14 h-16 relative bg-[#F5F3EF] rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.selectedColorImage || item.product.images?.[0]?.image_url || '/logo.png'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-[#181818] line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-[#7A756D] text-[11px] flex items-center flex-wrap gap-1 mt-0.5">
                            <span>Size: {item.selectedSize}</span>
                            {item.selectedColor && (
                              <span className="flex items-center gap-1">
                                •
                                {item.selectedColorHex && (
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs"
                                    style={{ backgroundColor: item.selectedColorHex }}
                                  />
                                )}
                                <span className="text-[#181818] font-medium">{item.selectedColor}</span>
                              </span>
                            )}
                            <span>• Qty: {item.quantity}</span>
                          </p>
                        </div>
                        <p className="font-bold text-[#181818]">
                          ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-[#EDE8DE] text-xs text-[#555555]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#181818]">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-[#181818]">
                      {shippingFee === 0 ? (
                        <span className="text-[#143728] font-semibold">Complimentary</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#181818] pt-3 border-t border-[#EDE8DE]">
                    <span>Total Amount</span>
                    <span className="text-[#143728]">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold tracking-wider uppercase rounded-full flex items-center justify-center space-x-2 transition shadow-md disabled:bg-[#8FA39A] cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{loading ? 'Securing Transaction...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} via Razorpay`}</span>
                </button>

                <div className="flex items-center justify-center space-x-2 text-[10px] text-[#777777] pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#143728]" />
                  <span>256-Bit Encrypted Razorpay Secure Checkout</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
