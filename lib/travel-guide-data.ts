export const GUIDE_REVIEW_DATE = "2026-10-03";
export const GUIDE_REVIEW_LABEL = "October 3, 2026";

export type GuideSource = {
  label: string;
  publisher: string;
  url: string;
  checked: string;
  supports: string;
};

export const guideSources = {
  visita: {
    label: "Baguio VISITA",
    publisher: "City Government of Baguio",
    url: "https://visita.baguio.gov.ph/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Registered accommodation search, attraction details, and city advisories",
  },
  genesis: {
    label: "Genesis and JoyBus schedules",
    publisher: "Genesis Transport Service Inc.",
    url: "https://genesisjoybus.com/schedules/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Published route, travel-time, trip-frequency, and fare ranges",
  },
  victory: {
    label: "Victory Liner terminal guide",
    publisher: "Victory Liner",
    url: "https://staging.victoryliner.com/TerminalGuide.aspx",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Baguio terminal names, addresses, and passenger reminders",
  },
  vos: {
    label: "V.O.S. Valencia Baguio Transient House",
    publisher: "V.O.S. Valencia",
    url: "https://bookbaguio.com/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Example direct-booking room rates and property location",
  },
  goodTaste: {
    label: "Good Taste Baguio official menu",
    publisher: "Good Taste Baguio",
    url: "https://goodtaste.ph/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Published menu examples, restaurant address, and live-queue link",
  },
  fare: {
    label: "2026 public-utility jeepney fare adjustment",
    publisher: "GMA News / DOTr and LTFRB announcement",
    url: "https://www.gmanetwork.com/news/money/economy/1003715/dotr-approves-ltfrb-fare-hike-recommendation-for-puvs/story/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Jeepney minimum fares effective September 28, 2026",
  },
  jeepneyRoutes: {
    label: "Baguio jeepney route directory",
    publisher: "City Government of Baguio",
    url: "https://alternateroutes.baguio.gov.ph/jeepneyroutes/",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Official route names and route-directory references for local verification",
  },
  taxi: {
    label: "Regular taxi fare rates",
    publisher: "Land Transportation Franchising and Regulatory Board",
    url: "https://www.ltfrb.gov.ph/wp-content/uploads/2024/11/TAXI-Fare-Rates.pdf",
    checked: GUIDE_REVIEW_LABEL,
    supports: "Taxi flag-down, distance, and time components used for planning",
  },
} satisfies Record<string, GuideSource>;

export const sampleTripAssumptions = {
  travelers: 2,
  duration: "3 days and 2 nights",
  timing: "A non-holiday weekday trip",
  style: "DIY commute, no private car",
  room: "V.O.S. Valencia Room 3 example",
  booking: "Direct inquiry through bookbaguio.com / the property Messenger link",
  stayRate: 1_000,
  stayNights: 2,
  bus: "Genesis Deluxe planning example",
  busBooking: "Check and book through the operator's current official channel",
  busFareEachWay: 695,
} as const;

export type SampleCost = {
  category: string;
  totalForTwo: number;
  perPerson: number;
  basis: string;
  optional?: boolean;
};

const sampleCoreCosts: readonly SampleCost[] = [
  {
    category: "Round-trip Manila–Baguio bus",
    totalForTwo: 2_780,
    perPerson: 1_390,
    basis: "₱695 each way × 2 travelers; replace with the live ticket quote",
  },
  {
    category: "Accommodation for 2 nights",
    totalForTwo: 2_000,
    perPerson: 1_000,
    basis: "Example weekday room at ₱1,000 per night, shared by 2",
  },
  {
    category: "Meals and snacks",
    totalForTwo: 4_260,
    perPerson: 2_130,
    basis: "Six main meals, two breakfasts, drinks, and modest snack allowances",
  },
  {
    category: "Local jeepney, taxi, and walking legs",
    totalForTwo: 900,
    perPerson: 450,
    basis: "Mixed-mode allowance; actual meter, route, traffic, and sharing change the result",
  },
  {
    category: "Attraction admissions",
    totalForTwo: 570,
    perPerson: 285,
    basis: "Planning allowance for selected paid stops; reconfirm every live rate",
  },
];

export const sampleOptionalCosts: readonly SampleCost[] = [
  {
    category: "Pasalubong and personal shopping",
    totalForTwo: 1_500,
    perPerson: 750,
    basis: "Optional spending cap",
    optional: true,
  },
  {
    category: "Contingency fund",
    totalForTwo: 1_000,
    perPerson: 500,
    basis: "For rain, traffic, medicine, or a changed plan",
    optional: true,
  },
];

export const sampleTripCosts = [...sampleCoreCosts, ...sampleOptionalCosts] as const;

export const sampleBaseTotal = sampleCoreCosts.reduce(
  (total, item) => total + item.totalForTwo,
  0,
);
export const sampleBasePerPerson = sampleCoreCosts.reduce(
  (total, item) => total + item.perPerson,
  0,
);
export const sampleReadyTotal = sampleTripCosts.reduce(
  (total, item) => total + item.totalForTwo,
  0,
);
export const sampleReadyPerPerson = sampleTripCosts.reduce(
  (total, item) => total + item.perPerson,
  0,
);

export type DailyPlanStop = {
  time: string;
  title: string;
  detail: string;
  costForTwo: number;
  costLabel: string;
};

export type DailyPlan = {
  day: string;
  theme: string;
  route: string;
  note: string;
  stops: readonly DailyPlanStop[];
  localTotalForTwo: number;
};

export const sampleThreeDayPlan: readonly DailyPlan[] = [
  {
    day: "Day 1",
    theme: "East Baguio classics + city-center evening",
    route: "Terminal → East Baguio → hotel rest → Burnham and Session Road",
    note: "Leave bags first. The evening section is intentionally easy to shorten if the bus is delayed.",
    localTotalForTwo: 2_120,
    stops: [
      { time: "6:30 AM", title: "Arrive and leave luggage", detail: "Use a confirmed hotel bag drop or staffed terminal counter; keep valuables with you.", costForTwo: 0, costLabel: "Confirm any storage fee" },
      { time: "7:15 AM", title: "Breakfast near the city center", detail: "A warm, simple breakfast before the first commute.", costForTwo: 300, costLabel: "₱150/person allowance" },
      { time: "8:30 AM", title: "Botanical Garden", detail: "Start the East Baguio loop before the busier hours.", costForTwo: 200, costLabel: "₱100/person planning rate" },
      { time: "10:15 AM", title: "The Mansion + Wright Park", detail: "Exterior landmark stop followed by the Pool of Pines area.", costForTwo: 0, costLabel: "Free public-area allowance" },
      { time: "11:45 AM", title: "Mines View + Good Shepherd", detail: "Viewpoint first, then pasalubong browsing without counting purchases here.", costForTwo: 20, costLabel: "₱10/person planning allowance" },
      { time: "1:30 PM", title: "Good Taste lunch", detail: "Example shared meal: half buttered chicken plus rice/drinks allowance; counter prices prevail.", costForTwo: 500, costLabel: "₱250/person allowance" },
      { time: "2:45 PM", title: "Check in and rest", detail: "Protect at least 75–90 minutes for shower, recharge, and weather recovery.", costForTwo: 0, costLabel: "Room cost listed separately" },
      { time: "4:45 PM", title: "Burnham, Cathedral, and Session Road", detail: "Walk the compact city-center cluster and stop when energy drops.", costForTwo: 0, costLabel: "No paid activity assumed" },
      { time: "7:15 PM", title: "Dinner + optional Night Market", detail: "Eat before browsing; visit the market only if operating and you still feel rested.", costForTwo: 500, costLabel: "₱250/person meal allowance" },
      { time: "All day", title: "Local transport and snacks", detail: "Shared taxi/jeepney and snack allowance for the day.", costForTwo: 600, costLabel: "₱300/person" },
    ],
  },
  {
    day: "Day 2",
    theme: "Camp John Hay + west-side viewpoints",
    route: "Camp John Hay → city lunch → Mirador → Diplomat optional",
    note: "This is the longest active day. Drop Diplomat—not lunch—if rain, queues, or traffic consume the buffer.",
    localTotalForTwo: 2_570,
    stops: [
      { time: "7:30 AM", title: "Breakfast", detail: "Eat near the stay before the longer park visit.", costForTwo: 360, costLabel: "₱180/person allowance" },
      { time: "8:30 AM", title: "Camp John Hay", detail: "Choose a focused walk and the Historical Core instead of trying to cover the entire estate.", costForTwo: 150, costLabel: "₱75/person published-reference allowance" },
      { time: "12:00 PM", title: "Lunch and seated rest", detail: "Return toward the city or eat near the next practical loading point.", costForTwo: 600, costLabel: "₱300/person allowance" },
      { time: "1:45 PM", title: "Mirador Heritage and Eco Park", detail: "Allow extra time for slopes, photos, and a slow descent.", costForTwo: 200, costLabel: "₱100/person planning allowance" },
      { time: "4:30 PM", title: "Diplomat Hotel, only if energy allows", detail: "Keep it optional so the day does not depend on perfect traffic.", costForTwo: 0, costLabel: "No admission assumed; verify access" },
      { time: "6:30 PM", title: "Dinner and café time", detail: "A proper dinner followed by an unhurried evening.", costForTwo: 600, costLabel: "₱300/person allowance" },
      { time: "All day", title: "Local transport and snacks", detail: "Mixed jeepney/shared taxi allowance plus drinks or merienda.", costForTwo: 660, costLabel: "₱330/person" },
    ],
  },
  {
    day: "Day 3",
    theme: "Checkout + City Market + departure",
    route: "Hotel → City Market → lunch → exact departure terminal",
    note: "Buy produce and pasalubong close to departure so you do not carry them through the parks.",
    localTotalForTwo: 1_040,
    stops: [
      { time: "8:00 AM", title: "Breakfast and pack", detail: "Confirm checkout, terminal branch, and baggage arrangement before leaving the room.", costForTwo: 360, costLabel: "₱180/person allowance" },
      { time: "10:30 AM", title: "Checkout and leave bags", detail: "Use the hotel only with explicit permission and a collection deadline.", costForTwo: 0, costLabel: "Confirm any storage fee" },
      { time: "11:00 AM", title: "Baguio City Market", detail: "Use a written shopping cap; optional purchases are outside the base trip total.", costForTwo: 0, costLabel: "Shopping budget listed separately" },
      { time: "12:30 PM", title: "Lunch near the center", detail: "Choose somewhere that keeps the luggage pickup and terminal transfer simple.", costForTwo: 500, costLabel: "₱250/person allowance" },
      { time: "2 hours before bus", title: "Collect bags and transfer", detail: "Navigate to the exact ticketed terminal—not just the operator name.", costForTwo: 180, costLabel: "Shared local-transfer allowance" },
    ],
  },
];

export function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}
