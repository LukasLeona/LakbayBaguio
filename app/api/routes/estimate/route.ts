import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api-rate-limit";
import {
  fetchGeoapifyMatrix,
  fetchGeoapifyWalkingDetails,
} from "@/lib/geoapify-routing";
import {
  mergeRouteEstimates,
  uniqueRouteLocations,
  type RouteDetailPair,
  type RouteEstimateLocation,
  type RouteEstimateMode,
} from "@/lib/route-estimates";

const MAX_LOCATIONS = 55;
const MAX_DETAIL_PAIRS = 20;
const BAGUIO_BOUNDS = { minLat: 16.15, maxLat: 16.75, minLng: 120.35, maxLng: 120.95 };

function coordinate(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function validPoint(value: unknown): RouteEstimateLocation | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { lat?: unknown; lng?: unknown; name?: unknown };
  const lat = coordinate(candidate.lat);
  const lng = coordinate(candidate.lng);
  if (
    lat === null || lng === null
    || lat < BAGUIO_BOUNDS.minLat || lat > BAGUIO_BOUNDS.maxLat
    || lng < BAGUIO_BOUNDS.minLng || lng > BAGUIO_BOUNDS.maxLng
  ) return null;
  return {
    lat,
    lng,
    ...(typeof candidate.name === "string" ? { name: candidate.name.slice(0, 100) } : {}),
  };
}

function validModes(value: unknown): RouteEstimateMode[] {
  if (!Array.isArray(value)) return ["walk", "drive"];
  return [...new Set(value.filter((mode): mode is RouteEstimateMode => mode === "walk" || mode === "drive"))];
}

function validPairs(value: unknown): RouteDetailPair[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_DETAIL_PAIRS).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { from?: unknown; to?: unknown };
    const from = validPoint(candidate.from);
    const to = validPoint(candidate.to);
    return from && to ? [{ from, to }] : [];
  });
}

export async function POST(request: Request) {
  const limit = consumeRateLimit(request, "route-estimates", 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many route calculations. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { locations?: unknown; modes?: unknown; detailPairs?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid route request." }, { status: 400 });
  }

  const rawLocations = Array.isArray(body.locations) ? body.locations : [];
  if (rawLocations.length > MAX_LOCATIONS) {
    return NextResponse.json({ error: `Choose at most ${MAX_LOCATIONS - 3} places per route.` }, { status: 422 });
  }
  const locations = uniqueRouteLocations(rawLocations.map(validPoint).filter(Boolean) as RouteEstimateLocation[]);
  const modes = validModes(body.modes);
  const detailPairs = validPairs(body.detailPairs);
  if (locations.length < 2 || (!modes.length && !detailPairs.length)) {
    return NextResponse.json({ error: "At least two valid Baguio locations are required." }, { status: 422 });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      estimates: {},
      warning: "Live routing is not configured; conservative local estimates will be used.",
    });
  }

  try {
    const matrix = await fetchGeoapifyMatrix(locations, modes, apiKey);
    const details = detailPairs.length
      ? await fetchGeoapifyWalkingDetails(detailPairs, apiKey)
      : {};
    return NextResponse.json(
      { configured: true, estimates: mergeRouteEstimates(matrix, details) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({
      configured: true,
      estimates: {},
      warning: "Live routing could not respond; conservative local estimates will be used.",
    });
  }
}
