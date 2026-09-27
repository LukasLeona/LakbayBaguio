import type { Coordinates, TransportMode } from "@/lib/planner-types";

export type RouteEstimateMode = "walk" | "drive";
export type RouteConfidence = "high" | "medium" | "low";
export type RouteTerrainLevel = "gentle" | "hilly" | "steep";

export type RouteTerrain = {
  elevationGainMeters: number;
  elevationLossMeters: number;
  averageClimbPercent: number;
  maximumGradePercent: number;
  level: RouteTerrainLevel;
  warning?: string;
};

export type PlannerRouteEstimate = {
  mode: RouteEstimateMode;
  distanceKm: number;
  durationMinutes: number;
  durationRange: { minimum: number; maximum: number };
  confidence: RouteConfidence;
  source: "geoapify-routing" | "verified-corridor";
  terrain?: RouteTerrain;
};

export type PlannerRouteEstimates = Record<string, PlannerRouteEstimate>;

export type RouteEstimateLocation = Coordinates & {
  name?: string;
  navigation?: Coordinates;
};

export type RouteDetailPair = {
  from: Coordinates;
  to: Coordinates;
};

export type RouteEstimateResponse = {
  configured: boolean;
  estimates: PlannerRouteEstimates;
  warning?: string;
};

const COORDINATE_PRECISION = 5;

export function routeCoordinates(location: RouteEstimateLocation): Coordinates {
  return location.navigation ?? location;
}

export function routeCoordinateKey(location: RouteEstimateLocation) {
  const point = routeCoordinates(location);
  return `${point.lat.toFixed(COORDINATE_PRECISION)},${point.lng.toFixed(COORDINATE_PRECISION)}`;
}

export function routeEstimateKey(
  from: Coordinates,
  to: Coordinates,
  mode: RouteEstimateMode,
) {
  return `${mode}:${routeCoordinateKey(from)}>${routeCoordinateKey(to)}`;
}

export function routeModeForTransport(mode: TransportMode): RouteEstimateMode {
  return mode === "walk" ? "walk" : "drive";
}

export function findRouteEstimate(
  estimates: PlannerRouteEstimates | undefined,
  from: Coordinates,
  to: Coordinates,
  mode: RouteEstimateMode,
) {
  return estimates?.[routeEstimateKey(from, to, mode)];
}

export function uniqueRouteLocations(
  locations: readonly RouteEstimateLocation[],
) {
  const unique = new Map<string, RouteEstimateLocation>();
  locations.forEach((location) => {
    const point = routeCoordinates(location);
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    unique.set(routeCoordinateKey(location), { ...location, lat: point.lat, lng: point.lng, navigation: undefined });
  });
  return [...unique.values()];
}

export function mergeRouteEstimates(
  ...collections: Array<PlannerRouteEstimates | undefined>
) {
  return Object.assign({}, ...collections.filter(Boolean)) as PlannerRouteEstimates;
}

export async function fetchPlannerRouteEstimates(
  locations: readonly RouteEstimateLocation[],
  options: {
    modes?: readonly RouteEstimateMode[];
    detailPairs?: readonly RouteDetailPair[];
    signal?: AbortSignal;
  } = {},
): Promise<RouteEstimateResponse> {
  const response = await fetch("/api/routes/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locations: uniqueRouteLocations(locations),
      modes: options.modes ?? ["walk", "drive"],
      detailPairs: (options.detailPairs ?? []).map(({ from, to }) => ({
        from: routeCoordinates(from),
        to: routeCoordinates(to),
      })),
    }),
    cache: "no-store",
    signal: options.signal,
  });

  const payload = await response.json().catch(() => null) as RouteEstimateResponse | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload && payload.error
      ? payload.error
      : "Live route estimates are temporarily unavailable.");
  }
  return payload as RouteEstimateResponse;
}
