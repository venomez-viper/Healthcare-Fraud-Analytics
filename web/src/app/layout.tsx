import type { Metadata } from "next";
import { Geist, Geist_Mono, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { FallingLeaves } from "@/components/falling-leaves";
import { Grain } from "@/components/scenery";
import { SiteNav, SiteFooter } from "@/components/blocks";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mincho = Shippori_Mincho({
  variable: "--font-mincho",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Provider Fraud Risk Explorer",
  description:
    "A watchful ranker that surfaces the providers most likely committing Medicare fraud, and explains why.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${mincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-washi">
        <FallingLeaves />
        <Grain />
        <SiteNav />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
