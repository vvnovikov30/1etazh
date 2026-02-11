import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Inter } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Одноэтажники.РФ — проекты и строительство одноэтажных домов",
  description: "Готовые дома, проектирование, строительство под ключ. Быстрый контакт — Telegram.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.jpg", type: "image/jpeg" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans min-h-screen bg-[var(--color-bg)] pt-16 md:pt-20`}>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Header />
        {children}
        <Footer />
        <FloatingTelegram />
      </body>
    </html>
  );
}
