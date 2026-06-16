import type { Metadata } from "next";
import {
  Geist,
  Schibsted_Grotesk,
  Source_Serif_4,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/top-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fonts for the invoice editor templates (Minimal / Classic / Bold)
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InvoiceKilat — Buat invoice profesional dalam menit",
  description:
    "Aplikasi pembuat invoice cepat untuk freelancer & penjual. Multi-perusahaan, kontak klien, template, live preview, dan PDF instan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${schibsted.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <TopBar />
            <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
