'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/auth-context';
import { AccountDashboardSkeleton } from '@/components/Skeleton';
import { Order, CustomerAddress } from '@/types/database';
import {
  User,
  Package,
  MapPin,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Truck,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function AccountPage() {
  const {
    user,
    loading: authLoading,
    logout,
    openAccountModal,
    savedAddresses,
    loadingAddresses,
    refreshAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('orders');

  // Customer orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address modal/form state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Guest lookup state (for non-logged in or guest customers)
  const [guestOrderNumber, setGuestOrderNumber] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestOrderResult, setGuestOrderResult] = useState<Order | null>(null);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [guestLookupError, setGuestLookupError] = useState('');

  // Load user orders when authenticated
  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to load customer orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfilePhone(user.phone || '');
      loadOrders();
    }
  }, [user, loadOrders]);

  // Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileName,
          phone: profilePhone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      } else {
        await refreshUser();
        setIsEditingProfile(false);
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Address Modal
  const handleOpenAddressModal = (address?: CustomerAddress) => {
    setAddressError('');
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        name: address.name,
        phone: address.phone,
        street: address.street,
        apartment: address.apartment || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'India',
        is_default: address.is_default,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        name: user?.full_name || '',
        phone: user?.phone || '',
        street: '',
        apartment: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        is_default: savedAddresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  // Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!addressForm.name || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.postal_code) {
      setAddressError('Please fill in all required address fields.');
      return;
    }

    setSavingAddress(true);
    let res;
    if (editingAddressId) {
      res = await updateAddress(editingAddressId, addressForm);
    } else {
      res = await addAddress(addressForm);
    }
    setSavingAddress(false);

    if (res.success) {
      setIsAddressModalOpen(false);
    } else {
      setAddressError(res.error || 'Failed to save address.');
    }
  };

  // Guest Order Lookup
  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLookupError('');
    setGuestOrderResult(null);

    if (!guestOrderNumber.trim() || !guestEmail.trim()) {
      setGuestLookupError('Please enter both Order Number and Email.');
      return;
    }

    setGuestLookupLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(guestOrderNumber.trim())}&email=${encodeURIComponent(guestEmail.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.order) {
        setGuestLookupError(data.error || 'Order not found. Please check your order details.');
      } else {
        setGuestOrderResult(data.order);
      }
    } catch {
      setGuestLookupError('Unable to look up order. Please try again.');
    } finally {
      setGuestLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Loading Skeleton */}
        {authLoading ? (
          <AccountDashboardSkeleton />
        ) : !user ? (
          /* GUEST / UNAUTHENTICATED STATE */
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C2A265]">
                Opulent Privileges
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#181818] font-light">
                Member Account
              </h1>
              <p className="text-sm text-[#7A756D] max-w-md mx-auto">
                Sign in to view your bespoke orders, track active shipments, and manage your luxury delivery addresses.
              </p>
            </div>

            {/* Sign In / Register Prompt Card */}
            <div className="bg-white rounded-2xl border border-[#EAE5DC] p-8 text-center shadow-sm space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#143728]/5 border border-[#143728]/10 flex items-center justify-center mx-auto text-[#143728]">
                <User size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-medium text-[#181818]">
                  Welcome to NOTIONS®
                </h3>
                <p className="text-xs text-[#7A756D]">
                  Experience effortless checkout, real-time tracking, and exclusive early drops.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => openAccountModal('login')}
                  className="flex-1 py-3 px-6 bg-[#143728] text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#0f291e] transition-all shadow-sm"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAccountModal('register')}
                  className="flex-1 py-3 px-6 bg-transparent border border-[#143728] text-[#143728] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#143728]/5 transition-all"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Quick Guest Order Tracking */}
            <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-[#F0EDE6] pb-3">
                <Search size={18} className="text-[#143728]" />
                <h3 className="font-serif text-base font-medium text-[#181818]">
                  Track a Guest Order
                </h3>
              </div>
              <p className="text-xs text-[#7A756D]">
                Placed an order without an account? Enter your Order Number and billing email below:
              </p>

              <form onSubmit={handleGuestLookup} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Order # (e.g. NOT-1234)"
                    value={guestOrderNumber}
                    onChange={(e) => setGuestOrderNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] focus:outline-none focus:border-[#143728]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Billing Email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] focus:outline-none focus:border-[#143728]"
                  />
                </div>

                {guestLookupError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                    {guestLookupError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={guestLookupLoading}
                  className="w-full py-2.5 bg-[#2B2B2B] text-white rounded-lg text-xs font-medium hover:bg-[#181818] transition flex items-center justify-center gap-2"
                >
                  {guestLookupLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Find Order Details'}
                </button>
              </form>

              {/* Guest Order Lookup Result */}
              {guestOrderResult && (
                <div className="mt-4 pt-4 border-t border-[#F0EDE6] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold font-mono text-[#143728]">{guestOrderResult.order_number}</span>
                      <p className="text-[11px] text-[#7A756D]">Placed on {new Date(guestOrderResult.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {guestOrderResult.order_status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {guestOrderResult.items?.map((item: any, idx) => {
                      const name = item.product_name || item.productName || 'Men’s Apparel';
                      const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
                      const qty = Number(item.quantity ?? 1);
                      const sizeLabel = item.variant_label || item.variantLabel || item.selectedSize;

                      return (
                        <div key={idx} className="flex justify-between text-xs text-[#333333]">
                          <span>{qty}x {name} {sizeLabel ? `(${sizeLabel})` : ''}</span>
                          <span className="font-semibold">₹{(unitPrice * qty).toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-xs font-bold text-[#181818] pt-2 border-t border-[#F0EDE6]">
                    <span>Total Amount</span>
                    <span>₹{guestOrderResult.total_amount?.toLocaleString('en-IN')}</span>
                  </div>

                  {guestOrderResult.tracking_url && (
                    <a
                      href={guestOrderResult.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#143728] font-medium hover:underline pt-1"
                    >
                      <Truck size={14} />
                      <span>Track Shipment via {guestOrderResult.courier_name || 'Courier'}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AUTHENTICATED CUSTOMER DASHBOARD */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Greeting Banner */}
            <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#143728] text-white flex items-center justify-center font-serif text-2xl font-light shadow-md">
                  {user.full_name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A265]">
                    Distinguished Patron
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl text-[#181818] font-medium">
                    {user.full_name}
                  </h1>
                  <p className="text-xs text-[#7A756D] flex items-center gap-2 mt-0.5">
                    <span>{user.email}</span>
                    {user.phone && <span>• {user.phone}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 border border-[#EAE5DC] rounded-xl text-xs font-medium text-[#7A756D] hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 transition cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#EAE5DC] space-x-2 sm:space-x-8 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 py-3 px-2 sm:px-0 border-b-2 font-medium text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#143728] text-[#143728]'
                    : 'border-transparent text-[#7A756D] hover:text-[#181818]'
                }`}
              >
                <Package size={16} />
                <span>Order History ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-2 py-3 px-2 sm:px-0 border-b-2 font-medium text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'border-[#143728] text-[#143728]'
                    : 'border-transparent text-[#7A756D] hover:text-[#181818]'
                }`}
              >
                <MapPin size={16} />
                <span>Addresses ({savedAddresses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 py-3 px-2 sm:px-0 border-b-2 font-medium text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-[#143728] text-[#143728]'
                    : 'border-transparent text-[#7A756D] hover:text-[#181818]'
                }`}
              >
                <User size={16} />
                <span>Profile Settings</span>
              </button>
            </div>

            {/* TAB CONTENT 1: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {loadingOrders ? (
                  <div className="p-12 text-center text-xs text-[#7A756D] bg-white rounded-2xl border border-[#EAE5DC]">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#143728]" />
                    <span>Loading your orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE5DC] space-y-4">
                    <Package size={36} className="mx-auto text-[#CFC8BA]" />
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-medium text-[#181818]">No Orders Yet</h3>
                      <p className="text-xs text-[#7A756D] max-w-sm mx-auto">
                        You have not placed any orders yet. Discover our latest collections and timeless essentials.
                      </p>
                    </div>
                    <a
                      href="/shop"
                      className="inline-block py-2.5 px-6 bg-[#143728] text-white rounded-xl text-xs font-semibold tracking-wider hover:bg-[#0f291e] transition shadow-sm"
                    >
                      Explore Collection
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = selectedOrder?.id === order.id;
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-[#EAE5DC] overflow-hidden shadow-sm transition-all hover:border-[#D1C9BE]"
                        >
                          {/* Order Card Summary */}
                          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0EDE6]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono font-bold text-sm text-[#181818]">
                                  {order.order_number}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    order.payment_status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF9F5] text-[#143728] border border-[#EAE5DC]">
                                  {order.order_status}
                                </span>
                              </div>
                              <p className="text-xs text-[#7A756D]">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4">
                              <div className="text-right">
                                <span className="text-[11px] text-[#7A756D] block">Total Amount</span>
                                <span className="font-serif font-bold text-base text-[#181818]">
                                  ₹{order.total_amount?.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(isExpanded ? null : order)}
                                className="px-3.5 py-1.5 bg-[#FAF9F5] hover:bg-[#F0EDE6] border border-[#EAE5DC] rounded-lg text-xs font-medium text-[#181818] transition cursor-pointer"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          </div>

                          {/* Shipping / Tracking Bar if available */}
                          {order.courier_name && (
                            <div className="bg-[#FAF9F5] px-6 py-2.5 border-b border-[#F0EDE6] flex flex-wrap items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-2 text-[#143728] font-medium">
                                <Truck size={15} />
                                <span>Courier: {order.courier_name}</span>
                                {order.tracking_number && (
                                  <span className="font-mono text-[11px] text-[#7A756D]">
                                    ({order.tracking_number})
                                  </span>
                                )}
                              </div>
                              {order.tracking_url && (
                                <a
                                  href={order.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#143728] font-semibold hover:underline"
                                >
                                  <span>Track Package</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Expanded Items & Breakdown */}
                          {isExpanded && (
                            <div className="p-6 bg-[#FCFBF8] space-y-4 animate-in fade-in duration-200">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A756D]">
                                Ordered Items ({order.items?.length || 0})
                              </h4>
                                <div className="divide-y divide-[#EAE5DC] bg-white rounded-xl border border-[#EAE5DC] overflow-hidden">
                                {order.items?.map((item: any, idx) => {
                                  const name = item.product_name || item.productName || 'Men’s Apparel';
                                  const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0);
                                  const qty = Number(item.quantity ?? 1);
                                  const imgUrl = item.image_url || item.imageUrl || item.image || item.selectedColorImage;
                                  const sizeLabel = item.variant_label || item.variantLabel || item.selectedSize;

                                  return (
                                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-12 relative bg-[#F5F3EF] rounded overflow-hidden shrink-0">
                                          {imgUrl ? (
                                            <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#888888] font-bold">N</div>
                                          )}
                                        </div>
                                        <div className="space-y-0.5">
                                          <p className="text-xs font-semibold text-[#181818]">{name}</p>
                                          <div className="flex items-center gap-2 text-[11px] text-[#7A756D]">
                                            {sizeLabel && <span>Size: {sizeLabel}</span>}
                                            {item.selected_color && <span>• Color: {item.selected_color}</span>}
                                            <span>• Qty: {qty}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-xs font-semibold text-[#181818]">
                                        ₹{(unitPrice * qty).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Delivery Address Summary */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                                <div className="p-4 bg-white rounded-xl border border-[#EAE5DC] space-y-1">
                                  <span className="font-bold text-[#143728] block mb-1">Delivery Address</span>
                                  <p className="font-medium text-[#181818]">{order.shipping_name}</p>
                                  <p className="text-[#555555]">{order.shipping_address_line1}</p>
                                  {order.shipping_address_line2 && <p className="text-[#555555]">{order.shipping_address_line2}</p>}
                                  <p className="text-[#555555]">{order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}</p>
                                  <p className="text-[#7A756D] pt-1">Phone: {order.shipping_phone}</p>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-[#EAE5DC] space-y-2">
                                  <span className="font-bold text-[#143728] block mb-1">Payment & Breakdown</span>
                                  <div className="flex justify-between text-[#555555]">
                                    <span>Subtotal</span>
                                    <span>₹{order.subtotal_amount?.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between text-[#555555]">
                                    <span>Shipping</span>
                                    <span>{order.shipping_amount === 0 ? 'FREE' : `₹${order.shipping_amount}`}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-[#181818] pt-1 border-t border-[#F0EDE6]">
                                    <span>Total Paid</span>
                                    <span>₹{order.total_amount?.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: ADDRESS MANAGEMENT */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#181818]">
                      Saved Delivery Addresses
                    </h3>
                    <p className="text-xs text-[#7A756D]">
                      Manage addresses for swift and seamless order checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddressModal()}
                    className="flex items-center gap-2 py-2 px-4 bg-[#143728] text-white rounded-xl text-xs font-semibold hover:bg-[#0f291e] transition shadow-sm cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="p-8 text-center text-xs text-[#7A756D]">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-[#143728]" />
                    <span>Updating addresses...</span>
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-2xl border border-[#EAE5DC] space-y-3">
                    <MapPin size={32} className="mx-auto text-[#CFC8BA]" />
                    <p className="text-xs text-[#7A756D]">No saved addresses found. Add an address for effortless checkout.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddressModal()}
                      className="py-2 px-4 bg-[#143728] text-white rounded-lg text-xs font-medium hover:bg-[#0f291e] transition"
                    >
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white rounded-2xl border p-5 relative space-y-3 shadow-sm transition ${
                          addr.is_default ? 'border-[#143728] ring-1 ring-[#143728]' : 'border-[#EAE5DC]'
                        }`}
                      >
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle size={10} />
                            Default Delivery
                          </span>
                        )}

                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-[#181818]">{addr.name}</h4>
                          <p className="text-xs text-[#555555]">{addr.street}</p>
                          {addr.apartment && <p className="text-xs text-[#555555]">{addr.apartment}</p>}
                          <p className="text-xs text-[#555555]">
                            {addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                          <p className="text-xs text-[#7A756D] pt-1">Phone: {addr.phone}</p>
                        </div>

                        <div className="pt-3 border-t border-[#F0EDE6] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenAddressModal(addr)}
                              className="text-[#143728] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAddress(addr.id)}
                              className="text-red-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>

                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-xs text-[#7A756D] hover:text-[#181818] underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: PROFILE SETTINGS */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 sm:p-8 max-w-xl shadow-sm space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#181818]">
                    Personal Information
                  </h3>
                  <p className="text-xs text-[#7A756D]">
                    Manage your personal account credentials and contact details.
                  </p>
                </div>

                {profileMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      profileMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {profileMessage.type === 'success' ? (
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-600 shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      disabled={!isEditingProfile}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] disabled:opacity-75 focus:outline-none focus:border-[#143728]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1">
                      Email Address (Primary Identity)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#EAE5DC] rounded-lg text-xs text-[#7A756D] cursor-not-allowed"
                    />
                    <span className="text-[10px] text-[#7A756D] mt-1 block">
                      Account email is permanently linked to your order history and cannot be altered.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      disabled={!isEditingProfile}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] disabled:opacity-75 focus:outline-none focus:border-[#143728]"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    {isEditingProfile ? (
                      <>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="py-2.5 px-6 bg-[#143728] text-white rounded-xl text-xs font-semibold hover:bg-[#0f291e] transition flex items-center gap-2 cursor-pointer"
                        >
                          {savingProfile && <RefreshCw size={12} className="animate-spin" />}
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileName(user.full_name || '');
                            setProfilePhone(user.phone || '');
                          }}
                          className="py-2.5 px-4 bg-transparent border border-[#EAE5DC] text-[#7A756D] rounded-xl text-xs font-medium hover:bg-[#FAF9F5] transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="py-2.5 px-6 bg-[#143728] text-white rounded-xl text-xs font-semibold hover:bg-[#0f291e] transition cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ADDRESS ADD / EDIT MODAL */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-[#EAE5DC] shadow-2xl p-6 overflow-hidden">
              <h3 className="font-serif text-xl font-medium text-[#181818] mb-1">
                {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
              </h3>
              <p className="text-xs text-[#7A756D] mb-4">
                Enter your exact shipping destination for precision delivery.
              </p>

              {addressError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181818] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="Receiver's name"
                      className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181818] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#181818] mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="House no, Building, Street address"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#181818] mb-1">Apartment, Suite, Unit (Optional)</label>
                  <input
                    type="text"
                    value={addressForm.apartment}
                    onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                    placeholder="Apt 4B, 2nd Floor"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181818] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181818] mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181818] mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      placeholder="400001"
                      className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs text-[#181818]">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="rounded text-[#143728] focus:ring-[#143728]"
                  />
                  <span>Make this my default delivery address</span>
                </label>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#F0EDE6]">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="py-2 px-4 border border-[#EAE5DC] text-[#7A756D] rounded-xl text-xs font-medium hover:bg-[#FAF9F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="py-2 px-6 bg-[#143728] text-white rounded-xl text-xs font-semibold hover:bg-[#0f291e] flex items-center gap-2"
                  >
                    {savingAddress && <RefreshCw size={12} className="animate-spin" />}
                    <span>{editingAddressId ? 'Save Changes' : 'Add Address'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
