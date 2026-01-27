import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import {Suspense} from "react";
import ScrollToHash from "./components/ScrollToHash";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anilog",
  description: "Track anime and manage your watchlist with account stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} relative flex min-h-screen flex-col text-zinc-100 antialiased`}
      >
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/bg/anilog-bg.webp')" }}
        />
        <div className="page-overlay fixed inset-0 -z-10 bg-black/70" />
        <div className="relative z-10 min-h-screen bg-gradient-to-br from-[#0b1022]/70 via-[#0f1731]/70 to-[#111827]/70">
          <Navbar />
          <Suspense fallback={null}>
          <ScrollToHash />
          </Suspense>
          <main className="flex-1 pt-[72px]">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
