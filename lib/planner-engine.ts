/**
 * Deterministic itinerary planning for Baguio Buddy.
 *
 * This module intentionally contains no browser state, network calls, or UI logic.
 * The route, fare, and schedule guidance it returns is a planning estimate and
 * should be presented with the exported disclaimer.
 */

import type {
  Coordinates,
  FareSettings,
  FinalDayPreference,
  PlannerStay,
  PlannerArea,
  PlannerDestination,
  RouteGuide,
  StartLocation,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";
import { LTFRB_FARE_POLICY, OFFICIAL_FARE_SETTINGS } from "@/lib/fare-policy";
import { isSupportedGoogleMapsUrl } from "@/lib/google-maps-place";

export type {
  FareSettings,
  PlannerDestination,
  PlannerStay,
  StartLocation,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";

export const PLANNING_DISCLAIMER =
  `Travel time and routes are estimates. Fare calculations use LTFRB-published rates reviewed ${LTFRB_FARE_POLICY.reviewedLabel}; confirm the taxi meter, jeepney fare matrix, attraction hours, and loading areas locally.`;

export const DEFAULT_FARE_SETTINGS = OFFICIAL_FARE_SETTINGS;

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
  /** Optional fixed-time accommodation check-in added to the route. */
  stay?: PlannerStay;
  /** Optional final-day terminal and departure time. */
  departure?: PlannerDeparture;
  /** Optional preview-only day constraints keyed by destination id. */
  dayAssignments?: PlannerDayAssignments;
};

export type PlannerDayAssignments = Readonly<Record<string, number>>;

export type PlannerDeparture = {
  location: PlannerStartLocation;
  /** Zero-based trip day; normally the final day. */
  dayIndex: number;
  /** Optional service departure time in local 24-hour HH:mm format. */
  time?: string;
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
  kind: "destination" | "check-in" | "check-out" | "departure";
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
  /** Mobile-safe route segments; each contains at most three waypoints. */
  routeMapUrls: string[];
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
  stay?: PlannerStay;
  departure?: PlannerDeparture;
  totals: ItineraryTotals;
  disclaimer: string;
};

export type ItineraryMoveEvaluation = {
  allowed: boolean;
  reason: string;
  itinerary?: PlannedItinerary;
};

type DayBuildOptions = {
  dayIndex: number;
  preference: TravelPreference;
  availableMinutes: number;
  travelers: number;
  modes: readonly TransportMode[];
  fareSettings: FareSettings;
  startMinutes: number;
  checkInStay?: PlannerStay;
  checkOutStay?: PlannerStay;
  departure?: PlannerDeparture;
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
const VALID_FINAL_DAY_PREFERENCES = new Set<FinalDayPreference>([
  "relax",
  "pasalubong",
  "easy-stop",
  "sightseeing",
]);

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

  if (request?.stay) {
    const stay = request.stay;
    validateLocation(stay, "stay", issues);

    if (stay.kind !== "hotel" && stay.kind !== "airbnb") {
      issues.push({
        field: "stay.kind",
        code: "invalid",
        message: "Choose Hotel or Airbnb for your stay.",
      });
    }
    if (!isSupportedGoogleMapsUrl(stay.googleMapsUrl)) {
      issues.push({
        field: "stay.googleMapsUrl",
        code: "invalid",
        message: "Paste a valid Google Maps place or share link for your stay.",
      });
    }
    if (
      !Number.isInteger(stay.checkInDay) ||
      stay.checkInDay < 0 ||
      stay.checkInDay >= request.numberOfDays
    ) {
      issues.push({
        field: "stay.checkInDay",
        code: "range",
        message: "Choose a check-in day within your trip.",
      });
    }
    if (parseTimeToMinutes(stay.checkInTime) === null) {
      issues.push({
        field: "stay.checkInTime",
        code: "invalid",
        message: "Check-in time must use HH:mm format.",
      });
    }
    if (
      !Number.isInteger(stay.checkOutDay) ||
      stay.checkOutDay < stay.checkInDay ||
      stay.checkOutDay >= request.numberOfDays
    ) {
      issues.push({
        field: "stay.checkOutDay",
        code: "range",
        message: "Checkout must fall between check-in and the final trip day.",
      });
    }
    if (parseTimeToMinutes(stay.checkOutTime) === null) {
      issues.push({
        field: "stay.checkOutTime",
        code: "invalid",
        message: "Checkout time must use HH:mm format.",
      });
    }
    const checkInValue = parseTimeToMinutes(stay.checkInTime);
    const checkOutValue = parseTimeToMinutes(stay.checkOutTime);
    if (
      stay.checkOutDay === stay.checkInDay &&
      checkInValue !== null &&
      checkOutValue !== null &&
      checkOutValue <= checkInValue
    ) {
      issues.push({
        field: "stay.checkOutDay",
        code: "range",
        message: "A stay needs at least two trip days when checkout is earlier than check-in.",
      });
    }
    if (!VALID_FINAL_DAY_PREFERENCES.has(stay.finalDayPreference)) {
      issues.push({
        field: "stay.finalDayPreference",
        code: "invalid",
        message: "Choose how you want to spend your final day.",
      });
    }
    if (stay.luggagePlan !== "carry" && stay.luggagePlan !== "property-drop") {
      issues.push({
        field: "stay.luggagePlan",
        code: "invalid",
        message: "Choose how you plan to handle luggage before check-in.",
      });
    }
  }

  if (request?.departure) {
    validateLocation(request.departure.location, "departure.location", issues);
    if (
      !Number.isInteger(request.departure.dayIndex) ||
      request.departure.dayIndex < 0 ||
      request.departure.dayIndex >= request.numberOfDays
    ) {
      issues.push({
        field: "departure.dayIndex",
        code: "range",
        message: "Choose a departure day within your trip.",
      });
    }
    if (
      request.departure.time &&
      parseTimeToMinutes(request.departure.time) === null
    ) {
      issues.push({
        field: "departure.time",
        code: "invalid",
        message: "Departure time must use HH:mm format.",
      });
    }
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
  const automaticBuckets = buildDayBuckets(
    request.start,
    destinations,
    request.numberOfDays,
    request.availableMinutes,
    request.preference,
    startMinutes,
    request.stay,
  );
  const buckets = applyDayAssignments(
    automaticBuckets,
    destinations,
    request.dayAssignments,
    request.numberOfDays,
  );

  const dayOptions = {
    preference: request.preference,
    availableMinutes: request.availableMinutes,
    travelers: request.travelers,
    modes,
    fareSettings,
    startMinutes,
  };

  const dayStarts = buckets.map((_, dayIndex) =>
    startLocationForDay(request.start, request.stay, dayIndex),
  );

  const daysWithoutRoutes = buckets.map((bucket, dayIndex) =>
    buildDayItinerary(dayStarts[dayIndex], bucket, {
      ...dayOptions,
      dayIndex,
      ...(request.stay?.checkInDay === dayIndex ? { checkInStay: request.stay } : {}),
      ...(request.stay?.checkOutDay === dayIndex ? { checkOutStay: request.stay } : {}),
      ...(request.departure?.dayIndex === dayIndex ? { departure: request.departure } : {}),
    }),
  );

  const days = daysWithoutRoutes.map((day) => {
    const routeMapUrls = buildDayRouteUrls(dayStarts[day.index], day);
    return {
      ...day,
      routeMapUrl: routeMapUrls[0],
      routeMapUrls,
    };
  });
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
      stay: request.stay,
      departure: request.departure,
      dayAssignments: request.dayAssignments,
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
    ...(request.stay ? { stay: request.stay } : {}),
    ...(request.departure ? { departure: request.departure } : {}),
    totals,
    disclaimer: PLANNING_DISCLAIMER,
  };
}

function applyDayAssignments(
  automaticBuckets: readonly PlannerDestination[][],
  destinations: readonly PlannerDestination[],
  assignments: PlannerDayAssignments | undefined,
  numberOfDays: number,
): PlannerDestination[][] {
  if (!assignments || !Object.keys(assignments).length) {
    return automaticBuckets.map((bucket) => [...bucket]);
  }

  const assignedIds = new Set(
    destinations
      .filter((destination) => {
        const dayIndex = assignments[destination.id];
        return Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex < numberOfDays;
      })
      .map((destination) => destination.id),
  );
  const buckets = automaticBuckets.map((bucket) =>
    bucket.filter((destination) => !assignedIds.has(destination.id)),
  );

  destinations.forEach((destination) => {
    if (!assignedIds.has(destination.id)) return;
    buckets[assignments[destination.id]].push(destination);
  });

  return buckets;
}

function itineraryDestinations(itinerary: PlannedItinerary): PlannerDestination[] {
  const byId = new Map<string, PlannerDestination>();
  itinerary.days.forEach((day) => {
    day.items.forEach((item) => {
      if (item.kind === "destination") byId.set(item.destination.id, item.destination);
    });
    day.unscheduled.forEach((destination) => byId.set(destination.id, destination));
  });
  return itinerary.selectedDestinationIds
    .map((id) => byId.get(id))
    .filter((destination): destination is PlannerDestination => Boolean(destination));
}

export function getItineraryDayAssignments(itinerary: PlannedItinerary): Record<string, number> {
  const assignments: Record<string, number> = {};
  itinerary.days.forEach((day) => {
    day.items.forEach((item) => {
      if (item.kind === "destination") assignments[item.destination.id] = day.index;
    });
    day.unscheduled.forEach((destination) => {
      assignments[destination.id] = day.index;
    });
  });
  return assignments;
}

function scheduledDestinationIds(itinerary: PlannedItinerary): Set<string> {
  return new Set(
    itinerary.days.flatMap((day) =>
      day.items
        .filter((item) => item.kind === "destination")
        .map((item) => item.destination.id),
    ),
  );
}

function activeDayMinutes(day: PlannedDay): number {
  return day.items.reduce(
    (total, item) => total + item.transport.minutes + item.destination.duration,
    0,
  );
}

/**
 * Dry-runs a review-screen move through the production planner. A destination
 * only moves when it remains geographically coherent, fits its opening hours,
 * preserves fixed anchors, and does not displace another scheduled place.
 */
export function evaluateItineraryMove(
  itinerary: PlannedItinerary,
  destinationId: string,
  targetDayIndex: number,
): ItineraryMoveEvaluation {
  if (!Number.isInteger(targetDayIndex) || targetDayIndex < 0 || targetDayIndex >= itinerary.days.length) {
    return { allowed: false, reason: "Choose a day within this trip." };
  }

  const destinations = itineraryDestinations(itinerary);
  const destination = destinations.find((place) => place.id === destinationId);
  if (!destination) {
    return { allowed: false, reason: "This place is no longer part of the itinerary preview." };
  }

  const assignments = getItineraryDayAssignments(itinerary);
  const sourceDayIndex = assignments[destinationId];
  if (sourceDayIndex === targetDayIndex) {
    return { allowed: false, reason: `${destination.name} is already assigned to Day ${targetDayIndex + 1}.` };
  }

  const targetDay = itinerary.days[targetDayIndex];
  const targetPlaces = targetDay.items
    .filter((item) => item.kind === "destination" && item.destination.id !== destinationId)
    .map((item) => item.destination);
  const targetHasSideTrip = targetPlaces.some((place) => place.area === "Atok Side Trip");
  const movingSideTrip = destination.area === "Atok Side Trip";
  if (targetPlaces.length && targetHasSideTrip !== movingSideTrip) {
    return {
      allowed: false,
      reason: `${destination.name} cannot be mixed with Day ${targetDayIndex + 1}'s ${targetHasSideTrip ? "Atok side trip" : "Baguio city route"}.`,
    };
  }

  const sharesArea = targetPlaces.some((place) => place.area === destination.area);
  const nearestTargetKm = targetPlaces.length
    ? Math.min(...targetPlaces.map((place) => haversineKm(place, destination)))
    : haversineKm(startLocationForDay(itinerary.start, itinerary.stay, targetDayIndex), destination);
  if (targetPlaces.length && !sharesArea && nearestTargetKm > 2.5) {
    return {
      allowed: false,
      reason: `${destination.name} is too far from Day ${targetDayIndex + 1}'s route (${nearestTargetKm.toFixed(1)} km from its nearest stop).`,
    };
  }

  assignments[destinationId] = targetDayIndex;
  const next = generateItinerary({
    start: itinerary.start,
    destinations,
    date: itinerary.date,
    numberOfDays: itinerary.numberOfDays,
    availableMinutes: itinerary.availableMinutes,
    travelers: itinerary.travelers,
    modes: itinerary.modes,
    preference: itinerary.preference,
    fareSettings: itinerary.fareSettings,
    startMinutes: itinerary.startMinutes,
    ...(itinerary.stay ? { stay: itinerary.stay } : {}),
    ...(itinerary.departure ? { departure: itinerary.departure } : {}),
    dayAssignments: assignments,
  });
  const nextTargetDay = next.days[targetDayIndex];
  const movedStop = nextTargetDay.items.find(
    (item) => item.kind === "destination" && item.destination.id === destinationId,
  );
  if (!movedStop) {
    return {
      allowed: false,
      reason: `${destination.name} cannot fit Day ${targetDayIndex + 1}'s opening hours, travel time, and fixed commitments.`,
    };
  }

  const beforeScheduled = scheduledDestinationIds(itinerary);
  const afterScheduled = scheduledDestinationIds(next);
  const displaced = destinations.find(
    (place) => place.id !== destinationId && beforeScheduled.has(place.id) && !afterScheduled.has(place.id),
  );
  if (displaced) {
    return {
      allowed: false,
      reason: `Moving ${destination.name} would push ${displaced.name} outside Day ${targetDayIndex + 1}'s safe schedule.`,
    };
  }

  const nextActiveMinutes = activeDayMinutes(nextTargetDay);
  const currentActiveMinutes = activeDayMinutes(targetDay);
  const relaxedLimit = Math.max(180, itinerary.availableMinutes - 30);
  if (nextActiveMinutes > relaxedLimit && nextActiveMinutes > currentActiveMinutes + 15) {
    return {
      allowed: false,
      reason: `Day ${targetDayIndex + 1} would become too compressed. Keep at least 30 minutes of breathing room.`,
    };
  }

  return {
    allowed: true,
    reason: `${destination.name} fits Day ${targetDayIndex + 1}. Route order, times, distance, and fare will be recalculated.`,
    itinerary: next,
  };
}

type DestinationCluster = {
  key: string;
  area: PlannerArea;
  destinations: PlannerDestination[];
  centroid: PlannerLocation;
  estimatedMinutes: number;
  firstIndex: number;
};

function destinationCentroid(
  destinations: readonly PlannerDestination[],
  label: string,
): PlannerLocation {
  const divisor = Math.max(1, destinations.length);
  return {
    name: label,
    lat: destinations.reduce((sum, destination) => sum + destination.lat, 0) / divisor,
    lng: destinations.reduce((sum, destination) => sum + destination.lng, 0) / divisor,
    area: destinations[0]?.area,
  };
}

function estimateClusterMinutes(
  destinations: readonly PlannerDestination[],
  preference: TravelPreference,
  startMinutes: number,
): number {
  if (!destinations.length) return 0;
  const centroid = destinationCentroid(destinations, destinations[0].area);
  const ordered = optimizeRoute(centroid, destinations, preference, startMinutes);
  let minutes = ordered.reduce(
    (sum, destination) => sum + destination.duration,
    0,
  );

  for (let index = 1; index < ordered.length; index += 1) {
    minutes += estimateTravelMinutes(
      haversineKm(ordered[index - 1], ordered[index]),
      "taxi",
    );
  }

  // Keep a small transition buffer between visits so a day feels achievable,
  // rather than packing every minute with another attraction.
  return minutes + ordered.length * 8 + 20;
}

function makeDestinationCluster(
  area: PlannerArea,
  destinations: PlannerDestination[],
  firstIndex: number,
  preference: TravelPreference,
  startMinutes: number,
  suffix = "",
): DestinationCluster {
  return {
    key: `${area}${suffix}`,
    area,
    destinations,
    centroid: destinationCentroid(destinations, area),
    estimatedMinutes: estimateClusterMinutes(
      destinations,
      preference,
      startMinutes,
    ),
    firstIndex,
  };
}

function splitOversizedClusters(
  clusters: DestinationCluster[],
  availableDays: number,
  targetMinutes: number,
  preference: TravelPreference,
  startMinutes: number,
): DestinationCluster[] {
  const result = [...clusters];
  let spareDays = Math.max(0, availableDays - result.length);

  while (spareDays > 0) {
    const candidateIndex = result.reduce((bestIndex, cluster, index) => {
      if (
        cluster.destinations.length < 2 ||
        cluster.estimatedMinutes <= targetMinutes * 1.12
      ) {
        return bestIndex;
      }
      if (bestIndex < 0) return index;
      return cluster.estimatedMinutes > result[bestIndex].estimatedMinutes
        ? index
        : bestIndex;
    }, -1);

    if (candidateIndex < 0) break;
    const candidate = result[candidateIndex];
    const ordered = optimizeRoute(
      candidate.centroid,
      candidate.destinations,
      preference,
      startMinutes,
    );
    const splitAt = Math.ceil(ordered.length / 2);
    const first = makeDestinationCluster(
      candidate.area,
      ordered.slice(0, splitAt),
      candidate.firstIndex,
      preference,
      startMinutes,
      `${candidate.key}-a`,
    );
    const second = makeDestinationCluster(
      candidate.area,
      ordered.slice(splitAt),
      candidate.firstIndex + splitAt,
      preference,
      startMinutes,
      `${candidate.key}-b`,
    );
    result.splice(candidateIndex, 1, first, second);
    spareDays -= 1;
  }

  return result;
}

function minimumClusterDistance(
  cluster: DestinationCluster,
  destinations: readonly PlannerDestination[],
): number {
  if (!destinations.length) return Number.POSITIVE_INFINITY;
  return Math.min(
    ...destinations.map((destination) =>
      haversineKm(cluster.centroid, destination),
    ),
  );
}

function rebalanceBucketCounts(
  buckets: PlannerDestination[][],
  usableDays: number,
): void {
  if (usableDays < 2) return;

  for (let pass = 0; pass < 12; pass += 1) {
    const counts = buckets.slice(0, usableDays).map(
      (bucket) => bucket.filter((destination) => destination.timeSlot !== "night").length,
    );
    const fullest = counts.indexOf(Math.max(...counts));
    const lightest = counts.indexOf(Math.min(...counts));
    if (counts[fullest] - counts[lightest] <= 2) return;

    const targetStops = buckets[lightest].filter(
      (destination) => destination.timeSlot !== "night",
    );
    const candidates = buckets[fullest].filter(
      (destination) =>
        destination.timeSlot !== "night" &&
        destination.area !== "Atok Side Trip",
    );
    if (!candidates.length) return;

    const candidate = [...candidates].sort((first, second) => {
      const firstDistance = targetStops.length
        ? Math.min(...targetStops.map((stop) => haversineKm(first, stop)))
        : 0;
      const secondDistance = targetStops.length
        ? Math.min(...targetStops.map((stop) => haversineKm(second, stop)))
        : 0;
      const firstAreaFit = targetStops.some((stop) => stop.area === first.area) ? -1.5 : 0;
      const secondAreaFit = targetStops.some((stop) => stop.area === second.area) ? -1.5 : 0;
      return firstDistance + firstAreaFit - (secondDistance + secondAreaFit);
    })[0];

    buckets[fullest] = buckets[fullest].filter(
      (destination) => destination.id !== candidate.id,
    );
    buckets[lightest].push(candidate);
  }
}

/**
 * Groups stops by Baguio travel corridor before assigning them to days.
 * Corridor boundaries are kept intact unless a group is too large or there
 * are fewer days than selected areas. This prevents a global nearest-neighbor
 * route from being cut halfway through City Center or the Mines View corridor.
 */
export function buildDayBuckets(
  start: PlannerLocation,
  destinations: readonly PlannerDestination[],
  numberOfDays: number,
  availableMinutes: number,
  preference: TravelPreference,
  startMinutes: number,
  stay?: PlannerStay,
): PlannerDestination[][] {
  const buckets = Array.from(
    { length: numberOfDays },
    (): PlannerDestination[] => [],
  );
  const nightStops = destinations.filter(
    (destination) => destination.timeSlot === "night",
  );
  const protectedFinalDay = Boolean(
    stay &&
    numberOfDays > 1 &&
    stay.checkOutDay === numberOfDays - 1 &&
    stay.finalDayPreference !== "sightseeing",
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

  if (atokStops.length && numberOfDays > 1 && !protectedFinalDay) {
    buckets[numberOfDays - 1].push(...atokStops);
  } else if (atokStops.length) {
    regularStops.push(...atokStops);
  }

  const targetPerDay = Math.max(180, availableMinutes - 45);
  const finalRegularDay =
    atokStops.length && numberOfDays > 1 && !protectedFinalDay
      ? numberOfDays - 2
      : numberOfDays - 1;
  const regularDayCount = Math.max(
    1,
    finalRegularDay + 1 - (protectedFinalDay ? 1 : 0),
  );
  const byArea = new Map<
    PlannerArea,
    { destinations: PlannerDestination[]; firstIndex: number }
  >();

  regularStops.forEach((destination, index) => {
    const existing = byArea.get(destination.area);
    if (existing) {
      existing.destinations.push(destination);
    } else {
      byArea.set(destination.area, {
        destinations: [destination],
        firstIndex: index,
      });
    }
  });

  let clusters = [...byArea.entries()].map(([area, group]) =>
    makeDestinationCluster(
      area,
      group.destinations,
      group.firstIndex,
      preference,
      startMinutes,
    ),
  );
  clusters = splitOversizedClusters(
    clusters,
    regularDayCount,
    targetPerDay,
    preference,
    startMinutes,
  );

  const remaining = [...clusters];
  const bucketLoads = Array.from({ length: regularDayCount }, () => 0);
  const seedCount = Math.min(regularDayCount, remaining.length);

  // Give each usable day one coherent corridor before considering merges.
  for (let dayIndex = 0; dayIndex < seedCount; dayIndex += 1) {
    const anchor = startLocationForDay(start, stay, dayIndex);
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    remaining.forEach((cluster, index) => {
      let score = haversineKm(anchor, cluster.centroid);
      if (anchor.area === cluster.area) score -= 0.75;
      if (stay && dayIndex === stay.checkInDay) {
        score += haversineKm(cluster.centroid, stay) * 1.25;
      }
      score += cluster.firstIndex / 100_000;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [cluster] = remaining.splice(bestIndex, 1);
    buckets[dayIndex].push(...cluster.destinations);
    bucketLoads[dayIndex] += cluster.estimatedMinutes;
  }

  // When there are more corridors than days, merge only the geographically
  // closest groups and strongly discourage an already overloaded day.
  remaining.forEach((cluster) => {
    let bestDay = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let dayIndex = 0; dayIndex < regularDayCount; dayIndex += 1) {
      const proximity = minimumClusterDistance(cluster, buckets[dayIndex]);
      const overload = Math.max(
        0,
        bucketLoads[dayIndex] + cluster.estimatedMinutes - targetPerDay,
      );
      const sameArea = buckets[dayIndex].some(
        (destination) => destination.area === cluster.area,
      );
      const checkInPenalty =
        stay && dayIndex === stay.checkInDay && overload > 0 ? 2 : 0;
      const score =
        proximity +
        overload / 45 +
        checkInPenalty +
        (sameArea ? -0.8 : 0);
      if (score < bestScore) {
        bestScore = score;
        bestDay = dayIndex;
      }
    }

    buckets[bestDay].push(...cluster.destinations);
    bucketLoads[bestDay] += cluster.estimatedMinutes;
  });

  // Evening-only places follow the day whose daytime route is closest, rather
  // than being attached by selection order.
  nightStops.forEach((destination) => {
    let bestDay = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let dayIndex = 0; dayIndex < regularDayCount; dayIndex += 1) {
      const dayStops = buckets[dayIndex];
      const proximity = dayStops.length
        ? Math.min(
            ...dayStops.map((stop) => haversineKm(stop, destination)),
          )
        : haversineKm(startLocationForDay(start, stay, dayIndex), destination);
      const sameArea = dayStops.some((stop) => stop.area === destination.area);
      const existingNightStops = dayStops.filter(
        (stop) => stop.timeSlot === "night",
      ).length;
      const score = proximity + existingNightStops * 1.5 + (sameArea ? -1 : 0);
      if (score < bestScore) {
        bestScore = score;
        bestDay = dayIndex;
      }
    }
    buckets[bestDay].push(destination);
  });

  rebalanceBucketCounts(buckets, regularDayCount);

  if (protectedFinalDay && stay) {
    const finalBucket = buckets[stay.checkOutDay];
    const movable = buckets
      .slice(0, regularDayCount)
      .flatMap((bucket) => bucket)
      .filter((destination) => destination.timeSlot !== "night");
    let finalChoice: PlannerDestination | undefined;

    if (stay.finalDayPreference === "pasalubong") {
      finalChoice = movable.find((destination) => destination.id === "baguio-city-market")
        ?? movable.find((destination) => destination.tags.includes("pasalubong"))
        ?? movable.find((destination) => destination.category === "Food & shopping");
    } else if (stay.finalDayPreference === "easy-stop") {
      finalChoice = [...movable].sort(
        (first, second) => haversineKm(stay, first) - haversineKm(stay, second),
      )[0];
    }

    if (finalChoice) {
      for (let index = 0; index < regularDayCount; index += 1) {
        buckets[index] = buckets[index].filter(
          (destination) => destination.id !== finalChoice?.id,
        );
      }
      finalBucket.push(finalChoice);
    }
  }

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

function routeDistanceWithAnchor(
  start: PlannerLocation,
  route: readonly PlannerDestination[],
  anchor: PlannerLocation,
): number {
  let total = 0;
  let current = start;
  route.forEach((destination) => {
    total += haversineKm(current, destination);
    current = destination;
  });
  return total + haversineKm(current, anchor);
}

/** Orders a route that must finish at a fixed place, such as hotel check-in. */
function optimizeRouteToAnchor(
  start: PlannerLocation,
  destinations: readonly PlannerDestination[],
  anchor: PlannerLocation,
): PlannerDestination[] {
  if (destinations.length < 2) return [...destinations];
  let best: PlannerDestination[] = [];
  let bestDistance = Number.POSITIVE_INFINITY;

  destinations.forEach((first) => {
    const route = [first];
    const remaining = destinations.filter((destination) => destination.id !== first.id);
    let current: PlannerLocation = first;

    while (remaining.length) {
      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      remaining.forEach((destination, index) => {
        const anchorWeight = remaining.length === 1 ? 1 : 0.18;
        const score = haversineKm(current, destination)
          + haversineKm(destination, anchor) * anchorWeight;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      const [next] = remaining.splice(bestIndex, 1);
      route.push(next);
      current = next;
    }

    const distance = routeDistanceWithAnchor(start, route, anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = route;
    }
  });

  return best;
}

function estimateAnchoredRouteMinutes(
  start: PlannerLocation,
  route: readonly PlannerDestination[],
  anchor: PlannerLocation,
): number {
  return route.reduce(
    (minutes, destination) => minutes + destination.duration + 8,
    estimateTravelMinutes(routeDistanceWithAnchor(start, route, anchor), "taxi"),
  );
}

function partitionAroundCheckIn(
  start: PlannerLocation,
  destinations: readonly PlannerDestination[],
  stay: PlannerStay,
  startMinutes: number,
  checkInMinutes: number,
): { before: PlannerDestination[]; after: PlannerDestination[] } {
  if (!destinations.length) return { before: [], after: [] };
  const budget = Math.max(0, checkInMinutes - startMinutes - 15);
  const groups = new Map<PlannerArea, PlannerDestination[]>();
  destinations.forEach((destination) => {
    const group = groups.get(destination.area) ?? [];
    group.push(destination);
    groups.set(destination.area, group);
  });

  const candidates = [...groups.values()].map((group) => {
    const route = optimizeRouteToAnchor(start, group, stay);
    const minutes = estimateAnchoredRouteMinutes(start, route, stay);
    const centroid = destinationCentroid(group, group[0].area);
    return {
      route,
      minutes,
      score: minutes + haversineKm(centroid, stay) * 10,
    };
  }).filter((candidate) => candidate.minutes <= budget);

  let before = candidates.sort((first, second) => second.score - first.score)[0]?.route ?? [];
  if (!before.length) {
    const fallback = optimizeRouteToAnchor(start, destinations, stay);
    let used = 0;
    let current = start;
    before = fallback.filter((destination) => {
      const next = used
        + estimateTravelMinutes(haversineKm(current, destination), "taxi")
        + destination.duration
        + estimateTravelMinutes(haversineKm(destination, stay), "taxi");
      if (next > budget) return false;
      used += estimateTravelMinutes(haversineKm(current, destination), "taxi")
        + destination.duration;
      current = destination;
      return true;
    });
  }

  const beforeIds = new Set(before.map((destination) => destination.id));
  return {
    before,
    after: destinations.filter((destination) => !beforeIds.has(destination.id)),
  };
}

export function buildDayItinerary(
  start: PlannerLocation,
  bucket: readonly PlannerDestination[],
  options: DayBuildOptions,
): Omit<PlannedDay, "routeMapUrl" | "routeMapUrls"> {
  const nightStops = bucket.filter(
    (destination) => destination.timeSlot === "night",
  );
  const daytime = bucket.filter(
    (destination) => destination.timeSlot !== "night",
  );
  const items: PlannedStop[] = [];
  const unscheduled: PlannerDestination[] = [];
  const notices: string[] = [];
  let current: PlannerLocation = start;
  let cursor = options.startMinutes;
  const dayEnd = options.startMinutes + options.availableMinutes;
  const stayDestination = options.checkInStay
    ? stayToDestination(options.checkInStay)
    : null;
  const checkInMinutes = options.checkInStay
    ? parseTimeToMinutes(options.checkInStay.checkInTime) ?? dayEnd
    : null;
  const checkoutDestination = options.checkOutStay
    ? stayToCheckoutDestination(options.checkOutStay)
    : null;
  const checkoutMinutes = options.checkOutStay
    ? parseTimeToMinutes(options.checkOutStay.checkOutTime) ?? options.startMinutes
    : null;
  const departureDestination = options.departure
    ? departureToDestination(options.departure)
    : null;
  const departureMinutes = options.departure?.time
    ? (parseTimeToMinutes(options.departure.time) ?? null)
    : null;

  const appendFixedStop = (
    kind: "check-in" | "check-out" | "departure",
    destination: PlannerDestination,
    fixedMinutes: number | null,
    placeMapUrl?: string,
  ) => {
    const distance = haversineKm(current, destination);
    const transport = chooseTransport(current, destination, distance, options);
    const afterTravel = cursor + transport.minutes;
    const scheduledArrival = fixedMinutes === null
      ? afterTravel
      : Math.max(afterTravel, fixedMinutes);
    const wait = fixedMinutes === null ? 0 : Math.max(0, fixedMinutes - afterTravel);
    items.push(createPlannedStop({
      kind,
      destination,
      from: current,
      arrivalMinutes: scheduledArrival,
      waitMinutes: wait,
      distance,
      transport,
      number: items.length + 1,
      placeMapUrl,
    }));
    cursor = scheduledArrival + destination.duration;
    current = destination;
    return scheduledArrival;
  };

  if (checkoutDestination && options.checkOutStay && checkoutMinutes !== null) {
    const arrival = appendFixedStop(
      "check-out",
      checkoutDestination,
      checkoutMinutes,
      options.checkOutStay.googleMapsUrl,
    );
    notices.push(
      options.checkOutStay.finalDayPreference === "relax"
        ? `The morning is protected for a slow start at ${options.checkOutStay.name}, with checkout at ${minutesToTime(checkoutMinutes)}.`
        : `${options.checkOutStay.name} checkout is held at ${minutesToTime(checkoutMinutes)} before the final-day route.`,
    );
    if (arrival > checkoutMinutes + 10) {
      notices.push("Checkout may run late; shorten the morning before leaving the property.");
    }
  }

  const appendStayCheckIn = () => {
    if (!stayDestination || !options.checkInStay || checkInMinutes === null) return;
    const scheduledArrival = appendFixedStop(
      "check-in",
      stayDestination,
      checkInMinutes,
      options.checkInStay.googleMapsUrl,
    );

    if (scheduledArrival > checkInMinutes + 15) {
      notices.push(
        `${options.checkInStay.name} check-in is estimated at ${minutesToTime(scheduledArrival)}, after the selected ${minutesToTime(checkInMinutes)} time. Consider removing an earlier stop.`,
      );
    } else {
      notices.push(
        `${options.checkInStay.name} check-in is held at ${minutesToTime(checkInMinutes)}; the morning finishes one corridor before the afternoon restarts near the stay.`,
      );
    }
    if (options.checkInStay.locationPrecision === "approximate") {
      notices.push(
        `The shortened Google Maps link for ${options.checkInStay.name} does not expose its pin coordinates, so travel estimates use central Baguio. Open the saved Maps link for exact navigation.`,
      );
    }
  };

  const scheduleDestination = (
    destination: PlannerDestination,
    deadline: number | null,
  ) => {
    const distance = haversineKm(current, destination);
    const transport = chooseTransport(current, destination, distance, options);
    const arrival = cursor + transport.minutes;
    const { open, close } = openingWindow(destination);
    const scheduledArrival = Math.max(arrival, open);
    const wait = Math.max(0, open - arrival);
    const onwardMinutes = deadline !== null && stayDestination
      ? chooseTransport(
          destination,
          stayDestination,
          haversineKm(destination, stayDestination),
          options,
        ).minutes
      : 0;
    const travelToDeparture = departureDestination
      ? chooseTransport(
          destination,
          departureDestination,
          haversineKm(destination, departureDestination),
          options,
        ).minutes
      : 0;

    if (
      scheduledArrival + destination.duration > close ||
      scheduledArrival > dayEnd + 90 ||
      (deadline !== null && scheduledArrival + destination.duration + onwardMinutes > deadline + 15) ||
      (departureMinutes !== null && scheduledArrival + destination.duration + travelToDeparture > departureMinutes - 30)
    ) {
      unscheduled.push(destination);
      return false;
    }

    items.push(createPlannedStop({
      destination,
      from: current,
      arrivalMinutes: scheduledArrival,
      waitMinutes: wait,
      distance,
      transport,
      number: items.length + 1,
    }));
    cursor = scheduledArrival + destination.duration;
    current = destination;
    return true;
  };

  if (stayDestination && options.checkInStay && checkInMinutes !== null) {
    const partition = partitionAroundCheckIn(
      start,
      daytime,
      options.checkInStay,
      options.startMinutes,
      checkInMinutes,
    );
    partition.before.forEach((destination) => {
      scheduleDestination(destination, checkInMinutes);
    });
    appendStayCheckIn();
    const postCheckIn = optimizeRoute(
      current,
      partition.after,
      options.preference,
      cursor,
    );
    postCheckIn.forEach((destination) => scheduleDestination(destination, null));
  } else {
    const ordered = optimizeRoute(
      current,
      daytime,
      options.preference,
      cursor,
    );
    ordered.forEach((destination) => scheduleDestination(destination, null));
  }

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
    const travelToDeparture = departureDestination
      ? chooseTransport(
          destination,
          departureDestination,
          haversineKm(destination, departureDestination),
          options,
        ).minutes
      : 0;

    if (
      scheduledArrival + destination.duration > close ||
      (departureMinutes !== null && scheduledArrival + destination.duration + travelToDeparture > departureMinutes - 30)
    ) {
      unscheduled.push(destination);
      notices.push(
        departureMinutes !== null
          ? `${destination.name} cannot fit without risking the selected departure time.`
          : `${destination.name} cannot fit before its estimated closing time.`,
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

  if (departureDestination && options.departure) {
    const arrivalTarget = departureMinutes === null
      ? null
      : Math.max(options.startMinutes, departureMinutes - 30);
    const arrival = appendFixedStop(
      "departure",
      departureDestination,
      arrivalTarget,
      googleSearchUrl(options.departure.location.googleQuery || options.departure.location.name),
    );
    notices.push(
      departureMinutes === null
        ? `The route finishes at ${options.departure.location.name}. Confirm your departure schedule before travelling.`
        : `The route aims to reach ${options.departure.location.name} by ${minutesToTime(arrivalTarget ?? arrival)}, 30 minutes before the ${minutesToTime(departureMinutes)} departure.`,
    );
  }

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
    const taxiTotal = calculateTaxiFare(
      distance,
      options.fareSettings,
      estimateTravelMinutes(distance, "taxi"),
    );
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
      ? calculateTaxiFare(distance, options.fareSettings, minutes)
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
  return roundFareToQuarter(
    settings.jeepMinimum +
      Math.max(0, distance - settings.jeepBaseKm) * settings.jeepPerKm,
  );
}

export function calculateTaxiFare(
  distance: number,
  settings: FareSettings,
  travelMinutes = estimateTravelMinutes(distance, "taxi"),
): number {
  return roundMoney(
    settings.taxiFlag +
      distance * settings.taxiPerKm +
      travelMinutes * settings.taxiPerMinute,
  );
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
    origin: locationForDirections(from),
    destination: locationForDirections(to),
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
  return buildDayRouteUrls(start, day)[0];
}

/**
 * Google Maps mobile browsers support fewer waypoints than desktop. Keeping
 * each URL to three waypoints prevents later agenda stops from disappearing.
 */
export function buildDayRouteUrls(
  start: PlannerLocation,
  day: Pick<PlannedDay, "items">,
): string[] {
  const routeItems = day.items.filter(
    (item) => !(item.kind === "check-out" && item.distance < 0.05),
  );
  if (!routeItems.length) {
    return [googleSearchUrl(start.googleQuery || start.name)];
  }

  const routeUrls: string[] = [];
  let segmentOrigin: PlannerLocation = start;

  for (let index = 0; index < routeItems.length; index += 4) {
    const segment = routeItems.slice(index, index + 4);
    const destinations = segment.map((item) =>
      locationForDirections(item.destination),
    );
    const destination = destinations[destinations.length - 1];
    const waypoints = destinations.slice(0, -1);
    const allWalking = segment.every((item) => item.transport.mode === "walk");
    const params = new URLSearchParams({
      api: "1",
      origin: locationForDirections(segmentOrigin),
      destination,
      travelmode: allWalking ? "walking" : "driving",
    });
    if (waypoints.length) params.set("waypoints", waypoints.join("|"));
    routeUrls.push(`https://www.google.com/maps/dir/?${params.toString()}`);
    segmentOrigin = segment[segment.length - 1].destination;
  }

  return routeUrls;
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
    ...(itinerary.stay
      ? [`Stay: ${itinerary.stay.name} (${itinerary.stay.kind === "hotel" ? "Hotel" : "Airbnb"}), check-in Day ${itinerary.stay.checkInDay + 1} at ${minutesToTime(parseTimeToMinutes(itinerary.stay.checkInTime) ?? 0)}, checkout Day ${(itinerary.stay.checkOutDay ?? itinerary.numberOfDays - 1) + 1} at ${minutesToTime(parseTimeToMinutes(itinerary.stay.checkOutTime || "11:00") ?? 660)}`]
      : []),
    ...(itinerary.departure
      ? [`Departure: ${itinerary.departure.location.name}${itinerary.departure.time ? ` at ${minutesToTime(parseTimeToMinutes(itinerary.departure.time) ?? 0)}` : ""}`]
      : []),
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
        `${index + 1}. ${minutesToTime(item.arrivalMinutes)} - ${item.destination.name}${item.kind === "check-in" ? " (fixed check-in)" : item.kind === "check-out" ? " (fixed checkout)" : item.kind === "departure" ? " (departure)" : ""}`,
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
  kind = "destination",
  destination,
  from,
  arrivalMinutes,
  waitMinutes,
  distance,
  transport,
  number,
  eveningAddOn,
  placeMapUrl,
}: {
  kind?: "destination" | "check-in" | "check-out" | "departure";
  destination: PlannerDestination;
  from: PlannerLocation;
  arrivalMinutes: number;
  waitMinutes: number;
  distance: number;
  transport: PlannedTransport;
  number: number;
  eveningAddOn?: true;
  placeMapUrl?: string;
}): PlannedStop {
  return {
    kind,
    number,
    destination,
    arrivalMinutes,
    departureMinutes: arrivalMinutes + destination.duration,
    waitMinutes,
    distance,
    transport,
    from,
    ...(eveningAddOn ? { eveningAddOn } : {}),
    placeMapUrl: placeMapUrl ?? googleSearchUrl(destination.googleQuery || destination.name),
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

function stayToDestination(stay: PlannerStay): PlannerDestination {
  const isHotel = stay.kind === "hotel";
  return {
    id: `${stay.id}-check-in`,
    name: `${stay.name} check-in`,
    area: "City Center",
    duration: 30,
    open: stay.checkInTime,
    close: "23:59",
    category: "Stay",
    popular: false,
    description: `Check in at your ${isHotel ? "hotel" : "Airbnb"}, settle your luggage, and take a short breather before the next stop.`,
    activities:
      stay.luggagePlan === "property-drop"
        ? ["Confirm the early luggage arrangement", "Keep valuables with you", "Save the host or front-desk contact"]
        : ["Complete check-in", "Leave luggage securely", "Save the host or front-desk contact"],
    tags: ["stay", "check-in", stay.kind],
    icon: isHotel ? "🏨" : "🏠",
    image: "/assets/img/favicon.svg",
    googleQuery: stay.googleQuery,
    routeGuide: {
      ...GENERIC_ROUTE_GUIDE,
      modeLabel: `${isHotel ? "Hotel" : "Airbnb"} check-in`,
      loadingQuery: `${stay.name}, Baguio City`,
      signboard: `the route closest to ${stay.name}`,
      returnHint: "Keep the property pin open and confirm the safest drop-off with the driver.",
    },
    scope: "Baguio City",
    alight: `Show the driver the saved Google Maps pin and ask to alight at ${stay.name}.`,
    lat: stay.lat,
    lng: stay.lng,
  };
}

function stayToCheckoutDestination(stay: PlannerStay): PlannerDestination {
  const isHotel = stay.kind === "hotel";
  return {
    ...stayToDestination(stay),
    id: `${stay.id}-check-out`,
    name: `${stay.name} checkout`,
    duration: 20,
    open: stay.checkOutTime,
    description: `Pack up, return the key if needed, and complete checkout without rushing the final day.`,
    activities: [
      "Check drawers and charging outlets",
      "Confirm luggage storage if needed",
      "Keep the booking receipt and property contact",
    ],
    tags: ["stay", "check-out", stay.kind],
    icon: isHotel ? "🧳" : "🔑",
    routeGuide: {
      ...GENERIC_ROUTE_GUIDE,
      modeLabel: `${isHotel ? "Hotel" : "Airbnb"} checkout`,
      loadingQuery: `${stay.name}, Baguio City`,
      signboard: `the route closest to ${stay.name}`,
      returnHint: "Confirm luggage storage before leaving the property.",
    },
  };
}

function departureToDestination(departure: PlannerDeparture): PlannerDestination {
  return {
    id: `departure-${departure.location.id}`,
    name: `Depart from ${departure.location.name}`,
    area: departure.location.area,
    duration: 0,
    open: "00:00",
    close: "23:59",
    category: "Stay",
    popular: false,
    description: departure.time
      ? "Arrive with a practical boarding allowance before leaving Baguio."
      : "Finish the itinerary at your chosen departure point.",
    activities: [
      "Confirm the platform or loading bay",
      "Keep tickets and identification ready",
      "Allow extra time for Baguio traffic",
    ],
    tags: ["departure", "terminal"],
    icon: "🚌",
    image: "/assets/img/favicon.svg",
    googleQuery: departure.location.googleQuery,
    routeGuide: {
      ...GENERIC_ROUTE_GUIDE,
      modeLabel: "Departure transfer",
      loadingQuery: departure.location.googleQuery,
      signboard: departure.location.name,
      returnHint: "Confirm your service and boarding instructions with the operator.",
    },
    scope: "Baguio City",
    lat: departure.location.lat,
    lng: departure.location.lng,
  };
}

function startLocationForDay(
  tripStart: PlannerLocation,
  stay: PlannerStay | undefined,
  dayIndex: number,
): PlannerLocation {
  if (!stay || dayIndex <= stay.checkInDay) return tripStart;
  return {
    id: stay.id,
    name: stay.name,
    lat: stay.lat,
    lng: stay.lng,
    googleQuery: stay.googleQuery,
  };
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
    taxiPerMinute:
      settings?.taxiPerMinute ?? DEFAULT_FARE_SETTINGS.taxiPerMinute,
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
    scheduledStops: days.reduce(
      (sum, day) => sum + day.items.filter((item) => item.kind === "destination").length,
      0,
    ),
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

function locationForDirections(location: PlannerLocation): string {
  if (location.id === "current-location") return locationForUrl(location);
  return location.googleQuery || location.name || locationForUrl(location);
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundFareToQuarter(value: number): number {
  return Math.round(value * 4) / 4;
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
