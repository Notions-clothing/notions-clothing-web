'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  ShoppingBag,
  Image as ImageIcon,
  Settings,
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
  RefreshCw,
  Lock,
  LogOut,
  Shield,
  Menu,
  X,
  Star,
  Eye,
  EyeOff,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  ChevronRight,
  Filter,
  IndianRupee,
  Tag,
  Phone,
  Mail,
  MapPin,
  Palette,
  Ruler,
  ChevronLeft,
} from 'lucide-react';
import { Product, ProductVariant, ProductImage, Category, CategorySize, Banner, Order, SiteSettings, ProductColor, ProductColorVariant, ProductColorImage, ProductColorSizeVariant } from '@/types/database';
import ColorManagement from '@/components/admin/ColorManagement';
import SizeManagement from '@/components/admin/SizeManagement';
import SubcategoryManagement from '@/components/admin/SubcategoryManagement';
import BannerManagement from '@/components/admin/BannerManagement';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'subcategories' | 'colors' | 'sizes' | 'orders' | 'banners' | 'settings';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Store Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    store_name: 'NOTIONS®',
    tagline: 'OPULENT CLOTHING',
    logo_url: '/logo.png',
    support_email: 'concierge@notionsclothing.com',
    support_phone: '+91 98765 43210',
    working_hours: 'Mon - Sat, 10am - 7pm',
    address: 'Flagship Atelier, 42 Heritage Promenade, Indiranagar, Bengaluru, India',
    free_shipping_threshold: 1999,
    flat_shipping_rate: 99,
    announcement_bar: 'Complimentary Shipping across India on orders above ₹1,999',
    instagram_url: 'https://instagram.com/notionsclothing',
    whatsapp_number: '+919876543210',
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Toast Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Product Filters & Modal State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'published' | 'bestseller' | 'new' | 'draft'>('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productMode, setProductMode] = useState<'normal' | 'variant'>('variant');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Category Filters & Modal State
  const [categoryGroupFilter, setCategoryGroupFilter] = useState<'all' | 'homepage' | 'root' | 'cat-men' | 'cat-footwear' | 'cat-accessories'>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Banner Modal State
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  // Order Filters & Tracking State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Delete Confirmation Modal State (Products, Categories, Orders, Discard Mode)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    message?: string;
    confirmText?: string;
    isDeleting?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    confirmText: 'Delete',
    isDeleting: false,
    onConfirm: () => {},
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, banRes, ordRes, setRes, colRes, sizeRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/banners'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/colors'),
        fetch('/api/admin/sizes'),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (banRes.ok) setBanners(await banRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (colRes.ok) setColors(await colRes.json());
      if (sizeRes?.ok) setSizes(await sizeRes.json());
      if (setRes.ok) {
        const loadedSettings = await setRes.json();
        if (loadedSettings && Object.keys(loadedSettings).length > 0) {
          setSettings((prev) => ({ ...prev, ...loadedSettings }));
        }
      }
    } catch (e: any) {
      showNotification('Failed to load store data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth');
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          loadData();
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError(data.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setLoginPassword('');
  };

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
  const openNewProductModal = () => {
    const defaultCat = categories.find((c) => c.slug === 'men-shirts') || categories[0];
    setProductMode('variant');
    setEditingProduct({
      name: '',
      slug: '',
      sku: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      category_id: defaultCat?.id || '',
      category_slug: defaultCat?.slug || '',
      category_name: defaultCat?.name || '',
      price: 1499,
      compare_at_price: 1999,
      product_mode: 'variant',
      stock: 50,
      sizes: [],
      is_bestseller: false,
      is_featured: true,
      is_new_arrival: true,
      is_published: true,
      rating_score: 4.7,
      rating_count: 24,
      material: '100% Premium Cotton',
      care_instructions: 'Machine wash cold gentle cycle, do not bleach.',
      images: [],
      variants: [],
      colors: [],
    });
    setCustomImageUrl('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Auto-attach variant photos to product images if product level images are empty
    let productToSave = { ...editingProduct };
    if ((!productToSave.images || productToSave.images.length === 0) && productToSave.colors && productToSave.colors.length > 0) {
      const colorWithImg = productToSave.colors.find((c) => (c.images && c.images.length > 0) || c.image_url);
      if (colorWithImg) {
        if (colorWithImg.images && colorWithImg.images.length > 0) {
          productToSave.images = colorWithImg.images.map((img, idx) => ({
            id: img.id || `img-${Date.now()}-${idx}`,
            product_id: productToSave.id || '',
            image_url: img.url,
            image_public_id: img.public_id || '',
            alt_text: productToSave.name || 'Product Image',
            sort_order: idx + 1,
            is_primary: idx === 0,
          }));
        } else if (colorWithImg.image_url) {
          productToSave.images = [{
            id: `img-${Date.now()}-0`,
            product_id: productToSave.id || '',
            image_url: colorWithImg.image_url,
            image_public_id: colorWithImg.image_public_id || '',
            alt_text: productToSave.name || 'Product Image',
            sort_order: 1,
            is_primary: true,
          }];
        }
      }
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave),
      });

      if (res.ok) {
        showNotification('Product saved successfully!');
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

  const handleQuickToggleProduct = async (product: Product, field: 'is_published' | 'is_bestseller' | 'is_new_arrival') => {
    try {
      const updated = { ...product, [field]: !product[field] };
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showNotification(`Updated "${product.name}"`);
      } else {
        loadData();
      }
    } catch (e) {
      showNotification('Failed to update product', 'error');
      loadData();
    }
  };

  const handleDeleteProduct = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Product',
      itemName: name || 'this product',
      message: 'This product will be permanently deleted from the store. All inventory, variants, and gallery photos will be removed.',
      confirmText: 'Delete Product',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
        try {
          const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification('Product deleted');
            loadData();
            setDeleteModalState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
          } else {
            showNotification('Failed to delete product', 'error');
            setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
          }
        } catch (e) {
          showNotification('Failed to delete product', 'error');
          setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  const applyVariantPreset = (sizes: string[]) => {
    if (!editingProduct) return;
    const newVariants = sizes.map((size, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      product_id: editingProduct.id || '',
      size,
      inventory_quantity: 0,
      is_available: true,
    }));
    setEditingProduct({ ...editingProduct, variants: newVariants });
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
        body: JSON.stringify({ ...editingCategory, parent_id: editingCategory.parent_id || null }),
      });

      if (res.ok) {
        showNotification('Category saved successfully!');
        setShowCategoryModal(false);
        setEditingCategory(null);
        loadData();
      }
    } catch (err: any) {
      showNotification('Failed to save category', 'error');
    }
  };

  const handleQuickToggleCategory = async (cat: Category) => {
    try {
      const updated = { ...cat, is_published: !cat.is_published };
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      showNotification(`Category "${cat.name}" ${updated.is_published ? 'published' : 'hidden'}`);
    } catch (e) {
      showNotification('Failed to update category', 'error');
      loadData();
    }
  };

  const handleDeleteCategory = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Category',
      itemName: name || id,
      message: 'This category will be permanently removed. Products currently assigned to this category may become unassigned.',
      confirmText: 'Delete Category',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
        try {
          const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification('Category deleted');
            loadData();
            setDeleteModalState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
          } else {
            showNotification('Failed to delete category', 'error');
            setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
          }
        } catch (e) {
          showNotification('Failed to delete category', 'error');
          setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
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
        showNotification('Banner updated successfully!');
        setEditingBanner(null);
        loadData();
      }
    } catch (err: any) {
      showNotification('Failed to update banner', 'error');
    }
  };

  // ----------------------------------------------------
  // ORDER ACTIONS
  // ----------------------------------------------------
  const handleUpdateOrder = async (order: Order, updates: Partial<Order>) => {
    try {
      const updatedOrder = { ...order, ...updates };
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (res.ok) {
        showNotification(`Order #${order.order_number} updated!`);
        loadData();
      }
    } catch (e) {
      showNotification('Failed to update order', 'error');
    }
  };

  const handleDeleteOrder = (id: string, orderNum: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Order',
      itemName: `Order #${orderNum}`,
      message: 'This order record and all customer delivery details will be permanently erased. This action cannot be undone.',
      confirmText: 'Delete Order',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
        try {
          const res = await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification(`Order #${orderNum} deleted`);
            loadData();
            setDeleteModalState((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
          } else {
            showNotification('Failed to delete order', 'error');
            setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
          }
        } catch (e) {
          showNotification('Failed to delete order', 'error');
          setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // ----------------------------------------------------
  // SETTINGS ACTIONS
  // ----------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showNotification('Store settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error saving settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // ----------------------------------------------------
  // FILTERED DATA & METRICS
  // ----------------------------------------------------
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
  ).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory =
      productCategoryFilter === 'all' ||
      p.category_id === productCategoryFilter ||
      p.category_slug === productCategoryFilter;

    const matchesStatus =
      productStatusFilter === 'all' ||
      (productStatusFilter === 'published' && p.is_published) ||
      (productStatusFilter === 'draft' && !p.is_published) ||
      (productStatusFilter === 'bestseller' && p.is_bestseller) ||
      (productStatusFilter === 'new' && p.is_new_arrival);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const homepageSlugs = [
    'men-shirts',
    'men-jeans',
    'men-trousers',
    'men-t-shirts',
    'men-shorts',
    'men-jackets',
    'men-dhothis',
    'men-kurta',
    'footwear',
    'accessories',
  ];

  const filteredCategories = [...categories]
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
    .filter((c) => {
      if (categoryGroupFilter === 'homepage') return homepageSlugs.includes(c.slug);
      return true;
    });

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      !orderSearch.trim() ||
      o.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_phone?.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  const lowStockItems = products.flatMap((p) =>
    (p.variants || [])
      .filter((v) => v.inventory_quantity <= 5)
      .map((v) => ({ product: p, variant: v }))
  );

  // ----------------------------------------------------
  // AUTH LOADING & LOGIN SCREEN
  // ----------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#143728] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-600">Loading Admin CMS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/logo.png"
                alt="NOTIONS®"
                width={140}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-[#143728] mt-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin CMS Portal</span>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Sign in with your administrator credentials to manage products, categories, orders, banners, and settings.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:border-[#143728] focus:bg-white focus:outline-none transition text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:border-[#143728] focus:bg-white focus:outline-none transition text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 py-3 bg-[#143728] hover:bg-[#0d261b] disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-[#143728] transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mainCategoriesCount = categories.filter((c) => !c.parent_id).length;
  const subcategoriesCount = categories.filter((c) => Boolean(c.parent_id)).length;

  const navItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: products.length },
    { id: 'categories', label: 'Categories', icon: Layers, badge: mainCategoriesCount },
    { id: 'subcategories', label: 'Subcategories', icon: FolderTree, badge: subcategoriesCount },
    { id: 'colors', label: 'Product Colors', icon: Palette, badge: colors.length },
    { id: 'sizes', label: 'Product Sizes', icon: Ruler, badge: sizes.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
    { id: 'banners', label: 'Banners & CMS', icon: ImageIcon, badge: banners.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ----------------------------------------------------
  // MAIN ADMIN CMS LAYOUT (100% Standard Sans-Serif Font)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col lg:flex-row font-sans antialiased pb-20 lg:pb-0">
      {/* ====================================================
          DESKTOP LEFT SIDEBAR
      ==================================================== */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="NOTIONS®"
              width={110}
              height={32}
              className="h-7 w-auto object-contain"
            />
          </Link>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#143728] text-white uppercase tracking-wider">
            CMS
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#143728] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Add Button + Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2.5 bg-gray-50/50">
          <button
            onClick={() => {
              setActiveTab('products');
              openNewProductModal();
            }}
            className="w-full py-2.5 px-4 bg-[#143728] hover:bg-[#0d261b] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ====================================================
          MOBILE TOP HEADER & SLIDE-OUT DRAWER
      ==================================================== */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-15 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NOTIONS®"
              width={90}
              height={26}
              className="h-6 w-auto object-contain"
            />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#143728] text-white uppercase">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewProductModal}
            className="px-3 py-1.5 bg-[#143728] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Product</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10">
            <div>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src="/logo.png" alt="NOTIONS®" width={100} height={28} className="h-6 w-auto" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#143728] text-white">CMS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                        isActive ? 'bg-[#143728] text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-200 space-y-2">
              <Link
                href="/"
                target="_blank"
                className="w-full py-2.5 px-3 bg-gray-100 text-gray-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <span>Open Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MOBILE BOTTOM NAVIGATION BAR
      ==================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 grid grid-cols-9 py-1.5 px-0.5 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg transition ${
                isActive ? 'text-[#143728] font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#143728]' : 'text-gray-400'}`} />
              <span className="text-[10px] mt-1 truncate max-w-full px-0.5">
                {item.id === 'banners' ? 'Banners' : item.id === 'sizes' ? 'Sizes' : item.id === 'colors' ? 'Colors' : item.id === 'subcategories' ? 'Subcats' : item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ====================================================
          MAIN CONTENT AREA
      ==================================================== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Desktop Top Sub-Header */}
        <div className="hidden lg:flex h-16 bg-white border-b border-gray-200 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-900 capitalize">
              {activeTab === 'banners' ? 'Banners & Homepage CMS' : activeTab === 'colors' ? 'Product Colors' : activeTab === 'sizes' ? 'Product Sizes' : activeTab === 'subcategories' ? 'Product Subcategories' : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {notice && (
          <div className="fixed bottom-16 lg:bottom-6 right-4 lg:right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4">
            <div
              className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-medium ${
                notice.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-800'
                  : 'bg-red-600 text-white border-red-700'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* ====================================================
              1. DASHBOARD TAB
          ==================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Storefront Online & Active
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Welcome to NOTIONS® Admin CMS
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your products, inventory sizes, categories, homepage banners, and customer orders from one place.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={openNewProductModal}
                    className="px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('banners')}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
                  >
                    Edit Banners
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards (Standard Clean Font) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Total Revenue</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    From {orders.filter((o) => o.payment_status === 'paid').length} paid orders
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('orders')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-gray-300 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Orders</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{orders.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pendingOrdersCount} awaiting fulfillment
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('products')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-gray-300 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Products</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{products.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {products.filter((p) => p.is_published).length} active on store
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('categories')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-gray-300 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Categories</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{categories.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {categories.filter((c) => c.is_published).length} published categories
                  </p>
                </div>
              </div>

              {/* Quick CMS Shortcuts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={openNewProductModal}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3.5 text-left transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#143728] text-white flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Add New Product</h3>
                    <p className="text-xs text-gray-500">Upload photos, sizes & price</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setEditingCategory({
                      name: '',
                      slug: '',
                      parent_id: null,
                      description: '',
                      sort_order: categories.length + 1,
                      is_published: true,
                    });
                    setShowCategoryModal(true);
                  }}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3.5 text-left transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Add Category</h3>
                    <p className="text-xs text-gray-500">Create new apparel section</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('banners')}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3.5 text-left transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Homepage Banners</h3>
                    <p className="text-xs text-gray-500">Change Hero & Promo visuals</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3.5 text-left transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Store Settings</h3>
                    <p className="text-xs text-gray-500">Shipping, contact & logo</p>
                  </div>
                </button>
              </div>

              {/* Two Column: Recent Orders & Inventory Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Recent Customer Orders</h3>
                      <p className="text-xs text-gray-500">Live orders placed on the storefront</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-semibold text-[#143728] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">No customer orders yet</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        When customers complete checkout on your store, their orders will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {orders.slice(0, 5).map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setActiveTab('orders');
                            setExpandedOrderId(o.id);
                          }}
                          className="py-3.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">#{o.order_number}</span>
                              <span className="text-xs font-medium text-gray-600">{o.customer_name}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(o.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              • {o.items?.length || 0} items
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">
                              ₹{o.total_amount.toLocaleString('en-IN')}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                                o.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {o.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stock Status & Store Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Inventory Health</h3>
                    <p className="text-xs text-gray-500 mb-4">Stock levels across product variants</p>

                    {lowStockItems.length === 0 ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold">All Products Well Stocked</p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Every size variant has sufficient stock (&gt; 5 units).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto">
                        {lowStockItems.map(({ product, variant }, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-900">{product.name}</p>
                              <p className="text-[11px] text-gray-600">Size: {variant.size}</p>
                            </div>
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              {variant.inventory_quantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Free Shipping Threshold</span>
                      <span className="font-bold text-gray-900">₹{settings.free_shipping_threshold}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Standard Shipping Rate</span>
                      <span className="font-bold text-gray-900">₹{settings.flat_shipping_rate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              2. PRODUCTS CMS TAB
          ==================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              {/* Header & Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Products Catalog ({filteredProducts.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Add new garments, upload Cloudinary images, and manage size variants & stock.
                  </p>
                </div>
                <button
                  onClick={openNewProductModal}
                  className="px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products by name, SKU, or category..."
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#143728] focus:outline-none"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#143728] focus:outline-none text-gray-700 font-medium"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Products' },
                    { id: 'published', label: 'Published Live' },
                    { id: 'bestseller', label: 'Bestsellers' },
                    { id: 'new', label: 'New Arrivals' },
                    { id: 'draft', label: 'Hidden / Drafts' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => setProductStatusFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        productStatusFilter === pill.id
                          ? 'bg-[#143728] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products List (Responsive Cards on Mobile + Table on Desktop) */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-gray-800">No matching products found</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Try clearing your search filters or add a new product to the catalog.
                  </p>
                  <button
                    onClick={openNewProductModal}
                    className="px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredProducts.map((p) => {
                    const totalStock = (p.variants || []).reduce(
                      (sum, v) => sum + (Number(v.inventory_quantity) || 0),
                      0
                    );
                    const discount =
                      p.compare_at_price && p.compare_at_price > p.price
                        ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
                        : null;

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gray-300 transition shadow-2xs"
                      >
                        {/* Left: Thumbnail + Product Info */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            <Image
                              src={
                                p.images?.[0]?.image_url ||
                                p.colors?.find((c) => c.image_url || (c.images && c.images.length > 0))?.image_url ||
                                p.colors?.find((c) => c.images && c.images.length > 0)?.images?.[0]?.url ||
                                '/logo.png'
                              }
                              alt={p.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                {p.name}
                              </h3>
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                {p.category_name || p.category_slug}
                              </span>
                            </div>

                            {/* Price & SKU */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-gray-900">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                              {p.compare_at_price && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{p.compare_at_price.toLocaleString('en-IN')}
                                </span>
                              )}
                              {discount && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                  {discount}% OFF
                                </span>
                              )}
                              <span className="text-xs text-gray-400">• SKU: {p.sku}</span>
                            </div>

                            {/* Variants & Stock */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {(p.variants || []).map((v) => (
                                <span
                                  key={v.id || v.size}
                                  className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700"
                                >
                                  {v.size}: <strong>{v.inventory_quantity}</strong>
                                </span>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                ({totalStock} total in stock)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: 1-Click Quick Badges + Edit / Delete Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          {/* Quick Toggles */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'is_published')}
                              title="Click to toggle Published status"
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                p.is_published
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {p.is_published ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Live</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'is_bestseller')}
                              title="Click to toggle Bestseller badge"
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                p.is_bestseller
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-gray-50 text-gray-400 border border-gray-200 hover:text-gray-600'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${p.is_bestseller ? 'fill-amber-500 text-amber-500' : ''}`} />
                              <span>Bestseller</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'is_new_arrival')}
                              title="Click to toggle New Arrival badge"
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                p.is_new_arrival
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-50 text-gray-400 border border-gray-200 hover:text-gray-600'
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>New</span>
                            </button>
                          </div>

                          {/* Edit & Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const isVar = p.product_mode === 'variant' || Boolean(p.colors && p.colors.length > 0);
                                setProductMode(isVar ? 'variant' : 'normal');
                                setEditingProduct({
                                  ...p,
                                  product_mode: isVar ? 'variant' : 'normal',
                                  stock: p.stock !== undefined ? p.stock : (p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) ?? 25),
                                  sizes: p.sizes || p.variants?.map((v) => v.size) || [],
                                });
                                setCustomImageUrl('');
                                setShowProductModal(true);
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-[#143728] hover:text-white text-gray-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ====================================================
              3. CATEGORIES CMS TAB
          ==================================================== */}
          {/* ====================================================
              PRODUCT SUBCATEGORIES MANAGEMENT TAB
          ==================================================== */}
          {activeTab === 'subcategories' && (
            <SubcategoryManagement
              categories={categories}
              onRefresh={loadData}
              showNotification={showNotification}
              handleFileUpload={handleFileUpload}
            />
          )}

          {activeTab === 'categories' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Store Categories ({filteredCategories.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Manage homepage category cards, navigation links, and category photographs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory({
                      name: '',
                      slug: '',
                      parent_id: null,
                      description: '',
                      sort_order: categories.length + 1,
                      is_published: true,
                    });
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Group Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Main Categories' },
                  { id: 'homepage', label: 'Homepage Row (10)' },
                ].map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => setCategoryGroupFilter(grp.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      categoryGroupFilter === grp.id
                        ? 'bg-[#143728] text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCategories.map((c) => {
                  const parentCat = categories.find((p) => p.id === c.parent_id);
                  const hpIndex = homepageSlugs.indexOf(c.slug);
                  const isHomepageCard = hpIndex !== -1;
                  const isUploadedImg = Boolean(c.image_url && c.image_url.startsWith('http'));
                  return (
                    <div
                      key={c.id}
                      className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition shadow-2xs ${
                        isHomepageCard
                          ? 'border-[#143728]/30 hover:border-[#143728]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="relative w-16 h-16 rounded-xl bg-[#F3EFE6] border border-gray-200 overflow-hidden flex-shrink-0">
                            <Image
                              src={c.image_url || '/logo.png'}
                              alt={c.name}
                              fill
                              sizes="64px"
                              className={isUploadedImg ? 'object-cover' : 'object-contain p-1.5'}
                            />
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              onClick={() => handleQuickToggleCategory(c)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer ${
                                c.is_published
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {c.is_published ? 'Active' : 'Hidden'}
                            </button>
                            {isHomepageCard && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#143728] text-white">
                                Homepage #{hpIndex + 1}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">/category/{c.slug}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            Main Department
                          </span>
                          <span className="text-[11px] text-gray-500 font-semibold">Order: #{c.sort_order}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setShowCategoryModal(true);
                          }}
                          className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-[#143728] hover:text-white text-gray-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit / Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====================================================
              4. ORDERS CMS TAB
          ==================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Customer Orders ({filteredOrders.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Track payments, update order fulfillment status, and add courier tracking numbers.
                  </p>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order #, customer name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#143728] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-[#143728] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {st === 'all' ? `All Orders (${orders.length})` : st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-gray-800">No orders found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Real customer orders placed through checkout will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4"
                    >
                      {/* Top Order Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-base font-bold text-gray-900">
                              Order #{order.order_number}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                order.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              Payment: {order.payment_status}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700">
                              Status: {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Placed on {new Date(order.created_at).toLocaleString('en-IN')}
                            {order.razorpay_payment_id && ` • Razorpay ID: ${order.razorpay_payment_id}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Order Total</p>
                            <p className="text-lg font-bold text-gray-900">
                              ₹{order.total_amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customer & Items Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Customer Info */}
                        <div className="bg-gray-50 p-3.5 rounded-xl space-y-1">
                          <p className="font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Customer Details
                          </p>
                          <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                          <p className="text-gray-600">{order.customer_email}</p>
                          <p className="text-gray-600">{order.customer_phone}</p>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-gray-50 p-3.5 rounded-xl space-y-1">
                          <p className="font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Shipping Address
                          </p>
                          <p className="text-gray-800">{order.shipping_address?.street}</p>
                          <p className="text-gray-800">
                            {order.shipping_address?.city}, {order.shipping_address?.state}{' '}
                            {order.shipping_address?.postal_code}
                          </p>
                          <p className="text-gray-600">{order.shipping_address?.country}</p>
                        </div>

                        {/* Status & Tracking Update */}
                        <div className="bg-gray-50 p-3.5 rounded-xl space-y-2">
                          <p className="font-bold text-gray-700 uppercase tracking-wider">
                            Update Fulfillment
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrder(order, { status: e.target.value as any })
                              }
                              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            <select
                              value={order.payment_status}
                              onChange={(e) =>
                                handleUpdateOrder(order, { payment_status: e.target.value as any })
                              }
                              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                            >
                              <option value="pending">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <input
                              type="text"
                              placeholder="Courier (e.g. BlueDart)"
                              defaultValue={order.tracking_carrier || ''}
                              onBlur={(e) =>
                                handleUpdateOrder(order, { tracking_carrier: e.target.value })
                              }
                              className="w-1/2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Tracking AWB #"
                              defaultValue={order.tracking_number || ''}
                              onBlur={(e) =>
                                handleUpdateOrder(order, { tracking_number: e.target.value })
                              }
                              className="w-1/2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ordered Items */}
                      <div className="pt-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Ordered Items ({order.items?.length || 0})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(order.items || []).map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/60"
                            >
                              <div className="flex items-center gap-3">
                                {item.image_url && (
                                  <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                    <Image
                                      src={item.image_url}
                                      alt={item.product_name}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-gray-900">
                                    {item.product_name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <span>Size: {item.variant_label || 'Standard'}</span>
                                    {item.selected_color && (
                                      <span className="flex items-center gap-1">
                                        • Color:
                                        {item.selected_color_hex && (
                                          <span
                                            className="inline-block w-2 h-2 rounded-full border border-black/15"
                                            style={{ backgroundColor: item.selected_color_hex }}
                                          />
                                        )}
                                        <strong className="text-gray-700">{item.selected_color}</strong>
                                      </span>
                                    )}
                                    <span>• Qty: {item.quantity}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-gray-900">
                                ₹{item.line_total?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================
              PRODUCT COLORS CMS TAB (Phase 3)
          ==================================================== */}
          {activeTab === 'colors' && (
            <ColorManagement
              colors={colors}
              onRefresh={loadData}
              showNotification={showNotification}
            />
          )}
          {/* ====================================================
              PRODUCT SIZES MANAGEMENT TAB
          ==================================================== */}
          {activeTab === 'sizes' && (
            <SizeManagement
              categories={categories}
              sizes={sizes}
              onRefresh={loadData}
              showNotification={showNotification}
            />
          )}


          {/* ====================================================
              5. BANNERS & HOMEPAGE CMS TAB (Phase 2)
          ==================================================== */}
          {activeTab === 'banners' && (
            <BannerManagement
              banners={banners}
              categories={categories}
              products={products}
              onRefresh={loadData}
              showNotification={showNotification}
              handleFileUpload={handleFileUpload}
            />
          )}

          {/* ====================================================
              6. STORE SETTINGS & INTEGRATIONS TAB
          ==================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Store Settings & Configuration
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Configure your brand identity, contact information, shipping rates, and cloud integrations.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Store Info & Shipping */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Brand Identity */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                      1. Brand Identity & Announcement Bar
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={settings.store_name}
                          onChange={(e) =>
                            setSettings({ ...settings, store_name: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Brand Tagline
                        </label>
                        <input
                          type="text"
                          value={settings.tagline}
                          onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Announcement Bar Message
                      </label>
                      <input
                        type="text"
                        value={settings.announcement_bar}
                        onChange={(e) =>
                          setSettings({ ...settings, announcement_bar: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact & Store Location */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                      2. Contact Details & Flagship Address
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Customer Support Email
                        </label>
                        <input
                          type="email"
                          value={settings.support_email}
                          onChange={(e) =>
                            setSettings({ ...settings, support_email: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Support Phone / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={settings.support_phone}
                          onChange={(e) =>
                            setSettings({ ...settings, support_phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Physical Store / Atelier Address
                      </label>
                      <textarea
                        rows={2}
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Shipping Rules */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                      3. Shipping & Delivery Rules
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Free Shipping Minimum Order (₹)
                        </label>
                        <input
                          type="number"
                          value={settings.free_shipping_threshold}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              free_shipping_threshold: Number(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Standard Flat Shipping Charge (₹)
                        </label>
                        <input
                          type="number"
                          value={settings.flat_shipping_rate}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              flat_shipping_rate: Number(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-3 bg-[#143728] hover:bg-[#0d261b] text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer"
                      >
                        {savingSettings ? 'Saving Changes...' : 'Save Store Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Cloud Integrations & Admin Info */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                      Connected Services
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">Supabase Database</p>
                          <p className="text-gray-600 mt-0.5">vvwizaunsdtnkocwjgwi</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                          CONNECTED
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">Cloudinary CDN</p>
                          <p className="text-gray-600 mt-0.5">Cloud: fb7zpbif</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                          ACTIVE
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">Razorpay Gateway</p>
                          <p className="text-gray-500 mt-0.5">HMAC signature verified</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px]">
                          READY
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">Brevo Transactional Email</p>
                          <p className="text-gray-500 mt-0.5">Order confirmation emails</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px]">
                          READY
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                    <h3 className="text-base font-bold text-gray-900">Admin Security</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Your admin login credentials (<code className="bg-gray-100 px-1.5 py-0.5 rounded">ADMIN_USERNAME</code> and{' '}
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded">ADMIN_PASSWORD</code>) are stored securely in{' '}
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code>.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================
          MODAL 1: ADD / EDIT PRODUCT MODAL
      ==================================================== */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct.id ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-gray-500">
                  Fill in the product details, upload photos, and set size inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              {/* ====================================================
                  PRODUCT CREATION MODE SWITCHING (Normal vs Variant Mode)
              ==================================================== */}
              <div className="bg-gray-100 p-2 rounded-2xl border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="px-1">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                      Product Mode: 
                    </span>
                  </div>

                  <div className="inline-flex p-1 bg-gray-200/80 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (productMode === 'normal') return;
                        if (editingProduct.colors && editingProduct.colors.length > 0) {
                          setDeleteModalState({
                            isOpen: true,
                            title: 'Switch to Normal Mode?',
                            itemName: `${editingProduct.name || 'Product'} Colors`,
                            message: 'Switching to Normal Product Mode will discard configured color variants and their independent stock levels. Do you wish to continue?',
                            confirmText: 'Discard & Switch',
                            isDeleting: false,
                            onConfirm: () => {
                              setProductMode('normal');
                              setEditingProduct({
                                ...editingProduct,
                                product_mode: 'normal',
                                colors: [],
                              });
                              showNotification('Switched to Normal Product Mode');
                              setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
                            },
                          });
                          return;
                        }
                        setProductMode('normal');
                        setEditingProduct({
                          ...editingProduct,
                          product_mode: 'normal',
                          colors: [],
                        });
                        showNotification('Switched to Normal Product Mode');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        productMode === 'normal'
                          ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Normal Product Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (productMode === 'variant') return;
                        setProductMode('variant');
                        setEditingProduct({
                          ...editingProduct,
                          product_mode: 'variant',
                        });
                        showNotification('Switched to Product Variant Mode');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        productMode === 'variant'
                          ? 'bg-[#143728] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Product Variant Mode</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name"
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, ''),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Main Category *
                    </label>
                    <select
                      value={editingProduct.category_id || ''}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.id === e.target.value);
                        setEditingProduct({
                          ...editingProduct,
                          category_id: e.target.value,
                          category_slug: cat?.slug || '',
                          category_name: cat?.name || '',
                          subcategory_id: '',
                          subcategory_slug: '',
                          subcategory_name: '',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:border-[#143728] focus:outline-none"
                    >
                      <option value="">-- Select Main Category --</option>
                      {categories.filter((c) => !c.parent_id).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={editingProduct.subcategory_id || ''}
                      disabled={!editingProduct.category_id}
                      onChange={(e) => {
                        const sub = categories.find((s) => s.id === e.target.value);
                        setEditingProduct({
                          ...editingProduct,
                          subcategory_id: e.target.value,
                          subcategory_slug: sub?.slug || '',
                          subcategory_name: sub?.name || '',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:border-[#143728] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- Select Subcategory (Optional) --</option>
                      {categories
                        .filter((s) => s.parent_id === editingProduct.category_id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Price, Compare Price & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    MRP / Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.compare_at_price || ''}
                    placeholder="Optional (for % OFF)"
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compare_at_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* ====================================================
                  MODE-SPECIFIC FORM SECTIONS
              ==================================================== */}

              {/* --------------------------------------------------
                  MODE A: NORMAL PRODUCT MODE (Toggle OFF)
                  Single common stock, category-based sizes, max 5 images
              -------------------------------------------------- */}
              {productMode === 'normal' && (
                <div className="space-y-4">
                  {/* Normal Product Common Stock */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider mb-0.5">
                          Single Product Stock Quantity (Units) *
                        </label>
                        <p className="text-[11px] text-gray-500">
                          In Normal Product Mode, all selected sizes share this single common stock inventory.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-semibold">Total Stock:</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={editingProduct.stock ?? 25}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setEditingProduct({
                              ...editingProduct,
                              stock: val,
                              variants: (editingProduct.sizes || []).map((sz, i) => ({
                                id: `var-${Date.now()}-${i}`,
                                product_id: editingProduct.id || '',
                                size: sz,
                                inventory_quantity: val,
                                is_available: val > 0,
                              })),
                            });
                          }}
                          className="w-24 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-center font-bold bg-white text-gray-900 focus:outline-none focus:border-[#143728]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Normal Product Category-Based Size Selection */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider">
                          Select Sizes for {editingProduct.category_name || 'Category'}
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Sizes are dynamically loaded from Product Sizes. Select applicable size options for this product.
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const targetCatId = editingProduct.subcategory_id || editingProduct.category_id;
                      const catSizes = sizes.filter(
                        (s) =>
                          (s.category_id === targetCatId ||
                            s.category_id === editingProduct.category_id ||
                            (editingProduct.subcategory_id && s.category_id === editingProduct.subcategory_id)) &&
                          s.is_active !== false
                      );

                      if (catSizes.length === 0) {
                        return (
                          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">
                                No sizes configured for {editingProduct.category_name || 'the selected category'}
                              </span>
                              <span className="text-[11px] text-amber-800">
                                Size creation is managed exclusively in the <strong>Product Sizes</strong> sidebar. Please open the Product Sizes sidebar to add sizes for this category.
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {catSizes.map((cs) => {
                            const isSelected = (editingProduct.sizes || []).includes(cs.name);
                            return (
                              <button
                                key={cs.id}
                                type="button"
                                onClick={() => {
                                  let currentSizes = editingProduct.sizes ? [...editingProduct.sizes] : [];
                                  if (isSelected) {
                                    currentSizes = currentSizes.filter((s) => s !== cs.name);
                                  } else {
                                    currentSizes.push(cs.name);
                                  }
                                  const commonStock = editingProduct.stock ?? 25;
                                  const updatedVariants: ProductVariant[] = currentSizes.map((sz, i) => ({
                                    id: `var-${Date.now()}-${i}`,
                                    product_id: editingProduct.id || '',
                                    size: sz,
                                    inventory_quantity: commonStock,
                                    is_available: commonStock > 0,
                                  }));
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizes: currentSizes,
                                    variants: updatedVariants,
                                  });
                                }}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#143728] text-white border-[#143728] shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {cs.name} {isSelected ? '✓' : '+'}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Normal Product Images (Maximum 5 Images) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider">
                          Product Photographs (Max 5 Images)
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Upload high-resolution product photos. Drag or use arrows to set the primary cover photo.
                        </p>
                      </div>
                    
                    </div>

                    {/* Image previews with reorder and delete */}
                    {(editingProduct.images || []).length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2.5 py-1">
                        {(editingProduct.images || []).map((img, i, arr) => (
                          <div
                            key={img.id || i}
                            className="relative w-20 h-24 rounded-xl overflow-hidden bg-white border border-gray-300 flex-shrink-0 group shadow-2xs"
                          >
                            <Image
                              src={img.image_url}
                              alt="Product"
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                            {i === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold text-center py-0.5 z-10">
                                Primary Photo
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 z-20">
                              {i > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const imgs = [...(editingProduct.images || [])];
                                    const temp = imgs[i - 1];
                                    imgs[i - 1] = imgs[i];
                                    imgs[i] = temp;
                                    setEditingProduct({ ...editingProduct, images: imgs });
                                  }}
                                  className="p-1 rounded bg-white text-gray-800 text-[10px] hover:bg-gray-100 cursor-pointer"
                                  title="Move Left"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                              )}
                              {i < arr.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const imgs = [...(editingProduct.images || [])];
                                    const temp = imgs[i + 1];
                                    imgs[i + 1] = imgs[i];
                                    imgs[i] = temp;
                                    setEditingProduct({ ...editingProduct, images: imgs });
                                  }}
                                  className="p-1 rounded bg-white text-gray-800 text-[10px] hover:bg-gray-100 cursor-pointer"
                                  title="Move Right"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingProduct.images || []).filter((_, idx) => idx !== i);
                                  setEditingProduct({ ...editingProduct, images: updated });
                                }}
                                className="p-1 rounded bg-red-600 text-white text-[10px] hover:bg-red-700 cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic p-3 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                        No product photos uploaded. Upload up to 5 photos below.
                      </p>
                    )}

                    {/* Upload controls (disabled if 5 images reached) */}
                    {(editingProduct.images || []).length < 5 ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-300 hover:border-[#143728] rounded-xl cursor-pointer transition shadow-2xs">
                          <UploadCloud className="w-4 h-4 text-[#143728]" />
                          <span className="font-semibold text-gray-700 text-xs">
                            {uploadingImage ? 'Uploading Photos...' : 'Upload Images (Max 5 Total, Multiple Supported)'}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              const currentCount = editingProduct.images?.length || 0;
                              const availableSlots = 5 - currentCount;
                              if (availableSlots <= 0) {
                                showNotification('Maximum 5 images allowed per product.', 'error');
                                return;
                              }
                              const filesToUpload = files.slice(0, availableSlots);
                              setUploadingImage(true);
                              try {
                                const newImgs: ProductImage[] = [];
                                for (const file of filesToUpload) {
                                  const uploaded = await handleFileUpload(file, 'notions/products');
                                  newImgs.push({
                                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                    product_id: editingProduct.id || '',
                                    image_url: uploaded.url,
                                    image_public_id: uploaded.public_id,
                                    alt_text: editingProduct.name || 'Product Image',
                                    sort_order: currentCount + newImgs.length + 1,
                                    is_primary: currentCount === 0 && newImgs.length === 0,
                                  });
                                }
                                setEditingProduct({
                                  ...editingProduct,
                                  images: [...(editingProduct.images || []), ...newImgs],
                                });
                                showNotification(`Uploaded ${newImgs.length} image(s) successfully!`);
                              } catch (err: any) {
                                showNotification(err.message, 'error');
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                        </label>

                        {/* Paste URL */}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="Or paste image URL..."
                            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs w-44"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!customImageUrl.trim()) return;
                              if ((editingProduct.images?.length || 0) >= 5) {
                                showNotification('Maximum 5 images allowed per product.', 'error');
                                return;
                              }
                              const newImg: ProductImage = {
                                id: `img-${Date.now()}`,
                                product_id: editingProduct.id || '',
                                image_url: customImageUrl.trim(),
                                image_public_id: 'custom_url',
                                alt_text: editingProduct.name || 'Product Image',
                                sort_order: (editingProduct.images?.length || 0) + 1,
                                is_primary: (editingProduct.images?.length || 0) === 0,
                              };
                              setEditingProduct({
                                ...editingProduct,
                                images: [...(editingProduct.images || []), newImg],
                              });
                              setCustomImageUrl('');
                            }}
                            className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-xs cursor-pointer"
                          >
                            Add URL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-semibold">
                        Maximum 5 images reached. Remove an existing image to upload another.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  MODE B: PRODUCT VARIANT MODE (Toggle ON)
                  Colors, per-color galleries (max 5), independent stock
              -------------------------------------------------- */}
              {productMode === 'variant' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block font-bold text-gray-800 text-sm">
                        Product Colors, Galleries & Color-Wise Stock
                      </label>
                      <p className="text-[11px] text-gray-500">
                        Upload up to 5 photos per color and configure category-specific sizes with independent stock levels.
                      </p>
                    </div>

                    {/* Add Color Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer shadow-2xs focus:outline-none focus:border-[#143728]"
                        value=""
                        onChange={(e) => {
                          const colId = e.target.value;
                          if (!colId) return;
                          const col = colors.find((c) => c.id === colId);
                          if (col) {
                            const currentColors = editingProduct.colors || [];
                            if (!currentColors.some((c) => c.color_id === col.id)) {
                              const targetCatId = editingProduct.subcategory_id || editingProduct.category_id;
                              const catSizes = sizes.filter(
                                (s) =>
                                  (s.category_id === targetCatId ||
                                    s.category_id === editingProduct.category_id ||
                                    (editingProduct.subcategory_id && s.category_id === editingProduct.subcategory_id)) &&
                                  s.is_active !== false
                              );
                              const initialSizes = catSizes.map((s) => ({
                                size_id: s.id,
                                size: s.name,
                                stock: 0,
                              }));
                              const initialStock = initialSizes.reduce((sum, s) => sum + s.stock, 0);

                              const newVariant: ProductColorVariant = {
                                color_id: col.id,
                                name: col.name,
                                hex: col.hex,
                                stock: initialStock,
                                image_url: '',
                                image_public_id: '',
                                images: [],
                                sizes: initialSizes,
                              };

                              const updatedColors = [...currentColors, newVariant];

                              const sizeMap: { [key: string]: number } = {};
                              updatedColors.forEach((c) => {
                                (c.sizes || []).forEach((s) => {
                                  sizeMap[s.size] = (sizeMap[s.size] || 0) + (Number(s.stock) || 0);
                                });
                              });
                              const updatedVariants: ProductVariant[] = Object.keys(sizeMap).map((sz, i) => ({
                                id: `var-${Date.now()}-${i}`,
                                product_id: editingProduct.id || '',
                                size: sz,
                                inventory_quantity: sizeMap[sz],
                                is_available: sizeMap[sz] > 0,
                              }));

                              setEditingProduct({
                                ...editingProduct,
                                colors: updatedColors,
                                variants: updatedVariants,
                              });
                            }
                          }
                        }}
                      >
                        <option value="">+ Assign Color Variant</option>
                        {colors
                          .filter((c) => c.is_active !== false)
                          .filter((c) => !(editingProduct.colors || []).some((ec) => ec.color_id === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.hex})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Warning if category has no sizes configured yet */}
                  {(() => {
                    const targetCatId = editingProduct.subcategory_id || editingProduct.category_id;
                    const catSizes = sizes.filter(
                      (s) =>
                        (s.category_id === targetCatId ||
                          s.category_id === editingProduct.category_id ||
                          (editingProduct.subcategory_id && s.category_id === editingProduct.subcategory_id)) &&
                        s.is_active !== false
                    );
                    if (catSizes.length === 0) {
                      return (
                        <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              No sizes configured for {editingProduct.category_name || 'the selected category'}
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Size creation is managed exclusively in the <strong>Product Sizes</strong> sidebar. Please open the Product Sizes sidebar to add sizes for this category.
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* List of Assigned Color Variants */}
                  {(!editingProduct.colors || editingProduct.colors.length === 0) ? (
                    <p className="text-xs text-gray-500 italic p-4 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                      No color variants assigned. Select a color above to upload color photo galleries (up to 5 per color), assign sizes, and set independent stock.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {editingProduct.colors.map((cv, cIdx) => {
                        const targetCatId = editingProduct.subcategory_id || editingProduct.category_id;
                        const catSizes = sizes.filter(
                          (s) =>
                            (s.category_id === targetCatId ||
                              s.category_id === editingProduct.category_id ||
                              (editingProduct.subcategory_id && s.category_id === editingProduct.subcategory_id)) &&
                            s.is_active !== false
                        );

                        const colorImgCount = cv.images?.length || (cv.image_url ? 1 : 0);

                        return (
                          <div
                            key={cv.color_id || cIdx}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3"
                          >
                            {/* Color Variant Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-6 h-6 rounded-full border border-black/20 shadow-2xs shrink-0 inline-block"
                                  style={{ backgroundColor: cv.hex }}
                                />
                                <div>
                                  <span className="text-xs font-bold text-gray-900">{cv.name}</span>
                                  <span className="text-[10px] text-gray-400 font-mono uppercase ml-1.5">
                                    {cv.hex}
                                  </span>
                                </div>
                                <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-[#143728] text-[10px] font-bold rounded-full border border-emerald-100">
                                  Total Stock: {cv.stock || 0}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedColors = (editingProduct.colors || []).filter((_, i) => i !== cIdx);
                                  const sizeMap: { [key: string]: number } = {};
                                  updatedColors.forEach((c) => {
                                    (c.sizes || []).forEach((s) => {
                                      sizeMap[s.size] = (sizeMap[s.size] || 0) + (Number(s.stock) || 0);
                                    });
                                  });
                                  const updatedVariants: ProductVariant[] = Object.keys(sizeMap).map((sz, i) => ({
                                    id: `var-${Date.now()}-${i}`,
                                    product_id: editingProduct.id || '',
                                    size: sz,
                                    inventory_quantity: sizeMap[sz],
                                    is_available: sizeMap[sz] > 0,
                                  }));
                                  setEditingProduct({
                                    ...editingProduct,
                                    colors: updatedColors,
                                    variants: updatedVariants,
                                  });
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer transition"
                                title="Remove Color"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Multi-Image Gallery for this Color (Max 5 Images) */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                  {cv.name} Gallery: <span className="text-[#143728]">{colorImgCount} / 5 photos ({Math.max(0, 5 - colorImgCount)} slots left)</span>
                                </span>
                                {colorImgCount < 5 ? (
                                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer transition">
                                    <UploadCloud className="w-3.5 h-3.5 text-[#143728]" />
                                    <span>Upload Photos (Max 5)</span>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/png,image/jpeg,image/webp"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length === 0) return;
                                        const availableSlots = 5 - colorImgCount;
                                        if (availableSlots <= 0) {
                                          showNotification(`Maximum 5 images allowed for ${cv.name}.`, 'error');
                                          return;
                                        }
                                        const filesToUpload = files.slice(0, availableSlots);
                                        setUploadingImage(true);
                                        try {
                                          const updatedColors = [...(editingProduct.colors || [])];
                                          const currentImages = updatedColors[cIdx].images ? [...updatedColors[cIdx].images!] : [];
                                          if (updatedColors[cIdx].image_url && currentImages.length === 0) {
                                            currentImages.push({
                                              id: `img-${Date.now()}-0`,
                                              url: updatedColors[cIdx].image_url!,
                                              public_id: updatedColors[cIdx].image_public_id,
                                              sort_order: 1,
                                            });
                                          }
                                          for (const file of filesToUpload) {
                                            const uploaded = await handleFileUpload(file, 'notions/products/colors');
                                            currentImages.push({
                                              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                              url: uploaded.url,
                                              public_id: uploaded.public_id,
                                              sort_order: currentImages.length + 1,
                                            });
                                          }
                                          updatedColors[cIdx] = {
                                            ...updatedColors[cIdx],
                                            images: currentImages,
                                            image_url: currentImages[0]?.url,
                                            image_public_id: currentImages[0]?.public_id,
                                          };
                                          setEditingProduct({ ...editingProduct, colors: updatedColors });
                                          showNotification(`Uploaded ${filesToUpload.length} image(s) for ${cv.name}!`);
                                        } catch (err: any) {
                                          showNotification(err.message, 'error');
                                        } finally {
                                          setUploadingImage(false);
                                        }
                                      }}
                                    />
                                  </label>
                                ) : (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                    Max 5 Photos Reached
                                  </span>
                                )}
                              </div>

                              {/* Image Previews, Reorder, Delete & Replace */}
                              {(!cv.images || cv.images.length === 0) && !cv.image_url ? (
                                <p className="text-[11px] text-gray-400 italic p-2.5 bg-gray-50 rounded-lg text-center">
                                  No photos uploaded for {cv.name} yet. Click "Upload Photos" above to add up to 5 images.
                                </p>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  {(cv.images && cv.images.length > 0
                                    ? cv.images
                                    : cv.image_url
                                    ? [{ id: 'legacy-1', url: cv.image_url, public_id: cv.image_public_id, sort_order: 1 }]
                                    : []
                                  ).map((img, imgIdx, imgArr) => (
                                    <div
                                      key={img.id || imgIdx}
                                      className="relative w-16 h-20 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden group shadow-2xs"
                                    >
                                      <Image src={img.url} alt={`${cv.name} ${imgIdx}`} fill className="object-cover" />
                                      {imgIdx === 0 && (
                                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold text-center py-0.5 z-10">
                                          Primary
                                        </span>
                                      )}
                                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 z-20">
                                        {imgIdx > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedColors = [...(editingProduct.colors || [])];
                                              const imgs = [...(updatedColors[cIdx].images || [])];
                                              const temp = imgs[imgIdx - 1];
                                              imgs[imgIdx - 1] = imgs[imgIdx];
                                              imgs[imgIdx] = temp;
                                              updatedColors[cIdx] = {
                                                ...updatedColors[cIdx],
                                                images: imgs,
                                                image_url: imgs[0]?.url,
                                              };
                                              setEditingProduct({ ...editingProduct, colors: updatedColors });
                                            }}
                                            className="p-1 rounded bg-white text-gray-800 text-[10px] hover:bg-gray-100"
                                            title="Move Left"
                                          >
                                            <ChevronLeft className="w-3 h-3" />
                                          </button>
                                        )}
                                        {imgIdx < imgArr.length - 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedColors = [...(editingProduct.colors || [])];
                                              const imgs = [...(updatedColors[cIdx].images || [])];
                                              const temp = imgs[imgIdx + 1];
                                              imgs[imgIdx + 1] = imgs[imgIdx];
                                              imgs[imgIdx] = temp;
                                              updatedColors[cIdx] = {
                                                ...updatedColors[cIdx],
                                                images: imgs,
                                                image_url: imgs[0]?.url,
                                              };
                                              setEditingProduct({ ...editingProduct, colors: updatedColors });
                                            }}
                                            className="p-1 rounded bg-white text-gray-800 text-[10px] hover:bg-gray-100"
                                            title="Move Right"
                                          >
                                            <ChevronRight className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedColors = [...(editingProduct.colors || [])];
                                            const imgs = (updatedColors[cIdx].images || []).filter((_, i) => i !== imgIdx);
                                            updatedColors[cIdx] = {
                                              ...updatedColors[cIdx],
                                              images: imgs,
                                              image_url: imgs[0]?.url || '',
                                              image_public_id: imgs[0]?.public_id || '',
                                            };
                                            setEditingProduct({ ...editingProduct, colors: updatedColors });
                                          }}
                                          className="p-1 rounded bg-red-600 text-white text-[10px] hover:bg-red-700"
                                          title="Delete Image"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Category-Wise Sizes & Stock for this Color */}
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                                Applicable Sizes & Stock for {cv.name}:
                              </span>

                              {catSizes.length === 0 ? (
                                <p className="text-[11px] text-amber-700 italic">
                                  No sizes found in category "{editingProduct.category_name || 'selected'}". Configure sizes in Product Sizes tab first.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {/* Size Selection Pills */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {catSizes.map((cs) => {
                                      const isAssigned = (cv.sizes || []).some(
                                        (s) => s.size.toLowerCase() === cs.name.toLowerCase() || s.size_id === cs.id
                                      );
                                      return (
                                        <button
                                          key={cs.id}
                                          type="button"
                                          onClick={() => {
                                            const updatedColors = [...(editingProduct.colors || [])];
                                            let currentSizes = updatedColors[cIdx].sizes ? [...updatedColors[cIdx].sizes!] : [];
                                            if (isAssigned) {
                                              currentSizes = currentSizes.filter(
                                                (s) => s.size.toLowerCase() !== cs.name.toLowerCase() && s.size_id !== cs.id
                                              );
                                            } else {
                                              currentSizes.push({
                                                size_id: cs.id,
                                                size: cs.name,
                                                stock: 0,
                                              });
                                            }
                                            const totalStock = currentSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
                                            updatedColors[cIdx] = {
                                              ...updatedColors[cIdx],
                                              sizes: currentSizes,
                                              stock: totalStock,
                                            };

                                            const sizeMap: { [key: string]: number } = {};
                                            updatedColors.forEach((c) => {
                                              (c.sizes || []).forEach((s) => {
                                                sizeMap[s.size] = (sizeMap[s.size] || 0) + (Number(s.stock) || 0);
                                              });
                                            });
                                            const updatedVariants: ProductVariant[] = Object.keys(sizeMap).map((sz, i) => ({
                                              id: `var-${Date.now()}-${i}`,
                                              product_id: editingProduct.id || '',
                                              size: sz,
                                              inventory_quantity: sizeMap[sz],
                                              is_available: sizeMap[sz] > 0,
                                            }));

                                            setEditingProduct({
                                              ...editingProduct,
                                              colors: updatedColors,
                                              variants: updatedVariants,
                                            });
                                          }}
                                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                            isAssigned
                                              ? 'bg-[#143728] text-white border-[#143728]'
                                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                          }`}
                                        >
                                          {cs.name} {isAssigned ? '✓' : '+'}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Stock input grid for each active size */}
                                  {(cv.sizes && cv.sizes.length > 0) ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                                      {cv.sizes.map((sz, szIdx) => (
                                        <div
                                          key={sz.size_id || szIdx}
                                          className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center"
                                        >
                                          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                                            Size {sz.size}
                                          </span>
                                          <div className="flex items-center justify-center gap-1">
                                            <span className="text-[10px] text-gray-400">Qty:</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={sz.stock}
                                              onChange={(e) => {
                                                const updatedColors = [...(editingProduct.colors || [])];
                                                const currentSizes = [...(updatedColors[cIdx].sizes || [])];
                                                currentSizes[szIdx] = {
                                                  ...currentSizes[szIdx],
                                                  stock: Math.max(0, Number(e.target.value) || 0),
                                                };
                                                const totalStock = currentSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
                                                updatedColors[cIdx] = {
                                                  ...updatedColors[cIdx],
                                                  sizes: currentSizes,
                                                  stock: totalStock,
                                                };

                                                const sizeMap: { [key: string]: number } = {};
                                                updatedColors.forEach((c) => {
                                                  (c.sizes || []).forEach((s) => {
                                                    sizeMap[s.size] = (sizeMap[s.size] || 0) + (Number(s.stock) || 0);
                                                  });
                                                });
                                                const updatedVariants: ProductVariant[] = Object.keys(sizeMap).map((sName, i) => ({
                                                  id: `var-${Date.now()}-${i}`,
                                                  product_id: editingProduct.id || '',
                                                  size: sName,
                                                  inventory_quantity: sizeMap[sName],
                                                  is_available: sizeMap[sName] > 0,
                                                }));

                                                setEditingProduct({
                                                  ...editingProduct,
                                                  colors: updatedColors,
                                                  variants: updatedVariants,
                                                });
                                              }}
                                              className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded font-bold text-center bg-white"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-gray-400 italic">
                                      No sizes selected for this color. Click the size buttons above to assign sizes and stock.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Description & Material */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  placeholder="Enter product description"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                />
              </div>

              {/* 6. Visibility & Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_published ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_published: e.target.checked })
                    }
                    className="rounded text-[#143728]"
                  />
                  <span className="font-semibold text-gray-800">Published on Store</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.is_bestseller}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_bestseller: e.target.checked })
                    }
                    className="rounded text-[#143728]"
                  />
                  <span className="font-semibold text-amber-900">Bestseller Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-blue-50/60 px-3 py-2 rounded-xl border border-blue-200">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.is_new_arrival}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_new_arrival: e.target.checked })
                    }
                    className="rounded text-[#143728]"
                  />
                  <span className="font-semibold text-blue-900">New Arrival</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#143728] hover:bg-[#0d261b] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: ADD / EDIT CATEGORY MODAL
      ==================================================== */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCategory.id ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter category name"
                  value={editingCategory.name || ''}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    const autoSlug = nameVal
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setEditingCategory({
                      ...editingCategory,
                      name: nameVal,
                      slug: !editingCategory.id ? autoSlug : editingCategory.slug,
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">URL Slug *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = (editingCategory.name || '')
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setEditingCategory({ ...editingCategory, slug: generated });
                      }}
                      className="text-[10px] text-[#143728] hover:underline font-bold cursor-pointer"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter category slug"
                    value={editingCategory.slug || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editingCategory.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        sort_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              

              {/* Category Active Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-gray-700">Active / Published</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.is_published !== false}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, is_published: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]" />
                </label>
              </div>

              {/* Category Image Upload */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-semibold text-gray-700">Category Photograph</label>
                <div className="flex items-center gap-3">
                  {editingCategory.image_url && (
                    <div className="relative w-14 h-14 rounded-xl bg-[#F3EFE6] border border-gray-300 overflow-hidden flex-shrink-0">
                      <Image
                        src={editingCategory.image_url}
                        alt="Category"
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-dashed border-gray-300 hover:border-[#143728] rounded-xl cursor-pointer">
                    <UploadCloud className="w-4 h-4 text-[#143728]" />
                    <span className="font-semibold text-gray-700">
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const uploaded = await handleFileUpload(file, 'notions/categories');
                          setEditingCategory({
                            ...editingCategory,
                            image_url: uploaded.url,
                            image_public_id: uploaded.public_id,
                          });
                          showNotification('Category image uploaded!');
                        } catch (err: any) {
                          showNotification(err.message, 'error');
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#143728] text-white font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 3: EDIT BANNER MODAL
      ==================================================== */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-2xl font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Homepage Banner</h3>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Section: {editingBanner.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* Banner Image Preview & Upload */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                <label className="block font-bold text-gray-800">Banner Visual</label>
                {editingBanner.image_url && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-white border border-gray-200">
                    <Image
                      src={editingBanner.image_url}
                      alt="Banner preview"
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-300 hover:border-[#143728] rounded-xl cursor-pointer transition">
                  <UploadCloud className="w-4 h-4 text-[#143728]" />
                  <span className="font-semibold text-gray-700">
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload New Banner Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const uploaded = await handleFileUpload(file, 'notions/banners');
                        setEditingBanner({
                          ...editingBanner,
                          image_url: uploaded.url,
                          image_public_id: uploaded.public_id,
                        });
                        showNotification('Banner image uploaded!');
                      } catch (err: any) {
                        showNotification(err.message, 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Headline / Title</label>
                  <input
                    type="text"
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subtitle / Tag</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Supporting Text</label>
                <input
                  type="text"
                  value={editingBanner.description || ''}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={editingBanner.cta_label || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, cta_label: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={editingBanner.cta_url || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, cta_url: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#143728] text-white font-semibold"
                >
                  Save Banner Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Products, Categories, Orders */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        itemName={deleteModalState.itemName}
        message={deleteModalState.message}
        confirmText={deleteModalState.confirmText}
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false, isDeleting: false }))}
        onConfirm={deleteModalState.onConfirm}
      />
    </div>
  );
}
