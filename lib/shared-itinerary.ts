import type { PlannedItinerary } from "./planner-engine";

export const SHARED_ITINERARY_STORAGE_KEY = "baguio-buddy.shared-itinerary.v1";
export const SHARED_ITINERARY_CHANGE_EVENT = "baguio-buddy:shared-itinerary-change";

export type SharedItineraryPreview = {
  token: string;
  title: string;
  dayCount: number;
  stopCount: number;
  openedAt: string;
};

export function isPlannedItinerary(value: unknown): value is PlannedItinerary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlannedItinerary>;
  return Boolean(
    typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && candidate.start
    && Array.isArray(candidate.days)
    && candidate.days.length > 0
    && candidate.totals
    && typeof candidate.totals.scheduledStops === "number"
    && typeof candidate.numberOfDays === "number"
    && Array.isArray(candidate.selectedDestinationIds),
  );
}

export function isShareToken(value: string) {
  return /^[a-f0-9]{32}$/.test(value);
}

export function sharedItineraryPath(token: string) {
  return `/plan/itinerary/shared/${token}`;
}

export function rememberSharedItinerary(token: string, itinerary: PlannedItinerary) {
  const preview: SharedItineraryPreview = {
    token,
    title: itinerary.title,
    dayCount: itinerary.numberOfDays,
    stopCount: itinerary.totals.scheduledStops,
    openedAt: new Date().toISOString(),
  };
  localStorage.setItem(SHARED_ITINERARY_STORAGE_KEY, JSON.stringify(preview));
  window.dispatchEvent(new Event(SHARED_ITINERARY_CHANGE_EVENT));
  return preview;
}

export function readSharedItineraryPreview(): SharedItineraryPreview | null {
  try {
    const raw = localStorage.getItem(SHARED_ITINERARY_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SharedItineraryPreview>;
    if (
      typeof value.token !== "string"
      || !isShareToken(value.token)
      || typeof value.title !== "string"
      || typeof value.dayCount !== "number"
      || typeof value.stopCount !== "number"
      || typeof value.openedAt !== "string"
    ) return null;
    return value as SharedItineraryPreview;
  } catch {
    return null;
  }
}
