import type { MetadataRoute } from "next";
import { places } from "@/lib/places";
import { LAST_CONTENT_REVIEW, SITE_URL } from "@/lib/seo";

const reviewedAt = new Date(`${LAST_CONTENT_REVIEW}T00:00:00+08:00`);
const completeGuideReviewedAt = new Date("2026-10-05T00:00:00+08:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: reviewedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/plan`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE_URL}/tourist-spots`, lastModified: reviewedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/explore`, lastModified: reviewedAt, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: reviewedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/guides/baguio-travel-guide`, lastModified: completeGuideReviewedAt, changeFrequency: "weekly", priority: 0.98 },
    { url: `${SITE_URL}/guides/baguio-itinerary-3-days-2-nights`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE_URL}/guides/baguio-commute-guide`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/guides/baguio-trip-budget`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/guides/where-to-stay-in-baguio`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/guides/manila-to-baguio-bus-guide`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/guides/baguio-first-timer-guide`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/resources`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/about`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/help`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.55 },
    { url: `${SITE_URL}/privacy`, lastModified: reviewedAt, changeFrequency: "yearly", priority: 0.35 },
    { url: `${SITE_URL}/partner`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.4 },
  ];

  const placePages: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${SITE_URL}/places/${place.id}`,
    lastModified: reviewedAt,
    changeFrequency: "monthly",
    priority: place.popular ? 0.75 : 0.65,
    ...(place.image ? { images: [new URL(place.image, SITE_URL).toString()] } : {}),
  }));

  return [...corePages, ...placePages];
}
