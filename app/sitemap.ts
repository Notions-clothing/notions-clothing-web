import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';
import { getProducts, getCategories, getBrands } from '@/lib/db';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // Fetch live active database entities
  const [products, categories, brands] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
    getBrands().catch(() => []),
  ]);

  const currentDate = new Date();

  // 1. Static Core Storefront Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/new-arrivals`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/offers`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/policies/shipping`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/policies/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/policies/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. Active, Published Categories
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.is_published !== false && c.slug)
    .map((c) => ({
      url: `${siteUrl}/category/${encodeURIComponent(c.slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: c.parent_id ? 0.75 : 0.85,
    }));

  // 3. Active, Published Products
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.is_published !== false && p.slug)
    .map((p) => {
      let modDate = currentDate;
      if (p.created_at) {
        const parsed = new Date(p.created_at);
        if (!isNaN(parsed.getTime())) modDate = parsed;
      }
      return {
        url: `${siteUrl}/product/${encodeURIComponent(p.slug)}`,
        lastModified: modDate,
        changeFrequency: 'weekly',
        priority: p.is_bestseller || p.is_featured ? 0.9 : 0.8,
      };
    });

  // 4. Active Brands
  const brandRoutes: MetadataRoute.Sitemap = brands
    .filter((b) => b.is_active !== false && b.slug)
    .map((b) => {
      let modDate = currentDate;
      const dateStr = b.updated_at || b.created_at;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) modDate = parsed;
      }
      return {
        url: `${siteUrl}/brands/${encodeURIComponent(b.slug)}`,
        lastModified: modDate,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
    });

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...brandRoutes];
}

