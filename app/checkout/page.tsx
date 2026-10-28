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
        handler: async function (response: any) {
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
            clearCart();
            router.push(`/order-confirmation/${orderData.orderNumber}`);
          } else {
            setErrorMsg(verifyData.error || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#143728',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMsg(`Payment was not completed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-[#6B665E] hover:text-[#143728] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#181818] mt-3">
            Secure Atelier Checkout
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-[#EDE8DE] p-8 max-w-md mx-auto">
            <h3 className="font-serif text-xl text-[#181818] mb-2">Your Bag is Empty</h3>
            <p className="text-xs text-[#737373] mb-6">
              Please add items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
            >
              Discover Collection
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Customer and Shipping Form */}
            <div className="lg:col-span-7 space-y-8">
              {/* Contact Information */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#143728]">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Email Address (for order & invoice dispatch) *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="vikram@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#143728]">
                  2. Delivery Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="street"
                      required
                      placeholder="Flat / Villa / House No., Street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Apartment, Suite, Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Near Landmark"
                      value={formData.apartment}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="Bengaluru"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      placeholder="Karnataka"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      placeholder="560038"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#444444] font-medium mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="India"
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#F5F2EB] text-[#777777]"
                    />
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
                          src={item.product.images?.[0]?.image_url || '/logo.png'}
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
                          <p className="text-[#7A756D] text-[11px]">
                            Size: {item.selectedSize} × {item.quantity}
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
                  className="w-full py-4 px-6 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold tracking-wider uppercase rounded-full flex items-center justify-center space-x-2 transition shadow-md disabled:bg-[#8FA39A]"
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
