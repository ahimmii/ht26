import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Outfit } from "next/font/google";
import { CampaignTracker } from "@/components/ui/campaign-tracker";
import { ConsentBanner } from "@/components/ui/consent-banner";
import { TrackingScripts } from "@/components/ui/tracking-scripts";
import { getLocale, getTrackingConsent } from "@/lib/locale";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Halloween Tangier 2026",
    template: "%s — Halloween Tangier 2026",
  },
  description: "An exclusive Halloween night in Tangier. 160 guests. One night. No second chances.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Halloween Tangier 2026",
    description: "One night. No second chances. October 31 — Tangier.",
    images: ["/logo.png"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const consent = await getTrackingConsent();

  return (
    <html
      lang={locale}
      className={`${cinzel.variable} ${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-bone">
        <div className="grain" aria-hidden />
        {children}
        <ConsentBanner locale={locale} consent={consent} />
        <TrackingScripts consent={consent} />
        <CampaignTracker />
      </body>
    </html>
  );
}
