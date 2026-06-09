import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:       "QabiFly — Aapki Zarurat Hamari Zimmedari",
  description: "Reoti Block, Ballia — Hyperlocal e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}