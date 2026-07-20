import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navbar from "@/components/Navbar";
import EmailCapture from "@/components/EmailCapture";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tactica — AI Football Tactical Engine",
  description:
    "ML-powered formation prediction, BSD live match data, Gemini AI tactical chat, " +
    "and FPL Scout. Built by Linea Football.",
  openGraph: {
    title: "Tactica — AI Football Tactical Engine",
    description: "Formation predictions, opponent analysis, FPL Scout and AI chat.",
    url: "https://app.tactica.com.ng",
    siteName: "Tactica",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@TacticaEngine",
    title: "Tactica — AI Football Tactical Engine",
    description: "Formation predictions, opponent analysis, FPL Scout and AI chat.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Navbar — all 6 modules always visible */}
        <Navbar />

        {/* Page content */}
        <main>{children}</main>

        {/* Email capture — appears after 3 tool uses, not on first visit */}
        <EmailCapture />

        {/* Vercel Analytics — pageviews, countries, referrers */}
        <Analytics />

        {/* Vercel Speed Insights — Core Web Vitals per page */}
        <SpeedInsights />
      </body>
    </html>
  );
}
