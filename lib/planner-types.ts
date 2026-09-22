/** Shared, serializable types for the Baguio Buddy itinerary planner. */

export type PlannerArea =
  | "City Center"
  | "East Baguio"
  | "South Baguio"
  | "West Baguio"
  | "North Baguio"
  | "La Trinidad"
  | "Tuba / Asin"
  | "Atok Side Trip";

export type DestinationCategory =
  | "Park"
  | "Viewpoint"
  | "Museum"
  | "Food & shopping"
  | "Culture"
  | "Stay";

export type DestinationScope = "Baguio City" | "Nearby Benguet side trip";
export type DestinationTimeSlot = "night";

export type PlannerCategoryFilter =
  | "All"
  | "Popular"
  | "City Center"
  | "Nature & Views"
  | "Arts & Culture"
  | "Food & Shopping"
  | "Family"
  | "Nearby Side Trips";

export type AutoPickTheme =
  | "balanced"
  | "popular"
  | "nature"
  | "culture"
  | "food"
  | "family"
  | "hidden";

export type TravelPreference = "balanced" | "cheapest" | "fastest" | "less-walking";
export type TransportMode = "walk" | "jeepney" | "taxi";
export type StayKind = "hotel" | "airbnb";
export type StayLocationPrecision = "pin" | "approximate";
export type LuggagePlan = "carry" | "property-drop";
export type FinalDayPreference =
  | "relax"
  | "pasalubong"
  | "easy-stop"
  | "sightseeing";

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface RouteGuide {
  readonly modeLabel: string;
  readonly loadingArea: string;
  readonly loadingQuery: string;
  readonly signboard: string;
  readonly returnHint: string;
}

export interface PlannerDestination extends Coordinates {
  readonly id: string;
  readonly name: string;
  readonly area: PlannerArea;
  /** Recommended visit length in minutes. */
  readonly duration: number;
  /** Local 24-hour time in HH:mm format. */
  readonly open: string;
  /** Local 24-hour time in HH:mm format; night stops may close after midnight. */
  readonly close: string;
  readonly category: DestinationCategory;
  readonly popular: boolean;
  readonly description: string;
  readonly activities: readonly string[];
  readonly tags: readonly string[];
  readonly icon: string;
  readonly image: string;
  readonly googleQuery: string;
  readonly routeGuide: RouteGuide;
  readonly scope: DestinationScope;
  readonly alight?: string;
  readonly timeSlot?: DestinationTimeSlot;
}

export interface StartLocation extends Coordinates {
  readonly id: string;
  readonly name: string;
  readonly area: PlannerArea;
  readonly terminal?: boolean;
  readonly customName?: boolean;
  readonly googleQuery: string;
}

/** A traveler-supplied accommodation used as a fixed-time itinerary stop. */
export interface PlannerStay extends Coordinates {
  readonly id: string;
  readonly kind: StayKind;
  readonly name: string;
  readonly googleMapsUrl: string;
  readonly googleQuery: string;
  /** Zero-based trip day containing the check-in. */
  readonly checkInDay: number;
  /** Local 24-hour time in HH:mm format. */
  readonly checkInTime: string;
  /** Zero-based trip day containing checkout. */
  readonly checkOutDay: number;
  /** Local 24-hour time in HH:mm format. */
  readonly checkOutTime: string;
  readonly finalDayPreference: FinalDayPreference;
  readonly luggagePlan: LuggagePlan;
  readonly locationPrecision: StayLocationPrecision;
}

export interface BaggageOption {
  readonly name: string;
  readonly detail: string;
  readonly query: string;
}

export type BaggageOptionsByStart = Readonly<
  Partial<Record<StartLocation["id"], readonly BaggageOption[]>>
>;

export interface FareSettings {
  /** Minimum jeepney fare per traveler, in Philippine pesos. */
  readonly jeepMinimum: number;
  /** Distance covered by the minimum jeepney fare, in kilometers. */
  readonly jeepBaseKm: number;
  /** Estimated jeepney addition per kilometer, per traveler. */
  readonly jeepPerKm: number;
  /** Estimated taxi flag-down fare per vehicle, in Philippine pesos. */
  readonly taxiFlag: number;
  /** Estimated taxi addition per kilometer, per vehicle. */
  readonly taxiPerKm: number;
  /** Estimated taxi addition per minute of travel, per vehicle. */
  readonly taxiPerMinute: number;
}

export interface PlannerDefaults {
  readonly startLocationId: StartLocation["id"];
  readonly tripDays: number;
  readonly dailyStartTime: string;
  readonly availableHoursPerDay: number;
  readonly travelers: number;
  readonly preference: TravelPreference;
  readonly modes: readonly TransportMode[];
  readonly autoPickTheme: AutoPickTheme;
  readonly fares: FareSettings;
}

export interface PlannerData {
  readonly startLocations: readonly StartLocation[];
  readonly baggageOptions: BaggageOptionsByStart;
  readonly destinations: readonly PlannerDestination[];
  readonly categoryOrder: readonly PlannerCategoryFilter[];
  readonly routeGuides: Readonly<Record<PlannerArea, RouteGuide>>;
  readonly defaults: PlannerDefaults;
}
