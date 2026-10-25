import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navbar from "@/components/Navbar";
import SignUpModal from "@/components/SignUpModal";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const TITLE = "Tactica — AI Football Tactical Engine";
const DESCRIPTION =
  "ML-powered formation prediction, BSD live match data, Gemini AI tactical chat, " +
  "and FPL Scout. Built by Cantera Football.";
const SHORT =
  "Formation predictions, opponent analysis, FPL Scout and AI chat.";

export const metadata: Metadata = {
  // Resolves every relative URL below against the real domain. Without
  // it Next falls back to localhost in dev and drops the image entirely
  // in production, so the og tags silently do nothing.
  metadataBase: new URL("https://app.tacticaengine.com"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Tactica",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: SHORT,
    url: "/",
    siteName: "Tactica",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Tactica — AI football tactical engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@TacticaEngine",
    creator: "@iamtjbest",
    title: TITLE,
    description: SHORT,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <SignUpModal />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
