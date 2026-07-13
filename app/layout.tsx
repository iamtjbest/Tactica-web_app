import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Tactica — Football Intelligence Engine",
  description: "AI-powered formation prediction, Starting XI selection, live match analysis and tactical chat. Free for every coach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg">
        <Navbar />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
