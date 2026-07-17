import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Vercel Analytics — tracks pageviews, unique visitors,
            countries, referrers. Zero config, GDPR-friendly,
            no cookies. View in Vercel dashboard → Analytics tab. */}
        <Analytics />

        {/* Vercel Speed Insights — tracks Core Web Vitals per page.
            Shows you which pages are slow so you can fix them.
            View in Vercel dashboard → Speed Insights tab. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
