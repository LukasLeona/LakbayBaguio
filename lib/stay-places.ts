import { hotels } from "@/lib/places";

export type StaySuggestion = {
  id: string;
  placeId: string | null;
  name: string;
  address: string;
  source: "geoapify" | "curated";
  types: string[];
  location: {
    lat: number;
    lng: number;
    googleMapsUrl: string;
  };
};

export type StayPlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
};

type GeoapifyProperties = {
  place_id?: string;
  name?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  lat?: number;
  lon?: number;
  categories?: string[];
};

type GeoapifyAutocompletePayload = {
  results?: GeoapifyProperties[];
  features?: Array<{ properties?: GeoapifyProperties }>;
};

const BAGUIO_SEARCH = Object.freeze({ latitude: 16.4023, longitude: 120.596, radius: 28_000 });

export function normalizeStayQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 100);
}

export function canonicalGoogleMapsPlaceUrl(_name: string, lat: number, lng: number) {
  const query = encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&utm_source=baguio_buddy&utm_campaign=place_details_search`;
}

export function searchCuratedStays(query: string): StaySuggestion[] {
  const needle = normalizeStayQuery(query).toLowerCase();
  if (needle.length < 2) return [];

  return hotels
    .filter((hotel) => [hotel.name, hotel.address, hotel.area, ...hotel.tags].join(" ").toLowerCase().includes(needle))
    .slice(0, 5)
    .map((hotel) => ({
      id: `curated:${hotel.id}`,
      placeId: null,
      name: hotel.name,
      address: `${hotel.address}, Baguio City`,
      source: "curated" as const,
      types: ["accommodation.hotel"],
      location: {
        lat: hotel.lat,
        lng: hotel.lng,
        googleMapsUrl: canonicalGoogleMapsPlaceUrl(hotel.name, hotel.lat, hotel.lng),
      },
    }));
}

function combineSuggestions(provider: StaySuggestion[], curated: StaySuggestion[]) {
  const names = new Set<string>();
  return [...provider, ...curated].filter((suggestion) => {
    const key = suggestion.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (names.has(key)) return false;
    names.add(key);
    return true;
  }).slice(0, 6);
}

export async function fetchGeoapifyStaySuggestions(input: string, apiKey: string) {
  const query = new URLSearchParams({
    text: input,
    format: "json",
    filter: `circle:${BAGUIO_SEARCH.longitude},${BAGUIO_SEARCH.latitude},${BAGUIO_SEARCH.radius}`,
    bias: `proximity:${BAGUIO_SEARCH.longitude},${BAGUIO_SEARCH.latitude}`,
    category: "accommodation",
    type: "amenity",
    limit: "6",
    lang: "en",
    apiKey,
  });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${query}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Accommodation suggestions are temporarily unavailable.");
  const payload = await response.json() as GeoapifyAutocompletePayload;
  const rows = payload.results ?? payload.features?.flatMap((feature) => feature.properties ? [feature.properties] : []) ?? [];
  const provider = rows.flatMap((properties): StaySuggestion[] => {
    const lat = Number(properties.lat);
    const lng = Number(properties.lon);
    const name = properties.name?.trim() || properties.address_line1?.trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const placeId = properties.place_id || `${lat},${lng}`;
    return [{
      id: `geoapify:${placeId}`,
      placeId,
      name,
      address: properties.formatted || properties.address_line2 || "Baguio City, Philippines",
      source: "geoapify",
      types: properties.categories ?? ["accommodation"],
      location: {
        lat,
        lng,
        googleMapsUrl: canonicalGoogleMapsPlaceUrl(name, lat, lng),
      },
    }];
  });

  return combineSuggestions(provider, searchCuratedStays(input));
}
