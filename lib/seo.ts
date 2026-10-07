import type { Metadata } from "next";

export const SITE_NAME = "Baguio Buddy";
export const SITE_URL = "https://baguiobuddy.com";
export const DEFAULT_SOCIAL_IMAGE = "/assets/img/destinations/burnham-park.jpg";
export const LAST_CONTENT_REVIEW = "2026-10-08";

export const CORE_KEYWORDS = [
  "Baguio itinerary",
  "Baguio itinerary planner",
  "Baguio itinerary 3 days 2 nights",
  "Baguio 3D2N itinerary",
  "Baguio tourist spots",
  "tourist spots in Baguio",
  "places to visit in Baguio",
  "Baguio commute guide",
  "Baguio DIY itinerary",
  "Baguio trip budget",
  "Baguio travel guide",
  "Baguio itinerary generator",
  "Baguio itinerary for first timers",
  "things to do in Baguio",
  "best time to visit Baguio",
  "where to stay in Baguio",
  "hotel near Burnham Park",
  "Manila to Baguio bus",
  "Victory Liner Manila to Baguio",
  "Genesis bus schedule to Baguio",
  "Baguio Night Market schedule",
];

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = DEFAULT_SOCIAL_IMAGE,
  type = "website",
}: PageMetadataOptions): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords: [...new Set([...keywords, ...CORE_KEYWORDS])],
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "en_PH",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [{ url: image, alt: `${SITE_NAME} Baguio travel planning` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export function noIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
