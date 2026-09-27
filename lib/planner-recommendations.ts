import type { PlannerDestination } from "@/lib/planner-types";

export const EAST_BAGUIO_CORE_LOOP_IDS = [
  "botanical-garden",
  "wright-park",
  "the-mansion",
  "mines-view-park",
  "good-shepherd",
] as const;

const EAST_BAGUIO_CORE_LOOP_ID_SET = new Set<string>(EAST_BAGUIO_CORE_LOOP_IDS);

const EAST_BAGUIO_CORE_VISIT_MINUTES: Readonly<Record<string, number>> = {
  "botanical-garden": 30,
  "wright-park": 20,
  "the-mansion": 10,
  "mines-view-park": 25,
  "good-shepherd": 15,
};

const ARRIVAL_DAY_CITY_IDS = new Set([
  "burnham-park",
  "baguio-cathedral",
  "session-road",
  "baguio-night-market",
]);

const ARRIVAL_DAY_CITY_VISIT_MINUTES: Readonly<Record<string, number>> = {
  "burnham-park": 45,
  "baguio-cathedral": 30,
  "session-road": 30,
};

type EastBaguioLoopOptions = {
  completeLoop: boolean;
  compactForPackedDay: boolean;
};

type PackedArrivalRouteOptions = {
  numberOfDays: number;
  hasArrivalDayStay: boolean;
};

export function isEastBaguioCoreLoopDestination(destination: Pick<PlannerDestination, "id">) {
  return EAST_BAGUIO_CORE_LOOP_ID_SET.has(destination.id);
}

/**
 * Completes the classic East Baguio corridor when a traveler selects any one
 * of its anchor attractions. Suggestions remain removable in the review step.
 */
export function completeEastBaguioCoreLoop(
  selected: readonly PlannerDestination[],
  catalog: readonly PlannerDestination[],
  options: EastBaguioLoopOptions,
) {
  if (!options.completeLoop || !selected.some(isEastBaguioCoreLoopDestination)) {
    return { destinations: [...selected], suggestedIds: [] as string[] };
  }

  const selectedIds = new Set(selected.map(({ id }) => id));
  const suggestions = catalog.filter(
    (destination) => isEastBaguioCoreLoopDestination(destination) && !selectedIds.has(destination.id),
  );
  const destinations = [...selected, ...suggestions].map((destination) => {
    if (!options.compactForPackedDay) return destination;
    const recommendedDuration = EAST_BAGUIO_CORE_VISIT_MINUTES[destination.id];
    if (recommendedDuration) {
      return {
        ...destination,
        duration: Math.min(destination.duration, recommendedDuration),
        tags: [...new Set([...destination.tags, "classic-east-loop"])],
      };
    }
    const arrivalDayDuration = ARRIVAL_DAY_CITY_VISIT_MINUTES[destination.id];
    return arrivalDayDuration
      ? {
          ...destination,
          duration: Math.min(destination.duration, arrivalDayDuration),
          tags: [...new Set([...destination.tags, "arrival-city-loop"])],
        }
      : destination;
  });
  return {
    destinations,
    suggestedIds: suggestions.map(({ id }) => id),
  };
}

/** A packed arrival is opt-in by demand: many explicit choices across both corridors. */
export function shouldUsePackedArrivalRoute(
  selected: readonly PlannerDestination[],
  options: PackedArrivalRouteOptions,
) {
  if (!options.hasArrivalDayStay || options.numberOfDays < 2 || selected.length < 8) return false;
  const selectedIds = new Set(selected.map(({ id }) => id));
  const eastCount = selected.filter(isEastBaguioCoreLoopDestination).length;
  const cityCount = selected.filter(({ id }) => ARRIVAL_DAY_CITY_IDS.has(id)).length;
  return eastCount >= 3
    && cityCount >= 3
    && selectedIds.has("baguio-night-market");
}

/** Pins the packed template only when demand calls for it; the market remains a final-day default. */
export function defaultPlannerDayAssignments(
  destinations: readonly PlannerDestination[],
  numberOfDays: number,
  packedArrivalRoute: boolean,
) {
  const assignments: Record<string, number> = {};
  destinations.forEach((destination) => {
    if (packedArrivalRoute
      && (isEastBaguioCoreLoopDestination(destination) || ARRIVAL_DAY_CITY_IDS.has(destination.id))) {
      assignments[destination.id] = 0;
    }
    if (destination.id === "baguio-city-market" && numberOfDays > 1) {
      assignments[destination.id] = numberOfDays - 1;
    }
  });
  return assignments;
}
