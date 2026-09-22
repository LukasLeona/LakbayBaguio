import { hotels } from "@/lib/places";

export type StaySuggestion = {
  id: string;
  placeId: string | null;
  name: string;
  address: string;
  source: "google" | "curated";
  types: string[];
  location?: {
    lat: number;
    lng: number;
    googleMapsUrl: string;
  };
};

export type GoogleStayDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
};

type GoogleAutocompletePayload = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }>;
};

type GooglePlacePayload = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

const BAGUIO_SEARCH = Object.freeze({ latitude: 16.4023, longitude: 120.596, radius: 28_000 });
const STAY_TYPES = ["hotel", "lodging", "guest_house", "bed_and_breakfast", "private_guest_room"];

export function normalizeStayQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 100);
}

export function validSessionToken(value: string) {
  return /^[A-Za-z0-9_-]{16,96}$/.test(value);
}

export function validPlaceId(value: string) {
  return /^[A-Za-z0-9_-]{5,256}$/.test(value);
}

export function canonicalGoogleMapsPlaceUrl(name: string, lat: number, lng: number) {
  return `https://www.google.com/maps/place/${encodeURIComponent(name)}/@${lat},${lng},17z/data=!3d${lat}!4d${lng}`;
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
      types: ["hotel"],
      location: {
        lat: hotel.lat,
        lng: hotel.lng,
        googleMapsUrl: canonicalGoogleMapsPlaceUrl(hotel.name, hotel.lat, hotel.lng),
      },
    }));
}

function combineSuggestions(google: StaySuggestion[], curated: StaySuggestion[]) {
  const names = new Set<string>();
  return [...google, ...curated].filter((suggestion) => {
    const key = suggestion.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (names.has(key)) return false;
    names.add(key);
    return true;
  }).slice(0, 6);
}

export async function fetchStaySuggestions(input: string, sessionToken: string, apiKey: string) {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
    },
    body: JSON.stringify({
      input,
      sessionToken,
      includedPrimaryTypes: STAY_TYPES,
      includedRegionCodes: ["ph"],
      languageCode: "en",
      regionCode: "PH",
      locationRestriction: {
        circle: {
          center: { latitude: BAGUIO_SEARCH.latitude, longitude: BAGUIO_SEARCH.longitude },
          radius: BAGUIO_SEARCH.radius,
        },
      },
    }),
  });

  if (!response.ok) throw new Error("Google Places autocomplete is temporarily unavailable.");
  const payload = await response.json() as GoogleAutocompletePayload;
  const google = (payload.suggestions ?? []).flatMap((suggestion): StaySuggestion[] => {
    const prediction = suggestion.placePrediction;
    const placeId = prediction?.placeId;
    const name = prediction?.structuredFormat?.mainText?.text || prediction?.text?.text;
    if (!placeId || !name) return [];
    return [{
      id: `google:${placeId}`,
      placeId,
      name,
      address: prediction?.structuredFormat?.secondaryText?.text || "Baguio City, Philippines",
      source: "google",
      types: prediction?.types ?? [],
    }];
  });

  return combineSuggestions(google, searchCuratedStays(input));
}

export async function fetchStayDetails(placeId: string, sessionToken: string, apiKey: string): Promise<GoogleStayDetails> {
  const query = new URLSearchParams({ languageCode: "en", regionCode: "PH", sessionToken });
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${query}`, {
    cache: "no-store",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
    },
  });

  if (!response.ok) throw new Error("Google Places could not open that accommodation.");
  const place = await response.json() as GooglePlacePayload;
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("That accommodation did not include an exact map pin.");
  }

  return {
    placeId: place.id || placeId,
    name,
    address: place.formattedAddress || "Baguio City, Philippines",
    lat: lat as number,
    lng: lng as number,
    // Keep a coordinate-bearing URL so the planner can verify the selected pin
    // locally without another network request. googleMapsUri can be a CID URL.
    googleMapsUrl: canonicalGoogleMapsPlaceUrl(name, lat as number, lng as number),
  };
}
