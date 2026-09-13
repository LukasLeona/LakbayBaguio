/**
 * Deterministic itinerary planning for Lakbay Baguio.
 *
 * This module intentionally contains no browser state, network calls, or UI logic.
 * The route, fare, and schedule guidance it returns is a planning estimate and
 * should be presented with the exported disclaimer.
 */

import type {
  Coordinates,
  FareSettings,
  PlannerArea,
  PlannerDestination,
  RouteGuide,
  StartLocation,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";

export type {
  FareSettings,
  PlannerDestination,
  StartLocation,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";

export const PLANNING_DISCLAIMER =
  "Travel time, fares, attraction hours, and jeepney loading areas are estimates. Confirm current details locally.";

export const DEFAULT_FARE_SETTINGS = Object.freeze({
  jeepMinimum: 13,
  jeepBaseKm: 4,
  jeepPerKm: 1.8,
  taxiFlag: 50,
  taxiPerKm: 15,
});

export const PLANNER_LIMITS = Object.freeze({
  minimumDestinations: 2,
  minimumDays: 1,
  maximumDays: 5,
  minimumAvailableMinutes: 4 * 60,
  maximumAvailableMinutes: 12 * 60,
  minimumTravelers: 1,
  maximumTravelers: 12,
});

export type PlannerLocation = Coordinates & {
  id?: string;
  name: string;
  area?: PlannerArea;
  googleQuery?: string;
};

export type PlannerStartLocation = StartLocation;
export type PlannerRouteGuide = RouteGuide;

export type PlannerRequest = {
  start: PlannerStartLocation;
  destinations: readonly PlannerDestination[];
  date?: string;
  numberOfDays: number;
  availableMinutes: number;
  travelers: number;
  modes: readonly TransportMode[];
  preference: TravelPreference;
  fareSettings?: Partial<FareSettings>;
  /** A 24-hour HH:mm value. Defaults to 08:00 when omitted. */
  startTime?: string;
  /** Alternative to startTime, primarily useful for tests and restored state. */
  startMinutes?: number;
};

export type PlannerValidationCode =
  | "required"
  | "invalid"
  | "range"
  | "duplicate";

export type PlannerValidationIssue = {
  field: string;
  code: PlannerValidationCode;
  message: string;
};

export type PlannedTransport = {
  mode: TransportMode;
  minutes: number;
  farePerPerson: number;
  vehicleFare: number;
  totalFare: number;
  instructions: string[];
  loadingMapUrl: string | null;
  legMapUrl: string;
};

export type PlannedStop = {
  number: number;
  destination: PlannerDestination;
  arrivalMinutes: number;
  departureMinutes: number;
  waitMinutes: number;
  distance: number;
  transport: PlannedTransport;
  from: PlannerLocation;
  eveningAddOn?: true;
  placeMapUrl: string;
  mapPreviewUrl: string;
};

export type PlannedDay = {
  index: number;
  items: PlannedStop[];
  unscheduled: PlannerDestination[];
  notices: string[];
  totalDistance: number;
  totalFare: number;
  totalTravelMinutes: number;
  startMinutes: number;
  endMinutes: number;
  routeMapUrl: string;
};

export type ItineraryTotals = {
  scheduledStops: number;
  unscheduledStops: number;
  distance: number;
  fare: number;
  travelMinutes: number;
};

export type PlannedItinerary = {
  /** Stable for the same planner inputs; it deliberately does not use Date.now(). */
  id: string;
  title: string;
  start: PlannerStartLocation;
  days: PlannedDay[];
  preference: TravelPreference;
  travelers: number;
  modes: TransportMode[];
  fareSettings: FareSettings;
  date: string;
  numberOfDays: number;
  availableMinutes: number;
  startMinutes: number;
  selectedCount: number;
  selectedDestinationIds: string[];
  totals: ItineraryTotals;
  disclaimer: string;
};

type DayBuildOptions = {
  dayIndex: number;
  preference: TravelPreference;
  availableMinutes: number;
  travelers: number;
  modes: readonly TransportMode[];
  fareSettings: FareSettings;
  startMinutes: number;
};

type TransportOptions = Pick<
  DayBuildOptions,
  "preference" | "travelers" | "modes" | "fareSettings"
>;

const VALID_PREFERENCES = new Set<TravelPreference>([
  "balanced",
  "cheapest",
  "fastest",
  "less-walking",
]);

const VALID_MODES = new Set<TransportMode>(["walk", "jeepney", "taxi"]);

const GENERIC_ROUTE_GUIDE: PlannerRouteGuide = {
  modeLabel: "Local jeepney",
  loadingArea:
    "Ask at the nearest official loading area or a local transport dispatcher",
  loadingQuery: "Baguio City jeepney terminal",
  signboard: "Confirm the route closest to your destination before boarding",
  returnHint:
    "Ask the driver or dispatcher where to board a safe city-bound return trip.",
};

export class PlannerValidationError extends Error {
  readonly issues: PlannerValidationIssue[];

  constructor(issues: PlannerValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "PlannerValidationError";
    this.issues = issues;
  }
}

/**
 * Returns every actionable problem instead of stopping at the first invalid field.
 */
export function validatePlannerRequest(
  request: PlannerRequest,
): PlannerValidationIssue[] {
  const issues: PlannerValidationIssue[] = [];
  const destinations = Array.isArray(request?.destinations)
    ? request.destinations
    : [];
  const modes = Array.isArray(request?.modes) ? request.modes : [];

  if (!request?.start) {
    issues.push({
      field: "start",
      code: "required",
      message: "Choose a starting point.",
    });
  } else {
    validateLocation(request.start, "start", issues);
  }

  if (destinations.length < PLANNER_LIMITS.minimumDestinations) {
    issues.push({
      field: "destinations",
      code: "required",
      message: `Select at least ${PLANNER_LIMITS.minimumDestinations} destinations to build a useful route.`,
    });
  }

  const seenDestinationIds = new Set<string>();
  destinations.forEach((destination, index) => {
    const field = `destinations.${index}`;
    validateLocation(destination, field, issues);

    if (!nonEmptyString(destination.id)) {
      issues.push({
        field: `${field}.id`,
        code: "required",
        message: `Destination ${index + 1} needs an id.`,
      });
    } else if (seenDestinationIds.has(destination.id)) {
      issues.push({
        field: `${field}.id`,
        code: "duplicate",
        message: `${destination.name || `Destination ${index + 1}`} was selected more than once.`,
      });
    } else {
      seenDestinationIds.add(destination.id);
    }

    if (!Number.isFinite(destination.duration) || destination.duration <= 0) {
      issues.push({
        field: `${field}.duration`,
        code: "range",
        message: `${destination.name || `Destination ${index + 1}`} needs a positive visit duration.`,
      });
    }

    if (parseTimeToMinutes(destination.open) === null) {
      issues.push({
        field: `${field}.open`,
        code: "invalid",
        message: `${destination.name || `Destination ${index + 1}`} has an invalid opening time.`,
      });
    }

    if (parseTimeToMinutes(destination.close) === null) {
      issues.push({
        field: `${field}.close`,
        code: "invalid",
        message: `${destination.name || `Destination ${index + 1}`} has an invalid closing time.`,
      });
    }
  });

  if (
    !Number.isInteger(request?.numberOfDays) ||
    request.numberOfDays < PLANNER_LIMITS.minimumDays ||
    request.numberOfDays > PLANNER_LIMITS.maximumDays
  ) {
    issues.push({
      field: "numberOfDays",
      code: "range",
      message: `Trip length must be between ${PLANNER_LIMITS.minimumDays} and ${PLANNER_LIMITS.maximumDays} days.`,
    });
  }

  if (
    !Number.isFinite(request?.availableMinutes) ||
    request.availableMinutes < PLANNER_LIMITS.minimumAvailableMinutes ||
    request.availableMinutes > PLANNER_LIMITS.maximumAvailableMinutes
  ) {
    issues.push({
      field: "availableMinutes",
      code: "range",
      message: "Daily available time must be between 4 and 12 hours.",
    });
  }

  if (
    !Number.isInteger(request?.travelers) ||
    request.travelers < PLANNER_LIMITS.minimumTravelers ||
    request.travelers > PLANNER_LIMITS.maximumTravelers
  ) {
    issues.push({
      field: "travelers",
      code: "range",
      message: `Travelers must be between ${PLANNER_LIMITS.minimumTravelers} and ${PLANNER_LIMITS.maximumTravelers}.`,
    });
  }

  if (!VALID_PREFERENCES.has(request?.preference)) {
    issues.push({
      field: "preference",
      code: "invalid",
      message: "Choose a valid travel preference.",
    });
  }

  if (!modes.length) {
    issues.push({
      field: "modes",
      code: "required",
      message: "Choose at least one allowed travel mode.",
    });
  } else {
    modes.forEach((mode, index) => {
      if (!VALID_MODES.has(mode)) {
        issues.push({
          field: `modes.${index}`,
          code: "invalid",
          message: `Unknown travel mode: ${String(mode)}.`,
        });
      }
    });
  }

  if (request?.startMinutes !== undefined) {
    if (
      !Number.isFinite(request.startMinutes) ||
      request.startMinutes < 0 ||
      request.startMinutes >= 24 * 60
    ) {
      issues.push({
        field: "startMinutes",
        code: "range",
        message: "Daily start time must fall within one calendar day.",
      });
    }
  } else if (
    request?.startTime !== undefined &&
    parseTimeToMinutes(request.startTime) === null
  ) {
    issues.push({
      field: "startTime",
      code: "invalid",
      message: "Daily start time must use HH:mm format.",
    });
  }

  if (request?.date && !isValidIsoDate(request.date)) {
    issues.push({
      field: "date",
      code: "invalid",
      message: "Trip date must be a valid YYYY-MM-DD date.",
    });
  }

  const fares = mergeFareSettings(request?.fareSettings);
  (Object.keys(fares) as Array<keyof FareSettings>).forEach((key) => {
    if (!Number.isFinite(fares[key]) || fares[key] < 0) {
      issues.push({
        field: `fareSettings.${key}`,
        code: "range",
        message: "Fare assumptions must be zero or greater.",
      });
    }
  });

  return issues;
}

/**
 * Builds a complete itinerary or throws PlannerValidationError with all issues.
 */
export function generateItinerary(request: PlannerRequest): PlannedItinerary {
  const issues = validatePlannerRequest(request);
  if (issues.length) throw new PlannerValidationError(issues);

  const startMinutes = resolveStartMinutes(request);
  const fareSettings = mergeFareSettings(request.fareSettings);
  const modes = uniqueModes(request.modes);
  const destinations = [...request.destinations];
  const buckets = buildDayBuckets(
    request.start,
    destinations,
    request.numberOfDays,
    request.availableMinutes,
    request.preference,
    startMinutes,
  );

  const dayOptions = {
    preference: request.preference,
    availableMinutes: request.availableMinutes,
    travelers: request.travelers,
    modes,
    fareSettings,
    startMinutes,
  };

  const daysWithoutRoutes = buckets.map((bucket, dayIndex) =>
    buildDayItinerary(request.start, bucket, {
      ...dayOptions,
      dayIndex,
    }),
  );

  const days = daysWithoutRoutes.map((day) => ({
    ...day,
    routeMapUrl: buildDayRouteUrl(request.start, day),
  }));
  const totals = summarizeDays(days);
  const date = request.date || "";

  const identity = stableHash(
    JSON.stringify({
      start: locationForUrl(request.start),
      destinations: destinations.map((destination) => destination.id),
      date,
      numberOfDays: request.numberOfDays,
      availableMinutes: request.availableMinutes,
      travelers: request.travelers,
      modes,
      preference: request.preference,
      fareSettings,
      startMinutes,
    }),
  );

  return {
    id: `trip-${identity}`,
    title:
      request.numberOfDays > 1
        ? `Your ${request.numberOfDays}-day Baguio route`
        : "Your Baguio day, arranged",
    start: request.start,
    days,
    preference: request.preference,
    travelers: request.travelers,
    modes,
    fareSettings,
    date,
    numberOfDays: request.numberOfDays,
    availableMinutes: request.availableMinutes,
    startMinutes,
    selectedCount: destinations.length,
    selectedDestinationIds: destinations.map((destination) => destination.id),
    totals,
    disclaimer: PLANNING_DISCLAIMER,
  };
}

/**
 * Separates regular, Atok, and evening-only stops before scheduling each day.
 * Unlike the legacy implementation, the selected preference is not replaced
 * with "balanced" while calculating the cross-day order.
 */
export function buildDayBuckets(
  start: PlannerLocation,
  destinations: readonly PlannerDestination[],
  numberOfDays: number,
  availableMinutes: number,
  preference: TravelPreference,
  startMinutes: number,
): PlannerDestination[][] {
  const buckets = Array.from(
    { length: numberOfDays },
    (): PlannerDestination[] => [],
  );
  const nightStops = destinations.filter(
    (destination) => destination.timeSlot === "night",
  );
  const atokStops = destinations.filter(
    (destination) =>
      destination.area === "Atok Side Trip" &&
      destination.timeSlot !== "night",
  );
  const regularStops = destinations.filter(
    (destination) =>
      destination.timeSlot !== "night" &&
      destination.area !== "Atok Side Trip",
  );

  if (atokStops.length && numberOfDays > 1) {
    buckets[numberOfDays - 1].push(...atokStops);
  } else if (atokStops.length) {
    regularStops.push(...atokStops);
  }

  const route = optimizeRoute(
    start,
    regularStops,
    preference,
    startMinutes,
  );
  const targetPerDay = Math.max(180, availableMinutes - 45);
  const finalRegularDay =
    atokStops.length && numberOfDays > 1 ? numberOfDays - 2 : numberOfDays - 1;
  let currentDay = 0;
  let load = 0;

  route.forEach((destination) => {
    const estimated = destination.duration + 28;
    if (
      currentDay < finalRegularDay &&
      load > 0 &&
      load + estimated > targetPerDay
    ) {
      currentDay += 1;
      load = 0;
    }
    buckets[currentDay].push(destination);
    load += estimated;
  });

  nightStops.forEach((destination, index) => {
    const targetDay = Math.min(index, Math.max(0, numberOfDays - 1));
    buckets[targetDay].push(destination);
  });

  return buckets;
}

/** Nearest-neighbour ordering with opening-hour, area, and trip-scope penalties. */
export function optimizeRoute(
  start: PlannerLocation,
  destinations: readonly PlannerDestination[],
  preference: TravelPreference,
  startMinutes: number,
): PlannerDestination[] {
  const remaining = destinations.map((destination, originalIndex) => ({
    destination,
    originalIndex,
  }));
  const route: PlannerDestination[] = [];
  let current: PlannerLocation = start;
  let cursor = Number.isFinite(startMinutes) ? startMinutes : 8 * 60;

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestOriginalIndex = Number.POSITIVE_INFINITY;

    remaining.forEach(({ destination, originalIndex }, index) => {
      const distance = haversineKm(current, destination);
      const estimatedArrival =
        cursor + estimateTravelMinutes(distance, "taxi");
      const { open, close } = openingWindow(destination);
      const effectiveClose =
        destination.timeSlot === "night" ? 26 * 60 : close;
      const waitPenalty = Math.max(0, open - estimatedArrival) * 0.012;
      const closurePenalty =
        estimatedArrival + destination.duration > effectiveClose ? 100 : 0;
      const sameAreaBonus =
        current.area && current.area === destination.area ? -0.45 : 0;
      const sideTripPenalty =
        destination.scope && destination.scope !== "Baguio City" ? 0.8 : 0;
      const preferencePenalty =
        preference === "fastest" ? destination.duration / 600 : 0;
      const score =
        distance +
        waitPenalty +
        closurePenalty +
        sameAreaBonus +
        sideTripPenalty +
        preferencePenalty;

      if (
        score < bestScore ||
        (score === bestScore && originalIndex < bestOriginalIndex)
      ) {
        bestScore = score;
        bestIndex = index;
        bestOriginalIndex = originalIndex;
      }
    });

    const [{ destination: next }] = remaining.splice(bestIndex, 1);
    route.push(next);
    cursor +=
      estimateTravelMinutes(haversineKm(current, next), "taxi") +
      next.duration;
    current = next;
  }

  return route;
}

export function buildDayItinerary(
  start: PlannerLocation,
  bucket: readonly PlannerDestination[],
  options: DayBuildOptions,
): Omit<PlannedDay, "routeMapUrl"> {
  const nightStops = bucket.filter(
    (destination) => destination.timeSlot === "night",
  );
  const daytime = bucket.filter(
    (destination) => destination.timeSlot !== "night",
  );
  const ordered = optimizeRoute(
    start,
    daytime,
    options.preference,
    options.startMinutes,
  );
  const items: PlannedStop[] = [];
  const unscheduled: PlannerDestination[] = [];
  const notices: string[] = [];
  let current: PlannerLocation = start;
  let cursor = options.startMinutes;
  const dayEnd = options.startMinutes + options.availableMinutes;

  ordered.forEach((destination) => {
    const distance = haversineKm(current, destination);
    const transport = chooseTransport(
      current,
      destination,
      distance,
      options,
    );
    const arrival = cursor + transport.minutes;
    const { open, close } = openingWindow(destination);
    const scheduledArrival = Math.max(arrival, open);
    const wait = Math.max(0, open - arrival);

    // Preserve the legacy 90-minute grace period for an arrival just beyond the
    // chosen day window, but never schedule a visit after the attraction closes.
    if (
      scheduledArrival + destination.duration > close ||
      scheduledArrival > dayEnd + 90
    ) {
      unscheduled.push(destination);
      return;
    }

    items.push(
      createPlannedStop({
        destination,
        from: current,
        arrivalMinutes: scheduledArrival,
        waitMinutes: wait,
        distance,
        transport,
        number: items.length + 1,
      }),
    );
    cursor = scheduledArrival + destination.duration;
    current = destination;
  });

  nightStops.forEach((destination) => {
    const distance = haversineKm(current, destination);
    const transport = chooseTransport(
      current,
      destination,
      distance,
      options,
    );
    const afterTravel = cursor + transport.minutes;
    const { open, close } = openingWindow(destination);
    const scheduledArrival = Math.max(afterTravel, open);
    const wait = Math.max(0, scheduledArrival - afterTravel);

    if (scheduledArrival + destination.duration > close) {
      unscheduled.push(destination);
      notices.push(
        `${destination.name} cannot fit before its estimated closing time.`,
      );
      return;
    }

    if (scheduledArrival > dayEnd) {
      notices.push(
        `${destination.name} is an evening add-on at ${minutesToTime(scheduledArrival)} because it does not operate in the morning.`,
      );
    }

    items.push(
      createPlannedStop({
        destination,
        from: current,
        arrivalMinutes: scheduledArrival,
        waitMinutes: wait,
        distance,
        transport,
        number: items.length + 1,
        eveningAddOn: true,
      }),
    );
    cursor = scheduledArrival + destination.duration;
    current = destination;
  });

  if (unscheduled.length) {
    notices.push(
      `${unscheduled.length} selected ${unscheduled.length === 1 ? "place does" : "places do"} not fit safely within this day's opening hours and time allowance.`,
    );
  }

  return {
    index: options.dayIndex,
    items,
    unscheduled,
    notices,
    totalDistance: roundDistance(
      items.reduce((sum, item) => sum + item.distance, 0),
    ),
    totalFare: roundMoney(
      items.reduce((sum, item) => sum + item.transport.totalFare, 0),
    ),
    totalTravelMinutes: items.reduce(
      (sum, item) => sum + item.transport.minutes,
      0,
    ),
    startMinutes: options.startMinutes,
    endMinutes: cursor,
  };
}

export function chooseTransport(
  from: PlannerLocation,
  to: PlannerDestination,
  distance: number,
  options: TransportOptions,
): PlannedTransport {
  const allowed = new Set(options.modes);
  const walkLimit = options.preference === "less-walking" ? 0.45 : 0.85;
  const jeepneyIsSuitable =
    distance <= 10 &&
    to.area !== "Atok Side Trip" &&
    to.area !== "Tuba / Asin";
  let mode: TransportMode;

  if (allowed.has("walk") && distance <= walkLimit) {
    mode = "walk";
  } else if (
    (options.preference === "fastest" ||
      options.preference === "less-walking") &&
    allowed.has("taxi")
  ) {
    mode = "taxi";
  } else if (
    options.preference === "cheapest" &&
    allowed.has("jeepney") &&
    jeepneyIsSuitable &&
    allowed.has("taxi")
  ) {
    const jeepneyTotal =
      calculateJeepneyFare(distance, options.fareSettings) *
      options.travelers;
    const taxiTotal = calculateTaxiFare(distance, options.fareSettings);
    mode = jeepneyTotal <= taxiTotal ? "jeepney" : "taxi";
  } else if (allowed.has("jeepney") && jeepneyIsSuitable) {
    mode = "jeepney";
  } else if (allowed.has("taxi")) {
    mode = "taxi";
  } else if (allowed.has("walk")) {
    mode = "walk";
  } else {
    // Validation normally prevents this fallback. It preserves the legacy
    // behavior for callers that use this low-level helper directly.
    mode = "jeepney";
  }

  const minutes = estimateTravelMinutes(distance, mode);
  const farePerPerson =
    mode === "jeepney"
      ? calculateJeepneyFare(distance, options.fareSettings)
      : 0;
  const vehicleFare =
    mode === "taxi"
      ? calculateTaxiFare(distance, options.fareSettings)
      : 0;
  const totalFare =
    mode === "jeepney"
      ? farePerPerson * options.travelers
      : vehicleFare;
  const guide = to.routeGuide || GENERIC_ROUTE_GUIDE;

  return {
    mode,
    minutes,
    farePerPerson: roundMoney(farePerPerson),
    vehicleFare: roundMoney(vehicleFare),
    totalFare: roundMoney(totalFare),
    instructions: buildDirections(from, to, mode),
    loadingMapUrl:
      mode === "jeepney" ? googleSearchUrl(guide.loadingQuery) : null,
    legMapUrl: googleDirectionsUrl(from, to, mode),
  };
}

export function calculateJeepneyFare(
  distance: number,
  settings: FareSettings,
): number {
  return roundMoney(
    settings.jeepMinimum +
      Math.max(0, distance - settings.jeepBaseKm) * settings.jeepPerKm,
  );
}

export function calculateTaxiFare(
  distance: number,
  settings: FareSettings,
): number {
  return roundMoney(settings.taxiFlag + distance * settings.taxiPerKm);
}

export function estimateTravelMinutes(
  distance: number,
  mode: TransportMode,
): number {
  if (mode === "walk") {
    return Math.max(4, Math.round((distance / 4.2) * 60));
  }
  if (mode === "jeepney") {
    return Math.max(12, Math.round(9 + (distance / 14) * 60));
  }
  return Math.max(7, Math.round(5 + (distance / 18) * 60));
}

export function buildDirections(
  from: PlannerLocation,
  to: PlannerDestination,
  mode: TransportMode,
): string[] {
  if (mode === "walk") {
    return [
      `Start from ${from.name} and open the walking route in Google Maps.`,
      "Use pedestrian crossings and avoid shortcuts through private property.",
      `Continue to the official or safest public entrance of ${to.name}.`,
    ];
  }

  if (mode === "taxi") {
    return [
      `Find a metered taxi or verified hired vehicle near ${from.name}.`,
      `Show the driver the Google Maps pin for ${to.name} and ask for the official entrance.`,
      "Use the meter when applicable and confirm any waiting arrangement before leaving the vehicle.",
    ];
  }

  const guide = to.routeGuide || GENERIC_ROUTE_GUIDE;
  return [
    `Go to: ${guide.loadingArea}.`,
    `Look for a signboard marked ${guide.signboard}.`,
    `Tell the dispatcher or driver that you are going to ${to.name}.`,
    to.alight ||
      `Ask the driver to announce the nearest safe drop-off for ${to.name}.`,
    guide.returnHint,
  ];
}

export function googleDirectionsUrl(
  from: PlannerLocation,
  to: PlannerLocation,
  mode: TransportMode,
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: locationForUrl(from),
    destination: locationForUrl(to),
    travelmode: mode === "walk" ? "walking" : "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googleSearchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function googleMapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function buildDayRouteUrl(
  start: PlannerLocation,
  day: Pick<PlannedDay, "items">,
): string {
  if (!day.items.length) {
    return googleSearchUrl(start.googleQuery || start.name);
  }

  const destinations = day.items.map((item) =>
    locationForUrl(item.destination),
  );
  const destination = destinations[destinations.length - 1];
  const waypoints = destinations.slice(0, -1).slice(0, 8);
  const allWalking = day.items.every(
    (item) => item.transport.mode === "walk",
  );
  const params = new URLSearchParams({
    api: "1",
    origin: locationForUrl(start),
    destination,
    travelmode: allWalking ? "walking" : "driving",
  });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function itineraryToText(itinerary: PlannedItinerary): string {
  const lines = [
    "LAKBAY BAGUIO ITINERARY",
    `Starting point: ${itinerary.start.name}`,
    `Date: ${itinerary.date ? formatTripDate(itinerary.date) : "Not specified"}`,
    `Days: ${itinerary.numberOfDays}`,
    `Scheduled stops: ${itinerary.totals.scheduledStops}`,
    `Estimated travel: ${formatDuration(itinerary.totals.travelMinutes)}`,
    `Estimated transport: ${formatCurrency(itinerary.totals.fare)}`,
    "",
  ];

  itinerary.days.forEach((day) => {
    const dateLabel = itinerary.date
      ? ` - ${formatDayDate(itinerary.date, day.index)}`
      : "";
    lines.push(`DAY ${day.index + 1}${dateLabel}`);
    day.notices.forEach((notice) => lines.push(`Note: ${notice}`));
    day.items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${minutesToTime(item.arrivalMinutes)} - ${item.destination.name}`,
      );
      lines.push(
        `   ${transportLabel(item.transport.mode)} from ${item.from.name}, about ${formatDuration(item.transport.minutes)} (${item.distance.toFixed(1)} km est.).`,
      );
      if (item.transport.mode !== "walk") {
        const fare =
          item.transport.mode === "jeepney"
            ? `${formatCurrency(item.transport.farePerPerson)} each; ${formatCurrency(item.transport.totalFare)} total`
            : `${formatCurrency(item.transport.vehicleFare)} per vehicle`;
        lines.push(`   Estimated fare: ${fare}.`);
      }
      item.transport.instructions.forEach((instruction) =>
        lines.push(`   - ${instruction}`),
      );
      if (item.destination.activities?.length) {
        lines.push(`   Try: ${item.destination.activities.join("; ")}`);
      }
    });
    if (!day.items.length) {
      lines.push("No selected stops fit this day's schedule.");
    }
    lines.push("");
  });

  lines.push(PLANNING_DISCLAIMER);
  return lines.join("\n");
}

export function haversineKm(
  first: Pick<PlannerLocation, "lat" | "lng">,
  second: Pick<PlannerLocation, "lat" | "lng">,
): number {
  const earthRadius = 6371;
  const latitudeDifference = degreesToRadians(second.lat - first.lat);
  const longitudeDifference = degreesToRadians(second.lng - first.lng);
  const latitude1 = degreesToRadians(first.lat);
  const latitude2 = degreesToRadians(second.lat);
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDifference / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(String(time || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(total: number): string {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatTripDate(value: string): string {
  const date = isoDateAtUtcMidnight(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDayDate(value: string, offset: number): string {
  const date = isoDateAtUtcMidnight(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function transportLabel(mode: TransportMode): string {
  if (mode === "walk") return "Walk";
  if (mode === "jeepney") return "Jeepney";
  return "Taxi";
}

function createPlannedStop({
  destination,
  from,
  arrivalMinutes,
  waitMinutes,
  distance,
  transport,
  number,
  eveningAddOn,
}: {
  destination: PlannerDestination;
  from: PlannerLocation;
  arrivalMinutes: number;
  waitMinutes: number;
  distance: number;
  transport: PlannedTransport;
  number: number;
  eveningAddOn?: true;
}): PlannedStop {
  return {
    number,
    destination,
    arrivalMinutes,
    departureMinutes: arrivalMinutes + destination.duration,
    waitMinutes,
    distance,
    transport,
    from,
    ...(eveningAddOn ? { eveningAddOn } : {}),
    placeMapUrl: googleSearchUrl(destination.googleQuery || destination.name),
    mapPreviewUrl: googleMapEmbedUrl(
      destination.googleQuery || destination.name,
    ),
  };
}

function validateLocation(
  location: PlannerLocation,
  field: string,
  issues: PlannerValidationIssue[],
): void {
  if (!nonEmptyString(location?.name)) {
    issues.push({
      field: `${field}.name`,
      code: "required",
      message: "Every route location needs a name.",
    });
  }
  if (
    !Number.isFinite(location?.lat) ||
    location.lat < -90 ||
    location.lat > 90
  ) {
    issues.push({
      field: `${field}.lat`,
      code: "range",
      message: `${location?.name || "A route location"} has an invalid latitude.`,
    });
  }
  if (
    !Number.isFinite(location?.lng) ||
    location.lng < -180 ||
    location.lng > 180
  ) {
    issues.push({
      field: `${field}.lng`,
      code: "range",
      message: `${location?.name || "A route location"} has an invalid longitude.`,
    });
  }
}

function resolveStartMinutes(request: PlannerRequest): number {
  if (request.startMinutes !== undefined) {
    return Math.round(request.startMinutes);
  }
  return parseTimeToMinutes(request.startTime || "08:00") ?? 8 * 60;
}

function mergeFareSettings(settings?: Partial<FareSettings>): FareSettings {
  return {
    jeepMinimum: settings?.jeepMinimum ?? DEFAULT_FARE_SETTINGS.jeepMinimum,
    jeepBaseKm: settings?.jeepBaseKm ?? DEFAULT_FARE_SETTINGS.jeepBaseKm,
    jeepPerKm: settings?.jeepPerKm ?? DEFAULT_FARE_SETTINGS.jeepPerKm,
    taxiFlag: settings?.taxiFlag ?? DEFAULT_FARE_SETTINGS.taxiFlag,
    taxiPerKm: settings?.taxiPerKm ?? DEFAULT_FARE_SETTINGS.taxiPerKm,
  };
}

function uniqueModes(modes: readonly TransportMode[]): TransportMode[] {
  return [...new Set(modes)];
}

function openingWindow(destination: PlannerDestination): {
  open: number;
  close: number;
} {
  const open = parseTimeToMinutes(destination.open) ?? 0;
  let close = parseTimeToMinutes(destination.close) ?? 24 * 60;
  if (close <= open) close += 24 * 60;
  return { open, close };
}

function summarizeDays(days: readonly PlannedDay[]): ItineraryTotals {
  return {
    scheduledStops: days.reduce((sum, day) => sum + day.items.length, 0),
    unscheduledStops: days.reduce(
      (sum, day) => sum + day.unscheduled.length,
      0,
    ),
    distance: roundDistance(
      days.reduce((sum, day) => sum + day.totalDistance, 0),
    ),
    fare: roundMoney(days.reduce((sum, day) => sum + day.totalFare, 0)),
    travelMinutes: days.reduce(
      (sum, day) => sum + day.totalTravelMinutes,
      0,
    ),
  };
}

function locationForUrl(location: PlannerLocation): string {
  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return `${location.lat},${location.lng}`;
  }
  return location.googleQuery || location.name;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isoDateAtUtcMidnight(value: string): Date | null {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Small stable FNV-1a hash suitable for local itinerary identifiers. */
function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
