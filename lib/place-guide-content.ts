import type { Place } from "./types";

export type PlaceGuideEditorial = {
  intro: string;
  bestFor: string;
  pace: string;
  visitPlan: readonly { title: string; copy: string }[];
  practicalTips: readonly string[];
};

const placeEditorial: Record<string, PlaceGuideEditorial> = {
  "mines-view-park": {
    intro: "Mines View works best near the start of an East Baguio loop, before the viewpoint and souvenir area become busier. The attraction is a mountain overlook—not a mine tour—so plan the stop around the view, the short walk through the stalls, and the uphill or stepped sections near the public entrance.",
    bestFor: "First-time visitors who want a classic Cordillera viewpoint",
    pace: "About 75 minutes on site, with extra time for the final approach",
    visitPlan: [
      { title: "Arrive with the weather in mind", copy: "Cloud and rain can hide the view quickly. Keep this stop movable within the East Baguio morning when possible." },
      { title: "Use the visitor entrance", copy: "Navigate to the public park entrance and protect time for the approach, stairs, viewpoint queue, and souvenir lane." },
      { title: "Continue nearby", copy: "Good Shepherd is the natural next stop. Wright Park, The Mansion, and Botanical Garden can follow on the return toward the city." },
    ],
    practicalTips: [
      "Expect crowds around the viewing deck on busy mornings and weekends.",
      "The short map distance to nearby stops can still include slopes, roadside walking, and queues.",
      "Keep purchases light until the longer sightseeing portion of the loop is finished.",
    ],
  },
  "wright-park": {
    intro: "Wright Park is not one single flat lawn. The Pool of Pines promenade and the horseback-riding area sit on different levels, so decide which part matters most before starting. Pairing it with The Mansion and Botanical Garden makes the visit more worthwhile than crossing town for this stop alone.",
    bestFor: "Families, first-time visitors, and an East Baguio walking sequence",
    pace: "About 75 minutes, adjusted for stairs, slopes, and horse-area activity",
    visitPlan: [
      { title: "Choose your entry side", copy: "Use the entrance closest to the part you want to see and do not assume every drop-off opens onto the same level." },
      { title: "Walk the Pool of Pines", copy: "Allow an unhurried pass along the pine-lined promenade before deciding whether to continue to the riding area." },
      { title: "Cross to nearby landmarks", copy: "The Mansion is the easiest companion stop; Botanical Garden and Mines View complete the larger East Baguio loop." },
    ],
    practicalTips: [
      "Wet steps and sloped paths deserve a slower pace after rain.",
      "Ask about current activity prices and safety rules before agreeing to a horse ride or photo service.",
      "Use a taxi fallback if rain, mobility needs, or tired legs make the next uphill connection impractical.",
    ],
  },
};

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
