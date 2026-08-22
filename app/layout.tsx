import type { Metadata } from "next";
import { Geist_Mono, Outfit, Permanent_Marker } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const ui = Outfit({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const marker = Permanent_Marker({
  variable: "--font-marker",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "BestCreatorBid.lol | The Creator Leaderboard Money Decides",
    template: "%s · BestCreatorBid.lol",
  },
  description:
    "Think you're the best creator? Prove it. Bid your way up the internet's least objective creator leaderboard.",
  openGraph: {
    title: "Who's the best creator? Money decides.",
    description: "Creators bid. Rankings move. Ego wins.",
    url: siteUrl(),
    siteName: "BestCreatorBid.lol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Who's the best creator? Money decides.",
    description: "Creators bid. Rankings move. Ego wins.",
  },
  alternates: {
    canonical: siteUrl(),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${ui.variable} ${geistMono.variable} ${marker.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BestCreatorBid.lol",
              url: siteUrl(),
              description:
                "Think you're the best creator? Prove it. Bid your way up the internet's least objective creator leaderboard.",
            }),
          }}
        />
        <AnalyticsProvider>{children}</AnalyticsProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
