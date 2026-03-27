import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapOwner — Snap Any House, See the Owner",
  description: "Point your camera at any property and instantly see the owner's name, phone number, property value, tax records, and more. Free for real estate professionals.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SnapOwner" },
  openGraph: {
    title: "SnapOwner — Snap Any House, See the Owner",
    description: "Point your camera at any property and instantly see the owner's name, phone number, property value, tax records, and more. Free for real estate professionals.",
    url: "https://snapowner.com",
    siteName: "SnapOwner",
    type: "website",
    images: [{ url: "https://snapowner.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapOwner — Snap Any House, See the Owner",
    description: "Instantly look up any property owner's phone number, email, property value, and tax records.",
    images: ["https://snapowner.com/og-image.png"],
  },
  icons: { apple: "/apple-touch-icon.png", icon: "/favicon.ico" },
  other: { "apple-mobile-web-app-title": "SnapOwner" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#007AFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});})}` }} />
      </body>
    </html>
  );
}
