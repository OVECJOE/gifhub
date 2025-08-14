import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import { BuyMeCoffee } from "@/components/layout/BuyMeCoffee";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GifHub",
  description: "Create, Organize, and Share High-Quality GIFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm text-black`}>
        <AuthSessionProvider>
          <Header />
          <main className="container mx-auto px-6 py-8 min-h-[calc(100vh-13rem)]">{children}</main>
          <Footer />
          <BuyMeCoffee />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
