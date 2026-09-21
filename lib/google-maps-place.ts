import type {
  LuggagePlan,
  PlannerStay,
  StayKind,
  StayLocationPrecision,
} from "@/lib/planner-types";

export const BAGUIO_CENTER = Object.freeze({ lat: 16.4023, lng: 120.596 });

export type ParsedGoogleMapsPlace = {
  normalizedUrl: string;
  name: string | null;
  query: string | null;
  lat: number | null;
  lng: number | null;
  locationPrecision: StayLocationPrecision;
};

const GOOGLE_MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value.replaceAll("+", " "));
  } catch {
    return value.replaceAll("+", " ");
  }
}

function finiteCoordinate(value: string | undefined) {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function coordinatesFromUrl(url: URL) {
  const text = `${url.pathname}${url.search}${url.hash}`;
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const dataMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const queryValue = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
  const queryMatch = queryValue.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  const match = atMatch ?? dataMatch ?? queryMatch;

  return {
    lat: finiteCoordinate(match?.[1]),
    lng: finiteCoordinate(match?.[2]),
  };
}

function placeNameFromUrl(url: URL) {
  const placeMatch = url.pathname.match(/\/place\/([^/]+)/i);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q");
  const candidate = placeMatch?.[1] ?? query;

  if (!candidate || /^-?\d+(?:\.\d+)?\s*,/.test(candidate)) return null;
  return safeDecode(candidate).trim() || null;
}

export function isSupportedGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (GOOGLE_MAPS_HOSTS.has(host) || host.endsWith(".google.com")) &&
      (host === "maps.app.goo.gl" || host === "goo.gl" || url.pathname.includes("/maps"))
    );
  } catch {
    return false;
  }
}

export function parseGoogleMapsPlaceUrl(value: string): ParsedGoogleMapsPlace | null {
  if (!isSupportedGoogleMapsUrl(value)) return null;

  const url = new URL(value.trim());
  url.hash = "";
  const coordinates = coordinatesFromUrl(url);
  const name = placeNameFromUrl(url);

  return {
    normalizedUrl: url.toString(),
    name,
    query: name ?? url.searchParams.get("query") ?? url.searchParams.get("q"),
    lat: coordinates.lat,
    lng: coordinates.lng,
    locationPrecision:
      coordinates.lat !== null && coordinates.lng !== null ? "pin" : "approximate",
  };
}

export function googleMapsStaySearchUrl(kind: StayKind, propertyName = "") {
  const type = kind === "hotel" ? "hotel" : "Airbnb or vacation rental";
  const query = propertyName.trim()
    ? `${propertyName.trim()}, Baguio City`
    : `${type} in Baguio City`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function createPlannerStay(input: {
  kind: StayKind;
  name: string;
  googleMapsUrl: string;
  checkInDay: number;
  checkInTime: string;
  luggagePlan: LuggagePlan;
}): PlannerStay {
  const parsed = parseGoogleMapsPlaceUrl(input.googleMapsUrl);
  if (!parsed) throw new Error("Paste a valid Google Maps place or share link for your stay.");

  const name = input.name.trim() || parsed.name || (input.kind === "hotel" ? "My hotel" : "My Airbnb");

  return {
    id: `stay-${input.kind}`,
    kind: input.kind,
    name,
    googleMapsUrl: parsed.normalizedUrl,
    googleQuery: parsed.query || `${name}, Baguio City`,
    checkInDay: input.checkInDay,
    checkInTime: input.checkInTime,
    luggagePlan: input.luggagePlan,
    lat: parsed.lat ?? BAGUIO_CENTER.lat,
    lng: parsed.lng ?? BAGUIO_CENTER.lng,
    locationPrecision: parsed.locationPrecision,
  };
}
