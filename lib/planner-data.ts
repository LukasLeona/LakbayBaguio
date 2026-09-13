/**
 * Typed migration of the original Lakbay Baguio planning dataset.
 *
 * Coordinates, schedules, fares, and public-transport guidance are planning aids.
 * Travelers should confirm current hours, admission rules, fares, and loading areas.
 */

import type {
  BaggageOption,
  BaggageOptionsByStart,
  FareSettings,
  PlannerArea,
  PlannerCategoryFilter,
  PlannerData,
  PlannerDefaults,
  PlannerDestination,
  RouteGuide,
  StartLocation,
} from "@/lib/planner-types";

export const PLANNER_ROUTE_GUIDES = {
  "City Center": {
    "modeLabel": "City-center jeepney or walk",
    "loadingArea": "Lower Session Road, Harrison Road, or the public-market transport area",
    "loadingQuery": "Lower Session Road jeepney terminal Baguio",
    "signboard": "Ask for the CBD route closest to your destination",
    "returnHint": "Most city-center stops are walkable; otherwise ask for a jeepney returning to Plaza, Burnham, or the public market."
  },
  "East Baguio": {
    "modeLabel": "Mines View / Pacdal jeepney",
    "loadingArea": "City-center Mines View or Pacdal loading area; ask a dispatcher near the Plaza or lower Mabini area",
    "loadingQuery": "Mines View jeepney terminal Baguio city center",
    "signboard": "Mines View, Pacdal, or a route serving Leonard Wood Road",
    "returnHint": "Use the designated city-bound loading area and confirm that the jeepney returns to Plaza or Burnham."
  },
  "South Baguio": {
    "modeLabel": "Scout Barrio / Loakan / Kias jeepney",
    "loadingArea": "A city-center terminal serving Scout Barrio, Loakan, Kias, or PMA",
    "loadingQuery": "Scout Barrio jeepney terminal Baguio",
    "signboard": "Scout Barrio, Loakan, Kias, Camp John Hay, or PMA as appropriate",
    "returnHint": "Ask staff where the city-bound jeepney waits; Camp John Hay entrances can require additional walking."
  },
  "West Baguio": {
    "modeLabel": "Quezon Hill / Tam-awan / Lourdes jeepney",
    "loadingArea": "City-center or market-side terminal serving Quezon Hill, Tam-awan, Lourdes, or Dominican Hill",
    "loadingQuery": "Quezon Hill jeepney terminal Baguio",
    "signboard": "Confirm Tam-awan, Lourdes, Dominican Hill, or Quezon Hill before boarding",
    "returnHint": "Return from the marked roadside loading point and ask for Plaza, Burnham, or the public market."
  },
  "North Baguio": {
    "modeLabel": "La Trinidad / Bokawkan jeepney",
    "loadingArea": "Magsaysay Avenue or the Baguio Center Mall transport area",
    "loadingQuery": "La Trinidad jeepney terminal Baguio Center Mall",
    "signboard": "La Trinidad, Bokawkan, or Bell Church",
    "returnHint": "Use a Baguio-bound jeepney and confirm the Plaza or city-center drop-off."
  },
  "La Trinidad": {
    "modeLabel": "La Trinidad jeepney",
    "loadingArea": "Magsaysay Avenue or Baguio Center Mall area",
    "loadingQuery": "La Trinidad jeepney terminal Baguio Center Mall",
    "signboard": "La Trinidad; tell the dispatcher the exact attraction",
    "returnHint": "Board a Baguio-bound jeepney from an official loading area and confirm the city-center stop."
  },
  "Tuba / Asin": {
    "modeLabel": "Asin / Tuba jeepney or hired vehicle",
    "loadingArea": "Confirm the current Asin or Tuba loading area with the Baguio public-market dispatcher",
    "loadingQuery": "Asin Road jeepney terminal Baguio",
    "signboard": "Asin, Nangalisan, or the exact barangay of the attraction",
    "returnHint": "Return trips can be less frequent. Ask the driver about the final city-bound trip before alighting."
  },
  "Atok Side Trip": {
    "modeLabel": "Atok-bound bus or hired vehicle",
    "loadingArea": "Dangwa or Slaughterhouse-area terminals serving northern Benguet; verify the current operator",
    "loadingQuery": "Atok bus terminal Baguio",
    "signboard": "Atok or Sayangan; confirm the attraction and return schedule",
    "returnHint": "This is a long side trip. Reserve transport and confirm the last Baguio-bound departure in advance."
  }
} as const satisfies Readonly<
  Record<PlannerArea, RouteGuide>
>;

export const PLANNER_START_LOCATIONS = [
  {
    "id": "victory-liner",
    "name": "Victory Liner Baguio Terminal",
    "lat": 16.40179,
    "lng": 120.59903,
    "area": "City Center",
    "terminal": true,
    "googleQuery": "Victory Liner Baguio Terminal"
  },
  {
    "id": "gov-pack",
    "name": "Gov. Pack Road Bus Terminal",
    "lat": 16.40946,
    "lng": 120.59978,
    "area": "City Center",
    "terminal": true,
    "googleQuery": "Gov Pack Road Baguio bus terminal"
  },
  {
    "id": "genesis-baguio",
    "name": "Genesis Transport - Baguio Terminal",
    "lat": 16.40905,
    "lng": 120.6001,
    "area": "City Center",
    "terminal": true,
    "googleQuery": "Genesis Transport Baguio Terminal Gov Pack Road"
  },
  {
    "id": "joybus-baguio",
    "name": "JoyBus - Baguio Terminal",
    "lat": 16.40905,
    "lng": 120.6001,
    "area": "City Center",
    "terminal": true,
    "googleQuery": "JoyBus Baguio Terminal Gov Pack Road"
  },
  {
    "id": "sm-baguio",
    "name": "SM City Baguio",
    "lat": 16.40817,
    "lng": 120.59997,
    "area": "City Center",
    "googleQuery": "SM City Baguio"
  },
  {
    "id": "burnham-start",
    "name": "Burnham Park",
    "lat": 16.41107,
    "lng": 120.59334,
    "area": "City Center",
    "googleQuery": "Burnham Park Baguio"
  },
  {
    "id": "session-start",
    "name": "Session Road",
    "lat": 16.41273,
    "lng": 120.59864,
    "area": "City Center",
    "googleQuery": "Session Road Baguio"
  },
  {
    "id": "hotel-custom",
    "name": "My hotel / accommodation",
    "lat": 16.4117,
    "lng": 120.598,
    "area": "City Center",
    "customName": true,
    "googleQuery": "Baguio City"
  }
] as const satisfies readonly StartLocation[];

export const PLANNER_BAGGAGE_OPTIONS = {
  "victory-liner": [
    {
      "name": "Victory Liner terminal baggage counter",
      "detail": "Traveler reports indicate a paid counter may be available and same-day ticket conditions can apply. Verify eligibility, hours, and fees directly at the terminal.",
      "query": "Victory Liner Baguio Terminal"
    },
    {
      "name": "SM City Baguio Tourist Lounge",
      "detail": "A reported alternative near the city center. Availability, level, size limits, and rates can change, so confirm with the mall concierge.",
      "query": "SM City Baguio Tourist Lounge"
    }
  ],
  "gov-pack": [
    {
      "name": "Genesis / JoyBus terminal counter",
      "detail": "Travelers have reported short-term baggage acceptance near Gov. Pack. Confirm the current policy and claim-ticket procedure at the counter.",
      "query": "Genesis Transport Baguio Terminal Gov Pack Road"
    },
    {
      "name": "SM City Baguio Tourist Lounge",
      "detail": "A nearby reported luggage option. Confirm current operating hours and rates before relying on it.",
      "query": "SM City Baguio Tourist Lounge"
    }
  ],
  "genesis-baguio": [
    {
      "name": "Genesis terminal counter",
      "detail": "Ask the terminal counter whether short-term luggage storage is currently available. Fees and operating rules are not guaranteed.",
      "query": "Genesis Transport Baguio Terminal Gov Pack Road"
    },
    {
      "name": "SM City Baguio Tourist Lounge",
      "detail": "A nearby reported alternative. Confirm current availability and rates with the mall concierge.",
      "query": "SM City Baguio Tourist Lounge"
    }
  ],
  "joybus-baguio": [
    {
      "name": "JoyBus / Genesis terminal counter",
      "detail": "Ask the counter about current baggage-hold rules before leaving the terminal. Keep valuables with you.",
      "query": "JoyBus Baguio Terminal Gov Pack Road"
    },
    {
      "name": "SM City Baguio Tourist Lounge",
      "detail": "A nearby reported alternative. Verify the exact level, opening time, and rates on arrival.",
      "query": "SM City Baguio Tourist Lounge"
    }
  ]
} as const satisfies BaggageOptionsByStart;

const RAW_DESTINATIONS = [
  {
    "id": "burnham-park",
    "name": "Burnham Park",
    "area": "City Center",
    "lat": 16.41107,
    "lng": 120.59334,
    "duration": 75,
    "open": "05:00",
    "close": "22:00",
    "category": "Park",
    "popular": true,
    "description": "Baguio's central lake park and one of the easiest places to begin a relaxed city route.",
    "activities": [
      "Rent a paddle boat on Burnham Lake",
      "Try strawberry taho and local street snacks",
      "Bike or skate around the park",
      "Walk through the Rose Garden and Orchidarium"
    ],
    "tags": [
      "family",
      "nature",
      "walkable",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/burnham-park.jpg",
    "googleQuery": "Burnham Park, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask to alight near Harrison Road, Lake Drive, or your preferred Burnham entrance.",
    "routeGuideArea": "City Center"
  },
  {
    "id": "session-road",
    "name": "Session Road",
    "area": "City Center",
    "lat": 16.41356,
    "lng": 120.59774,
    "duration": 60,
    "open": "06:00",
    "close": "23:00",
    "category": "Food & shopping",
    "popular": true,
    "description": "The city's best-known commercial street, lined with cafés, restaurants, shops, and landmarks.",
    "activities": [
      "Try a local café or bakery",
      "Walk from lower to upper Session Road",
      "Browse local shops and pasalubong stores",
      "Visit the cathedral from the upper section"
    ],
    "tags": [
      "food",
      "shopping",
      "walkable",
      "popular"
    ],
    "icon": "🛍️",
    "image": "assets/img/destinations/session-road.jpg",
    "googleQuery": "Session Road, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "baguio-cathedral",
    "name": "Baguio Cathedral",
    "area": "City Center",
    "lat": 16.41466,
    "lng": 120.59885,
    "duration": 35,
    "open": "06:00",
    "close": "19:00",
    "category": "Culture",
    "popular": true,
    "description": "A rose-colored hilltop landmark overlooking Session Road and the city center.",
    "activities": [
      "Take in the city view from the courtyard",
      "Use the historic cathedral stairs",
      "Keep voices low during services",
      "Pair the stop with Session Road"
    ],
    "tags": [
      "heritage",
      "view",
      "walkable",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/baguio-cathedral.jpg",
    "googleQuery": "Baguio Cathedral, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "baguio-city-market",
    "name": "Baguio City Market",
    "area": "City Center",
    "lat": 16.41574,
    "lng": 120.59406,
    "duration": 75,
    "open": "05:00",
    "close": "19:00",
    "category": "Food & shopping",
    "popular": true,
    "description": "A lively market for vegetables, strawberries, delicacies, woven goods, flowers, and souvenirs.",
    "activities": [
      "Buy fresh strawberries when in season",
      "Compare pasalubong prices",
      "Look for woven Cordilleran products",
      "Try local delicacies in the food sections"
    ],
    "tags": [
      "food",
      "shopping",
      "souvenirs",
      "popular"
    ],
    "icon": "🛍️",
    "image": "assets/img/destinations/baguio-city-market.jpg",
    "googleQuery": "Baguio City Market, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "baguio-night-market",
    "name": "Baguio Night Market",
    "area": "City Center",
    "lat": 16.4122,
    "lng": 120.596,
    "duration": 90,
    "open": "21:00",
    "close": "02:00",
    "category": "Food & shopping",
    "popular": true,
    "description": "A late-night Harrison Road market known for ukay-ukay, affordable finds, and street food.",
    "activities": [
      "Browse ukay-ukay stalls",
      "Try warm street food in the cold evening",
      "Bring small bills and keep valuables secure",
      "Arrive after the road is officially closed for the market"
    ],
    "tags": [
      "shopping",
      "food",
      "night",
      "popular"
    ],
    "icon": "🛍️",
    "image": "assets/img/destinations/baguio-night-market.jpg",
    "googleQuery": "Baguio Night Market Harrison Road",
    "scope": "Baguio City",
    "timeSlot": "night",
    "routeGuideArea": "City Center"
  },
  {
    "id": "ili-likha",
    "name": "Ili-Likha Artists Village",
    "area": "City Center",
    "lat": 16.41375,
    "lng": 120.59645,
    "duration": 75,
    "open": "10:00",
    "close": "20:00",
    "category": "Culture",
    "popular": true,
    "description": "A creative multi-level space combining local food, art, woodwork, and imaginative architecture.",
    "activities": [
      "Try food from the independent stalls",
      "Explore the layered art-filled interiors",
      "Check for workshops or performances",
      "Take photos without blocking narrow paths"
    ],
    "tags": [
      "art",
      "culture",
      "food",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/ili-likha.jpg",
    "googleQuery": "Ili-Likha Artists Village, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Walk from Session Road or ask to alight near Assumption Road.",
    "routeGuideArea": "City Center"
  },
  {
    "id": "baguio-museum",
    "name": "Baguio Museum",
    "area": "City Center",
    "lat": 16.40785,
    "lng": 120.59925,
    "duration": 60,
    "open": "09:00",
    "close": "17:00",
    "category": "Museum",
    "popular": false,
    "description": "A compact introduction to Cordilleran history, textiles, material culture, and traditional life.",
    "activities": [
      "Read the regional history displays",
      "Study Cordilleran textiles and objects",
      "Pair it with SM Baguio or Sunshine Park",
      "Check current gallery hours before visiting"
    ],
    "tags": [
      "culture",
      "indoors",
      "history"
    ],
    "icon": "🏛️",
    "image": "assets/img/destinations/baguio-museum.jpg",
    "googleQuery": "Baguio Museum, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "museo-kordilyera",
    "name": "Museo Kordilyera",
    "area": "City Center",
    "lat": 16.4028,
    "lng": 120.5918,
    "duration": 75,
    "open": "09:00",
    "close": "17:00",
    "category": "Museum",
    "popular": false,
    "description": "A university museum focused on the peoples, arts, histories, and material culture of the Cordillera.",
    "activities": [
      "Explore rotating exhibitions",
      "Read the cultural context carefully",
      "Visit the UP Baguio campus grounds",
      "Check academic-calendar closures"
    ],
    "tags": [
      "culture",
      "museum",
      "history"
    ],
    "icon": "🏛️",
    "image": "assets/img/destinations/museo-kordilyera.jpg",
    "googleQuery": "Museo Kordilyera, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "sunshine-park",
    "name": "Sunshine Park",
    "area": "City Center",
    "lat": 16.4086,
    "lng": 120.598,
    "duration": 35,
    "open": "06:00",
    "close": "18:00",
    "category": "Park",
    "popular": false,
    "description": "A small green public space near Baguio Museum, the Convention Center, and SM Baguio.",
    "activities": [
      "Take a short rest between city stops",
      "Pair it with Baguio Museum",
      "Enjoy a quiet morning walk",
      "Use it as a meeting point near the terminal area"
    ],
    "tags": [
      "park",
      "walkable",
      "quiet"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/sunshine-park.jpg",
    "googleQuery": "Sunshine Park, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "baguio-orchidarium",
    "name": "Baguio Orchidarium",
    "area": "City Center",
    "lat": 16.4107,
    "lng": 120.5905,
    "duration": 45,
    "open": "08:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A plant and flower area beside Burnham Park with orchids, ornamentals, and garden stalls.",
    "activities": [
      "Browse orchids and potted plants",
      "Ask before photographing vendor displays",
      "Pair it with Burnham Park",
      "Visit in the morning for softer light"
    ],
    "tags": [
      "plants",
      "garden",
      "walkable"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/baguio-orchidarium.jpg",
    "googleQuery": "Baguio Orchidarium, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "laperal-white-house",
    "name": "Laperal White House",
    "area": "City Center",
    "lat": 16.4172,
    "lng": 120.6043,
    "duration": 50,
    "open": "09:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A historic American-era house along Leonard Wood Road, known for its architecture and exhibitions.",
    "activities": [
      "Appreciate the exterior details",
      "Check whether the interior exhibit is open",
      "Pair it with Teachers Camp",
      "Respect restricted areas"
    ],
    "tags": [
      "heritage",
      "architecture",
      "culture"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/laperal-white-house.jpg",
    "googleQuery": "Laperal White House, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "City Center"
  },
  {
    "id": "teachers-camp",
    "name": "Teachers Camp",
    "area": "East Baguio",
    "lat": 16.419,
    "lng": 120.6082,
    "duration": 50,
    "open": "06:00",
    "close": "18:00",
    "category": "Culture",
    "popular": false,
    "description": "A historic pine-filled institutional compound with heritage buildings and a quiet Baguio atmosphere.",
    "activities": [
      "Walk around publicly accessible areas",
      "Observe heritage architecture",
      "Pair it with Laperal White House",
      "Respect events and restricted facilities"
    ],
    "tags": [
      "heritage",
      "pine",
      "quiet"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/teachers-camp.jpg",
    "googleQuery": "Teachers Camp, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "botanical-garden",
    "name": "Baguio Botanical Garden",
    "area": "East Baguio",
    "lat": 16.42194,
    "lng": 120.61335,
    "duration": 90,
    "open": "06:00",
    "close": "18:00",
    "category": "Park",
    "popular": true,
    "description": "A landscaped cultural garden with greenery, art, Cordilleran features, and photo areas.",
    "activities": [
      "Explore the cultural installations",
      "Walk the garden paths slowly",
      "Look for seasonal floral displays",
      "Visit early to avoid large crowds"
    ],
    "tags": [
      "nature",
      "culture",
      "photos",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/botanical-garden.jpg",
    "googleQuery": "Baguio Botanical Garden, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask the driver to drop you at the Botanical Garden main entrance on Leonard Wood Road.",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "wright-park",
    "name": "Wright Park",
    "area": "East Baguio",
    "lat": 16.42011,
    "lng": 120.61917,
    "duration": 75,
    "open": "06:00",
    "close": "18:00",
    "category": "Park",
    "popular": true,
    "description": "A pine-lined promenade beside The Mansion, known for the Pool of Pines and horseback-riding area.",
    "activities": [
      "Walk the Pool of Pines promenade",
      "Ride a horse through an accredited handler",
      "Rent Cordilleran-inspired attire respectfully",
      "Walk to The Mansion gate"
    ],
    "tags": [
      "nature",
      "family",
      "horse",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/wright-park.jpg",
    "googleQuery": "Wright Park, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask to alight near Wright Park or The Mansion. The two attractions are walkable from each other.",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "the-mansion",
    "name": "The Mansion",
    "area": "East Baguio",
    "lat": 16.42068,
    "lng": 120.62001,
    "duration": 35,
    "open": "06:00",
    "close": "18:00",
    "category": "Culture",
    "popular": true,
    "description": "The official presidential summer residence, viewed from its iconic gate and landscaped approach.",
    "activities": [
      "Take a photo from the public gate area",
      "Read the historical marker",
      "Pair it with Wright Park",
      "Avoid blocking traffic at the entrance"
    ],
    "tags": [
      "landmark",
      "photos",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/the-mansion.jpg",
    "googleQuery": "The Mansion, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "mines-view-park",
    "name": "Mines View Park",
    "area": "East Baguio",
    "lat": 16.42492,
    "lng": 120.62771,
    "duration": 75,
    "open": "05:00",
    "close": "20:00",
    "category": "Viewpoint",
    "popular": true,
    "description": "A classic viewpoint with souvenir stalls and mountain scenery toward the Cordillera ranges.",
    "activities": [
      "Visit the viewing deck",
      "Browse souvenir stalls",
      "Try local snacks and strawberry products",
      "Go early for lighter crowds and clearer views"
    ],
    "tags": [
      "view",
      "souvenirs",
      "popular"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/mines-view-park.jpg",
    "googleQuery": "Mines View Park, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ride to the Mines View terminal and follow the pedestrian signs to the park entrance.",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "good-shepherd",
    "name": "Good Shepherd Convent",
    "area": "East Baguio",
    "lat": 16.42529,
    "lng": 120.62924,
    "duration": 45,
    "open": "08:00",
    "close": "17:00",
    "category": "Food & shopping",
    "popular": true,
    "description": "A popular pasalubong stop near Mines View Park, known for ube jam and other local products.",
    "activities": [
      "Check product availability before lining up",
      "Buy only what you can safely carry",
      "Enjoy the view from the grounds",
      "Walk from Mines View when weather allows"
    ],
    "tags": [
      "food",
      "pasalubong",
      "popular"
    ],
    "icon": "🛍️",
    "image": "assets/img/destinations/good-shepherd.jpg",
    "googleQuery": "Good Shepherd Convent, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "arcas-yard",
    "name": "Arca's Yard",
    "area": "East Baguio",
    "lat": 16.435,
    "lng": 120.625,
    "duration": 90,
    "open": "09:00",
    "close": "19:00",
    "category": "Food & shopping",
    "popular": false,
    "description": "A cozy café and cultural space in the hills, known for views, books, local design, and relaxed meals.",
    "activities": [
      "Reserve a table on busy dates",
      "Try a warm drink with a mountain view",
      "Browse books and local displays",
      "Use a taxi for easier access"
    ],
    "tags": [
      "food",
      "view",
      "quiet"
    ],
    "icon": "🛍️",
    "image": "assets/img/destinations/arcas-yard.jpg",
    "googleQuery": "Arca's Yard, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask for Tiptop or Ambuklao Road and confirm the safest drop-off for Arca's Yard.",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "bamboo-eco-park",
    "name": "Bamboo Eco Park",
    "area": "East Baguio",
    "lat": 16.4315,
    "lng": 120.6168,
    "duration": 60,
    "open": "07:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A quieter bamboo-filled green space suited to gentle walks and nature photography.",
    "activities": [
      "Walk through the bamboo paths",
      "Use insect protection",
      "Visit in daylight",
      "Confirm current admission and access"
    ],
    "tags": [
      "nature",
      "quiet",
      "hidden"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/bamboo-eco-park.jpg",
    "googleQuery": "Bamboo Eco Park, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "East Baguio"
  },
  {
    "id": "camp-john-hay",
    "name": "Camp John Hay",
    "area": "South Baguio",
    "lat": 16.39784,
    "lng": 120.61137,
    "duration": 150,
    "open": "06:00",
    "close": "20:00",
    "category": "Park",
    "popular": true,
    "description": "A broad pine-covered estate with trails, heritage sites, cafés, and recreational areas.",
    "activities": [
      "Walk the Yellow Trail or an easier forest path",
      "Visit Bell House and the historical core",
      "Try a picnic or café stop",
      "Allow extra travel time between areas inside the estate"
    ],
    "tags": [
      "nature",
      "food",
      "long visit",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/camp-john-hay.jpg",
    "googleQuery": "Camp John Hay, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Tell the driver which Camp John Hay entrance you need. A taxi is often simpler for specific sites inside the estate.",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "bell-house",
    "name": "Bell House",
    "area": "South Baguio",
    "lat": 16.4002,
    "lng": 120.6115,
    "duration": 45,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A preserved American-era residence within Camp John Hay's historical core.",
    "activities": [
      "Tour the period rooms when open",
      "Walk around the landscaped grounds",
      "Pair it with the Cemetery of Negativism",
      "Check the historical-core entrance fee"
    ],
    "tags": [
      "heritage",
      "history",
      "camp john hay"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/bell-house.jpg",
    "googleQuery": "Bell House, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "cemetery-of-negativism",
    "name": "Cemetery of Negativism",
    "area": "South Baguio",
    "lat": 16.3994,
    "lng": 120.612,
    "duration": 25,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A playful symbolic site inside Camp John Hay encouraging visitors to leave negative habits behind.",
    "activities": [
      "Read the humorous markers",
      "Pair it with Bell House",
      "Keep the visit short and reflective",
      "Stay on designated paths"
    ],
    "tags": [
      "quirky",
      "heritage",
      "camp john hay"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/cemetery-of-negativism.jpg",
    "googleQuery": "Cemetery of Negativism, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "john-hay-historical-core",
    "name": "John Hay Historical Core",
    "area": "South Baguio",
    "lat": 16.4004,
    "lng": 120.6112,
    "duration": 90,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A cluster of heritage attractions inside Camp John Hay, including Bell House and historical markers.",
    "activities": [
      "Buy the appropriate entrance ticket",
      "Follow the heritage walk",
      "Combine nearby sites in one visit",
      "Allow time for uphill paths"
    ],
    "tags": [
      "heritage",
      "history",
      "camp john hay"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/john-hay-historical-core.jpg",
    "googleQuery": "John Hay Historical Core, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "philippine-military-academy",
    "name": "Philippine Military Academy",
    "area": "South Baguio",
    "lat": 16.3604,
    "lng": 120.6164,
    "duration": 120,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": true,
    "description": "A historic military academy with manicured grounds, monuments, and mountain scenery, subject to visitor rules.",
    "activities": [
      "Bring valid identification",
      "Follow current security and dress rules",
      "Visit approved public areas only",
      "Check access before traveling"
    ],
    "tags": [
      "history",
      "landmark",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/philippine-military-academy.jpg",
    "googleQuery": "Philippine Military Academy, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Use a PMA or Kias route only after confirming visitor access and the correct gate.",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "lions-head",
    "name": "Lion's Head",
    "area": "South Baguio",
    "lat": 16.3629,
    "lng": 120.6057,
    "duration": 30,
    "open": "06:00",
    "close": "18:00",
    "category": "Viewpoint",
    "popular": true,
    "description": "The iconic roadside lion sculpture along Kennon Road, best treated as a quick photo stop.",
    "activities": [
      "Take a quick roadside photo safely",
      "Stay within designated areas",
      "Avoid stepping into traffic",
      "Combine with a hired-vehicle route along Kennon Road"
    ],
    "tags": [
      "landmark",
      "photos",
      "popular"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/lions-head.jpg",
    "googleQuery": "Lion's Head, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Public transport may not stop conveniently. A hired vehicle is safer for a controlled photo stop.",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "maryknoll-ecological-sanctuary",
    "name": "Maryknoll Ecological Sanctuary",
    "area": "South Baguio",
    "lat": 16.3997,
    "lng": 120.5862,
    "duration": 75,
    "open": "08:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A peaceful ecological space with reflective paths, gardens, and environmental learning areas.",
    "activities": [
      "Follow the earth-themed trail",
      "Keep noise low",
      "Ask about guided activities",
      "Wear shoes suitable for damp paths"
    ],
    "tags": [
      "nature",
      "quiet",
      "education"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/maryknoll-ecological-sanctuary.jpg",
    "googleQuery": "Maryknoll Ecological Sanctuary, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "South Baguio"
  },
  {
    "id": "mirador-heritage-eco-park",
    "name": "Mirador Heritage and Eco Park",
    "area": "West Baguio",
    "lat": 16.40945,
    "lng": 120.57863,
    "duration": 105,
    "open": "06:00",
    "close": "18:00",
    "category": "Park",
    "popular": true,
    "description": "A hillside heritage park known for gardens, contemplative spaces, art, and sunset views.",
    "activities": [
      "Walk to the torii-inspired viewpoint",
      "Explore the gardens and heritage areas",
      "Time the visit for late afternoon",
      "Wear shoes suitable for slopes"
    ],
    "tags": [
      "view",
      "nature",
      "photos",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/mirador-heritage-eco-park.jpg",
    "googleQuery": "Mirador Heritage and Eco Park, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask for the closest Mirador or Lourdes drop-off and expect an uphill walk.",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "lourdes-grotto",
    "name": "Lourdes Grotto",
    "area": "West Baguio",
    "lat": 16.40905,
    "lng": 120.57978,
    "duration": 50,
    "open": "06:00",
    "close": "18:00",
    "category": "Culture",
    "popular": true,
    "description": "A hillside pilgrimage site reached by a long stairway, with views over western Baguio.",
    "activities": [
      "Climb at a comfortable pace",
      "Use the roadway alternative when appropriate",
      "Keep the prayer area quiet",
      "Pair it with Mirador"
    ],
    "tags": [
      "heritage",
      "stairs",
      "view",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/lourdes-grotto.jpg",
    "googleQuery": "Lourdes Grotto, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "diplomat-hotel",
    "name": "Old Diplomat Hotel",
    "area": "West Baguio",
    "lat": 16.4038,
    "lng": 120.5787,
    "duration": 60,
    "open": "07:00",
    "close": "18:00",
    "category": "Culture",
    "popular": true,
    "description": "Ruins of a historic hilltop structure on Dominican Hill, known for architecture and city views.",
    "activities": [
      "Explore only open public areas",
      "Read about the building's history",
      "Enjoy the panoramic viewpoint",
      "Avoid unsafe or restricted sections"
    ],
    "tags": [
      "heritage",
      "view",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/diplomat-hotel.jpg",
    "googleQuery": "Old Diplomat Hotel, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask for Dominican Hill and confirm the uphill access point.",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "tam-awan-village",
    "name": "Tam-awan Village",
    "area": "West Baguio",
    "lat": 16.429,
    "lng": 120.57785,
    "duration": 105,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": true,
    "description": "An artists' village with Cordilleran-inspired houses, galleries, workshops, and hillside paths.",
    "activities": [
      "Visit the galleries and traditional structures",
      "Check for portrait sketches or workshops",
      "Wear shoes for steep paths",
      "Respect cultural displays and artists"
    ],
    "tags": [
      "art",
      "culture",
      "hillside",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/tam-awan-village.jpg",
    "googleQuery": "Tam-awan Village, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Confirm the Tam-awan route and ask to alight at the main entrance.",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "igorot-stone-kingdom",
    "name": "Igorot Stone Kingdom",
    "area": "West Baguio",
    "lat": 16.4238,
    "lng": 120.5727,
    "duration": 105,
    "open": "06:00",
    "close": "18:00",
    "category": "Culture",
    "popular": true,
    "description": "A large stone-terrace attraction inspired by Cordilleran themes and mountain architecture.",
    "activities": [
      "Explore the stone terraces slowly",
      "Read the site's cultural explanations",
      "Watch for scheduled performances",
      "Use the designated photo areas"
    ],
    "tags": [
      "culture",
      "architecture",
      "family",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/igorot-stone-kingdom.jpg",
    "googleQuery": "Igorot Stone Kingdom, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ask for the Stone Kingdom route or a Tam-awan/Longlong-area jeepney and confirm the entrance drop-off.",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "easter-weaving-room",
    "name": "Easter Weaving Room",
    "area": "West Baguio",
    "lat": 16.4192,
    "lng": 120.5849,
    "duration": 60,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A long-running weaving center where visitors can see and buy Cordilleran-inspired textiles.",
    "activities": [
      "Observe weaving when demonstrations are available",
      "Ask before taking close-up photos",
      "Shop for locally made textiles",
      "Learn about patterns and materials"
    ],
    "tags": [
      "weaving",
      "culture",
      "shopping"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/easter-weaving-room.jpg",
    "googleQuery": "Easter Weaving Room, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "West Baguio"
  },
  {
    "id": "ifugao-woodcarvers-village",
    "name": "Ifugao Woodcarvers Village",
    "area": "West Baguio",
    "lat": 16.3892,
    "lng": 120.5616,
    "duration": 60,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A stretch along Asin Road associated with woodcarving workshops and artisan products.",
    "activities": [
      "Browse handmade woodcraft",
      "Ask artisans about their process",
      "Buy directly when possible",
      "Arrange transport because shops are spread out"
    ],
    "tags": [
      "craft",
      "shopping",
      "culture"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/ifugao-woodcarvers-village.jpg",
    "googleQuery": "Ifugao Woodcarvers Village, Baguio Philippines",
    "scope": "Baguio City",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "bencab-museum",
    "name": "BenCab Museum",
    "area": "Tuba / Asin",
    "lat": 16.3814,
    "lng": 120.5503,
    "duration": 150,
    "open": "09:00",
    "close": "18:00",
    "category": "Museum",
    "popular": true,
    "description": "A major contemporary-art museum with Cordilleran collections, gardens, and views along Asin Road.",
    "activities": [
      "Allow time for all galleries",
      "Explore the garden and farm area",
      "Check the museum café schedule",
      "Arrange a taxi or hired vehicle for easier return"
    ],
    "tags": [
      "art",
      "museum",
      "culture",
      "popular"
    ],
    "icon": "🏛️",
    "image": "assets/img/destinations/bencab-museum.jpg",
    "googleQuery": "BenCab Museum Tuba Benguet",
    "scope": "Nearby Benguet side trip",
    "alight": "Public jeepneys may require walking and uncertain return waits. A taxi or hired vehicle is usually more convenient.",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "asin-hot-springs",
    "name": "Asin Hot Springs",
    "area": "Tuba / Asin",
    "lat": 16.365,
    "lng": 120.5355,
    "duration": 180,
    "open": "07:00",
    "close": "18:00",
    "category": "Park",
    "popular": false,
    "description": "A group of warm-spring resorts in the Asin area, suitable for a slower half-day side trip.",
    "activities": [
      "Choose a resort before departing",
      "Bring swimwear and a change of clothes",
      "Confirm entrance fees and pool rules",
      "Arrange return transport in advance"
    ],
    "tags": [
      "water",
      "relax",
      "side trip"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/asin-hot-springs.jpg",
    "googleQuery": "Asin Hot Springs Tuba Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "hydro-falls",
    "name": "Hydro Falls",
    "area": "Tuba / Asin",
    "lat": 16.354,
    "lng": 120.543,
    "duration": 150,
    "open": "07:00",
    "close": "17:00",
    "category": "Viewpoint",
    "popular": false,
    "description": "A nature side trip in the Tuba area that may require local guidance and careful access planning.",
    "activities": [
      "Confirm current trail access",
      "Use a local guide when required",
      "Avoid visiting after heavy rain",
      "Carry water and proper footwear"
    ],
    "tags": [
      "nature",
      "adventure",
      "side trip"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/hydro-falls.jpg",
    "googleQuery": "Hydro Falls Tuba Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "mt-camisong-forest-park",
    "name": "Mt. Camisong Forest Park",
    "area": "Tuba / Asin",
    "lat": 16.348,
    "lng": 120.572,
    "duration": 180,
    "open": "06:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A forested mountain attraction outside central Baguio, best planned as a dedicated side trip.",
    "activities": [
      "Confirm the current entrance and road conditions",
      "Wear trail-ready footwear",
      "Bring rain protection",
      "Arrange a hired vehicle or local guide"
    ],
    "tags": [
      "nature",
      "forest",
      "side trip"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/mt-camisong-forest-park.jpg",
    "googleQuery": "Mt Camisong Forest Park Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "dragon-treasure-castle",
    "name": "Dragon Treasure Castle",
    "area": "Tuba / Asin",
    "lat": 16.344,
    "lng": 120.573,
    "duration": 90,
    "open": "08:00",
    "close": "17:00",
    "category": "Culture",
    "popular": false,
    "description": "A castle-themed roadside attraction in the wider Baguio–Tuba area, suited to a planned photo stop.",
    "activities": [
      "Confirm opening status before leaving",
      "Explore designated photo areas",
      "Pair with another Tuba-side attraction",
      "Use hired transport for convenience"
    ],
    "tags": [
      "photos",
      "family",
      "side trip"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/dragon-treasure-castle.jpg",
    "googleQuery": "Dragon Treasure Castle Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Tuba / Asin"
  },
  {
    "id": "bell-church",
    "name": "Bell Church",
    "area": "North Baguio",
    "lat": 16.43198,
    "lng": 120.59412,
    "duration": 50,
    "open": "06:00",
    "close": "17:00",
    "category": "Culture",
    "popular": true,
    "description": "A tranquil Chinese-Filipino temple complex near the Baguio–La Trinidad boundary.",
    "activities": [
      "Observe the temple architecture",
      "Keep voices low",
      "Follow photography rules",
      "Pair it with Valley of Colors"
    ],
    "tags": [
      "culture",
      "architecture",
      "popular"
    ],
    "icon": "🎨",
    "image": "assets/img/destinations/bell-church.jpg",
    "googleQuery": "Bell Church, Baguio Philippines",
    "scope": "Baguio City",
    "alight": "Ride a La Trinidad jeepney and ask to alight at Bell Church.",
    "routeGuideArea": "North Baguio"
  },
  {
    "id": "valley-of-colors",
    "name": "Valley of Colors",
    "area": "La Trinidad",
    "lat": 16.4466,
    "lng": 120.5899,
    "duration": 35,
    "open": "06:00",
    "close": "18:00",
    "category": "Viewpoint",
    "popular": true,
    "description": "A colorful hillside community visible along the road between Baguio and La Trinidad.",
    "activities": [
      "View the mural from a safe public area",
      "Avoid entering private residential spaces",
      "Pair it with Bell Church or Strawberry Farm",
      "Use daylight for better photos"
    ],
    "tags": [
      "photos",
      "view",
      "popular"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/valley-of-colors.jpg",
    "googleQuery": "Valley of Colors La Trinidad Benguet",
    "scope": "Nearby Benguet side trip",
    "alight": "Ask the driver for Valley of Colors or StoBoSa and alight only at a safe designated point.",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "strawberry-farm",
    "name": "La Trinidad Strawberry Farm",
    "area": "La Trinidad",
    "lat": 16.4549,
    "lng": 120.5897,
    "duration": 105,
    "open": "06:00",
    "close": "18:00",
    "category": "Park",
    "popular": true,
    "description": "A well-known farm area for seasonal strawberry picking, produce, food products, and local stalls.",
    "activities": [
      "Pick strawberries when farms permit and fruit is in season",
      "Try strawberry ice cream or taho",
      "Shop for vegetables and local products",
      "Wear shoes that can handle soil or mud"
    ],
    "tags": [
      "food",
      "farm",
      "family",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/strawberry-farm.jpg",
    "googleQuery": "La Trinidad Strawberry Farm Benguet",
    "scope": "Nearby Benguet side trip",
    "alight": "Tell the La Trinidad dispatcher you are going to Strawberry Farm and ask for the nearest safe drop-off.",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "mount-costa",
    "name": "Mount Costa",
    "area": "La Trinidad",
    "lat": 16.485,
    "lng": 120.58,
    "duration": 150,
    "open": "08:00",
    "close": "17:00",
    "category": "Park",
    "popular": true,
    "description": "A large garden attraction with themed landscapes and leisurely walking routes in La Trinidad.",
    "activities": [
      "Explore the themed gardens",
      "Bring sun and rain protection",
      "Allow at least two hours",
      "Arrange return transport before closing"
    ],
    "tags": [
      "garden",
      "photos",
      "family",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/mount-costa.jpg",
    "googleQuery": "Mount Costa La Trinidad Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "mt-kalugong",
    "name": "Mt. Kalugong Cultural Village",
    "area": "La Trinidad",
    "lat": 16.4705,
    "lng": 120.6075,
    "duration": 180,
    "open": "06:00",
    "close": "18:00",
    "category": "Viewpoint",
    "popular": true,
    "description": "A rocky cultural and nature destination with elevated views over La Trinidad.",
    "activities": [
      "Wear sturdy shoes for rock sections",
      "Enjoy the valley viewpoint",
      "Visit the café when open",
      "Check weather before climbing"
    ],
    "tags": [
      "hike",
      "view",
      "culture",
      "popular"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/mt-kalugong.jpg",
    "googleQuery": "Mt Kalugong Cultural Village La Trinidad",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "mt-yangbew",
    "name": "Mt. Yangbew",
    "area": "La Trinidad",
    "lat": 16.4975,
    "lng": 120.6065,
    "duration": 180,
    "open": "05:00",
    "close": "17:00",
    "category": "Viewpoint",
    "popular": false,
    "description": "An open grassland summit known for sunrise, mountain scenery, and a short but exposed hike.",
    "activities": [
      "Start early for sunrise",
      "Bring wind protection",
      "Stay on established paths",
      "Arrange transport to and from the jump-off"
    ],
    "tags": [
      "hike",
      "sunrise",
      "nature"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/mt-yangbew.jpg",
    "googleQuery": "Mt Yangbew La Trinidad Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "bahong-flower-farm",
    "name": "Bahong Flower Farm",
    "area": "La Trinidad",
    "lat": 16.49,
    "lng": 120.623,
    "duration": 120,
    "open": "07:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A flower-growing community in La Trinidad where access and viewing opportunities depend on current farm arrangements.",
    "activities": [
      "Confirm whether farms accept visitors",
      "Ask permission before entering fields",
      "Buy flowers from authorized sellers",
      "Use a local guide or arranged vehicle"
    ],
    "tags": [
      "flowers",
      "farm",
      "hidden"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/bahong-flower-farm.jpg",
    "googleQuery": "Bahong Flower Farm La Trinidad",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "haights-place",
    "name": "Haight's Place",
    "area": "La Trinidad",
    "lat": 16.4855,
    "lng": 120.604,
    "duration": 90,
    "open": "08:00",
    "close": "17:00",
    "category": "Park",
    "popular": false,
    "description": "A lesser-known upland stop in the Benguet area; current access and exact visitor arrangements should be checked before travel.",
    "activities": [
      "Confirm the correct map pin",
      "Contact the venue before departure",
      "Pair with a nearby La Trinidad stop",
      "Use arranged transport"
    ],
    "tags": [
      "hidden",
      "nature",
      "side trip"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/haights-place.jpg",
    "googleQuery": "Haight's Place Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "La Trinidad"
  },
  {
    "id": "northern-blossom-flower-farm",
    "name": "Northern Blossom Flower Farm",
    "area": "Atok Side Trip",
    "lat": 16.7365,
    "lng": 120.839,
    "duration": 180,
    "open": "06:00",
    "close": "16:30",
    "category": "Park",
    "popular": true,
    "description": "A famous Atok flower farm with mountain views, requiring a very early start and a long journey from Baguio.",
    "activities": [
      "Reserve or confirm entry before the trip",
      "Dress for colder Atok weather",
      "Start before dawn for better timing",
      "Plan transport as a dedicated day trip"
    ],
    "tags": [
      "flowers",
      "view",
      "day trip",
      "popular"
    ],
    "icon": "🌿",
    "image": "assets/img/destinations/northern-blossom-flower-farm.jpg",
    "googleQuery": "Northern Blossom Flower Farm Atok Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Atok Side Trip"
  },
  {
    "id": "highest-point-halsema",
    "name": "Halsema Highway Highest Point",
    "area": "Atok Side Trip",
    "lat": 16.707,
    "lng": 120.838,
    "duration": 35,
    "open": "06:00",
    "close": "17:00",
    "category": "Viewpoint",
    "popular": true,
    "description": "A high-elevation roadside viewpoint along Halsema Highway, normally paired with an Atok itinerary.",
    "activities": [
      "Stop only at a safe designated area",
      "Wear warm clothing",
      "Check fog and rain conditions",
      "Pair it with Northern Blossom"
    ],
    "tags": [
      "view",
      "road trip",
      "popular"
    ],
    "icon": "⛰️",
    "image": "assets/img/destinations/highest-point-halsema.jpg",
    "googleQuery": "Highest Point Halsema Highway Atok Benguet",
    "scope": "Nearby Benguet side trip",
    "routeGuideArea": "Atok Side Trip"
  }
] as const;

/**
 * The legacy source has 49 rows. Its duplicate-ID cleanup keeps these 48 unique
 * records, preserving the richer first Baguio Orchidarium entry.
 */
export const PLANNER_DESTINATIONS: readonly PlannerDestination[] = RAW_DESTINATIONS.map(
  ({ routeGuideArea, ...destination }) => ({
    ...destination,
    image: destination.image.startsWith("/") ? destination.image : `/${destination.image}`,
    routeGuide: PLANNER_ROUTE_GUIDES[routeGuideArea],
  }),
);

export const PLANNER_CATEGORY_ORDER = [
  "All",
  "Popular",
  "City Center",
  "Nature & Views",
  "Arts & Culture",
  "Food & Shopping",
  "Family",
  "Nearby Side Trips"
] as const satisfies readonly PlannerCategoryFilter[];

export const DEFAULT_FARE_SETTINGS = {
  jeepMinimum: 13,
  jeepBaseKm: 4,
  jeepPerKm: 1.8,
  taxiFlag: 50,
  taxiPerKm: 15,
} as const satisfies FareSettings;

export const DEFAULT_PLANNER_SETTINGS = {
  startLocationId: "victory-liner",
  tripDays: 2,
  dailyStartTime: "08:00",
  availableHoursPerDay: 8,
  travelers: 2,
  preference: "balanced",
  modes: ["walk", "jeepney", "taxi"],
  autoPickTheme: "balanced",
  fares: DEFAULT_FARE_SETTINGS,
} as const satisfies PlannerDefaults;

export const PLANNER_DATA = {
  startLocations: PLANNER_START_LOCATIONS,
  baggageOptions: PLANNER_BAGGAGE_OPTIONS,
  destinations: PLANNER_DESTINATIONS,
  categoryOrder: PLANNER_CATEGORY_ORDER,
  routeGuides: PLANNER_ROUTE_GUIDES,
  defaults: DEFAULT_PLANNER_SETTINGS,
} as const satisfies PlannerData;

const DESTINATIONS_BY_ID = new Map<string, PlannerDestination>(
  PLANNER_DESTINATIONS.map((destination) => [destination.id, destination] as const),
);

const START_LOCATIONS_BY_ID = new Map<string, StartLocation>(
  PLANNER_START_LOCATIONS.map((location) => [location.id, location] as const),
);

const BAGGAGE_OPTIONS_BY_START: BaggageOptionsByStart = PLANNER_BAGGAGE_OPTIONS;

export function getPlannerDestinationById(id: string): PlannerDestination | undefined {
  return DESTINATIONS_BY_ID.get(id);
}

export function getPlannerStartLocationById(id: string): StartLocation | undefined {
  return START_LOCATIONS_BY_ID.get(id);
}

export function getBaggageOptionsForStart(startLocationId: string): readonly BaggageOption[] {
  return BAGGAGE_OPTIONS_BY_START[startLocationId] ?? [];
}

export function getRouteGuideForArea(area: PlannerArea): RouteGuide {
  return PLANNER_ROUTE_GUIDES[area];
}
