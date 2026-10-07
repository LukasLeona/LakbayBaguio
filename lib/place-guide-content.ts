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
  "baguio-cathedral": {
    intro: "Baguio Cathedral is a short heritage and reflection stop above the Session Road area. It fits naturally into a city-center walk, but the climb from the commercial district can feel steeper than the map suggests. Use the upper road approach when stairs or weather make the direct pedestrian route uncomfortable.",
    bestFor: "A quiet heritage stop between Session Road and nearby city sights",
    pace: "About 35 minutes, plus the uphill approach you choose",
    visitPlan: [
      { title: "Check the church schedule", copy: "Treat worship services, ceremonies, and parish activity as the priority and adjust sightseeing quietly around them." },
      { title: "Choose stairs or road access", copy: "The direct city-center approach climbs; a vehicle drop-off nearer the upper entrance may be more comfortable." },
      { title: "Continue on foot", copy: "Session Road, Porta Vaga, SM Baguio, and other central stops are easier to combine than a distant attraction." },
    ],
    practicalTips: [
      "Dress and behave respectfully inside an active place of worship.",
      "Do not block entrances or services for photos.",
      "Allow extra walking time when the pavement is wet or the city center is crowded.",
    ],
  },
  "bencab-museum": {
    intro: "BenCab Museum is a destination visit along Asin Road rather than a quick downtown add-on. Protect time for both the galleries and the grounds, then include the full outbound and return journey. A rushed slot misses the main reason to travel this far from the city center.",
    bestFor: "Art, Cordilleran culture, gardens, and a slower half-day outing",
    pace: "About 150 minutes on site, excluding the substantial Asin Road trip",
    visitPlan: [
      { title: "Confirm access first", copy: "Check the museum's current opening day, last admission, entrance rules, and weather conditions before leaving Baguio proper." },
      { title: "Protect gallery and garden time", copy: "Start with the collections, then decide how much of the outdoor area fits your energy and the weather." },
      { title: "Secure the return", copy: "Arrange or confirm a taxi, driver, or reliable pickup plan before the end of the visit instead of assuming an immediate ride back." },
    ],
    practicalTips: [
      "Do not place this between two fixed city-center reservations.",
      "Keep a rain layer and shoes suitable for paths and changes in elevation.",
      "Confirm photography rules inside the galleries before taking pictures.",
    ],
  },
  "museo-kordilyera": {
    intro: "Museo Kordilyera is a focused indoor stop for understanding Cordilleran peoples through material culture, exhibition research, and interpretation. It works well as the cultural anchor of a city-center day, especially when rain makes an outdoor-heavy route less appealing.",
    bestFor: "Travelers who want context for Cordilleran art, history, and culture",
    pace: "About 75 minutes, with time to read rather than only photograph displays",
    visitPlan: [
      { title: "Verify the museum calendar", copy: "Because the museum is within UP Baguio, confirm current opening days, campus access, holidays, and any exhibition changeover." },
      { title: "Follow the exhibit story", copy: "Allow time for labels and interpretation so the stop adds context to the rest of the Baguio trip." },
      { title: "Keep the next stop central", copy: "Pair the museum with Session Road, Burnham Park, Baguio Cathedral, or a nearby meal rather than a distant area loop." },
    ],
    practicalTips: [
      "Use quiet indoor time here as a weather fallback, but still confirm same-day access.",
      "Respect exhibit photography restrictions and university rules.",
      "Budget for the campus approach and the walk back to the main road or next loading point.",
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
