import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "NOTIONS® — Opulent Clothing | Luxury Menswear & Accessories",
  description:
    "Discover timeless luxury, opulent menswear, handcrafted footwear, and refined accessories at NOTIONS®. Designed for the modern discerning gentleman.",
  openGraph: {
    title: "NOTIONS® — Opulent Clothing",
    description: "Every Outfit a Statement. Premium men's fashion for your everyday journey.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#181818] antialiased">
        <WishlistProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <WishlistDrawer />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
