import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { AuthProvider } from "@/context/auth-context";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import AccountModal from "@/components/AccountModal";
import JsonLd from "@/components/JsonLd";
import {
  getSiteUrl,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  getOrganizationJsonLd,
  getWebSiteJsonLd,
} from "@/lib/seo";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#143728",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "luxury menswear",
  keywords: [
    "NOTIONS",
    "opulent clothing",
    "luxury menswear",
    "men's apparel",
    "handcrafted footwear",
    "designer accessories",
    "bespoke men's fashion",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    siteName: SITE_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Opulent Clothing`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "TonWG5V3gdY0mNxZYuaTbsPC5k5cJc7et_a7Kahl5AY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={[getOrganizationJsonLd(), getWebSiteJsonLd()]} />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('notions_splash_seen')||sessionStorage.getItem('notions_splash_seen');var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!s&&!rm){document.documentElement.classList.add('notions-intro-pending');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#181818] antialiased" suppressHydrationWarning>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <WishlistDrawer />
              <AccountModal />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
