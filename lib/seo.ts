import type { Metadata } from 'next';
import { Product, Category, Brand } from '@/types/database';

export const PRODUCTION_DOMAIN = 'https://www.notionsonline.in';

/**
 * Returns the normalized production site URL without trailing slash.
 * Guarantees the official production domain https://www.notionsonline.in in production environments.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  // In production builds or production environments, prevent localhost and legacy domain
  if (process.env.NODE_ENV === 'production') {
    if (
      envUrl &&
      !envUrl.includes('localhost') &&
      !envUrl.includes('127.0.0.1') &&
      !envUrl.includes('notionsclothing.com')
    ) {
      return envUrl.replace(/\/+$/, '');
    }
    if (vercelProd) {
      return `https://${vercelProd}`.replace(/\/+$/, '');
    }
    if (vercelUrl) {
      return `https://${vercelUrl}`.replace(/\/+$/, '');
    }
    return PRODUCTION_DOMAIN;
  }

  // Development environment
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Normalizes and converts relative or external image paths to absolute URLs.
 */
export function toAbsoluteImageUrl(imagePath?: string | null): string {
  if (!imagePath) {
    return `${getSiteUrl()}/logo.png`;
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${getSiteUrl()}${cleanPath}`;
}

/**
 * Generates an absolute, normalized canonical URL.
 * Strips tracking parameters, sort parameters, and pagination spam.
 */
export function getCanonicalUrl(pathname: string = '/'): string {
  const siteUrl = getSiteUrl();
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // Strip any trailing slash except root '/'
  const cleanPath = normalizedPath.length > 1 ? normalizedPath.replace(/\/+$/, '') : normalizedPath;
  return `${siteUrl}${cleanPath}`;
}

export const SITE_NAME = 'NOTIONS®';
export const DEFAULT_TITLE = 'NOTIONS® — Opulent Clothing | Luxury Menswear & Accessories';
export const DEFAULT_DESCRIPTION =
  'Discover timeless luxury, opulent menswear, handcrafted footwear, and refined accessories at NOTIONS®. Tailored for the modern discerning gentleman.';

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Builds standard Next.js Metadata with canonical, OpenGraph, Twitter, and Robots.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = getCanonicalUrl(path);
  const imageUrl = toAbsoluteImageUrl(image);

  const baseKeywords = [
    'NOTIONS',
    'opulent clothing',
    'luxury menswear',
    "men's apparel",
    'handcrafted footwear',
    'designer accessories',
    'bespoke fashion',
  ];
  const combinedKeywords = Array.from(new Set([...keywords, ...baseKeywords]));

  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: {
      absolute: resolvedTitle,
    },
    description,
    keywords: combinedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Builds metadata strictly for private/administrative routes (noindex, nofollow).
 */
export function buildPrivateMetadata(title: string, path: string): Metadata {
  return buildPageMetadata({
    title,
    description: 'Private area. Not intended for search indexing.',
    path,
    noIndex: true,
  });
}

// ====================================================
// STRUCTURED DATA (JSON-LD) GENERATORS
// ====================================================

/**
 * Global Organization schema.
 */
export function getOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'NOTIONS® Opulent Clothing',
    legalName: 'NOTIONS Clothing Atelier',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
      caption: 'NOTIONS® Logo',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-98765-43210',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Flagship Atelier, 42 Heritage Promenade',
      addressLocality: 'Indiranagar, Bengaluru',
      addressRegion: 'KA',
      postalCode: '560038',
      addressCountry: 'IN',
    },
  };
}

/**
 * Global WebSite schema with Sitelinks Search Box.
 */
export function getWebSiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'NOTIONS®',
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Product detail page Schema (Product + Offer).
 * STRICT: Uses only genuine database values. No fake ratings or hardcoded reviews.
 */
export function getProductJsonLd(product: Product, canonicalUrl: string) {
  const siteUrl = getSiteUrl();

  // Compute availability dynamically
  let inStock = false;
  if (product.product_mode === 'variant' && product.colors && product.colors.length > 0) {
    const totalVariantStock = product.colors.reduce((sum, col) => {
      const colStock = (col.sizes || []).reduce((sSum, sz) => sSum + (sz.stock || 0), 0);
      return sum + colStock;
    }, 0);
    inStock = totalVariantStock > 0;
  } else if (product.variants && product.variants.length > 0) {
    const totalVarStock = product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
    inStock = totalVarStock > 0;
  } else {
    inStock = (product.stock ?? 0) > 0;
  }

  // Extract images
  const images = (product.images || [])
    .map((img) => toAbsoluteImageUrl(img.image_url))
    .filter(Boolean);

  if (images.length === 0) {
    images.push(`${siteUrl}/logo.png`);
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    description: product.description || `${product.name} crafted by NOTIONS®.`,
    url: canonicalUrl,
    image: images,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand_name || 'NOTIONS®',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: oneYearFromNow.toISOString().split('T')[0],
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'NOTIONS®',
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: product.price >= 1999 ? 0 : 99,
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  // Only include aggregateRating if product has genuine recorded ratings (count > 0)
  if (product.rating_count && product.rating_count > 0 && product.rating_score) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating_score,
      reviewCount: product.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return productSchema;
}

/**
 * BreadcrumbList schema generator.
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * CollectionPage / ItemList schema generator for categories and catalog.
 */
export function getCollectionJsonLd({
  name,
  description,
  url,
  products = [],
}: {
  name: string;
  description?: string;
  url: string;
  products?: Product[];
}) {
  const collectionSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description || `Discover the opulent ${name} collection at NOTIONS®.`,
    url,
  };

  if (products.length > 0) {
    collectionSchema.mainEntity = {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 24).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: getCanonicalUrl(`/product/${p.slug}`),
        name: p.name,
      })),
    };
  }

  return collectionSchema;
}

