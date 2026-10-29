export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  sort_order: number;
  is_published: boolean;
  subcategories?: Category[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color?: string | null;
  sku?: string | null;
  price?: number | null;
  inventory_quantity: number;
  is_available: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_public_id: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_slug?: string;
  category_name?: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  is_bestseller: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_published: boolean;
  rating_score: number;
  rating_count: number;
  images: ProductImage[];
  variants: ProductVariant[];
  material?: string;
  care_instructions?: string;
  created_at: string;
}

export interface Banner {
  id: string;
  section: 'hero' | 'essentials' | 'footwear' | 'accessories' | 'new_arrivals';
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  badge_text?: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  product: Product;
  selected_size?: string;
  selected_color?: string;
  quantity: number;
  unit_price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  sku?: string;
  variant_label?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_carrier?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface SiteSettings {
  store_name: string;
  tagline: string;
  logo_url?: string;
  support_email: string;
  support_phone: string;
  working_hours?: string;
  address: string;
  free_shipping_threshold: number;
  flat_shipping_rate: number;
  announcement_bar: string;
  instagram_url?: string;
  whatsapp_number?: string;
}
