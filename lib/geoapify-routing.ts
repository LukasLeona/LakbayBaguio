import {
  routeEstimateKey,
  type PlannerRouteEstimate,
  type PlannerRouteEstimates,
  type RouteDetailPair,
  type RouteEstimateLocation,
  type RouteEstimateMode,
  type RouteTerrain,
} from "@/lib/route-estimates";

type MatrixCell = { distance?: unknown; time?: unknown } | null;
type MatrixPayload = { sources_to_targets?: MatrixCell[][] };
type RoutingLeg = { elevation_range?: unknown };
type RoutingResult = {
  distance?: unknown;
  time?: unknown;
  legs?: RoutingLeg[];
};
type RoutingPayload = { results?: RoutingResult[] };

const MATRIX_CELL_LIMIT = 900;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const requestCache = new Map<string, { expiresAt: number; estimate: PlannerRouteEstimate }>();
const matrixRequestCache = new Map<string, { expiresAt: number; estimates: PlannerRouteEstimates }>();
const MINES_VIEW = { lat: 16.4196515, lng: 120.6269696 };
const GOOD_SHEPHERD = { lat: 16.4214729, lng: 120.6251922 };
const VERIFIED_WALKING_CORRIDORS: PlannerRouteEstimates = {
  [routeEstimateKey(MINES_VIEW, GOOD_SHEPHERD, "walk")]: {
    mode: "walk",
    distanceKm: 0.55,
    durationMinutes: 14,
    durationRange: { minimum: 13, maximum: 18 },
    confidence: "high",
    source: "verified-corridor",
    terrain: {
      elevationGainMeters: 18,
      elevationLossMeters: 2,
      averageClimbPercent: 3.3,
      maximumGradePercent: 10,
      level: "steep",
      warning: "Steep uphill connection—use the public road, allow extra time, and consider a taxi if carrying luggage.",
    },
  },
  [routeEstimateKey(GOOD_SHEPHERD, MINES_VIEW, "walk")]: {
    mode: "walk",
    distanceKm: 0.55,
    durationMinutes: 12,
    durationRange: { minimum: 11, maximum: 16 },
    confidence: "high",
    source: "verified-corridor",
    terrain: {
      elevationGainMeters: 2,
      elevationLossMeters: 18,
      averageClimbPercent: 0.4,
      maximumGradePercent: 10,
      level: "steep",
      warning: "Steep downhill connection—use the public road and take extra care in wet weather.",
    },
  },
};

export function getVerifiedWalkingCorridor(pair: RouteDetailPair) {
  return VERIFIED_WALKING_CORRIDORS[routeEstimateKey(pair.from, pair.to, "walk")];
}

function rounded(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function durationRange(minutes: number, mode: RouteEstimateMode) {
  const lowerRatio = mode === "walk" ? 0.95 : 0.9;
  const upperRatio = mode === "walk" ? 1.25 : 1.35;
  return {
    minimum: Math.max(1, Math.floor(minutes * lowerRatio)),
    maximum: Math.max(2, Math.ceil(minutes * upperRatio)),
  };
}

function matrixEstimate(cell: MatrixCell, mode: RouteEstimateMode): PlannerRouteEstimate | null {
  const distance = Number(cell?.distance);
  const time = Number(cell?.time);
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(time) || time <= 0) return null;
  const durationMinutes = Math.max(1, Math.ceil(time / 60));
  return {
    mode,
    distanceKm: rounded(distance / 1_000, 2),
    durationMinutes,
    durationRange: durationRange(durationMinutes, mode),
    confidence: mode === "walk" ? "high" : "medium",
    source: "geoapify-routing",
  };
}

function elevationPoints(legs: RoutingLeg[] | undefined) {
  const points: Array<[number, number]> = [];
  legs?.forEach((leg) => {
    if (!Array.isArray(leg.elevation_range)) return;
    leg.elevation_range.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) return;
      const distance = Number(entry[0]);
      const elevation = Number(entry[1]);
      if (Number.isFinite(distance) && Number.isFinite(elevation)) points.push([distance, elevation]);
    });
  });
  return points;
}

export function summarizeRouteTerrain(
  points: readonly [number, number][],
  routeDistanceMeters: number,
): RouteTerrain | undefined {
  if (points.length < 2 || routeDistanceMeters <= 0) return undefined;
  let gain = 0;
  let loss = 0;
  let maximumGrade = 0;

  for (let index = 1; index < points.length; index += 1) {
    const distanceDelta = points[index][0] - points[index - 1][0];
    const elevationDelta = points[index][1] - points[index - 1][1];
    if (elevationDelta > 0) gain += elevationDelta;
    else loss += Math.abs(elevationDelta);
    if (distanceDelta >= 20) {
      maximumGrade = Math.max(maximumGrade, Math.abs(elevationDelta / distanceDelta) * 100);
    }
  }

  const averageClimb = (gain / routeDistanceMeters) * 100;
  const level = gain >= 35 || maximumGrade >= 8
    ? "steep"
    : gain >= 15 || maximumGrade >= 5
      ? "hilly"
      : "gentle";
  const warning = level === "steep"
    ? "Steep uphill sections—allow extra time and consider a taxi if carrying luggage or mobility is limited."
    : level === "hilly"
      ? "Hilly walk—use comfortable shoes and allow a little recovery time."
      : undefined;

  return {
    elevationGainMeters: Math.round(gain),
    elevationLossMeters: Math.round(loss),
    averageClimbPercent: rounded(averageClimb),
    maximumGradePercent: rounded(maximumGrade),
    level,
    ...(warning ? { warning } : {}),
  };
}

async function geoapifyFetch(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Geoapify routing returned ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchGeoapifyMatrix(
  locations: readonly RouteEstimateLocation[],
  modes: readonly RouteEstimateMode[],
  apiKey: string,
) {
  const estimates: PlannerRouteEstimates = {};
  const targetCount = locations.length;
  if (targetCount < 2) return estimates;
  const sourceChunkSize = Math.max(1, Math.floor(MATRIX_CELL_LIMIT / targetCount));

  for (const mode of modes) {
    for (let sourceOffset = 0; sourceOffset < locations.length; sourceOffset += sourceChunkSize) {
      const sources = locations.slice(sourceOffset, sourceOffset + sourceChunkSize);
      const requestKey = `${mode}:${sources.map(({ lat, lng }) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|")}>${locations.map(({ lat, lng }) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|")}`;
      const cached = matrixRequestCache.get(requestKey);
      if (cached && cached.expiresAt > Date.now()) {
        Object.assign(estimates, cached.estimates);
        continue;
      }
      const response = await geoapifyFetch(
        `https://api.geoapify.com/v1/routematrix?apiKey=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            ...(mode === "drive" ? { traffic: "approximated" } : {}),
            sources: sources.map(({ lng, lat }) => ({ location: [lng, lat] })),
            targets: locations.map(({ lng, lat }) => ({ location: [lng, lat] })),
          }),
        },
      );
      const payload = await response.json() as MatrixPayload;
      const requestEstimates: PlannerRouteEstimates = {};
      payload.sources_to_targets?.forEach((row, localSourceIndex) => {
        const from = sources[localSourceIndex];
        if (!from) return;
        row.forEach((cell, targetIndex) => {
          const to = locations[targetIndex];
          if (!to || from === to) return;
          const estimate = matrixEstimate(cell, mode);
          if (estimate) requestEstimates[routeEstimateKey(from, to, mode)] = estimate;
        });
      });
      Object.assign(estimates, requestEstimates);
      matrixRequestCache.set(requestKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        estimates: requestEstimates,
      });
    }
  }

  return estimates;
}

async function fetchWalkingDetail(
  pair: RouteDetailPair,
  apiKey: string,
): Promise<[string, PlannerRouteEstimate] | null> {
  const key = routeEstimateKey(pair.from, pair.to, "walk");
  const verified = getVerifiedWalkingCorridor(pair);
  if (verified) return [key, verified];
  const cached = requestCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return [key, cached.estimate];
  const params = new URLSearchParams({
    waypoints: `${pair.from.lat},${pair.from.lng}|${pair.to.lat},${pair.to.lng}`,
    mode: "walk",
    details: "elevation",
    format: "json",
    apiKey,
  });
  const response = await geoapifyFetch(`https://api.geoapify.com/v1/routing?${params}`);
  const payload = await response.json() as RoutingPayload;
  const result = payload.results?.[0];
  const distance = Number(result?.distance);
  const time = Number(result?.time);
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(time) || time <= 0) return null;
  const durationMinutes = Math.max(1, Math.ceil(time / 60));
  const terrain = summarizeRouteTerrain(elevationPoints(result?.legs), distance);
  const estimate: PlannerRouteEstimate = {
    mode: "walk",
    distanceKm: rounded(distance / 1_000, 2),
    durationMinutes,
    durationRange: durationRange(durationMinutes, "walk"),
    confidence: "high",
    source: "geoapify-routing",
    ...(terrain ? { terrain } : {}),
  };
  requestCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, estimate });
  return [key, estimate];
}

export async function fetchGeoapifyWalkingDetails(
  pairs: readonly RouteDetailPair[],
  apiKey: string,
) {
  const estimates: PlannerRouteEstimates = {};
  for (let offset = 0; offset < pairs.length; offset += 4) {
    const results = await Promise.all(
      pairs.slice(offset, offset + 4).map((pair) => fetchWalkingDetail(pair, apiKey)),
    );
    results.forEach((result) => {
      if (result) estimates[result[0]] = result[1];
    });
  }
  return estimates;
}
