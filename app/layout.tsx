import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HouseLens — Snap Any House, See the Owner",
  description: "Point your camera at any property and instantly see the owner's name, phone number, property value, tax records, and more. Free for real estate professionals.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HouseLens" },
  openGraph: {
    title: "HouseLens — Snap Any House, See the Owner",
    description: "Point your camera at any property and instantly see the owner's name, phone number, property value, tax records, and more. Free for real estate professionals.",
    url: "https://houselens.io",
    siteName: "HouseLens",
    type: "website",
    images: [{ url: "https://houselens.io/logo.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HouseLens — Snap Any House, See the Owner",
    description: "Instantly look up any property owner's phone number, email, property value, and tax records. Free.",
    images: ["https://houselens.io/logo.png"],
  },
  icons: { apple: "/icons/icon-192.png" },
  other: { "apple-mobile-web-app-title": "HouseLens" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#007AFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="apple-touch-icon" href="/icons/icon-192.png" /></head>
      <body className="font-sans antialiased">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});})}` }} />
      </body>
    </html>
  );
}
