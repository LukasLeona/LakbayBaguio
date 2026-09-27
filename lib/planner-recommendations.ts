import type { PlannerDestination } from "@/lib/planner-types";

export const EAST_BAGUIO_CORE_LOOP_IDS = [
  "botanical-garden",
  "wright-park",
  "the-mansion",
  "mines-view-park",
] as const;

const EAST_BAGUIO_CORE_LOOP_ID_SET = new Set<string>(EAST_BAGUIO_CORE_LOOP_IDS);

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
) {
  if (!selected.some(isEastBaguioCoreLoopDestination)) {
    return { destinations: [...selected], suggestedIds: [] as string[] };
  }

  const selectedIds = new Set(selected.map(({ id }) => id));
  const suggestions = catalog.filter(
    (destination) => isEastBaguioCoreLoopDestination(destination) && !selectedIds.has(destination.id),
  );
  return {
    destinations: [...selected, ...suggestions],
    suggestedIds: suggestions.map(({ id }) => id),
  };
}
