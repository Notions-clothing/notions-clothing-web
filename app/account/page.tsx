'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { createClient } from '@/utils/supabase/client';
import { User, Package, LogOut, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order } from '@/types/database';

export default function AccountPage() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'lookup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Guest lookup
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState('');

  // User orders
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          fetchUserOrders(user.email);
        }
      } catch (err) {
        console.error('Error fetching user', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [supabase]);

  const fetchUserOrders = async (userEmail?: string) => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const allOrders: Order[] = await res.json();
        if (userEmail) {
          setOrders(allOrders.filter((o) => o.customer_email.toLowerCase() === userEmail.toLowerCase()));
        }
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        setUser(data.user);
        fetchUserOrders(data.user.email);
        setAuthSuccess('Welcome back to NOTIONS®.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        setUser(data.user);
        setAuthSuccess('Account created successfully. Welcome to NOTIONS®.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  };

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setFoundOrder(null);

    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const allOrders: Order[] = await res.json();
        const match = allOrders.find(
          (o) =>
            o.order_number.toLowerCase() === lookupOrderNumber.trim().toLowerCase() &&
            o.customer_email.toLowerCase() === lookupEmail.trim().toLowerCase()
        );

        if (match) {
          setFoundOrder(match);
        } else {
          setLookupError('No matching order found. Please verify your order number and email.');
        }
      }
    } catch (e: any) {
      setLookupError('Failed to lookup order');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="py-24 text-center text-xs text-[#777777]">
            Verifying secure session...
          </div>
        ) : user ? (
          /* Authenticated Customer View */
          <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE5DC] gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#143728]">
                  Privileged Member
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#181818] mt-1">
                  My NOTIONS® Account
                </h1>
                <p className="text-xs text-[#666666] mt-1">
                  Logged in as <strong className="text-[#181818]">{user.email}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-[#F3EFE6] hover:bg-[#EAE5DC] text-[#143728] text-xs font-semibold rounded-full transition"
                >
                  Admin Portal
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#DDD7CC] hover:bg-white text-xs font-medium rounded-full text-[#444444] transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Orders Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#143728]" />
                <h2 className="text-lg font-serif font-bold text-[#181818]">
                  Order History & Shipments
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-[#EDE8DE] text-center">
                  <p className="text-xs text-[#666666] mb-4">
                    You haven’t placed any orders with this account yet.
                  </p>
                  <Link
                    href="/category/men"
                    className="inline-block px-6 py-2 bg-[#143728] text-white text-xs font-medium rounded-full hover:bg-[#0d281c] transition"
                  >
                    Explore Menswear
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-white p-6 rounded-xl border border-[#EDE8DE] space-y-4 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row justify-between text-xs pb-3 border-b border-[#F0ECE2] gap-2">
                        <div>
                          <strong className="text-sm text-[#181818]">#{o.order_number}</strong>
                          <span className="text-[#7A756D] ml-3">
                            {new Date(o.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D9EFE0] text-[#143728]">
                            {o.payment_status.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F2EB] text-[#181818]">
                            {o.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {o.items.map((it) => (
                          <div key={it.id || it.product_name} className="flex justify-between text-[#444444]">
                            <span>
                              {it.product_name} ({it.variant_label}) × {it.quantity}
                            </span>
                            <span className="font-semibold text-[#181818]">
                              ₹{(it.unit_price * it.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[#F0ECE2] text-xs">
                        <span className="text-[#666666]">
                          Total Paid: <strong className="text-[#143728]">₹{o.total_amount.toLocaleString('en-IN')}</strong>
                        </span>
                        <Link
                          href={`/order-confirmation/${o.order_number}`}
                          className="text-[#143728] font-semibold hover:underline"
                        >
                          View Full Receipt →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Login / Sign Up / Guest Lookup */
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold text-[#181818] mb-2">
                Member Atelier
              </h1>
              <p className="text-xs text-[#6B665E]">
                Access your orders, bespoke preferences, and private privileges.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#EAE5DC] mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 pb-3 text-center transition ${
                  authMode === 'login'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 pb-3 text-center transition ${
                  authMode === 'signup'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('lookup')}
                className={`flex-1 pb-3 text-center transition ${
                  authMode === 'lookup'
                    ? 'text-[#143728] border-b-2 border-[#143728]'
                    : 'text-[#777777] hover:text-[#181818]'
                }`}
              >
                Guest Lookup
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-xs text-green-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Forms */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-medium text-[#444444] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#444444] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full uppercase tracking-wider transition shadow-sm"
                >
                  Sign In
                </button>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-medium text-[#444444] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#444444] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#444444] mb-1.5">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full uppercase tracking-wider transition shadow-sm"
                >
                  Create Account
                </button>
              </form>
            )}

            {authMode === 'lookup' && (
              <div className="space-y-6">
                <form onSubmit={handleGuestLookup} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs">
                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Order Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NOT-123456"
                      value={lookupOrderNumber}
                      onChange={(e) => setLookupOrderNumber(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#444444] mb-1.5">
                      Billing / Contact Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email used at checkout"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5] text-xs focus:outline-none focus:border-[#143728]"
                    />
                  </div>

                  {lookupError && (
                    <p className="text-xs text-red-600">{lookupError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full uppercase tracking-wider transition shadow-sm"
                  >
                    Track Guest Order
                  </button>
                </form>

                {foundOrder && (
                  <div className="bg-white p-6 rounded-2xl border border-[#143728]/40 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-sm text-[#181818]">#{foundOrder.order_number}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D9EFE0] text-[#143728]">
                        {foundOrder.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555]">
                      Recipient: <strong>{foundOrder.customer_name}</strong>
                    </p>
                    <p className="text-xs text-[#555555]">
                      Amount: <strong>₹{foundOrder.total_amount.toLocaleString('en-IN')}</strong>
                    </p>
                    <Link
                      href={`/order-confirmation/${foundOrder.order_number}`}
                      className="inline-block text-xs font-semibold text-[#143728] hover:underline pt-2"
                    >
                      View Full Order Details →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <CartDrawer />
      <Footer />
    </div>
  );
}
