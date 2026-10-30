import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Category, Product, ProductVariant, Banner, SiteSettings, Order } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const storeFilePath = path.join(process.cwd(), 'data', 'store.json');

function readLocalStore() {
  try {
    if (fs.existsSync(storeFilePath)) {
      const content = fs.readFileSync(storeFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading local store:', err);
  }
  return { categories: [], products: [], banners: [], settings: {}, orders: [] };
}

function writeLocalStore(data: any) {
  try {
    fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

// ----------------------------------------------------
// CATEGORIES (Local Store is Primary Source of Truth)
// ----------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  const store = readLocalStore();
  return (store.categories || [])
    .filter((c: Category) => c.is_published)
    .sort((a: Category, b: Category) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const store = readLocalStore();
  return (store.categories || []).sort(
    (a: Category, b: Category) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) || null;
}

export async function saveCategory(category: Partial<Category>): Promise<Category> {
  const store = readLocalStore();
  store.categories = store.categories || [];

  // Match by id OR by slug so we never create duplicate categories when editing
  const existingIndex = store.categories.findIndex(
    (c: Category) =>
      (category.id && c.id === category.id) ||
      (category.slug && c.slug === category.slug)
  );

  const existing = existingIndex >= 0 ? store.categories[existingIndex] : null;
  const id = existing?.id || category.id || `cat-${Date.now()}`;

  const newCat: Category = {
    id,
    name: category.name || existing?.name || 'Untitled Category',
    slug: category.slug || existing?.slug || `cat-${Date.now()}`,
    parent_id: category.parent_id !== undefined ? category.parent_id : (existing?.parent_id ?? null),
    description: category.description !== undefined ? category.description : (existing?.description || ''),
    image_url: category.image_url !== undefined ? category.image_url : (existing?.image_url || ''),
    image_public_id:
      category.image_public_id !== undefined
        ? category.image_public_id
        : (existing?.image_public_id || ''),
    sort_order: category.sort_order ?? existing?.sort_order ?? store.categories.length + 1,
    is_published: category.is_published ?? existing?.is_published ?? true,
  };

  if (existingIndex >= 0) {
    store.categories[existingIndex] = newCat;
  } else {
    store.categories.push(newCat);
  }

  // If the user updated "shoes" photo, also sync "footwear" homepage card if footwear still has default image
  if (newCat.slug === 'shoes' && newCat.image_url) {
    const fwIdx = store.categories.findIndex((c: Category) => c.slug === 'footwear');
    if (fwIdx >= 0) {
      store.categories[fwIdx].image_url = newCat.image_url;
      store.categories[fwIdx].image_public_id = newCat.image_public_id;
    }
  }

  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('categories').upsert(newCat);
    } catch (e) {
      // Ignore if RLS blocks anonymous upsert
    }
  }

  return newCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.categories = (store.categories || []).filter((c: Category) => c.id !== id);
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

// ----------------------------------------------------
// PRODUCTS (Local Store is Primary Source of Truth)
// ----------------------------------------------------
export async function getProducts(options?: {
  categorySlug?: string;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  search?: string;
  sort?: string;
}): Promise<Product[]> {
  const store = readLocalStore();
  let list: Product[] = (store.products || []).filter((p: Product) => p.is_published);

  if (options?.categorySlug && options.categorySlug !== 'all') {
    const slug = options.categorySlug;
    list = list.filter((p) => {
      if (p.category_slug === slug || p.category_id === slug) return true;
      if (slug === 'men' && p.category_slug?.startsWith('men')) return true;
      if (slug === 'footwear' && (p.category_slug === 'shoes' || p.category_slug === 'sandals'))
        return true;
      if (
        slug === 'accessories' &&
        ['caps', 'rings', 'bracelet', 'chain'].includes(p.category_slug || '')
      )
        return true;
      return false;
    });
  }

  if (options?.isBestseller) {
    list = list.filter((p) => p.is_bestseller);
  }

  if (options?.isFeatured) {
    list = list.filter((p) => p.is_featured);
  }

  if (options?.isNewArrival) {
    list = list.filter((p) => p.is_new_arrival);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }

  if (options?.sort) {
    if (options.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (options.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (options.sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  return list;
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const store = readLocalStore();
  return store.products || [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const store = readLocalStore();
  const product = (store.products || []).find((p: Product) => p.slug === slug || p.id === slug);
  return product || null;
}

export async function saveProduct(product: Partial<Product>): Promise<Product> {
  const store = readLocalStore();
  store.products = store.products || [];
  const id = product.id || `prod-${Date.now()}`;
  const now = new Date().toISOString();

  const newProd: Product = {
    id,
    name: product.name || 'Untitled Product',
    slug: product.slug || `prod-${Date.now()}`,
    description: product.description || '',
    category_id: product.category_id || '',
    category_slug: product.category_slug || '',
    category_name: product.category_name || '',
    sku: product.sku || `NOT-${Date.now().toString().slice(-4)}`,
    price: Number(product.price) || 0,
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
    is_bestseller: !!product.is_bestseller,
    is_featured: !!product.is_featured,
    is_new_arrival: !!product.is_new_arrival,
    is_published: product.is_published ?? true,
    rating_score: product.rating_score || 4.8,
    rating_count: product.rating_count || 0,
    images: product.images || [],
    variants: product.variants || [],
    material: product.material || '',
    care_instructions: product.care_instructions || '',
    created_at: product.created_at || now,
  };

  const existingIndex = store.products.findIndex((p: Product) => p.id === id);
  if (existingIndex >= 0) {
    store.products[existingIndex] = { ...store.products[existingIndex], ...newProd };
  } else {
    store.products.push(newProd);
  }
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('products').upsert(newProd);
    } catch (e) {}
  }

  return newProd;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.products = (store.products || []).filter((p: Product) => p.id !== id);
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

// ----------------------------------------------------
// BANNERS
// ----------------------------------------------------
export async function getBanners(): Promise<Banner[]> {
  const store = readLocalStore();
  return (store.banners || []).filter((b: Banner) => b.is_published);
}

export async function getAllBannersAdmin(): Promise<Banner[]> {
  const store = readLocalStore();
  return store.banners || [];
}

export async function saveBanner(banner: Partial<Banner>): Promise<Banner> {
  const store = readLocalStore();
  store.banners = store.banners || [];
  const id = banner.id || `ban-${Date.now()}`;
  const newBanner: Banner = {
    id,
    section: banner.section || 'hero',
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    description: banner.description || '',
    cta_label: banner.cta_label || 'Shop Now',
    cta_url: banner.cta_url || '/',
    image_url: banner.image_url || '',
    image_public_id: banner.image_public_id || '',
    badge_text: banner.badge_text || '',
    sort_order: banner.sort_order ?? 1,
    is_published: banner.is_published ?? true,
  };

  const existingIndex = store.banners.findIndex(
    (b: Banner) => b.id === id || (banner.section && b.section === banner.section)
  );
  if (existingIndex >= 0) {
    store.banners[existingIndex] = { ...store.banners[existingIndex], ...newBanner };
  } else {
    store.banners.push(newBanner);
  }
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('banners').upsert(newBanner);
    } catch (e) {}
  }

  return newBanner;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.banners = (store.banners || []).filter((b: Banner) => b.id !== id);
  writeLocalStore(store);
  if (supabase) {
    try {
      await supabase.from('banners').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

// ----------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  const store = readLocalStore();
  return store.settings || {};
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const store = readLocalStore();
  store.settings = { ...store.settings, ...settings };
  writeLocalStore(store);
  return store.settings;
}

// ----------------------------------------------------
// ORDERS
// ----------------------------------------------------
export async function getOrdersAdmin(): Promise<Order[]> {
  const store = readLocalStore();
  return store.orders || [];
}

export async function deleteOrder(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.orders = (store.orders || []).filter((o: Order) => o.id !== id);
  writeLocalStore(store);
  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

export async function saveOrder(order: Partial<Order>): Promise<Order> {
  const store = readLocalStore();
  const id = order.id || `ord-${Date.now()}`;
  const orderNumber = order.order_number || `NOT-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id,
    order_number: orderNumber,
    customer_name: order.customer_name || 'Guest Customer',
    customer_email: order.customer_email || '',
    customer_phone: order.customer_phone || '',
    shipping_address: order.shipping_address || {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
    },
    subtotal: order.subtotal || 0,
    shipping_amount: order.shipping_amount || 0,
    discount_amount: order.discount_amount || 0,
    total_amount: order.total_amount || 0,
    currency: order.currency || 'INR',
    status: order.status || 'pending',
    payment_status: order.payment_status || 'pending',
    tracking_carrier: order.tracking_carrier || '',
    tracking_number: order.tracking_number || '',
    notes: order.notes || '',
    created_at: order.created_at || now,
    items: order.items || [],
    razorpay_order_id: order.razorpay_order_id || '',
    razorpay_payment_id: order.razorpay_payment_id || '',
  };

  store.orders = store.orders || [];
  const existingIdx = store.orders.findIndex((o: Order) => o.id === id);
  if (existingIdx >= 0) {
    store.orders[existingIdx] = { ...store.orders[existingIdx], ...newOrder };
  } else {
    store.orders.unshift(newOrder);
    // Automatically decrement stock for new confirmed/paid orders
    if (Array.isArray(newOrder.items) && newOrder.items.length > 0) {
      for (const item of newOrder.items) {
        const prod: Product | undefined = (store.products || []).find(
          (p: Product) => p.id === item.product_id || p.name === item.product_name
        );
        if (prod && Array.isArray(prod.variants)) {
          const variant = prod.variants.find(
            (v: ProductVariant) => v.size.toLowerCase() === (item.variant_label || '').toLowerCase()
          );
          if (variant) {
            variant.inventory_quantity = Math.max(
              0,
              (Number(variant.inventory_quantity) || 0) - (Number(item.quantity) || 1)
            );
            variant.is_available = variant.inventory_quantity > 0;
          }
        }
      }
    }
  }
  writeLocalStore(store);
  return newOrder;
}
