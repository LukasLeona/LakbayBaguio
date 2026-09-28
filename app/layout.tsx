import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { BottomNavigation, SiteHeader } from "@/components/navigation";
import { UtilityMenu } from "@/components/utility-menu";
import { ChatNotificationsProvider } from "@/components/chat-notifications";
import {
  CORE_KEYWORDS,
  DEFAULT_SOCIAL_IMAGE,
  serializeJsonLd,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Baguio Itinerary Planner & Tourist Spot Guide | Baguio Buddy",
    template: "%s | Baguio Buddy",
  },
  description: "Build a practical Baguio itinerary with clustered tourist spots, realistic travel times, hotel timing, commute guidance, route links, and estimated fares.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  keywords: CORE_KEYWORDS,
  icons: { icon: "/assets/img/favicon.svg?v=baguio-buddy" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/",
    siteName: SITE_NAME,
    title: "Baguio Itinerary Planner & Tourist Spot Guide | Baguio Buddy",
    description: "Plan a smoother DIY Baguio trip with area-clustered tourist spots, commute guidance, hotel timing, realistic travel estimates, and editable day-by-day routes.",
    images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: "Burnham Park in Baguio City" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baguio Itinerary Planner & Tourist Spot Guide | Baguio Buddy",
    description: "Build a practical Baguio itinerary around your dates, stay, selected tourist spots, and commute preferences.",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { address: false, email: false, telephone: false },
  other: {
    "geo.region": "PH-BEN",
    "geo.placename": "Baguio City",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/assets/img/logo.svg`,
      description: "A Baguio trip-planning website for practical, commute-aware, hotel-aware itineraries.",
      areaServed: { "@type": "City", name: "Baguio City" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "en-PH",
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: "Plan a practical Baguio itinerary with tourist spots grouped by area, commute guidance, hotel timing, and estimated travel costs.",
    },
  ];

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={poppins.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }} />
        <ChatNotificationsProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <SiteHeader />
          <UtilityMenu />
          {children}
          <BottomNavigation />
        </ChatNotificationsProvider>
      </body>
    </html>
  );
}
