import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#6C3DC8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title:       "QabiFly — Aapki Zarurat Hamari Zimmedari",
  description: "Reoti Block, Ballia — Hyperlocal E-Commerce",
  manifest:    "/manifest.json",
  appleWebApp: {
    capable:           true,
    statusBarStyle:    "default",
    title:             "QabiFly",
  },
  icons: {
    icon:  "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title:       "QabiFly",
    description: "Apna Gaon Apna Bazaar",
    url:         "https://qabifly.vercel.app",
    siteName:    "QabiFly",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <meta name="application-name"        content="QabiFly" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QabiFly" />
        <meta name="mobile-web-app-capable"  content="yes" />
        <meta name="msapplication-TileColor" content="#6C3DC8" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Script id="sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
              .then(r => console.log('SW registered'))
              .catch(e => console.log('SW error', e));
          }
        `}</Script>
      </body>
    </html>
  );
}
