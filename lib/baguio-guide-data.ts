import { PLANNER_DESTINATIONS, PLANNER_ROUTE_GUIDES } from "@/lib/planner-data";
import type { PlannerArea, PlannerDestination } from "@/lib/planner-types";

export const BAGUIO_GUIDE_PUBLISHED_DATE = "2026-10-05";
export const BAGUIO_GUIDE_REVIEW_LABEL = "October 5, 2026";

export type GuideLoop = {
  id: string;
  title: string;
  area: PlannerArea;
  summary: string;
  bestFor: string;
  timeNeeded: string;
  travelNote: string;
  destinationIds: readonly string[];
};

export const BAGUIO_GUIDE_LOOPS: readonly GuideLoop[] = [
  {
    id: "east-baguio",
    title: "East Baguio classics",
    area: "East Baguio",
    summary: "The strongest first-visit loop: gardens, pine-lined landmarks, a mountain viewpoint, and a nearby pasalubong stop.",
    bestFor: "First-time visitors and photo stops",
    timeNeeded: "5–7 hours with lunch and commute buffers",
    travelNote: "Stay in the east once you arrive. Returning to the city center between every stop wastes time.",
    destinationIds: [
      "botanical-garden",
      "wright-park",
      "the-mansion",
      "mines-view-park",
      "good-shepherd",
      "teachers-camp",
      "bamboo-eco-park",
      "arcas-yard",
    ],
  },
  {
    id: "city-center",
    title: "City-center walk and evening",
    area: "City Center",
    summary: "The most flexible cluster for arrival day, after hotel check-in, or a weather-adjusted afternoon.",
    bestFor: "Walking, food, museums, shopping, and evening plans",
    timeNeeded: "3–7 hours depending on museums and the Night Market",
    travelNote: "The center is hilly despite short map distances. Schedule museums before closing and the Night Market only at night.",
    destinationIds: [
      "burnham-park",
      "baguio-cathedral",
      "session-road",
      "ili-likha",
      "baguio-museum",
      "museo-kordilyera",
      "sunshine-park",
      "baguio-orchidarium",
      "laperal-white-house",
      "baguio-city-market",
      "baguio-night-market",
    ],
  },
  {
    id: "camp-john-hay",
    title: "Camp John Hay and south Baguio",
    area: "South Baguio",
    summary: "A slower pine-forest day with a focused historical route instead of trying to cover the entire estate.",
    bestFor: "Nature, heritage, families, and a less urban day",
    timeNeeded: "Half to one full day",
    travelNote: "Camp John Hay is a large estate. Choose the specific entrance and attractions before boarding.",
    destinationIds: [
      "camp-john-hay",
      "john-hay-historical-core",
      "bell-house",
      "cemetery-of-negativism",
      "maryknoll-ecological-sanctuary",
      "philippine-military-academy",
      "lions-head",
    ],
  },
  {
    id: "west-baguio",
    title: "West Baguio arts and viewpoints",
    area: "West Baguio",
    summary: "A culture-heavy route through hillside parks, studios, heritage sites, and craft communities.",
    bestFor: "Art, Cordilleran culture, viewpoints, and repeat visitors",
    timeNeeded: "5–8 hours depending on how many major attractions you enter",
    travelNote: "Pick one or two anchor attractions. Stairs, slopes, and cross-hill transfers make every stop slower than it looks.",
    destinationIds: [
      "mirador-heritage-eco-park",
      "lourdes-grotto",
      "diplomat-hotel",
      "tam-awan-village",
      "igorot-stone-kingdom",
      "easter-weaving-room",
      "ifugao-woodcarvers-village",
    ],
  },
  {
    id: "la-trinidad",
    title: "North Baguio and La Trinidad",
    area: "La Trinidad",
    summary: "A Benguet side trip for farms, gardens, cultural sites, and elevated viewpoints beyond Baguio City proper.",
    bestFor: "Produce, gardens, short hikes, and a dedicated side-trip day",
    timeNeeded: "Half day for the valley; full day for an upland stop",
    travelNote: "Traffic across the Baguio–La Trinidad corridor is variable. Do not promise several mountain stops on a short checkout day.",
    destinationIds: [
      "bell-church",
      "valley-of-colors",
      "strawberry-farm",
      "mount-costa",
      "mt-kalugong",
      "mt-yangbew",
      "bahong-flower-farm",
      "haights-place",
    ],
  },
  {
    id: "asin-tuba",
    title: "Asin Road and Tuba",
    area: "Tuba / Asin",
    summary: "A destination-led side trip for art, forests, hot springs, and newer attractions outside the compact city routes.",
    bestFor: "Art lovers, nature trips, and travelers with arranged transport",
    timeNeeded: "One dedicated day",
    travelNote: "Return service can be limited. Confirm the final ride back before leaving Baguio and avoid combining several remote stops casually.",
    destinationIds: [
      "bencab-museum",
      "asin-hot-springs",
      "hydro-falls",
      "mt-camisong-forest-park",
      "dragon-treasure-castle",
    ],
  },
  {
    id: "atok",
    title: "Atok mountain day trip",
    area: "Atok Side Trip",
    summary: "A very early, weather-sensitive Benguet trip that should never be presented as a quick Baguio city stop.",
    bestFor: "Flower farms, mountain views, and travelers with a full spare day",
    timeNeeded: "One long dedicated day",
    travelNote: "Reserve transport, verify admission, and confirm the last Baguio-bound trip. Fog, rain, and mountain-road delays can change the plan.",
    destinationIds: ["northern-blossom-flower-farm", "highest-point-halsema"],
  },
] as const;

const DESTINATIONS_BY_ID = new Map(
  PLANNER_DESTINATIONS.map((destination) => [destination.id, destination] as const),
);

export function getGuideDestination(id: string): PlannerDestination | undefined {
  return DESTINATIONS_BY_ID.get(id);
}

export function getLoopDestinations(loop: GuideLoop): readonly PlannerDestination[] {
  return loop.destinationIds.flatMap((id) => {
    const destination = getGuideDestination(id);
    return destination ? [destination] : [];
  });
}

export function getGuideLoopForDestination(id: string): GuideLoop | undefined {
  return BAGUIO_GUIDE_LOOPS.find((loop) => loop.destinationIds.includes(id));
}

export const BAGUIO_GUIDE_DESTINATIONS = BAGUIO_GUIDE_LOOPS.flatMap(getLoopDestinations);

export function formatGuideTime(time: string): string {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

export function formatVisitDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export function destinationPlanningNote(destination: PlannerDestination): string {
  const id = destination.id;
  if (["mt-kalugong", "mt-yangbew", "hydro-falls"].includes(id)) {
    return "Outdoor terrain and weather matter; wear suitable footwear and confirm local access before leaving.";
  }
  if (["baguio-city-market", "good-shepherd", "session-road", "baguio-night-market"].includes(id)) {
    return "Purchases, queues, and operating conditions vary. Keep shopping time and spending separate from admission.";
  }
  if (["philippine-military-academy", "teachers-camp", "bahong-flower-farm", "haights-place"].includes(id)) {
    return "Access can depend on current institutional or property rules; confirm permission before making the trip.";
  }
  if (destination.area === "Tuba / Asin" || destination.area === "Atok Side Trip") {
    return "Treat this as a destination trip and confirm both entry and return transportation in advance.";
  }
  if (destination.category === "Museum" || destination.category === "Culture") {
    return "Confirm the visitor entrance, opening day, and any event or service restrictions.";
  }
  return "Allow time for the final walk, queues, photos, and changing mountain weather.";
}

export function routeGuideForLoop(loop: GuideLoop) {
  return PLANNER_ROUTE_GUIDES[loop.area];
}

