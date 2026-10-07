import type { Place } from "./types";

export type PlaceGuideEditorial = {
  intro: string;
  bestFor: string;
  pace: string;
  visitPlan: readonly { title: string; copy: string }[];
  practicalTips: readonly string[];
};

const placeEditorial: Record<string, PlaceGuideEditorial> = {};

function genericEditorial(place: Place): PlaceGuideEditorial {
  const park = place.kind === "park";
  const restaurant = place.kind === "restaurant";

  return {
    intro: park
      ? `Treat ${place.name} as part of a ${place.area} route instead of crossing the city for one isolated stop. Its ${place.duration}-minute planning allowance leaves room to enter, look around, and continue without turning the visit into a photo sprint.`
      : restaurant
        ? `Use ${place.name} as a deliberate meal stop in your ${place.area} route. The ${place.duration}-minute planning allowance protects ordering, dining, and payment time before the next attraction.`
        : `Use ${place.name} as the base for places around ${place.area}. Confirm the exact entrance and check-in rules before calculating luggage and commute time.`,
    bestFor: park ? "First-time visitors building an area-based sightseeing day" : restaurant ? "Travelers protecting a real meal break" : "Travelers choosing a route-friendly base",
    pace: `${place.duration} minutes on site, plus the full approach and onward trip`,
    visitPlan: [
      { title: "Confirm before leaving", copy: "Recheck opening, access, fees, reservations, and weather on the actual travel date." },
      { title: "Use the exact entrance", copy: "Navigate to the public visitor entrance, not only the center point of the property." },
      { title: "Continue within the area", copy: `Choose the next compatible stop in ${place.area} to reduce backtracking through Baguio traffic.` },
    ],
    practicalTips: [
      "Keep a rain layer and a small time buffer for changing mountain weather.",
      "Ask local staff or a dispatcher when the final loading point or entrance is unclear.",
      "Treat published times and prices as planning references until confirmed live.",
    ],
  };
}

export function getPlaceGuideEditorial(place: Place) {
  return placeEditorial[place.id] ?? genericEditorial(place);
}

export { placeEditorial };
