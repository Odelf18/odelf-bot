import { Syne, Manrope, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Odelf Bot — Paper futures. Live PnL.",
  description:
    "Public paper-trading showcase: crypto futures dry-run with OdelfTrend and a live PnL board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
