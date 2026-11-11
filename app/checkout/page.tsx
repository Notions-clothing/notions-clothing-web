'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { CustomerAddress } from '@/types/database';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft, MapPin, CheckCircle, Plus, User } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, totalAmount, clearCart } = useCart();
  const { user, savedAddresses, addAddress, openAccountModal } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isStockReservedError, setIsStockReservedError] = useState(false);
  const [reservationToken, setReservationToken] = useState<string>('');

  // Selected address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveToAccount, setSaveToAccount] = useState(true);

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

  // When user or savedAddresses load, pre-populate
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
      if (defaultAddr && selectedAddressId === 'new') {
        setSelectedAddressId(defaultAddr.id);
        applyAddressToForm(defaultAddr);
      }
    }
  }, [savedAddresses]);

  const applyAddressToForm = (addr: CustomerAddress) => {
    setFormData((prev) => ({
      ...prev,
      fullName: addr.name || prev.fullName,
      phone: addr.phone || prev.phone,
      street: addr.street || '',
      apartment: addr.apartment || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postal_code || '',
    }));
  };

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFormData((prev) => ({
        ...prev,
        street: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
      }));
    } else {
      const addr = savedAddresses.find((a) => a.id === addrId);
      if (addr) {
        applyAddressToForm(addr);
      }
    }
  };

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
    setIsStockReservedError(false);

    if (items.length === 0) {
      setErrorMsg('Your shopping bag is empty.');
      return;
    }

    setLoading(true);

    try {
      // If user selected 'new' address and opted to save to account, save it
      if (user && selectedAddressId === 'new' && saveToAccount && formData.street && formData.city && formData.postalCode) {
        try {
          await addAddress({
            name: formData.fullName || user.full_name,
            phone: formData.phone || user.phone || '',
            street: formData.street,
            apartment: formData.apartment || '',
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: 'India',
            is_default: savedAddresses.length === 0,
          });
        } catch (e) {
          console.error('Non-blocking address save error:', e);
        }
      }

      // 1. Call server to validate cart and create Razorpay order with database-level stock lock
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
          existingReservationToken: reservationToken,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.razorpayOrderId) {
        if (orderData.isStockReserved || orderRes.status === 409) {
          setIsStockReservedError(true);
        }
        setErrorMsg(orderData.error || 'Failed to initialize payment gateway.');
        setLoading(false);
        return;
      }

      // Save reservation token to prevent double-locking on re-attempts
      if (orderData.reservationToken) {
        setReservationToken(orderData.reservationToken);
      }

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setErrorMsg('Razorpay SDK failed to load. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 3. Open Razorpay payment gateway
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'NOTIONS®',
        description: `Order ${orderData.orderNumber} Payment`,
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
          setLoading(true);
          try {
            // 4. Verify payment on server and confirm order
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: orderData.orderNumber,
                reservationToken: orderData.reservationToken,
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
                items: items.map((item) => ({
                  productId: item.product.id,
                  product_id: item.product.id,
                  productName: item.product.name,
                  product_name: item.product.name,
                  sku: item.product.sku,
                  selectedSize: item.selectedSize,
                  selectedSizeId: item.selectedSizeId,
                  variant_label: item.selectedSize || 'Standard',
                  selectedColor: item.selectedColor,
                  selectedColorId: item.selectedColorId,
                  selectedColorHex: item.selectedColorHex,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  unit_price: item.unitPrice,
                  image_url: item.selectedColorImage || item.product.images?.[0]?.image_url || '',
                })),
                subtotal,
                shippingFee,
                totalAmount,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              clearCart();
              try {
                if (verifyData.order) {
                  localStorage.setItem('notions_last_order', JSON.stringify(verifyData.order));
                  sessionStorage.setItem(`notions_order_${orderData.orderNumber}`, JSON.stringify(verifyData.order));
                }
              } catch (e) {}
              const emailParam = formData?.email ? `?email=${encodeURIComponent(formData.email.trim())}` : '';
              router.push(`/order-confirmation/${orderData.orderNumber}${emailParam}`);
            } else {
              setErrorMsg(verifyData.error || 'Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            setErrorMsg('Payment verification encountered an unexpected error.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setLoading(false);
            if (orderData.reservationToken) {
              try {
                await fetch('/api/checkout/cancel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reservationToken: orderData.reservationToken,
                    razorpayOrderId: orderData.razorpayOrderId,
                    orderNumber: orderData.orderNumber,
                  }),
                });
              } catch (e) {}
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        setErrorMsg(response.error?.description || 'Payment failed or was cancelled by user.');
        setLoading(false);
        if (orderData.reservationToken) {
          try {
            await fetch('/api/checkout/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reservationToken: orderData.reservationToken,
                razorpayOrderId: orderData.razorpayOrderId,
                orderNumber: orderData.orderNumber,
              }),
            });
          } catch (e) {}
        }
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
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-start space-x-3 transition-all ${
              isStockReservedError
                ? 'bg-amber-50/90 border border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isStockReservedError ? 'text-amber-600' : 'text-red-500'}`} />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">
                {isStockReservedError ? 'Item Currently Reserved' : 'Unable to Proceed'}
              </span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
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
              {/* Guest Banner if not signed in */}
              {!user && (
                <div className="bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[#143728] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#181818]">Already have a NOTIONS® account?</p>
                      <p className="text-[11px] text-[#7A756D]">Sign in to access your saved addresses & faster checkout.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAccountModal('login')}
                    className="py-1.5 px-3.5 bg-[#143728] text-white rounded-lg text-xs font-medium hover:bg-[#0f291e] transition shrink-0 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* 1. Contact Information */}
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
                      Email Address (Order Confirmation) *
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

              {/* 2. Shipping Address Selection */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE8DE]">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#143728]">
                    2. Shipping Address
                  </h2>
                  {user && savedAddresses.length > 0 && (
                    <span className="text-[11px] text-[#7A756D]">
                      {savedAddresses.length} saved address{savedAddresses.length > 1 ? 'es' : ''} available
                    </span>
                  )}
                </div>

                {/* Saved Address Cards for Logged-In Customers */}
                {user && savedAddresses.length > 0 && (
                  <div className="space-y-3 pb-2">
                    <label className="block text-xs font-semibold text-[#181818]">
                      Select Saved Address
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#143728] bg-[#FAF9F5] ring-1 ring-[#143728]'
                                : 'border-[#DDD7CC] bg-white hover:border-[#143728]/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-[#181818]">{addr.name}</span>
                                {addr.is_default && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#555555] line-clamp-1">{addr.street}</p>
                              {addr.apartment && <p className="text-[11px] text-[#555555] line-clamp-1">{addr.apartment}</p>}
                              <p className="text-[11px] text-[#555555]">
                                {addr.city}, {addr.state} - {addr.postal_code}
                              </p>
                              <p className="text-[10px] text-[#7A756D] mt-1">Phone: {addr.phone}</p>
                            </div>
                            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#143728]">
                              <input
                                type="radio"
                                name="addressSelection"
                                checked={isSelected}
                                onChange={() => handleSelectAddress(addr.id)}
                                className="text-[#143728] focus:ring-[#143728]"
                              />
                              <span>Deliver to this address</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Option to enter a new address */}
                      <div
                        onClick={() => handleSelectAddress('new')}
                        className={`p-3.5 rounded-xl border border-dashed cursor-pointer transition flex items-center justify-center gap-2 ${
                          selectedAddressId === 'new'
                            ? 'border-[#143728] bg-[#FAF9F5] ring-1 ring-[#143728]'
                            : 'border-[#DDD7CC] bg-white hover:border-[#143728]'
                        }`}
                      >
                        <Plus size={16} className="text-[#143728]" />
                        <span className="text-xs font-semibold text-[#143728]">
                          + Enter New Address
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form Fields */}
                <div className="space-y-4 pt-2">
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

                  {user && selectedAddressId === 'new' && (
                    <label className="flex items-center gap-2 pt-1 text-xs text-[#181818] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                        className="rounded text-[#143728] focus:ring-[#143728]"
                      />
                      <span>Save this address to my account for future orders</span>
                    </label>
                  )}
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
