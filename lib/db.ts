import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  Brand,
  Category,
  CategorySize,
  Product,
  ProductVariant,
  ProductColor,
  ProductColorVariant,
  Banner,
  SiteSettings,
  BrandShowcase,
  Order,
  ProductSpecification,
  StockReservation,
  StockReservationItem,
  Customer,
  CustomerAddress,
  PasswordResetOtp,
} from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const storeFilePath = path.join(process.cwd(), 'data', 'store.json');

// ====================================================
// CONCURRENCY MUTEX FOR ATOMIC INVENTORY & RESERVATIONS
// ====================================================
class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  acquire<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentQueue = this.queue;
    this.queue = currentQueue.then(() => waitPromise, () => waitPromise);
    return currentQueue.then(async () => {
      try {
        return await fn();
      } finally {
        release!();
      }
    });
  }
}

export const inventoryMutex = new AsyncLock();

export const defaultBrandShowcase: BrandShowcase = {
  id: 'brand-showcase-tanay',
  is_enabled: true,
  section_label: 'OUR OWN BRAND',
  heading: 'A Signature of Our Own',
  description: 'Premium everyday wear crafted for modern men. Timeless style, trusted quality.',
  brand_logo_url: '',
  brand_logo_public_id: '',
  background_image_url: '/tanay-showcase-bg.jpg',
  background_image_public_id: '',
  button_text: 'Explore TANAY',
  brand_id: 'brand-1793611745732',
  brand_slug: 'tanay',
  category_id: '',
  category_slug: '',
};

function readLocalStore() {
  try {
    if (fs.existsSync(storeFilePath)) {
      const content = fs.readFileSync(storeFilePath, 'utf8');
      const parsed = JSON.parse(content);
      return {
        categories: parsed.categories || [],
        sizes: parsed.sizes || [],
        products: parsed.products || [],
        brands: parsed.brands || [],
        banners: parsed.banners || [],
        colors: parsed.colors || [],
        settings: parsed.settings || {},
        brand_showcase: parsed.brand_showcase || defaultBrandShowcase,
        orders: parsed.orders || [],
        stock_reservations: parsed.stock_reservations || [],
        customers: parsed.customers || [],
        customer_addresses: parsed.customer_addresses || [],
        password_reset_otps: parsed.password_reset_otps || [],
      };
    }
  } catch (err) {
    console.error('Error reading local store:', err);
  }
  return {
    categories: [],
    sizes: [],
    products: [],
    brands: [],
    banners: [],
    colors: [],
    settings: {},
    brand_showcase: defaultBrandShowcase,
    orders: [],
    stock_reservations: [],
    customers: [],
    customer_addresses: [],
    password_reset_otps: [],
  };
}

function writeLocalStore(data: any) {
  try {
    const tmpPath = `${storeFilePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, storeFilePath);
  } catch (err) {
    try {
      fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing local store:', e);
    }
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
    parent_id: category.parent_id ? category.parent_id : null,
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
// PRODUCT SIZES (Category-Specific Size Management)
// ----------------------------------------------------
export async function getSizes(categoryId?: string): Promise<CategorySize[]> {
  const store = readLocalStore();
  let list = (store.sizes || []).filter((s: CategorySize) => s.is_active !== false);
  if (categoryId) {
    list = list.filter((s: CategorySize) => s.category_id === categoryId);
  }
  return list.sort((a: CategorySize, b: CategorySize) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

export async function getAllSizesAdmin(categoryId?: string): Promise<CategorySize[]> {
  const store = readLocalStore();
  let list = store.sizes || [];
  if (categoryId) {
    list = list.filter((s: CategorySize) => s.category_id === categoryId);
  }
  return list.sort((a: CategorySize, b: CategorySize) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

export async function saveSize(size: Partial<CategorySize>): Promise<CategorySize> {
  const store = readLocalStore();
  store.sizes = store.sizes || [];
  const id = size.id || `sz-${Date.now()}`;

  let categoryName = size.category_name;
  if (!categoryName && size.category_id) {
    const cat = (store.categories || []).find((c: Category) => c.id === size.category_id);
    if (cat) categoryName = cat.name;
  }

  const newSize: CategorySize = {
    id,
    category_id: size.category_id || '',
    category_name: categoryName || '',
    name: size.name ? size.name.trim() : 'Standard',
    sort_order: size.sort_order ?? store.sizes.length + 1,
    is_active: size.is_active ?? true,
    created_at: size.created_at || new Date().toISOString(),
  };

  const existingIdx = store.sizes.findIndex((s: CategorySize) => s.id === id);
  if (existingIdx >= 0) {
    store.sizes[existingIdx] = { ...store.sizes[existingIdx], ...newSize };
  } else {
    store.sizes.push(newSize);
  }
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('category_sizes').upsert(newSize);
    } catch (e) {}
  }

  return newSize;
}

export async function deleteSize(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.sizes = (store.sizes || []).filter((s: CategorySize) => s.id !== id);
  writeLocalStore(store);
  if (supabase) {
    try {
      await supabase.from('category_sizes').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

// ----------------------------------------------------
// PRODUCT COLORS (Dedicated Color Management)
// ----------------------------------------------------
export async function getColors(): Promise<ProductColor[]> {
  const store = readLocalStore();
  return (store.colors || []).filter((c: ProductColor) => c.is_active !== false);
}

export async function getAllColorsAdmin(): Promise<ProductColor[]> {
  const store = readLocalStore();
  return store.colors || [];
}

export async function saveColor(color: Partial<ProductColor>): Promise<ProductColor> {
  const store = readLocalStore();
  store.colors = store.colors || [];
  const id = color.id || `col-${Date.now()}`;
  const newColor: ProductColor = {
    id,
    name: color.name ? color.name.trim() : 'Untitled Color',
    hex: color.hex ? color.hex.trim() : '#000000',
    is_active: color.is_active ?? true,
    created_at: color.created_at || new Date().toISOString(),
  };

  const existingIdx = store.colors.findIndex((c: ProductColor) => c.id === id);
  if (existingIdx >= 0) {
    store.colors[existingIdx] = { ...store.colors[existingIdx], ...newColor };
  } else {
    store.colors.push(newColor);
  }
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('colors').upsert(newColor);
    } catch (e) {}
  }

  return newColor;
}

export async function deleteColor(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.colors = (store.colors || []).filter((c: ProductColor) => c.id !== id);
  writeLocalStore(store);
  if (supabase) {
    try {
      await supabase.from('colors').delete().eq('id', id);
    } catch (e) {}
  }
  return true;
}

export function normalizeProduct(p: Product): Product {
  if (!p) return p;
  const normalized: Product = { ...p };
  if ((!normalized.images || normalized.images.length === 0) && normalized.colors && normalized.colors.length > 0) {
    const colorWithImg = normalized.colors.find((c) => (c.images && c.images.length > 0) || c.image_url);
    if (colorWithImg) {
      if (colorWithImg.images && colorWithImg.images.length > 0) {
        normalized.images = colorWithImg.images.map((img, idx) => ({
          id: img.id || `img-${normalized.id || 'p'}-${idx}`,
          product_id: normalized.id || '',
          image_url: img.url,
          image_public_id: img.public_id || '',
          alt_text: normalized.name || 'Product Image',
          sort_order: idx + 1,
          is_primary: idx === 0,
        }));
      } else if (colorWithImg.image_url) {
        normalized.images = [{
          id: `img-${normalized.id || 'p'}-0`,
          product_id: normalized.id || '',
          image_url: colorWithImg.image_url,
          image_public_id: colorWithImg.image_public_id || '',
          alt_text: normalized.name || 'Product Image',
          sort_order: 1,
          is_primary: true,
        }];
      }
    }
  }

  // Specifications normalization & sorting
  if (Array.isArray(normalized.specifications)) {
    normalized.specifications = normalized.specifications
      .filter((s) => s && s.key && s.key.trim() !== '' && s.value !== undefined && s.value !== null && s.value.toString().trim() !== '')
      .map((s, idx) => ({
        id: s.id || `spec-${normalized.id || 'p'}-${idx}`,
        key: s.key.trim(),
        value: s.value.toString().trim(),
        sort_order: s.sort_order !== undefined ? Number(s.sort_order) : (idx + 1),
      }))
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  } else {
    normalized.specifications = [];
  }

  normalized.brand_id = normalized.brand_id || null;
  normalized.brand_name = normalized.brand_name || null;
  normalized.brand_slug = normalized.brand_slug || null;

  return normalized;
}

// ====================================================
// STOCK RESERVATION & INVENTORY LOCKING HELPERS
// ====================================================

export function cleanupExpiredReservationsInternal(store: any): boolean {
  const now = Date.now();
  let changed = false;
  if (Array.isArray(store.stock_reservations)) {
    for (const resv of store.stock_reservations) {
      if (resv.status === 'active' && new Date(resv.expires_at).getTime() <= now) {
        resv.status = 'expired';
        resv.updated_at = new Date().toISOString();
        changed = true;
      }
    }
  }
  return changed;
}

export interface StockTarget {
  product_id: string;
  selected_color?: string;
  selected_color_id?: string;
  variant_label?: string;
  selected_size_id?: string;
}

export function getActiveReservedQuantityInternal(
  store: any,
  target: StockTarget,
  excludeReservationToken?: string
): number {
  const now = Date.now();
  if (!Array.isArray(store.stock_reservations)) return 0;

  let totalReserved = 0;
  for (const resv of store.stock_reservations) {
    if (resv.status !== 'active') continue;
    if (new Date(resv.expires_at).getTime() <= now) continue;
    if (excludeReservationToken && resv.reservation_token === excludeReservationToken) continue;

    if (!Array.isArray(resv.items)) continue;

    for (const item of resv.items) {
      if (item.product_id !== target.product_id) continue;

      const hasTargetColor = Boolean(target.selected_color || target.selected_color_id);
      const hasItemColor = Boolean(item.selected_color || item.selected_color_id);

      if (hasTargetColor || hasItemColor) {
        const colorMatches =
          (target.selected_color_id && item.selected_color_id && target.selected_color_id === item.selected_color_id) ||
          (target.selected_color && item.selected_color && target.selected_color.trim().toLowerCase() === item.selected_color.trim().toLowerCase());

        if (!colorMatches) continue;

        const hasTargetSize = Boolean(target.variant_label || target.selected_size_id);
        const hasItemSize = Boolean(item.variant_label || item.selected_size_id);
        if (hasTargetSize || hasItemSize) {
          const sizeMatches =
            (target.selected_size_id && item.selected_size_id && target.selected_size_id === item.selected_size_id) ||
            (target.variant_label && item.variant_label && target.variant_label.trim().toLowerCase() === item.variant_label.trim().toLowerCase());

          if (!sizeMatches) continue;
        }
      } else {
        const hasTargetSize = Boolean(target.variant_label);
        const hasItemSize = Boolean(item.variant_label);
        if (hasTargetSize && hasItemSize && target.variant_label?.trim().toLowerCase() !== item.variant_label?.trim().toLowerCase()) {
          continue;
        }
      }

      totalReserved += Number(item.quantity) || 0;
    }
  }

  return totalReserved;
}

export function getPhysicalStockInternal(prod: Product, target: StockTarget): number {
  if (!prod) return 0;

  // 1. Color Variant product
  if ((target.selected_color || target.selected_color_id) && Array.isArray(prod.colors) && prod.colors.length > 0) {
    const colVariant = prod.colors.find(
      (c) =>
        (target.selected_color_id && c.color_id === target.selected_color_id) ||
        (target.selected_color && c.name.trim().toLowerCase() === target.selected_color.trim().toLowerCase()) ||
        c.color_id === target.selected_color
    );
    if (!colVariant) return 0;

    // Color + Size
    if (Array.isArray(colVariant.sizes) && colVariant.sizes.length > 0) {
      const sz = colVariant.sizes.find(
        (s) =>
          (target.selected_size_id && s.size_id === target.selected_size_id) ||
          (target.variant_label && s.size.trim().toLowerCase() === target.variant_label.trim().toLowerCase())
      );
      return sz ? Math.max(0, Number(sz.stock) || 0) : 0;
    }

    return Math.max(0, Number(colVariant.stock) || 0);
  }

  // 2. Normal Product with size variants
  if (target.variant_label && Array.isArray(prod.variants) && prod.variants.length > 0) {
    const variant = prod.variants.find(
      (v) => v.size.trim().toLowerCase() === target.variant_label!.trim().toLowerCase()
    );
    if (variant) {
      return Math.max(0, Number(variant.inventory_quantity) || 0);
    }
  }

  // 3. Normal Product shared stock
  return Math.max(0, Number(prod.stock) || 0);
}

export function applyReservationsToProduct(p: Product, store: any, excludeToken?: string): Product {
  if (!p) return p;
  const clone: Product = JSON.parse(JSON.stringify(p));

  if (Array.isArray(clone.colors) && clone.colors.length > 0) {
    let totalAvailStock = 0;
    clone.colors.forEach((c) => {
      if (Array.isArray(c.sizes) && c.sizes.length > 0) {
        let colorSum = 0;
        c.sizes.forEach((sz) => {
          const reserved = getActiveReservedQuantityInternal(store, {
            product_id: clone.id,
            selected_color: c.name,
            selected_color_id: c.color_id,
            variant_label: sz.size,
            selected_size_id: sz.size_id,
          }, excludeToken);
          const rawStock = Number(sz.stock) || 0;
          sz.stock = Math.max(0, rawStock - reserved);
          colorSum += sz.stock;
        });
        c.stock = colorSum;
      } else {
        const reserved = getActiveReservedQuantityInternal(store, {
          product_id: clone.id,
          selected_color: c.name,
          selected_color_id: c.color_id,
        }, excludeToken);
        const rawStock = Number(c.stock) || 0;
        c.stock = Math.max(0, rawStock - reserved);
      }
      totalAvailStock += c.stock;
    });
    if (clone.stock !== undefined) {
      clone.stock = totalAvailStock;
    }
  } else {
    const reserved = getActiveReservedQuantityInternal(store, { product_id: clone.id }, excludeToken);
    const rawStock = Number(clone.stock) || 0;
    clone.stock = Math.max(0, rawStock - reserved);

    if (Array.isArray(clone.variants) && clone.variants.length > 0) {
      clone.variants.forEach((v) => {
        const vReserved = getActiveReservedQuantityInternal(store, {
          product_id: clone.id,
          variant_label: v.size,
        }, excludeToken);
        const vRaw = Number(v.inventory_quantity) || 0;
        v.inventory_quantity = Math.max(0, vRaw - vReserved);
        v.is_available = v.inventory_quantity > 0;
      });
    }
  }

  return clone;
}

// ----------------------------------------------------
// PRODUCTS (Local Store is Primary Source of Truth)
// ----------------------------------------------------
export async function getProducts(options?: {
  categorySlug?: string;
  subcategoryId?: string;
  subcategorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  search?: string;
  sort?: string;
  excludeReservationToken?: string;
}): Promise<Product[]> {
  const store = readLocalStore();
  cleanupExpiredReservationsInternal(store);
  let list: Product[] = (store.products || [])
    .map((p: Product) => applyReservationsToProduct(normalizeProduct(p), store, options?.excludeReservationToken))
    .filter((p: Product) => p.is_published);

  if (options?.brandId) {
    list = list.filter((p) => p.brand_id === options.brandId);
  }

  if (options?.brandSlug) {
    const bSlug = options.brandSlug.toLowerCase();
    list = list.filter(
      (p) =>
        (p.brand_slug && p.brand_slug.toLowerCase() === bSlug) ||
        p.brand_id === options.brandSlug
    );
  }

  if (options?.categorySlug && options.categorySlug !== 'all') {
    const slug = options.categorySlug;
    list = list.filter((p) => {
      if (p.category_slug === slug || p.category_id === slug) return true;
      if (p.subcategory_slug === slug || p.subcategory_id === slug) return true;
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

  if (options?.subcategoryId) {
    list = list.filter((p) => p.subcategory_id === options.subcategoryId);
  }

  if (options?.subcategorySlug) {
    list = list.filter((p) => p.subcategory_slug === options.subcategorySlug);
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
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.subcategory_name && p.subcategory_name.toLowerCase().includes(q))
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

export async function getPaginatedProducts(options?: {
  page?: number;
  limit?: number;
  offset?: number;
  categorySlug?: string;
  subcategoryId?: string;
  subcategorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  search?: string;
  sort?: string;
}): Promise<{ products: Product[]; total: number; hasMore: boolean; page: number; limit: number }> {
  const all = await getProducts(options);
  const total = all.length;

  const limit = options?.limit && options.limit > 0 ? options.limit : 15;
  let offset = 0;
  if (options?.offset !== undefined) {
    offset = options.offset;
  } else if (options?.page && options.page > 0) {
    offset = (options.page - 1) * limit;
  }

  const page = Math.floor(offset / limit) + 1;
  const paginated = all.slice(offset, offset + limit);
  const hasMore = offset + paginated.length < total;

  return {
    products: paginated,
    total,
    hasMore,
    page,
    limit,
  };
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const store = readLocalStore();
  return (store.products || []).map(normalizeProduct);
}

export async function getProductBySlug(slug: string, excludeReservationToken?: string): Promise<Product | null> {
  const store = readLocalStore();
  cleanupExpiredReservationsInternal(store);
  const product = (store.products || []).find((p: Product) => p.slug === slug || p.id === slug);
  return product ? applyReservationsToProduct(normalizeProduct(product), store, excludeReservationToken) : null;
}

export async function saveProduct(product: Partial<Product>): Promise<Product> {
  const store = readLocalStore();
  store.products = store.products || [];
  const id = product.id || `prod-${Date.now()}`;
  const now = new Date().toISOString();

  let productImages = product.images || [];
  if (productImages.length === 0 && product.colors && product.colors.length > 0) {
    const colorWithImg = product.colors.find((c) => (c.images && c.images.length > 0) || c.image_url);
    if (colorWithImg) {
      if (colorWithImg.images && colorWithImg.images.length > 0) {
        productImages = colorWithImg.images.map((img, idx) => ({
          id: img.id || `img-${id}-${idx}`,
          product_id: id,
          image_url: img.url,
          image_public_id: img.public_id || '',
          alt_text: product.name || 'Product Image',
          sort_order: idx + 1,
          is_primary: idx === 0,
        }));
      } else if (colorWithImg.image_url) {
        productImages = [{
          id: `img-${id}-0`,
          product_id: id,
          image_url: colorWithImg.image_url,
          image_public_id: colorWithImg.image_public_id || '',
          alt_text: product.name || 'Product Image',
          sort_order: 1,
          is_primary: true,
        }];
      }
    }
  }

  const newProd: Product = {
    id,
    name: product.name || 'Untitled Product',
    slug: product.slug || `prod-${Date.now()}`,
    description: product.description || '',
    category_id: product.category_id || '',
    category_slug: product.category_slug || '',
    category_name: product.category_name || '',
    subcategory_id: product.subcategory_id || '',
    subcategory_slug: product.subcategory_slug || '',
    subcategory_name: product.subcategory_name || '',
    brand_id: product.brand_id || null,
    brand_name: (() => {
      if (product.brand_name) return product.brand_name;
      if (product.brand_id) {
        const b = (store.brands || []).find((brand: Brand) => brand.id === product.brand_id);
        return b?.name || null;
      }
      return null;
    })(),
    brand_slug: (() => {
      if (product.brand_slug) return product.brand_slug;
      if (product.brand_id) {
        const b = (store.brands || []).find((brand: Brand) => brand.id === product.brand_id);
        return b?.slug || null;
      }
      return null;
    })(),
    sku: product.sku || `NOT-${Date.now().toString().slice(-4)}`,
    price: Number(product.price) || 0,
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
    is_bestseller: !!product.is_bestseller,
    is_featured: !!product.is_featured,
    is_new_arrival: !!product.is_new_arrival,
    is_published: product.is_published ?? true,
    rating_score: product.rating_score || 4.8,
    rating_count: product.rating_count || 0,
    images: productImages,
    variants: product.variants || [],
    colors: product.colors || [],
    product_mode: product.product_mode || (product.colors && product.colors.length > 0 ? 'variant' : 'normal'),
    stock: product.stock !== undefined ? Number(product.stock) : (product.variants?.reduce((s, v) => s + (v.inventory_quantity || 0), 0) ?? 25),
    sizes: product.sizes || [],
    material: product.material || '',
    care_instructions: product.care_instructions || '',
    specifications: (() => {
      if (!Array.isArray(product.specifications)) return [];
      const seenKeys = new Set<string>();
      const valid: ProductSpecification[] = [];

      product.specifications.forEach((s, idx) => {
        if (!s || !s.key || !s.key.trim()) return;
        const trimmedKey = s.key.trim();
        const keyLower = trimmedKey.toLowerCase();
        if (seenKeys.has(keyLower)) return; // Prevent duplicate keys for the same product
        const val = s.value !== undefined && s.value !== null ? s.value.toString().trim() : '';
        if (!val) return; // Skip empty values
        seenKeys.add(keyLower);

        valid.push({
          id: s.id || `spec-${id}-${idx}-${Date.now()}`,
          key: trimmedKey,
          value: val,
          sort_order: s.sort_order !== undefined ? Number(s.sort_order) : (idx + 1),
        });
      });
      return valid.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    })(),
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
// BANNERS (Multiple Hero & Promotional Banners)
// ----------------------------------------------------
export async function getBanners(): Promise<Banner[]> {
  const store = readLocalStore();
  return (store.banners || [])
    .filter((b: Banner) => b.is_published)
    .sort((a: Banner, b: Banner) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

export async function getAllBannersAdmin(): Promise<Banner[]> {
  const store = readLocalStore();
  return (store.banners || []).sort(
    (a: Banner, b: Banner) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
  );
}

export async function saveBanner(banner: Partial<Banner>): Promise<Banner> {
  const store = readLocalStore();
  store.banners = store.banners || [];
  const id = banner.id || `ban-${Date.now()}`;

  let ctaUrl = banner.cta_url || '/';
  if (banner.destination_type === 'category' && banner.destination_id) {
    const cat = (store.categories || []).find((c: Category) => c.id === banner.destination_id);
    if (cat) ctaUrl = `/category/${cat.slug}`;
  } else if (banner.destination_type === 'product' && banner.destination_id) {
    const prod = (store.products || []).find((p: Product) => p.id === banner.destination_id);
    if (prod) ctaUrl = `/product/${prod.slug}`;
  }

  const newBanner: Banner = {
    id,
    section: banner.section || 'hero',
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    description: banner.description || '',
    cta_label: banner.cta_label || 'Shop Now',
    cta_url: ctaUrl,
    destination_type: banner.destination_type || 'custom',
    destination_id: banner.destination_id || null,
    image_url: banner.image_url || '',
    image_public_id: banner.image_public_id || '',
    badge_text: banner.badge_text || '',
    sort_order: banner.sort_order ?? store.banners.length + 1,
    is_published: banner.is_published ?? true,
  };

  // Match only by ID so multiple banners can be saved in any section
  const existingIndex = store.banners.findIndex((b: Banner) => b.id === id);
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
// BRAND SHOWCASE SECTION (TANAY by notions)
// ----------------------------------------------------
export async function getBrandShowcase(): Promise<BrandShowcase> {
  const store = readLocalStore();
  let showcase: BrandShowcase = store.brand_showcase || defaultBrandShowcase;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('brand_showcase')
        .select('*')
        .eq('id', showcase.id || 'brand-showcase-tanay')
        .maybeSingle();

      if (!error && data) {
        showcase = { ...showcase, ...data };
      }
    } catch (e) {
      // Safe fallback to store.json
    }
  }

  return showcase;
}

export async function updateBrandShowcase(data: Partial<BrandShowcase>): Promise<BrandShowcase> {
  const store = readLocalStore();
  const current = store.brand_showcase || defaultBrandShowcase;

  let resolvedSlug = data.category_slug;
  if (data.category_id && !resolvedSlug) {
    const cats = store.categories || [];
    const matched = cats.find((c: Category) => c.id === data.category_id);
    if (matched) {
      resolvedSlug = matched.slug;
    }
  }

  let resolvedBrandSlug = data.brand_slug;
  if (data.brand_id && !resolvedBrandSlug) {
    const brands = store.brands || [];
    const matchedBrand = brands.find((b: Brand) => b.id === data.brand_id);
    if (matchedBrand) {
      resolvedBrandSlug = matchedBrand.slug;
    }
  }

  const updated: BrandShowcase = {
    ...current,
    ...data,
    id: current.id || 'brand-showcase-tanay',
    category_slug: resolvedSlug !== undefined ? resolvedSlug : current.category_slug,
    brand_id: data.brand_id !== undefined ? data.brand_id : current.brand_id,
    brand_slug: resolvedBrandSlug !== undefined ? resolvedBrandSlug : current.brand_slug,
    updated_at: new Date().toISOString(),
  };

  store.brand_showcase = updated;
  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('brand_showcase').upsert(updated);
    } catch (e) {
      console.error('Supabase brand_showcase upsert non-blocking error:', e);
    }
  }

  return updated;
}

// ----------------------------------------------------
// BRANDS (Local Store is Primary Source of Truth)
// ----------------------------------------------------
export async function getBrands(): Promise<Brand[]> {
  const store = readLocalStore();
  let brands: Brand[] = (store.brands || [])
    .filter((b: Brand) => b.is_active !== false)
    .sort((a: Brand, b: Brand) => (a.sort_order ?? 99) - (b.sort_order ?? 99));

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map(brands.map((b) => [b.id, b]));
        data.forEach((sb) => map.set(sb.id, sb));
        brands = Array.from(map.values()).sort(
          (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
        );
      }
    } catch (e) {}
  }
  return brands;
}

export async function getAllBrandsAdmin(): Promise<Brand[]> {
  const store = readLocalStore();
  let brands: Brand[] = (store.brands || []).sort(
    (a: Brand, b: Brand) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
  );

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map(brands.map((b) => [b.id, b]));
        data.forEach((sb) => map.set(sb.id, sb));
        brands = Array.from(map.values()).sort(
          (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
        );
      }
    } catch (e) {}
  }
  return brands;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const store = readLocalStore();
  let brand = (store.brands || []).find(
    (b: Brand) => b.slug.toLowerCase() === slug.toLowerCase() || b.id === slug
  );

  if (!brand && supabase) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (!error && data) {
        brand = data;
      }
    } catch (e) {}
  }
  return brand || null;
}

export async function saveBrand(brand: Partial<Brand>): Promise<Brand> {
  const store = readLocalStore();
  store.brands = store.brands || [];
  const id = brand.id || `brand-${Date.now()}`;
  const now = new Date().toISOString();
  const slug = (brand.slug || brand.name || id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newBrand: Brand = {
    id,
    name: (brand.name || 'Untitled Brand').trim(),
    slug,
    description: brand.description || '',
    logo_url: brand.logo_url || '',
    logo_public_id: brand.logo_public_id || '',
    banner_url: brand.banner_url || '',
    banner_public_id: brand.banner_public_id || '',
    website_url: brand.website_url || '',
    is_active: brand.is_active !== false,
    sort_order: brand.sort_order !== undefined ? Number(brand.sort_order) : store.brands.length + 1,
    created_at: brand.created_at || now,
    updated_at: now,
  };

  const existingIdx = store.brands.findIndex((b: Brand) => b.id === id);
  if (existingIdx >= 0) {
    store.brands[existingIdx] = { ...store.brands[existingIdx], ...newBrand };
  } else {
    store.brands.push(newBrand);
  }

  // Sync cached brand info across products belonging to this brand
  if (Array.isArray(store.products)) {
    store.products.forEach((p: Product) => {
      if (p.brand_id === id) {
        p.brand_name = newBrand.name;
        p.brand_slug = newBrand.slug;
      }
    });
  }

  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('brands').upsert(newBrand);
    } catch (e) {
      console.error('Supabase saveBrand non-blocking sync error:', e);
    }
  }

  return newBrand;
}

export async function deleteBrand(id: string): Promise<boolean> {
  const store = readLocalStore();
  store.brands = (store.brands || []).filter((b: Brand) => b.id !== id);

  // Unlink brand from products without deleting the products
  if (Array.isArray(store.products)) {
    store.products.forEach((p: Product) => {
      if (p.brand_id === id) {
        p.brand_id = null;
        p.brand_name = null;
        p.brand_slug = null;
      }
    });
  }

  writeLocalStore(store);

  if (supabase) {
    try {
      await supabase.from('brands').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase deleteBrand non-blocking sync error:', e);
    }
  }

  return true;
}

// ----------------------------------------------------
// ORDERS
// ----------------------------------------------------
export async function getOrdersAdmin(): Promise<Order[]> {
  const store = readLocalStore();
  let orders: Order[] = store.orders || [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const existingNumbers = new Set(orders.map((o) => o.order_number));
        for (const sbOrder of data) {
          if (!existingNumbers.has(sbOrder.order_number)) {
            orders.push({
              ...sbOrder,
              items: sbOrder.items || [],
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to query orders from Supabase:', e);
    }
  }

  return orders;
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

// Helper to deduct physical stock for items
function deductPhysicalStockInternal(store: any, items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    const prod: Product | undefined = (store.products || []).find(
      (p: Product) => p.id === item.product_id || p.name === item.product_name
    );
    if (!prod) continue;

    const qty = Number(item.quantity) || 1;

    // 1. Decrement normal product variants
    if (Array.isArray(prod.variants)) {
      const variant = prod.variants.find(
        (v: ProductVariant) => v.size.trim().toLowerCase() === (item.variant_label || '').trim().toLowerCase()
      );
      if (variant) {
        variant.inventory_quantity = Math.max(0, (Number(variant.inventory_quantity) || 0) - qty);
        variant.is_available = variant.inventory_quantity > 0;
      }
    }

    // 2. Decrement normal product common stock
    if (!item.selected_color && prod.stock !== undefined) {
      prod.stock = Math.max(0, (Number(prod.stock) || 0) - qty);
    }

    // 3. Decrement color variant & size stock
    if (item.selected_color && Array.isArray(prod.colors)) {
      const colorVariant = prod.colors.find(
        (c: ProductColorVariant) =>
          (item.selected_color_id && c.color_id === item.selected_color_id) ||
          c.name.trim().toLowerCase() === (item.selected_color || '').trim().toLowerCase() ||
          c.color_id === item.selected_color
      );
      if (colorVariant) {
        if (Array.isArray(colorVariant.sizes) && colorVariant.sizes.length > 0) {
          const sz = colorVariant.sizes.find(
            (s) =>
              (item.selected_size_id && s.size_id === item.selected_size_id) ||
              s.size.trim().toLowerCase() === (item.variant_label || '').trim().toLowerCase()
          );
          if (sz) {
            sz.stock = Math.max(0, (Number(sz.stock) || 0) - qty);
          }
          colorVariant.stock = colorVariant.sizes.reduce(
            (sum, s) => sum + (Number(s.stock) || 0),
            0
          );
        } else {
          colorVariant.stock = Math.max(0, (Number(colorVariant.stock) || 0) - qty);
        }
      }
    }
  }
}

export async function saveOrder(order: Partial<Order>): Promise<Order> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.orders = store.orders || [];
    store.stock_reservations = store.stock_reservations || [];

    const existingIdx = store.orders.findIndex(
      (o: Order) =>
        (order.id && o.id === order.id) ||
        (order.order_number && o.order_number === order.order_number)
    );
    const existing = existingIdx >= 0 ? store.orders[existingIdx] : undefined;
    const now = new Date().toISOString();

    const orderId = order.id || existing?.id || `ord-${Date.now()}`;
    const orderNumber = order.order_number || existing?.order_number || `NOT-${Date.now().toString().slice(-6)}`;

    const targetStatus = order.status ?? existing?.status ?? 'pending';

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: order.customer_name ?? existing?.customer_name ?? 'Guest Customer',
      customer_email: order.customer_email ?? existing?.customer_email ?? '',
      customer_phone: order.customer_phone ?? existing?.customer_phone ?? '',
      shipping_address: order.shipping_address ?? existing?.shipping_address ?? {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
      },
      subtotal: order.subtotal ?? existing?.subtotal ?? 0,
      shipping_amount: order.shipping_amount ?? existing?.shipping_amount ?? 0,
      discount_amount: order.discount_amount ?? existing?.discount_amount ?? 0,
      total_amount: order.total_amount ?? existing?.total_amount ?? 0,
      currency: order.currency ?? existing?.currency ?? 'INR',
      status: targetStatus,
      payment_status: order.payment_status ?? existing?.payment_status ?? 'pending',
      tracking_carrier: order.tracking_carrier ?? existing?.tracking_carrier ?? '',
      tracking_number: order.tracking_number ?? existing?.tracking_number ?? '',
      notes: order.notes ?? existing?.notes ?? '',
      created_at: order.created_at ?? existing?.created_at ?? now,
      items: (order.items && order.items.length > 0) ? order.items : (existing?.items ?? []),
      razorpay_order_id: order.razorpay_order_id ?? existing?.razorpay_order_id ?? '',
      razorpay_payment_id: order.razorpay_payment_id ?? existing?.razorpay_payment_id ?? '',
      customer_id: order.customer_id ?? existing?.customer_id,
      confirmation_email_sent_at: order.confirmation_email_sent_at ?? existing?.confirmation_email_sent_at,
      status_email_sent_at: order.status_email_sent_at ?? existing?.status_email_sent_at,
      last_emailed_status:
        order.last_emailed_status !== undefined
          ? order.last_emailed_status
          : (targetStatus !== 'shipped' && targetStatus !== 'delivered' && existing?.last_emailed_status === 'shipped')
          ? undefined
          : existing?.last_emailed_status,
    };

    const isPaid = newOrder.payment_status === 'paid';

    // Idempotency: check if order was already confirmed and paid
    if (existingIdx >= 0) {
      const existing = store.orders[existingIdx];
      const wasPaid = existing.payment_status === 'paid';
      store.orders[existingIdx] = { ...existing, ...newOrder };

      if (!wasPaid && isPaid) {
        // Find reservation and confirm
        const resv = store.stock_reservations.find(
          (r: StockReservation) =>
            r.order_number === orderNumber ||
            (newOrder.razorpay_order_id && r.razorpay_order_id === newOrder.razorpay_order_id)
        );
        if (resv && resv.status !== 'confirmed') {
          resv.status = 'confirmed';
          resv.updated_at = new Date().toISOString();
        }
        deductPhysicalStockInternal(store, newOrder.items);
      }
    } else {
      store.orders.unshift(newOrder);
      if (isPaid) {
        const resv = store.stock_reservations.find(
          (r: StockReservation) =>
            r.order_number === orderNumber ||
            (newOrder.razorpay_order_id && r.razorpay_order_id === newOrder.razorpay_order_id)
        );
        if (resv && resv.status !== 'confirmed') {
          resv.status = 'confirmed';
          resv.updated_at = new Date().toISOString();
        }
        deductPhysicalStockInternal(store, newOrder.items);
      }
    }

    if (supabase) {
      try {
        await supabase.from('orders').upsert({
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          customer_phone: newOrder.customer_phone,
          shipping_address: newOrder.shipping_address,
          subtotal: newOrder.subtotal,
          shipping_amount: newOrder.shipping_amount,
          discount_amount: newOrder.discount_amount || 0,
          total_amount: newOrder.total_amount,
          currency: newOrder.currency || 'INR',
          status: newOrder.status,
          payment_status: newOrder.payment_status,
          tracking_carrier: newOrder.tracking_carrier || '',
          tracking_number: newOrder.tracking_number || '',
          notes: newOrder.notes || '',
          created_at: newOrder.created_at,
          items: newOrder.items,
          razorpay_order_id: newOrder.razorpay_order_id || '',
          razorpay_payment_id: newOrder.razorpay_payment_id || '',
        }, { onConflict: 'order_number' });
      } catch (e) {
        console.error('Supabase saveOrder non-blocking sync error:', e);
      }
    }

    writeLocalStore(store);
    return newOrder;
  });
}

// ====================================================
// RESERVATION MANAGEMENT (ATOMIC & CONCURRENCY SAFE)
// ====================================================

export interface CreateReservationItemParam {
  productId: string;
  selectedColor?: string;
  selectedColorId?: string;
  selectedColorHex?: string;
  selectedSize?: string;
  selectedSizeId?: string;
  variant_label?: string;
  quantity: number;
}

export interface CreateReservationParams {
  items: CreateReservationItemParam[];
  customerEmail: string;
  orderNumber: string;
  razorpayOrderId?: string;
  existingReservationToken?: string;
  durationMinutes?: number;
}

export interface ReservationResult {
  success: boolean;
  reservation?: StockReservation;
  error?: string;
  isReserved?: boolean;
  availableStock?: number;
}

export async function createStockReservation(params: CreateReservationParams): Promise<ReservationResult> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    cleanupExpiredReservationsInternal(store);

    // If an existing token is provided, release its previous reservation first
    if (params.existingReservationToken && Array.isArray(store.stock_reservations)) {
      const prev = store.stock_reservations.find(
        (r: StockReservation) => r.reservation_token === params.existingReservationToken && r.status === 'active'
      );
      if (prev) {
        prev.status = 'released';
        prev.updated_at = new Date().toISOString();
      }
    }

    const reservationItems: StockReservationItem[] = [];

    // Atomically validate each item against physical stock minus other active reservations
    for (const item of params.items) {
      const prod = (store.products || []).find(
        (p: Product) => p.id === item.productId || p.slug === item.productId
      );

      if (!prod) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        };
      }

      const qty = Math.max(1, parseInt(item.quantity as any, 10) || 1);
      const target: StockTarget = {
        product_id: prod.id,
        selected_color: item.selectedColor,
        selected_color_id: item.selectedColorId,
        variant_label: item.selectedSize || item.variant_label || 'Standard',
        selected_size_id: item.selectedSizeId,
      };

      const physicalStock = getPhysicalStockInternal(prod, target);
      const activeReserved = getActiveReservedQuantityInternal(store, target);
      const availableStock = Math.max(0, physicalStock - activeReserved);

      if (availableStock < qty) {
        const variantDesc = item.selectedColor
          ? ` (${item.selectedColor}${item.selectedSize ? `, Size ${item.selectedSize}` : ''})`
          : item.selectedSize
          ? ` (Size ${item.selectedSize})`
          : '';

        if (physicalStock >= qty) {
          // Stock exists physically, but is currently held in an active checkout by another customer
          return {
            success: false,
            error: `The item "${prod.name}${variantDesc}" is currently reserved by another customer during checkout. Please try again shortly.`,
            isReserved: true,
            availableStock,
          };
        } else {
          return {
            success: false,
            error: `Insufficient stock for "${prod.name}${variantDesc}". Only ${availableStock} available.`,
            isReserved: false,
            availableStock,
          };
        }
      }

      reservationItems.push({
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        variant_label: item.selectedSize || item.variant_label || 'Standard',
        selected_size_id: item.selectedSizeId,
        selected_color: item.selectedColor,
        selected_color_id: item.selectedColorId,
        selected_color_hex: item.selectedColorHex,
        quantity: qty,
        unit_price: prod.price,
      });
    }

    // All items available: create new reservation record
    const duration = params.durationMinutes && params.durationMinutes > 0 ? params.durationMinutes : 10;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();
    const reservationToken = `tok_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const reservationId = `resv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newReservation: StockReservation = {
      id: reservationId,
      reservation_token: reservationToken,
      order_number: params.orderNumber,
      razorpay_order_id: params.razorpayOrderId || '',
      customer_email: params.customerEmail,
      items: reservationItems,
      status: 'active',
      expires_at: expiresAt,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    store.stock_reservations = store.stock_reservations || [];
    store.stock_reservations.unshift(newReservation);
    writeLocalStore(store);

    if (supabase) {
      try {
        await supabase.from('stock_reservations').insert({
          id: newReservation.id,
          reservation_token: newReservation.reservation_token,
          order_number: newReservation.order_number,
          razorpay_order_id: newReservation.razorpay_order_id,
          customer_email: newReservation.customer_email,
          items: newReservation.items,
          status: newReservation.status,
          expires_at: newReservation.expires_at,
          created_at: newReservation.created_at,
          updated_at: newReservation.updated_at,
        });
      } catch (e) {
        console.error('Supabase stock_reservations insert non-blocking sync error:', e);
      }
    }

    return {
      success: true,
      reservation: newReservation,
    };
  });
}

export interface ConfirmReservationParams {
  reservationToken?: string;
  razorpayOrderId?: string;
  orderNumber?: string;
  orderData?: any;
}

export async function confirmStockReservationAndDeduct(
  params: ConfirmReservationParams
): Promise<{ success: boolean; error?: string; alreadyProcessed?: boolean }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.stock_reservations = store.stock_reservations || [];

    // Idempotency check: check if order already confirmed
    const existingOrder = (store.orders || []).find(
      (o: Order) =>
        (params.orderNumber && o.order_number === params.orderNumber) ||
        (params.razorpayOrderId && o.razorpay_order_id === params.razorpayOrderId)
    );

    if (existingOrder && existingOrder.payment_status === 'paid') {
      return { success: true, alreadyProcessed: true };
    }

    // Find reservation
    const resv = store.stock_reservations.find(
      (r: StockReservation) =>
        (params.reservationToken && r.reservation_token === params.reservationToken) ||
        (params.razorpayOrderId && r.razorpay_order_id === params.razorpayOrderId) ||
        (params.orderNumber && r.order_number === params.orderNumber)
    );

    if (resv && resv.status === 'confirmed') {
      return { success: true, alreadyProcessed: true };
    }

    const itemsToDeduct = resv?.items || params.orderData?.items || [];

    // If reservation expired or released, verify if stock is still physically available
    if (resv && (resv.status === 'expired' || resv.status === 'released')) {
      for (const item of itemsToDeduct) {
        const prod = (store.products || []).find((p: Product) => p.id === item.product_id);
        if (prod) {
          const target: StockTarget = {
            product_id: prod.id,
            selected_color: item.selected_color,
            selected_color_id: item.selected_color_id,
            variant_label: item.variant_label,
            selected_size_id: item.selected_size_id,
          };
          const physical = getPhysicalStockInternal(prod, target);
          if (physical < (Number(item.quantity) || 1)) {
            return {
              success: false,
              error: `Reservation expired and stock for ${prod.name} was claimed by another customer.`,
            };
          }
        }
      }
    }

    // Deduct physical stock
    deductPhysicalStockInternal(store, itemsToDeduct);

    // Mark reservation as confirmed
    if (resv) {
      resv.status = 'confirmed';
      resv.updated_at = new Date().toISOString();
      if (params.razorpayOrderId && !resv.razorpay_order_id) {
        resv.razorpay_order_id = params.razorpayOrderId;
      }
    }

    writeLocalStore(store);

    if (supabase && resv) {
      try {
        await supabase
          .from('stock_reservations')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', resv.id);
      } catch (e) {
        console.error('Supabase stock_reservations confirm non-blocking sync error:', e);
      }
    }

    return { success: true };
  });
}

export async function releaseStockReservation(params: {
  reservationToken?: string;
  razorpayOrderId?: string;
  orderNumber?: string;
}): Promise<{ success: boolean }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    if (!Array.isArray(store.stock_reservations)) return { success: true };

    const resv = store.stock_reservations.find(
      (r: StockReservation) =>
        (params.reservationToken && r.reservation_token === params.reservationToken) ||
        (params.razorpayOrderId && r.razorpay_order_id === params.razorpayOrderId) ||
        (params.orderNumber && r.order_number === params.orderNumber)
    );

    if (resv && resv.status === 'active') {
      resv.status = 'released';
      resv.updated_at = new Date().toISOString();
      writeLocalStore(store);

      if (supabase) {
        try {
          await supabase
            .from('stock_reservations')
            .update({ status: 'released', updated_at: resv.updated_at })
            .eq('id', resv.id);
        } catch (e) {
          console.error('Supabase stock_reservations release non-blocking sync error:', e);
        }
      }
    }

    return { success: true };
  });
}

export async function linkRazorpayOrderIdToReservation(
  reservationToken: string,
  razorpayOrderId: string
): Promise<boolean> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    if (!Array.isArray(store.stock_reservations)) return false;

    const resv = store.stock_reservations.find(
      (r: StockReservation) => r.reservation_token === reservationToken
    );

    if (resv) {
      resv.razorpay_order_id = razorpayOrderId;
      resv.updated_at = new Date().toISOString();
      writeLocalStore(store);

      if (supabase) {
        try {
          await supabase
            .from('stock_reservations')
            .update({ razorpay_order_id: razorpayOrderId, updated_at: resv.updated_at })
            .eq('id', resv.id);
        } catch (e) {}
      }
      return true;
    }
    return false;
  });
}

export async function getLiveStockStatus(
  productId: string,
  options?: {
    selectedColor?: string;
    selectedColorId?: string;
    selectedSize?: string;
    selectedSizeId?: string;
    excludeReservationToken?: string;
  }
): Promise<{
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  isReserved: boolean;
  isAvailable: boolean;
}> {
  const store = readLocalStore();
  cleanupExpiredReservationsInternal(store);

  const prod = (store.products || []).find(
    (p: Product) => p.id === productId || p.slug === productId
  );

  if (!prod) {
    return {
      physicalStock: 0,
      reservedStock: 0,
      availableStock: 0,
      isReserved: false,
      isAvailable: false,
    };
  }

  const target: StockTarget = {
    product_id: prod.id,
    selected_color: options?.selectedColor,
    selected_color_id: options?.selectedColorId,
    variant_label: options?.selectedSize,
    selected_size_id: options?.selectedSizeId,
  };

  const physicalStock = getPhysicalStockInternal(prod, target);
  const reservedStock = getActiveReservedQuantityInternal(store, target, options?.excludeReservationToken);
  const availableStock = Math.max(0, physicalStock - reservedStock);

  return {
    physicalStock,
    reservedStock,
    availableStock,
    isReserved: physicalStock > 0 && availableStock <= 0,
    isAvailable: availableStock > 0,
  };
}

// ====================================================
// CUSTOMER AUTHENTICATION & PROFILE MANAGEMENT
// ====================================================

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const calculated = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return calculated === hash;
  } catch (e) {
    return false;
  }
}

export async function createCustomer(data: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
}): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customers = store.customers || [];

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    if (!data.fullName || data.fullName.trim().length === 0) {
      return { success: false, error: 'Full name is required.' };
    }

    const existing = store.customers.find(
      (c: Customer) => c.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    if (data.password) {
      if (data.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      const hashed = hashPassword(data.password);
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    const now = new Date().toISOString();
    const customerId = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCustomer: Customer = {
      id: customerId,
      email: normalizedEmail,
      password_hash: passwordHash,
      password_salt: passwordSalt,
      full_name: data.fullName.trim(),
      phone: (data.phone || '').trim(),
      addresses: [],
      created_at: now,
      updated_at: now,
    };

    store.customers.push(newCustomer);
    writeLocalStore(store);

    const sanitized = { ...newCustomer };
    delete sanitized.password_hash;
    delete sanitized.password_salt;

    return { success: true, customer: sanitized };
  });
}

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const store = readLocalStore();
  const normalizedEmail = (email || '').trim().toLowerCase();

  const customer: Customer | undefined = (store.customers || []).find(
    (c: Customer) => c.email.toLowerCase() === normalizedEmail
  );

  if (!customer || !customer.password_hash || !customer.password_salt) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const isValid = verifyPassword(password, customer.password_hash, customer.password_salt);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const sanitized = { ...customer };
  delete sanitized.password_hash;
  delete sanitized.password_salt;

  return { success: true, customer: sanitized };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const store = readLocalStore();
  const customer = (store.customers || []).find((c: Customer) => c.id === id);
  if (!customer) return null;
  const sanitized = { ...customer };
  delete sanitized.password_hash;
  delete sanitized.password_salt;
  return sanitized;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const store = readLocalStore();
  const normalized = (email || '').trim().toLowerCase();
  const customer = (store.customers || []).find(
    (c: Customer) => c.email.toLowerCase() === normalized
  );
  if (!customer) return null;
  const sanitized = { ...customer };
  delete sanitized.password_hash;
  delete sanitized.password_salt;
  return sanitized;
}

export async function updateCustomerProfile(
  id: string,
  data: { fullName?: string; phone?: string }
): Promise<Customer | null> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customers = store.customers || [];
    const idx = store.customers.findIndex((c: Customer) => c.id === id);
    if (idx < 0) return null;

    if (data.fullName !== undefined) {
      store.customers[idx].full_name = data.fullName.trim();
    }
    if (data.phone !== undefined) {
      store.customers[idx].phone = data.phone.trim();
    }
    store.customers[idx].updated_at = new Date().toISOString();
    writeLocalStore(store);

    const sanitized = { ...store.customers[idx] };
    delete sanitized.password_hash;
    delete sanitized.password_salt;
    return sanitized;
  });
}

// ====================================================
// CUSTOMER ADDRESS MANAGEMENT
// ====================================================

export async function getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
  const store = readLocalStore();
  const addresses: CustomerAddress[] = (store.customer_addresses || []).filter(
    (a: CustomerAddress) => a.customer_id === customerId
  );
  return addresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
}

export async function addCustomerAddress(
  customerId: string,
  address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>
): Promise<CustomerAddress> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customer_addresses = store.customer_addresses || [];

    const existingForCust = store.customer_addresses.filter(
      (a: CustomerAddress) => a.customer_id === customerId
    );

    // If it's the first address or marked default, set as default and unset others
    const isDefault = address.is_default || existingForCust.length === 0;

    if (isDefault) {
      existingForCust.forEach((a: CustomerAddress) => {
        a.is_default = false;
      });
    }

    const now = new Date().toISOString();
    const newAddress: CustomerAddress = {
      id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customer_id: customerId,
      name: address.name,
      phone: address.phone,
      street: address.street,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country || 'India',
      is_default: isDefault,
      created_at: now,
      updated_at: now,
    };

    store.customer_addresses.unshift(newAddress);
    writeLocalStore(store);
    return newAddress;
  });
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  address: Partial<CustomerAddress>
): Promise<CustomerAddress | null> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customer_addresses = store.customer_addresses || [];

    const idx = store.customer_addresses.findIndex(
      (a: CustomerAddress) => a.id === addressId && a.customer_id === customerId
    );
    if (idx < 0) return null;

    if (address.is_default) {
      store.customer_addresses.forEach((a: CustomerAddress) => {
        if (a.customer_id === customerId) a.is_default = false;
      });
    }

    store.customer_addresses[idx] = {
      ...store.customer_addresses[idx],
      ...address,
      id: addressId,
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    };

    writeLocalStore(store);
    return store.customer_addresses[idx];
  });
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string
): Promise<boolean> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customer_addresses = store.customer_addresses || [];

    const initialLen = store.customer_addresses.length;
    const deletedWasDefault = store.customer_addresses.find(
      (a: CustomerAddress) => a.id === addressId && a.customer_id === customerId
    )?.is_default;

    store.customer_addresses = store.customer_addresses.filter(
      (a: CustomerAddress) => !(a.id === addressId && a.customer_id === customerId)
    );

    // If deleted address was default, make the first remaining address default
    if (deletedWasDefault) {
      const remaining = store.customer_addresses.filter(
        (a: CustomerAddress) => a.customer_id === customerId
      );
      if (remaining.length > 0) {
        remaining[0].is_default = true;
      }
    }

    writeLocalStore(store);
    return store.customer_addresses.length < initialLen;
  });
}

export async function setDefaultCustomerAddress(
  customerId: string,
  addressId: string
): Promise<boolean> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.customer_addresses = store.customer_addresses || [];

    let found = false;
    store.customer_addresses.forEach((a: CustomerAddress) => {
      if (a.customer_id === customerId) {
        if (a.id === addressId) {
          a.is_default = true;
          found = true;
        } else {
          a.is_default = false;
        }
      }
    });

    if (found) {
      writeLocalStore(store);
    }
    return found;
  });
}

// ====================================================
// CUSTOMER ORDER HISTORY
// ====================================================

export async function getCustomerOrders(email: string): Promise<Order[]> {
  const store = readLocalStore();
  const normalized = (email || '').trim().toLowerCase();
  const orders: Order[] = (store.orders || []).filter(
    (o: Order) => o.customer_email.toLowerCase() === normalized
  );

  return orders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ====================================================
// FORGOT PASSWORD & OTP MANAGEMENT
// ====================================================

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function createPasswordResetOtp(
  email: string,
  role: 'customer' | 'admin'
): Promise<{ success: boolean; otp?: string; name?: string; error?: string }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    store.password_reset_otps = store.password_reset_otps || [];

    const normalizedEmail = (email || '').trim().toLowerCase();
    let recipientName = 'User';

    if (role === 'customer') {
      const cust = (store.customers || []).find(
        (c: Customer) => c.email.toLowerCase() === normalizedEmail
      );
      if (!cust) {
        // Obscured failure for security
        return { success: false, error: 'No account found with this email address.' };
      }
      recipientName = cust.full_name || 'Customer';
    } else if (role === 'admin') {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@notionsclothing.com').toLowerCase();
      if (normalizedEmail !== adminEmail) {
        return { success: false, error: 'No administrative account associated with this email.' };
      }
      recipientName = 'Administrator';
    }

    // Rate limiting: check cooldown of 60 seconds
    const now = Date.now();
    const recentOtp = store.password_reset_otps.find(
      (o: PasswordResetOtp) =>
        o.email.toLowerCase() === normalizedEmail &&
        o.role === role &&
        !o.used &&
        now - new Date(o.created_at).getTime() < 60 * 1000
    );

    if (recentOtp) {
      return { success: false, error: 'A reset code was recently sent. Please wait 60 seconds before requesting another.' };
    }

    // Clean up old OTPs for this email
    store.password_reset_otps = store.password_reset_otps.filter(
      (o: PasswordResetOtp) => !(o.email.toLowerCase() === normalizedEmail && o.role === role)
    );

    // Generate secure 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(rawOtp);
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes

    const newRecord: PasswordResetOtp = {
      id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: normalizedEmail,
      role,
      otp_hash: otpHash,
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date(now).toISOString(),
      used: false,
    };

    store.password_reset_otps.unshift(newRecord);
    writeLocalStore(store);

    return {
      success: true,
      otp: rawOtp,
      name: recipientName,
    };
  });
}

export async function verifyPasswordResetOtp(
  email: string,
  role: 'customer' | 'admin',
  otp: string
): Promise<{ success: boolean; error?: string }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const record = (store.password_reset_otps || []).find(
      (o: PasswordResetOtp) =>
        o.email.toLowerCase() === normalizedEmail &&
        o.role === role &&
        !o.used
    );

    if (!record) {
      return { success: false, error: 'Reset code expired or not found. Please request a new code.' };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Reset code has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      record.used = true;
      writeLocalStore(store);
      return { success: false, error: 'Too many incorrect attempts. Please request a new reset code.' };
    }

    record.attempts += 1;

    const providedHash = hashOtp(otp.trim());
    if (providedHash !== record.otp_hash) {
      writeLocalStore(store);
      return { success: false, error: 'Invalid verification code. Please check and try again.' };
    }

    writeLocalStore(store);
    return { success: true };
  });
}

export async function resetPasswordWithOtp(
  email: string,
  role: 'customer' | 'admin',
  otp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  return inventoryMutex.acquire(async () => {
    const store = readLocalStore();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const record = (store.password_reset_otps || []).find(
      (o: PasswordResetOtp) =>
        o.email.toLowerCase() === normalizedEmail &&
        o.role === role &&
        !o.used
    );

    if (!record) {
      return { success: false, error: 'Reset session invalid. Please request a new OTP.' };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Reset session expired. Please request a new OTP.' };
    }

    const providedHash = hashOtp(otp.trim());
    if (providedHash !== record.otp_hash) {
      return { success: false, error: 'Invalid reset code.' };
    }

    // Mark OTP as used
    record.used = true;

    const { hash, salt } = hashPassword(newPassword);

    if (role === 'customer') {
      const cust = (store.customers || []).find(
        (c: Customer) => c.email.toLowerCase() === normalizedEmail
      );
      if (!cust) {
        return { success: false, error: 'Customer account not found.' };
      }
      cust.password_hash = hash;
      cust.password_salt = salt;
      cust.updated_at = new Date().toISOString();
    } else if (role === 'admin') {
      store.settings = store.settings || {};
      store.settings.admin_password_hash = hash;
      store.settings.admin_password_salt = salt;
    }

    writeLocalStore(store);
    return { success: true };
  });
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const store = readLocalStore();
  if (store.settings?.admin_password_hash && store.settings?.admin_password_salt) {
    return verifyPassword(
      password,
      store.settings.admin_password_hash,
      store.settings.admin_password_salt
    );
  }
  const expectedPass = process.env.ADMIN_PASSWORD || 'notions@admin2026';
  return password === expectedPass;
}
