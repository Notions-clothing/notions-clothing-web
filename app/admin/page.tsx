'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Layers,
  ShoppingBag,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  Check,
  AlertCircle,
  ExternalLink,
  Search,
  Database,
  ArrowLeft,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Product, Category, Banner, Order } from '@/types/database';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'banners' | 'orders' | 'supabase'>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Banner Modal State
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, banRes, ordRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/banners'),
        fetch('/api/admin/orders'),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (banRes.ok) setBanners(await banRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (e: any) {
      showNotification('Failed to load store data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  // CLOUDINARY UPLOAD HANDLER
  // ----------------------------------------------------
  const handleFileUpload = async (file: File, folder: string = 'notions/admin_uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload to Cloudinary failed');
    }
    return data;
  };

  // ----------------------------------------------------
  // PRODUCT ACTIONS
  // ----------------------------------------------------
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        showNotification('Product saved successfully');
        setShowProductModal(false);
        setEditingProduct(null);
        loadData();
      } else {
        throw new Error('Failed to save product');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the atelier?')) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Product deleted');
        loadData();
      }
    } catch (e) {
      showNotification('Failed to delete product', 'error');
    }
  };

  // ----------------------------------------------------
  // CATEGORY ACTIONS
  // ----------------------------------------------------
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        showNotification('Category saved successfully');
        setShowCategoryModal(false);
        setEditingCategory(null);
        loadData();
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // BANNER ACTIONS
  // ----------------------------------------------------
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner),
      });

      if (res.ok) {
        showNotification('Banner updated successfully');
        setEditingBanner(null);
        loadData();
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // ORDER ACTIONS
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, status: any, carrier?: string, tracking?: string) => {
    try {
      const existing = orders.find(o => o.id === orderId);
      if (!existing) return;

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...existing,
          status,
          tracking_carrier: carrier ?? existing.tracking_carrier,
          tracking_number: tracking ?? existing.tracking_number,
        }),
      });

      if (res.ok) {
        showNotification(`Order #${existing.order_number} marked as ${status}`);
        loadData();
      }
    } catch (e) {
      showNotification('Failed to update order status', 'error');
    }
  };

  // METRICS CALCULATIONS
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#181818] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#EAE5DC] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="NOTIONS®"
                width={120}
                height={34}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#143728] text-white tracking-widest uppercase">
              Admin Atelier
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center space-x-1.5 text-xs text-[#555555] hover:text-[#143728] transition"
            >
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={loadData}
              title="Refresh store data"
              className="p-1.5 rounded-full text-[#666666] hover:bg-[#F3EFE6] transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`px-4 py-2 text-xs font-medium text-center ${
            notice.type === 'success'
              ? 'bg-[#D9EFE0] text-[#143728]'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-[#EAE5DC] pb-4 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'products'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'categories'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'banners'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Hero & Banners ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'supabase'
                ? 'bg-[#143728] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#EFEBE0]'
            }`}
          >
            Supabase SQL Setup
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW & METRICS */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#EDE8DE] shadow-2xs">
                <div className="flex items-center justify-between text-[#7A756D] text-xs">
                  <span>Qualifying Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#143728]" />
                </div>
                <p className="font-serif text-2xl font-bold text-[#181818] mt-2">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-[#143728] mt-1 block">
                  From paid verified orders
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EDE8DE] shadow-2xs">
                <div className="flex items-center justify-between text-[#7A756D] text-xs">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-[#143728]" />
                </div>
                <p className="font-serif text-2xl font-bold text-[#181818] mt-2">
                  {orders.length}
                </p>
                <span className="text-[10px] text-[#777777] mt-1 block">
                  {pendingOrders.length} pending fulfillment
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EDE8DE] shadow-2xs">
                <div className="flex items-center justify-between text-[#7A756D] text-xs">
                  <span>Catalog Products</span>
                  <Package className="w-4 h-4 text-[#143728]" />
                </div>
                <p className="font-serif text-2xl font-bold text-[#181818] mt-2">
                  {products.length}
                </p>
                <span className="text-[10px] text-[#143728] mt-1 block">
                  {products.filter((p) => p.is_published).length} published live
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EDE8DE] shadow-2xs">
                <div className="flex items-center justify-between text-[#7A756D] text-xs">
                  <span>Store Categories</span>
                  <Layers className="w-4 h-4 text-[#143728]" />
                </div>
                <p className="font-serif text-2xl font-bold text-[#181818] mt-2">
                  {categories.length}
                </p>
                <span className="text-[10px] text-[#777777] mt-1 block">
                  Exact Men, Footwear & Accessories
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl border border-[#EDE8DE] space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#181818]">
                Atelier Quick Operations
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      slug: '',
                      description: '',
                      category_id: categories[0]?.id || '',
                      category_slug: categories[0]?.slug || '',
                      sku: `NOT-${Date.now().toString().slice(-4)}`,
                      price: 1499,
                      compare_at_price: 1999,
                      is_published: true,
                      is_bestseller: false,
                      is_featured: true,
                      is_new_arrival: true,
                      variants: [
                        { id: 'v-m', product_id: '', size: 'M', inventory_quantity: 20, is_available: true },
                        { id: 'v-l', product_id: '', size: 'L', inventory_quantity: 20, is_available: true },
                        { id: 'v-xl', product_id: '', size: 'XL', inventory_quantity: 15, is_available: true },
                      ],
                      images: [],
                    });
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#143728] text-white text-xs font-semibold rounded-full hover:bg-[#0d281c] transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload New Product</span>
                </button>

                <button
                  onClick={() => setActiveTab('banners')}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#F3EFE6] text-[#143728] text-xs font-semibold rounded-full hover:bg-[#EAE5DC] transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Update Hero & Promo Banners</span>
                </button>

                <button
                  onClick={() => setActiveTab('supabase')}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 border border-[#DDD7CC] text-[#333333] text-xs font-semibold rounded-full hover:bg-[#FAF9F5] transition"
                >
                  <Database className="w-4 h-4 text-[#143728]" />
                  <span>Supabase PostgreSQL Migration Status</span>
                </button>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-[#EDE8DE] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#181818]">
                  Recent Customer Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-medium text-[#143728] hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-[#888888] py-8 text-center">
                  No orders placed yet. Orders will appear here upon checkout.
                </p>
              ) : (
                <div className="divide-y divide-[#EDE8DE]">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#181818]">#{o.order_number}</strong>
                        <span className="text-[#777777] ml-2">{o.customer_name} ({o.customer_email})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#181818]">₹{o.total_amount.toLocaleString('en-IN')}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D9EFE0] text-[#143728]">
                          {o.payment_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#181818]">
                  Products Management
                </h2>
                <p className="text-xs text-[#666666]">
                  Add, edit, unpublish, and upload high-res Cloudinary images for all store apparel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    slug: '',
                    description: '',
                    category_id: categories[0]?.id || '',
                    category_slug: categories[0]?.slug || '',
                    sku: `NOT-${Date.now().toString().slice(-4)}`,
                    price: 1499,
                    compare_at_price: 1999,
                    is_published: true,
                    is_bestseller: false,
                    is_featured: true,
                    is_new_arrival: true,
                    variants: [
                      { id: 'v-m', product_id: '', size: 'M', inventory_quantity: 20, is_available: true },
                      { id: 'v-l', product_id: '', size: 'L', inventory_quantity: 20, is_available: true },
                    ],
                    images: [],
                  });
                  setShowProductModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#EDE8DE] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F5] border-b border-[#EDE8DE] text-[11px] uppercase tracking-wider text-[#7A756D]">
                    <tr>
                      <th className="py-3 px-4">Image</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Sizes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DE]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF9F5] transition">
                        <td className="py-3 px-4">
                          <div className="w-12 h-14 relative bg-[#F5F3EF] rounded overflow-hidden">
                            {p.images?.[0]?.image_url ? (
                              <Image
                                src={p.images[0].image_url}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#999999]">N</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#181818] block">{p.name}</span>
                          <span className="text-[11px] text-[#7A756D]">SKU: {p.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-[#555555]">
                          {p.category_name || p.category_slug}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#181818]">₹{p.price.toLocaleString('en-IN')}</span>
                          {p.compare_at_price && (
                            <span className="text-[10px] text-[#888888] line-through block">
                              ₹{p.compare_at_price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[120px]">
                            {p.variants?.map((v) => (
                              <span
                                key={v.size}
                                className="px-1.5 py-0.5 rounded bg-[#F3EFE6] text-[10px] font-medium"
                              >
                                {v.size}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.is_published
                                ? 'bg-[#D9EFE0] text-[#143728]'
                                : 'bg-[#EAE5DC] text-[#777777]'
                            }`}
                          >
                            {p.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 rounded text-[#555555] hover:text-[#143728] hover:bg-[#F3EFE6] transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded text-[#555555] hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#181818]">
                  Store Category Hierarchy
                </h2>
                <p className="text-xs text-[#666666]">
                  Men's Apparel, Footwear, and Accessories structure.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory({
                    name: '',
                    slug: '',
                    description: '',
                    is_published: true,
                  });
                  setShowCategoryModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-full"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-xl border border-[#EDE8DE] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 relative bg-[#F5F3EF] rounded-lg overflow-hidden flex-shrink-0">
                      {c.image_url ? (
                        <Image src={c.image_url} alt={c.name} fill className="object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#888888]">N</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#181818]">{c.name}</h4>
                      <p className="text-[11px] text-[#7A756D]">slug: /{c.slug}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(c);
                      setShowCategoryModal(true);
                    }}
                    className="p-1.5 text-[#555555] hover:text-[#143728]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: BANNERS & CONTENT MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#181818]">
                Homepage Banners & Editorial Imagery
              </h2>
              <p className="text-xs text-[#666666]">
                Upload new editorial campaign photographs directly to Cloudinary and customize copy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-[#EDE8DE] overflow-hidden p-6 space-y-4 shadow-2xs"
                >
                  <div className="relative aspect-[16/7] w-full bg-[#F5F3EF] rounded-xl overflow-hidden border border-[#EDE8DE]">
                    {b.image_url ? (
                      <Image src={b.image_url} alt={b.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#888888]">
                        No Banner Image
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#143728] block">
                      Section: {b.section}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#181818] mt-1">{b.title}</h3>
                    <p className="text-xs text-[#666666] mt-1">{b.description}</p>
                    <p className="text-xs text-[#143728] font-medium mt-2">
                      CTA: {b.cta_label} → {b.cta_url}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingBanner(b)}
                    className="w-full py-2 bg-[#F3EFE6] hover:bg-[#EAE5DC] text-[#143728] text-xs font-semibold rounded-full transition"
                  >
                    Edit Banner & Replace Image
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: ORDERS MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#181818]">
                Customer Orders & Fulfillment
              </h2>
              <p className="text-xs text-[#666666]">
                Real-time snapshot of authenticated and guest customer transactions.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-[#EDE8DE]">
                <p className="text-xs text-[#777777]">No customer orders recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white p-6 rounded-2xl border border-[#EDE8DE] space-y-4 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row justify-between text-xs pb-4 border-b border-[#F0ECE2] gap-3">
                      <div>
                        <strong className="text-base text-[#181818]">#{o.order_number}</strong>
                        <span className="text-[#7A756D] ml-3">
                          {new Date(o.created_at).toLocaleString('en-IN')}
                        </span>
                        <p className="text-xs text-[#555555] mt-1">
                          Customer: <strong className="text-[#181818]">{o.customer_name}</strong> ({o.customer_email}, {o.customer_phone})
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="text-xs p-1.5 border border-[#DDD7CC] rounded-lg bg-[#FAF9F5]"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D9EFE0] text-[#143728]">
                          {o.payment_status.toUpperCase()} (₹{o.total_amount.toLocaleString('en-IN')})
                        </span>
                      </div>
                    </div>

                    {/* Items */}
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

                    {/* Delivery & Tracking */}
                    <div className="pt-3 border-t border-[#F0ECE2] text-xs text-[#555555] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <p>
                        Destination: {o.shipping_address.street}, {o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.postal_code}
                      </p>
                      {o.tracking_number ? (
                        <span className="text-[#143728] font-medium">
                          Tracking: {o.tracking_carrier} - {o.tracking_number}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const carrier = prompt('Enter carrier (e.g. Bluedart, Delhivery):', 'BlueDart');
                            const tracking = prompt('Enter tracking number:');
                            if (carrier && tracking) {
                              handleUpdateOrderStatus(o.id, 'shipped', carrier, tracking);
                            }
                          }}
                          className="text-[#143728] underline font-medium"
                        >
                          + Add Tracking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SUPABASE SQL SETUP */}
        {/* ==================================================== */}
        {activeTab === 'supabase' && (
          <div className="bg-white rounded-2xl border border-[#EDE8DE] p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-[#143728]">
                <Database className="w-5 h-5" />
                <h2 className="font-serif text-2xl font-bold text-[#181818]">
                  Supabase PostgreSQL Setup
                </h2>
              </div>
              <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                Supabase URL: <code className="bg-[#F3EFE6] px-1.5 py-0.5 rounded text-[#143728]">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvwizaunsdtnkocwjgwi.supabase.co'}</code>
              </p>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                To sync live PostgreSQL with all tables, constraints, RLS policies, and the category hierarchy, run the SQL script below in your <strong>Supabase Dashboard → SQL Editor</strong>.
              </p>
            </div>

            <div className="relative">
              <pre className="bg-[#181818] text-[#E0E0E0] p-4 rounded-xl text-xs overflow-x-auto max-h-96 leading-relaxed font-mono">
                {`-- Run this script in Supabase Dashboard -> SQL Editor
-- File: supabase/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    image_public_id VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    is_bestseller BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    rating_score DECIMAL(3, 2) DEFAULT 4.8,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complete SQL file located in workspace at supabase/schema.sql`}
              </pre>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`See supabase/schema.sql in workspace root`);
                  showNotification('Copied SQL file reference to clipboard');
                }}
                className="absolute top-3 right-3 px-3 py-1 bg-[#143728] text-white text-[11px] font-semibold rounded-md"
              >
                Copy Reference
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* PRODUCT MODAL */}
      {/* ==================================================== */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDE8DE] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-[#EDE8DE]">
              <h3 className="font-serif text-xl font-bold text-[#181818]">
                {editingProduct.id ? 'Edit Atelier Product' : 'Add New Atelier Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-[#666666] hover:text-[#181818] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setEditingProduct({ ...editingProduct, name, slug });
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#444444] font-medium mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#444444] font-medium mb-1">Category *</label>
                  <select
                    value={editingProduct.category_slug || ''}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.slug === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        category_slug: e.target.value,
                        category_id: cat?.id || '',
                        category_name: cat?.name || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#444444] font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#444444] font-medium mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#444444] font-medium mb-1">Compare-At Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.compare_at_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, compare_at_price: parseFloat(e.target.value) || null })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              {/* Cloudinary Image Upload Section */}
              <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EDE8DE] space-y-3">
                <label className="block text-[#444444] font-semibold">
                  Product Image (Cloudinary fb7zpbif)
                </label>
                <div className="flex items-center space-x-4">
                  {editingProduct.images?.[0]?.image_url && (
                    <div className="w-16 h-20 relative rounded overflow-hidden border border-[#EDE8DE]">
                      <Image
                        src={editingProduct.images[0].image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <label className="flex-1 cursor-pointer border-2 border-dashed border-[#DDD7CC] rounded-xl p-4 text-center hover:border-[#143728] transition bg-white">
                    <UploadCloud className="w-6 h-6 mx-auto text-[#143728] mb-1" />
                    <span className="font-medium text-[#181818] block">
                      {uploadingImage ? 'Uploading to Cloudinary...' : 'Click to Upload High-Res Image'}
                    </span>
                    <span className="text-[10px] text-[#777777]">PNG, JPG, WEBP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingImage(true);
                          try {
                            const result = await handleFileUpload(file, 'notions/products');
                            setEditingProduct({
                              ...editingProduct,
                              images: [
                                {
                                  id: `img-${Date.now()}`,
                                  product_id: editingProduct.id || '',
                                  image_url: result.url,
                                  image_public_id: result.public_id,
                                  sort_order: 1,
                                  is_primary: true,
                                },
                              ],
                            });
                            showNotification('Image uploaded to Cloudinary');
                          } catch (err: any) {
                            showNotification(err.message, 'error');
                          } finally {
                            setUploadingImage(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_published ?? true}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_published: e.target.checked })}
                    className="rounded text-[#143728] focus:ring-0"
                  />
                  <span>Published Live</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_bestseller ?? false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_bestseller: e.target.checked })}
                    className="rounded text-[#143728] focus:ring-0"
                  />
                  <span>Bestseller Tag</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_new_arrival ?? false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_new_arrival: e.target.checked })}
                    className="rounded text-[#143728] focus:ring-0"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#EDE8DE] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-[#DDD7CC] rounded-full text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#143728] hover:bg-[#0d281c] text-white text-xs font-semibold rounded-full"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BANNER EDIT MODAL */}
      {/* ==================================================== */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDE8DE] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#EDE8DE]">
              <h3 className="font-serif text-xl font-bold text-[#181818]">
                Edit Banner: {editingBanner.section}
              </h3>
              <button onClick={() => setEditingBanner(null)} className="text-[#666666]">✕</button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#444444] font-medium mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Subtitle / Badge</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBanner.description || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Button Label</label>
                  <input
                    type="text"
                    value={editingBanner.cta_label || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, cta_label: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={editingBanner.cta_url || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, cta_url: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                  />
                </div>
              </div>

              {/* Cloudinary upload for Banner */}
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EDE8DE] space-y-2">
                <label className="block font-semibold text-[#444444]">
                  Upload New Banner Image to Cloudinary
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImage(true);
                      try {
                        const res = await handleFileUpload(file, 'notions/banners');
                        setEditingBanner({
                          ...editingBanner,
                          image_url: res.url,
                          image_public_id: res.public_id,
                        });
                        showNotification('Banner image uploaded to Cloudinary');
                      } catch (err: any) {
                        showNotification(err.message, 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                    }
                  }}
                  className="text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#EDE8DE] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 border border-[#DDD7CC] rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#143728] text-white rounded-full font-semibold"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CATEGORY EDIT MODAL */}
      {/* ==================================================== */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDE8DE] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#EDE8DE]">
              <h3 className="font-serif text-lg font-bold text-[#181818]">
                {editingCategory.id ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-[#666666]">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#444444] font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingCategory({ ...editingCategory, name, slug });
                  }}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DDD7CC] bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Category Image (Upload to Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const res = await handleFileUpload(file, 'notions/categories');
                        setEditingCategory({
                          ...editingCategory,
                          image_url: res.url,
                          image_public_id: res.public_id,
                        });
                        showNotification('Category icon uploaded to Cloudinary');
                      } catch (err: any) {
                        showNotification(err.message, 'error');
                      }
                    }
                  }}
                  className="text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#EDE8DE] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-[#DDD7CC] rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#143728] text-white rounded-full font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
