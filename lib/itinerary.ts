import type { Place, SavedItinerary } from "./types";

export const ITINERARY_STORAGE_KEY = "lakbay-baguio.pending-itinerary.v2";

const START = { lat: 16.4117, lng: 120.598 };

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const latScale = 111;
  const lngScale = 106;
  return Math.hypot((a.lat - b.lat) * latScale, (a.lng - b.lng) * lngScale);
}

function minutesToTime(minutes: number) {
  const normalized = Math.max(0, minutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function generateItinerary({
  candidates,
  days,
  pace,
  interests,
}: {
  candidates: Place[];
  days: number;
  pace: SavedItinerary["pace"];
  interests: string[];
}): SavedItinerary {
  const perDay = pace === "relaxed" ? 3 : pace === "packed" ? 5 : 4;
  const interestSet = new Set(interests);
  const scored = [...candidates].sort((a, b) => {
    const aScore = (a.popular ? 4 : 0) + a.tags.filter((tag) => interestSet.has(tag)).length * 3;
    const bScore = (b.popular ? 4 : 0) + b.tags.filter((tag) => interestSet.has(tag)).length * 3;
    return bScore - aScore;
  });

  const selected = scored.slice(0, Math.min(days * perDay, scored.length));
  const ordered: Place[] = [];
  let cursor = START;

  while (selected.length) {
    selected.sort((a, b) => distance(cursor, a) - distance(cursor, b));
    const next = selected.shift()!;
    ordered.push(next);
    cursor = next;
  }

  const stops = ordered.map((place, index) => {
    const dayIndex = Math.floor(index / perDay);
    const slot = index % perDay;
    const startMinute = 9 * 60 + slot * (pace === "packed" ? 105 : 125);
    return {
      id: place.id,
      name: place.name,
      area: place.area,
      lat: place.lat,
      lng: place.lng,
      duration: place.duration,
      image: place.image,
      time: `Day ${dayIndex + 1} · ${minutesToTime(startMinute)}`,
    };
  });

  return {
    id: `trip-${Date.now()}`,
    title: `${days}-day Baguio escape`,
    createdAt: new Date().toISOString(),
    days,
    pace,
    interests,
    stops,
    status: "pending",
  };
}
