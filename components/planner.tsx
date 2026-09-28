"use client";

import {
  AlertTriangle,
  BadgeCheck,
  BaggageClaim,
  BedDouble,
  BusFront,
  Building2,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  Crosshair,
  ExternalLink,
  House,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ItineraryResults } from "@/components/itinerary-results";
import { ItineraryReviewDialog } from "@/components/itinerary-review-dialog";
import { StayAutocomplete } from "@/components/stay-autocomplete";
import {
  createPlannerStay,
  googleMapsStaySearchUrl,
  parseGoogleMapsPlaceUrl,
  resolveGoogleMapsPlaceUrl,
  type ParsedGoogleMapsPlace,
} from "@/lib/google-maps-place";
import {
  DEFAULT_PLANNER_SETTINGS,
  PLANNER_CATEGORY_ORDER,
  PLANNER_DESTINATIONS,
  PLANNER_START_LOCATIONS,
  getBaggageOptionsForStart,
  getPlannerDestinationById,
  getPlannerStartLocationById,
} from "@/lib/planner-data";
import { LTFRB_FARE_POLICY, resolveFarePolicy } from "@/lib/fare-policy";
import {
  completeEastBaguioCoreLoop,
  defaultPlannerDayAssignments,
  isEastBaguioCoreLoopDestination,
  shouldUsePackedArrivalRoute,
} from "@/lib/planner-recommendations";
import {
  deferItineraryDestination,
  evaluateItineraryMove,
  generateItinerary,
  getItineraryDayAssignments,
  getItineraryWalkingDetailPairs,
  googleSearchUrl,
  parseTimeToMinutes,
  validatePlannerRequest,
  type ItineraryMoveEvaluation,
  type PlannedItinerary,
  type PlannerRequest,
} from "@/lib/planner-engine";
import {
  fetchPlannerRouteEstimates,
  mergeRouteEstimates,
  type RouteEstimateLocation,
} from "@/lib/route-estimates";
import type {
  AutoPickTheme,
  PlannerCategoryFilter,
  PlannerDestination,
  StartLocation,
  StayKind,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";
import { ITINERARY_CHANGE_EVENT, ITINERARY_STORAGE_KEY } from "@/lib/itinerary";
import { getPlace } from "@/lib/places";
import { isPlannedItinerary } from "@/lib/shared-itinerary";

const DRAFT_STORAGE_KEY = "lakbay-baguio-planner";

function requestRouteLocations(request: PlannerRequest): RouteEstimateLocation[] {
  return [
    request.start,
    ...request.destinations,
    ...(request.stay ? [request.stay] : []),
    ...(request.departure ? [request.departure.location] : []),
  ];
}

const AUTO_PICK_THEMES: { value: AutoPickTheme; label: string }[] = [
  { value: "balanced", label: "Balanced Baguio highlights" },
  { value: "popular", label: "Most visited" },
  { value: "nature", label: "Nature and views" },
  { value: "culture", label: "Arts and culture" },
  { value: "food", label: "Food and shopping" },
  { value: "family", label: "Family-friendly" },
  { value: "hidden", label: "Less obvious places" },
];

const PREFERENCES: {
  value: TravelPreference;
  icon: string;
  label: string;
  description: string;
}[] = [
  { value: "balanced", icon: "⚖", label: "Balanced", description: "A practical mix of cost and convenience" },
  { value: "cheapest", icon: "₱", label: "Cheapest", description: "Prefer walking and jeepneys when reasonable" },
  { value: "fastest", icon: "⚡", label: "Fastest", description: "Reduce waiting and transfers" },
  { value: "less-walking", icon: "🚕", label: "Less walking", description: "Favor door-to-door convenience" },
];

const MODES: { value: TransportMode; icon: string; label: string }[] = [
  { value: "walk", icon: "🚶", label: "Walk" },
  { value: "jeepney", icon: "🚐", label: "Jeepney" },
  { value: "taxi", icon: "🚕", label: "Taxi" },
];

type PlannerDraft = {
  startLocation?: string;
  tripDate?: string;
  tripDays?: string | number;
  startTime?: string;
  tripHours?: string | number;
  travelers?: string | number;
  selected?: string[];
  preference?: TravelPreference;
  modes?: TransportMode[];
  autoPickTheme?: AutoPickTheme;
  stay?: {
    enabled: boolean;
    kind: StayKind;
    name: string;
    googleMapsUrl: string;
    checkInDay: number;
    checkInTime: string;
    checkOutTime: string;
    departureLocationId: string;
    departureTime: string;
  };
};

function localDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isTravelPreference(value: unknown): value is TravelPreference {
  return value === "balanced" || value === "cheapest" || value === "fastest" || value === "less-walking";
}

function isTransportMode(value: unknown): value is TransportMode {
  return value === "walk" || value === "jeepney" || value === "taxi";
}

function isAutoPickTheme(value: unknown): value is AutoPickTheme {
  return AUTO_PICK_THEMES.some((theme) => theme.value === value);
}

function matchesCategory(destination: PlannerDestination, filter: PlannerCategoryFilter) {
  if (filter === "All") return true;
  if (filter === "Popular") return destination.popular;
  if (filter === "City Center") return destination.area === "City Center";
  if (filter === "Nature & Views") {
    return destination.category === "Park" || destination.category === "Viewpoint" || destination.tags.some((tag) => ["nature", "view", "garden", "pine"].includes(tag));
  }
  if (filter === "Arts & Culture") {
    return destination.category === "Museum" || destination.category === "Culture" || destination.tags.some((tag) => ["art", "culture", "history", "heritage"].includes(tag));
  }
  if (filter === "Food & Shopping") return destination.category === "Food & shopping";
  if (filter === "Family") return destination.tags.includes("family");
  return destination.scope === "Nearby Benguet side trip";
}

function scoreAutoPick(destination: PlannerDestination, theme: AutoPickTheme) {
  let score = destination.popular ? 10 : 3;
  if (destination.scope === "Baguio City") score += 2;
  if (destination.duration <= 90) score += 1.5;
  if (theme === "hidden" && !destination.popular) score += 8;
  if (theme === "balanced" && ["burnham-park", "botanical-garden", "camp-john-hay", "mirador-heritage-eco-park", "baguio-night-market"].includes(destination.id)) score += 5;
  if (theme === "popular" && destination.popular) score += 8;
  if (theme === "nature" && matchesCategory(destination, "Nature & Views")) score += 8;
  if (theme === "culture" && matchesCategory(destination, "Arts & Culture")) score += 8;
  if (theme === "food" && matchesCategory(destination, "Food & Shopping")) score += 8;
  if (theme === "family" && (matchesCategory(destination, "Family") || destination.popular)) score += 8;
  return score;
}

type PlannerProps = {
  initialView?: "editor" | "itinerary";
};

export function Planner({ initialView = "editor" }: PlannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlaceId = searchParams.get("place");
  const requestedPlannerPlace = requestedPlaceId ? getPlannerDestinationById(requestedPlaceId) : undefined;
  const requestedExplorePlace = requestedPlaceId ? getPlace(requestedPlaceId) : undefined;

  const [startLocationId, setStartLocationId] = useState<string>(DEFAULT_PLANNER_SETTINGS.startLocationId);
  const [customStart, setCustomStart] = useState<StartLocation | null>(null);
  const [tripDate, setTripDate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState<number>(DEFAULT_PLANNER_SETTINGS.tripDays);
  const [startTime, setStartTime] = useState<string>(DEFAULT_PLANNER_SETTINGS.dailyStartTime);
  const [availableHours, setAvailableHours] = useState<number>(DEFAULT_PLANNER_SETTINGS.availableHoursPerDay);
  const [travelers, setTravelers] = useState<number>(DEFAULT_PLANNER_SETTINGS.travelers);
  const [includeStay, setIncludeStay] = useState(false);
  const [stayKind, setStayKind] = useState<StayKind>("hotel");
  const [stayName, setStayName] = useState("");
  const [stayMapsUrl, setStayMapsUrl] = useState("");
  const [verifiedStayMap, setVerifiedStayMap] = useState<{ sourceUrl: string; place: ParsedGoogleMapsPlace } | null>(null);
  const [stayMapState, setStayMapState] = useState<"idle" | "checking" | "verified" | "error">("idle");
  const [stayMapError, setStayMapError] = useState("");
  const [checkInDay, setCheckInDay] = useState(0);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [departureLocationId, setDepartureLocationId] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preference, setPreference] = useState<TravelPreference>(DEFAULT_PLANNER_SETTINGS.preference);
  const [modes, setModes] = useState<TransportMode[]>([...DEFAULT_PLANNER_SETTINGS.modes]);
  const [autoPickTheme, setAutoPickTheme] = useState<AutoPickTheme>(DEFAULT_PLANNER_SETTINGS.autoPickTheme);
  const [filter, setFilter] = useState<PlannerCategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [result, setResult] = useState<PlannedItinerary | null>(null);
  const [reviewResult, setReviewResult] = useState<PlannedItinerary | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [locating, setLocating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [restored, setRestored] = useState(false);

  const selectedDestinations = useMemo(
    () => PLANNER_DESTINATIONS.filter((destination) => selectedIds.includes(destination.id)),
    [selectedIds],
  );

  const filteredDestinations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PLANNER_DESTINATIONS.filter((destination) => {
      if (!matchesCategory(destination, filter)) return false;
      if (!needle) return true;
      const haystack = [destination.name, destination.area, destination.category, destination.scope, destination.description, ...destination.tags, ...destination.activities].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, query]);

  const selectedStart = useMemo(() => {
    if (startLocationId === "current-location" && customStart) return customStart;
    return getPlannerStartLocationById(startLocationId) ?? PLANNER_START_LOCATIONS[0];
  }, [customStart, startLocationId]);

  const baggageOptions = useMemo(() => {
    const startMinutes = parseTimeToMinutes(startTime) ?? 480;
    if (!selectedStart.terminal || startMinutes > 600) return [];
    return getBaggageOptionsForStart(selectedStart.id);
  }, [selectedStart, startTime]);
  const farePolicy = useMemo(() => resolveFarePolicy(tripDate), [tripDate]);

  const parsedStayMap = useMemo(
    () => (stayMapsUrl.trim() ? parseGoogleMapsPlaceUrl(stayMapsUrl) : null),
    [stayMapsUrl],
  );
  const currentVerifiedStay = verifiedStayMap?.sourceUrl === stayMapsUrl.trim()
    ? verifiedStayMap.place
    : parsedStayMap?.name && parsedStayMap.locationPrecision === "pin"
      ? parsedStayMap
      : null;

  useEffect(() => {
    let restoredDate = "";
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as PlannerDraft;
        if (draft.startLocation && getPlannerStartLocationById(draft.startLocation)) setStartLocationId(draft.startLocation);
        if (typeof draft.tripDate === "string") restoredDate = draft.tripDate;
        if (draft.tripDays !== undefined) setNumberOfDays(clamp(Number(draft.tripDays) || 2, 1, 5));
        if (typeof draft.startTime === "string") setStartTime(draft.startTime);
        if (draft.tripHours !== undefined) setAvailableHours(clamp(Number(draft.tripHours) || 8, 4, 12));
        if (draft.travelers !== undefined) setTravelers(clamp(Number(draft.travelers) || 2, 1, 12));
        if (Array.isArray(draft.selected)) setSelectedIds(draft.selected.filter((id) => Boolean(getPlannerDestinationById(id))));
        if (isTravelPreference(draft.preference)) setPreference(draft.preference);
        if (Array.isArray(draft.modes)) setModes(draft.modes.filter(isTransportMode));
        if (isAutoPickTheme(draft.autoPickTheme)) setAutoPickTheme(draft.autoPickTheme);
        if (draft.stay) {
          setIncludeStay(Boolean(draft.stay.enabled));
          if (draft.stay.kind === "hotel" || draft.stay.kind === "airbnb") setStayKind(draft.stay.kind);
          if (typeof draft.stay.name === "string") setStayName(draft.stay.name);
          if (typeof draft.stay.googleMapsUrl === "string") setStayMapsUrl(draft.stay.googleMapsUrl);
          if (Number.isInteger(draft.stay.checkInDay)) setCheckInDay(Math.max(0, draft.stay.checkInDay));
          if (typeof draft.stay.checkInTime === "string") setCheckInTime(draft.stay.checkInTime);
          if (typeof draft.stay.checkOutTime === "string") setCheckOutTime(draft.stay.checkOutTime);
          if (typeof draft.stay.departureLocationId === "string") setDepartureLocationId(draft.stay.departureLocationId);
          if (typeof draft.stay.departureTime === "string") setDepartureTime(draft.stay.departureTime);
        }
      }

      const rawPending = localStorage.getItem(ITINERARY_STORAGE_KEY);
      if (rawPending) {
        const pending: unknown = JSON.parse(rawPending);
        if (isPlannedItinerary(pending)) {
          setResult(pending);
          setSaved(true);
          if (pending.start.id === "current-location") setCustomStart(pending.start);
          setStartLocationId(pending.start.id);
          restoredDate ||= pending.date;
          setNumberOfDays(pending.numberOfDays);
          setStartTime(`${String(Math.floor(pending.startMinutes / 60) % 24).padStart(2, "0")}:${String(pending.startMinutes % 60).padStart(2, "0")}`);
          setAvailableHours(Math.round(pending.availableMinutes / 60));
          setTravelers(pending.travelers);
          const pendingSuggestedIds = new Set(pending.suggestedDestinationIds ?? []);
          setSelectedIds(pending.selectedDestinationIds.filter(
            (id) => !pendingSuggestedIds.has(id) && Boolean(getPlannerDestinationById(id)),
          ));
          setPreference(pending.preference);
          setModes(pending.modes);
          if (pending.stay) {
            setIncludeStay(true);
            setStayKind(pending.stay.kind);
            setStayName(pending.stay.name);
            setStayMapsUrl(pending.stay.googleMapsUrl);
            setCheckInDay(pending.stay.checkInDay);
            setCheckInTime(pending.stay.checkInTime);
            setCheckOutTime(pending.stay.checkOutTime || "");
          }
          if (pending.departure) {
            setDepartureLocationId(pending.departure.location.id);
            setDepartureTime(pending.departure.time || "");
          }
        } else if (pending && typeof pending === "object" && Array.isArray((pending as { stops?: unknown[] }).stops)) {
          const legacyIds = (pending as { stops: { id?: string }[] }).stops.map((stop) => stop.id ?? "").filter((id) => Boolean(getPlannerDestinationById(id)));
          if (legacyIds.length) setSelectedIds((current) => [...new Set([...current, ...legacyIds])]);
        }
      }
    } catch {
      // Invalid old storage should never stop a traveler from building a new route.
    }
    setTripDate(restoredDate || localDateValue());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!requestedPlannerPlace) return;
    setSelectedIds((current) => current.includes(requestedPlannerPlace.id) ? current : [...current, requestedPlannerPlace.id]);
  }, [requestedPlannerPlace]);

  useEffect(() => {
    if (!restored) return;
    const draft: PlannerDraft = { startLocation: startLocationId, tripDate, tripDays: numberOfDays, startTime, tripHours: availableHours, travelers, selected: selectedIds, preference, modes, autoPickTheme, stay: { enabled: includeStay, kind: stayKind, name: stayName, googleMapsUrl: stayMapsUrl, checkInDay, checkInTime, checkOutTime, departureLocationId, departureTime } };
    try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft)); } catch { /* Storage is optional. */ }
  }, [autoPickTheme, availableHours, checkInDay, checkInTime, checkOutTime, departureLocationId, departureTime, includeStay, modes, numberOfDays, preference, restored, selectedIds, startLocationId, startTime, stayKind, stayMapsUrl, stayName, travelers, tripDate]);

  useEffect(() => {
    setCheckInDay((current) => Math.min(current, numberOfDays - 1));
  }, [numberOfDays]);

  useEffect(() => {
    const sourceUrl = stayMapsUrl.trim();
    if (!includeStay || !sourceUrl) {
      setVerifiedStayMap(null);
      setStayMapState("idle");
      setStayMapError("");
      return;
    }

    const local = parseGoogleMapsPlaceUrl(sourceUrl);
    if (!local) {
      setVerifiedStayMap(null);
      setStayMapState("error");
      setStayMapError("Paste a valid Google Maps place or share link.");
      return;
    }
    const localName = local.name || stayName.trim();
    if (localName && local.locationPrecision === "pin") {
      setVerifiedStayMap({ sourceUrl, place: { ...local, name: localName, query: localName } });
      setStayName(localName);
      setStayMapState("verified");
      setStayMapError("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setStayMapState("checking");
      setStayMapError("");
      resolveGoogleMapsPlaceUrl(sourceUrl, controller.signal)
        .then((place) => {
          setVerifiedStayMap({ sourceUrl, place });
          if (place.name) setStayName(place.name);
          setStayMapState("verified");
        })
        .catch((resolutionError) => {
          if (controller.signal.aborted) return;
          setVerifiedStayMap(null);
          setStayMapState("error");
          setStayMapError(resolutionError instanceof Error ? resolutionError.message : "We could not verify that Google Maps place.");
        });
    }, 550);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [includeStay, stayMapsUrl, stayName]);

  useEffect(() => {
    const updateStep = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-planner-step]"));
      let next = 1;
      sections.forEach((section) => { if (section.getBoundingClientRect().top <= 185) next = Number(section.dataset.plannerStep ?? 1); });
      setActiveStep(next);
    };
    updateStep();
    window.addEventListener("scroll", updateStep, { passive: true });
    return () => window.removeEventListener("scroll", updateStep);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!restored || initialView !== "itinerary" || result) return;
    router.replace("/plan");
  }, [initialView, restored, result, router]);

  function scrollToStep(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleDestination(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError("");
    setSaved(false);
  }

  function autoChoose() {
    const target = clamp(numberOfDays * (availableHours >= 10 ? 5 : availableHours >= 7 ? 4 : 3), 3, 18);
    const candidates = PLANNER_DESTINATIONS.filter((destination) => {
      if (numberOfDays < 3 && destination.area === "Atok Side Trip") return false;
      if (numberOfDays === 1 && destination.scope !== "Baguio City") return false;
      if (autoPickTheme === "popular") return destination.popular;
      if (autoPickTheme === "nature") return matchesCategory(destination, "Nature & Views");
      if (autoPickTheme === "culture") return matchesCategory(destination, "Arts & Culture");
      if (autoPickTheme === "food") return matchesCategory(destination, "Food & Shopping");
      if (autoPickTheme === "family") return matchesCategory(destination, "Family") || destination.popular;
      if (autoPickTheme === "hidden") return !destination.popular;
      return true;
    }).sort((a, b) => scoreAutoPick(b, autoPickTheme) - scoreAutoPick(a, autoPickTheme));
    const chosen: PlannerDestination[] = [];
    const areaCount = new Map<string, number>();
    for (const candidate of candidates) {
      if (chosen.length >= target) break;
      const count = areaCount.get(candidate.area) ?? 0;
      if (autoPickTheme === "balanced" && count >= (numberOfDays === 1 ? 3 : 4)) continue;
      chosen.push(candidate);
      areaCount.set(candidate.area, count + 1);
    }
    setSelectedIds(chosen.map((destination) => destination.id));
    setError("");
    setSaved(false);
    setToast(`Baguio Buddy selected ${chosen.length} places for your ${numberOfDays}-day trip.`);
  }

  function toggleMode(mode: TransportMode) {
    setModes((current) => current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]);
    setError("");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setToast("Location access is not supported by this browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current: StartLocation = { id: "current-location", name: "My current location", lat: coords.latitude, lng: coords.longitude, area: "City Center", googleQuery: `${coords.latitude},${coords.longitude}` };
        setCustomStart(current);
        setStartLocationId(current.id);
        setLocating(false);
        setToast("Your current location is now the starting point.");
      },
      () => { setLocating(false); setToast("We could not access your location. Choose a starting point instead."); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function buildPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (generating) return;
    const departureLocation = departureLocationId
      ? getPlannerStartLocationById(departureLocationId)
      : undefined;
    let stay: PlannerRequest["stay"];
    if (includeStay) {
      if (parseTimeToMinutes(checkOutTime) === null) {
        setError("Enter the checkout time provided by your hotel or host.");
        scrollToStep("trip-details");
        return;
      }
      try {
        setGenerating(true);
        const place = currentVerifiedStay ?? await resolveGoogleMapsPlaceUrl(stayMapsUrl);
        setVerifiedStayMap({ sourceUrl: stayMapsUrl.trim(), place });
        setStayMapState("verified");
        setStayMapError("");
        if (place.name) setStayName(place.name);
        stay = createPlannerStay({
          kind: stayKind,
          name: place.name || stayName,
          googleMapsUrl: place.normalizedUrl,
          checkInDay,
          checkInTime,
          checkOutDay: numberOfDays - 1,
          checkOutTime,
          finalDayPreference: "pasalubong",
          arrivalLuggagePlan: selectedStart.terminal ? "terminal-storage" : "property-drop",
          checkoutLuggagePlan: departureLocation ? "departure-storage" : "property-storage",
        });
      } catch (stayError) {
        setGenerating(false);
        setStayMapState("error");
        setStayMapError(stayError instanceof Error ? stayError.message : "Check your accommodation details.");
        setError(stayError instanceof Error ? stayError.message : "Check your accommodation details.");
        scrollToStep("trip-details");
        return;
      }
    }
    const market = getPlannerDestinationById("baguio-city-market");
    const finalDayStart = stay
      ? parseTimeToMinutes(stay.checkOutTime)
      : parseTimeToMinutes(startTime);
    const finalDepartureMinutes = departureTime
      ? parseTimeToMinutes(departureTime)
      : null;
    const marketFitsBeforeDeparture = finalDepartureMinutes === null
      || finalDayStart === null
      || finalDepartureMinutes - finalDayStart >= 3 * 60;
    const addFinalDayMarket = numberOfDays > 1
      && market
      && marketFitsBeforeDeparture
      && !selectedDestinations.some((destination) => destination.id === market.id)
      ? market
      : null;
    const requestedDestinations = addFinalDayMarket
      ? [...selectedDestinations, addFinalDayMarket]
      : selectedDestinations;
    const packedArrivalRoute = shouldUsePackedArrivalRoute(selectedDestinations, {
      numberOfDays,
      hasArrivalDayStay: Boolean(stay && stay.checkInDay === 0),
    });
    const selectedEastStops = selectedDestinations.filter(isEastBaguioCoreLoopDestination).length;
    const eastLoop = completeEastBaguioCoreLoop(
      requestedDestinations,
      PLANNER_DESTINATIONS,
      {
        completeLoop: packedArrivalRoute || selectedEastStops >= 3,
        compactForPackedDay: packedArrivalRoute,
      },
    );
    const planDestinations = eastLoop.destinations;
    const suggestedDestinationIds = [
      ...eastLoop.suggestedIds,
      ...(addFinalDayMarket ? [addFinalDayMarket.id] : []),
    ];
    const request: PlannerRequest = {
      start: selectedStart,
      destinations: planDestinations,
      date: tripDate,
      numberOfDays,
      availableMinutes: availableHours * 60,
      travelers,
      modes,
      jeepneyClass: "unsure",
      preference,
      pace: DEFAULT_PLANNER_SETTINGS.pace,
      suggestedDestinationIds,
      dayAssignments: defaultPlannerDayAssignments(planDestinations, numberOfDays, packedArrivalRoute),
      balanceOpenDays: true,
      startTime,
      ...(stay ? { stay } : {}),
      ...(departureLocation
        ? { departure: { location: departureLocation, dayIndex: numberOfDays - 1, ...(departureTime ? { time: departureTime } : {}) } }
        : {}),
    };
    const issues = validatePlannerRequest(request);
    if (issues.length) {
      setGenerating(false);
      setError(issues[0].message);
      if (issues[0].field.startsWith("destination")) scrollToStep("destinations");
      else if (issues[0].field === "modes") scrollToStep("preferences");
      else scrollToStep("trip-details");
      return;
    }
    setError("");
    setGenerating(true);
    const generationStartedAt = Date.now();
    let routingWarning = "";
    let next: PlannedItinerary;
    try {
      const locations = requestRouteLocations(request);
      const matrix = await fetchPlannerRouteEstimates(locations);
      routingWarning = matrix.warning ?? "";
      let routeEstimates = matrix.estimates;
      next = generateItinerary({ ...request, routeEstimates });

      const walkingPairs = getItineraryWalkingDetailPairs(next);
      if (matrix.configured && walkingPairs.length) {
        const details = await fetchPlannerRouteEstimates(locations, {
          modes: [],
          detailPairs: walkingPairs,
        });
        routingWarning ||= details.warning ?? "";
        routeEstimates = mergeRouteEstimates(routeEstimates, details.estimates);
        next = generateItinerary({ ...request, routeEstimates });
      }
    } catch {
      routingWarning = "Live routing was unavailable, so this preview uses conservative Baguio estimates. Check the low-confidence legs before leaving.";
      next = generateItinerary(request);
    }

    const remainingDelay = Math.max(0, 900 - (Date.now() - generationStartedAt));
    await new Promise<void>((resolve) => window.setTimeout(resolve, remainingDelay));
    setReviewResult(next);
    if (routingWarning) setToast(routingWarning);
    setGenerating(false);
  }

  function confirmReviewedPlan() {
    if (!reviewResult || confirming) return;
    const approvedItinerary = reviewResult;
    setConfirming(true);
    window.setTimeout(() => {
      setResult(approvedItinerary);
      setActiveDay(0);
      try {
        localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(approvedItinerary));
        setSaved(true);
        window.dispatchEvent(new Event(ITINERARY_CHANGE_EVENT));
      } catch {
        setSaved(false);
      }
      setReviewResult(null);
      setConfirming(false);
      router.push("/plan/itinerary");
    }, 2000);
  }

  function editReviewedPlan() {
    setReviewResult(null);
    window.setTimeout(() => scrollToStep("destinations"), 40);
  }

  function removeReviewedDestination(destinationId: string) {
    if (!reviewResult) return;
    setReviewResult(deferItineraryDestination(reviewResult, destinationId));
    setSaved(false);
  }

  function deleteReviewedDestination(destinationId: string) {
    if (!reviewResult) return;
    const remainingIds = reviewResult.selectedDestinationIds.filter((id) => id !== destinationId);
    const reviewedDestinations = new Map(
      reviewResult.days.flatMap((day) => [
        ...day.items
          .filter((item) => item.kind === "destination")
          .map((item) => [item.destination.id, item.destination] as const),
        ...day.unscheduled.map((destination) => [destination.id, destination] as const),
      ]),
    );
    const remainingDestinations = remainingIds
      .map((id) => reviewedDestinations.get(id) ?? getPlannerDestinationById(id))
      .filter((destination): destination is PlannerDestination => Boolean(destination));
    if (remainingDestinations.length < 2) return;

    const next = generateItinerary({
      start: reviewResult.start,
      destinations: remainingDestinations,
      date: reviewResult.date,
      numberOfDays: reviewResult.numberOfDays,
      availableMinutes: reviewResult.availableMinutes,
      travelers: reviewResult.travelers,
      modes: reviewResult.modes,
      preference: reviewResult.preference,
      pace: reviewResult.pace,
      fareSettings: reviewResult.fareSettings,
      jeepneyClass: "unsure",
      startMinutes: reviewResult.startMinutes,
      ...(reviewResult.stay ? { stay: reviewResult.stay } : {}),
      ...(reviewResult.departure ? { departure: reviewResult.departure } : {}),
      dayAssignments: getItineraryDayAssignments(reviewResult),
      deferredDestinationIds: reviewResult.deferredDestinationIds?.filter((id) => id !== destinationId),
      suggestedDestinationIds: reviewResult.suggestedDestinationIds?.filter((id) => id !== destinationId),
      routeEstimates: reviewResult.routeEstimates,
    });

    setSelectedIds((current) => current.filter((id) => id !== destinationId));
    setReviewResult(next);
    setSaved(false);
  }

  function evaluateReviewedMove(destinationId: string, targetDayIndex: number): ItineraryMoveEvaluation {
    if (!reviewResult) {
      return { allowed: false, reason: "The itinerary preview is no longer open." };
    }
    return evaluateItineraryMove(reviewResult, destinationId, targetDayIndex);
  }

  function moveReviewedDestination(destinationId: string, targetDayIndex: number): ItineraryMoveEvaluation {
    const evaluation = evaluateReviewedMove(destinationId, targetDayIndex);
    if (evaluation.allowed && evaluation.itinerary) {
      setReviewResult(evaluation.itinerary);
      setSaved(false);
    }
    return evaluation;
  }

  function savePlan() {
    if (!result) return;
    try {
      localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(result));
      setSaved(true);
      window.dispatchEvent(new Event(ITINERARY_CHANGE_EVENT));
      setToast("Itinerary saved as your pending trip.");
    } catch { setToast("This browser could not save the itinerary locally."); }
  }

  return (
    <div className={`trip-planner ${initialView === "itinerary" ? "results-mode" : "editor-mode"}`}>
      {initialView === "editor" ? <>
        <nav className="planner-progress" aria-label="Planner steps">
        <span className="progress-line" aria-hidden="true"><i style={{ width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%" }} /></span>
        {([[1, "Trip details", "Dates and schedule", "trip-details"], [2, "Destinations", "Pick or auto-choose", "destinations"], [3, "Preferences", "Travel style and transport", "preferences"]] as const).map(([step, label, hint, id]) => (
          <button key={step} type="button" className={`${activeStep === step ? "active" : ""} ${step < activeStep ? "complete" : ""}`} aria-current={activeStep === step ? "step" : undefined} onClick={() => scrollToStep(String(id))}>
            <span>{step < activeStep ? <Check size={14} /> : `0${step}`}</span><span><strong>{label}</strong><small>{hint}</small></span>
          </button>
        ))}
        </nav>

        <form className="planner-form" onSubmit={buildPlan} noValidate>
        <section className="planner-form-section" id="trip-details" data-planner-step="1">
          <header className="planner-step-heading"><span>01</span><div><h2>Begin your trip</h2><p>Tell us where, when, and how long your Baguio trip will be.</p></div></header>

          {requestedPlannerPlace ? <div className="planner-request-notice"><Check size={16} /><span><strong>{requestedPlannerPlace.name}</strong> was added from Explore. Choose at least one more destination below.</span></div> : requestedExplorePlace ? <div className="planner-request-notice warning"><span>ℹ</span><span><strong>{requestedExplorePlace.name}</strong> is listed in Explore but does not yet have verified hours and route guidance, so it was not silently added to your generated route.</span></div> : null}

          <div className="trip-detail-grid">
            <label className="planner-field start-field"><span>Starting point</span><div className="start-input-row"><select value={startLocationId} onChange={(event) => setStartLocationId(event.target.value)}>{customStart ? <option value="current-location">My current location</option> : null}{PLANNER_START_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="button" onClick={useCurrentLocation} disabled={locating} aria-label="Use my current location" title="Use my current location"><Crosshair size={17} className={locating ? "spin" : ""} /></button></div></label>
            <label className="planner-field"><span>Trip date</span><input type="date" min={localDateValue()} value={tripDate} onChange={(event) => setTripDate(event.target.value)} /></label>
            <label className="planner-field"><span>Number of days</span><select value={numberOfDays} onChange={(event) => setNumberOfDays(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((day) => <option key={day} value={day}>{day} {day === 1 ? "day" : "days"}</option>)}</select></label>
            <label className="planner-field"><span>Daily start time</span><input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label className="planner-field"><span>Time available each day</span><select value={availableHours} onChange={(event) => setAvailableHours(Number(event.target.value))}>{[4, 6, 8, 10, 12].map((hours) => <option key={hours} value={hours}>{hours === 12 ? "Full day" : `${hours} hours`}</option>)}</select></label>
            <label className="planner-field"><span>Travelers</span><input type="number" min="1" max="12" required value={travelers} onChange={(event) => setTravelers(clamp(Number(event.target.value) || 1, 1, 12))} /></label>
          </div>

          {selectedStart.terminalIdentity ? <aside className="terminal-identity-card" aria-label={`${selectedStart.terminalIdentity.branchLabel} terminal details`}>
            <div className="terminal-identity-heading"><span>{selectedStart.terminalIdentity.branchLabel}</span><div><small>{selectedStart.terminalIdentity.operator}</small><strong>{selectedStart.terminalIdentity.officialName}</strong></div></div>
            <p><MapPin size={15} /> <span>{selectedStart.terminalIdentity.address}<small>{selectedStart.lat.toFixed(5)}, {selectedStart.lng.toFixed(5)}</small></span></p>
            <p className="terminal-ticket-warning"><AlertTriangle size={15} /> {selectedStart.terminalIdentity.warning}</p>
            <a href={selectedStart.terminalIdentity.sourceUrl} target="_blank" rel="noreferrer">Check Victory Liner’s terminal directory <ExternalLink size={13} /></a>
          </aside> : null}

          <section className={`stay-planner-card ${includeStay ? "expanded" : ""}`} aria-labelledby="stay-planner-title">
            <header>
              <span className="stay-card-icon"><BedDouble size={20} /></span>
              <div><small>OPTIONAL FIXED STOP</small><h2 id="stay-planner-title">Add your hotel or Airbnb check-in</h2><p>We will plan your day around check-in and include directions to the property.</p></div>
              <button type="button" className="stay-toggle" aria-pressed={includeStay} onClick={() => { setIncludeStay((current) => !current); setSaved(false); }}>{includeStay ? "Remove" : "Add stay"}</button>
            </header>
            {includeStay ? <div className="stay-planner-fields">
              <div className="stay-kind-picker" role="group" aria-label="Accommodation type">
                <button type="button" className={stayKind === "hotel" ? "active" : ""} aria-pressed={stayKind === "hotel"} onClick={() => setStayKind("hotel")}><Building2 size={17} /> Hotel</button>
                <button type="button" className={stayKind === "airbnb" ? "active" : ""} aria-pressed={stayKind === "airbnb"} onClick={() => setStayKind("airbnb")}><House size={17} /> Airbnb</button>
              </div>
              <StayAutocomplete
                kind={stayKind}
                value={stayName}
                onValueChange={(value) => {
                  setStayName(value);
                  setSaved(false);
                }}
                onSelect={(place) => {
                  setStayName(place.name);
                  setStayMapsUrl(place.googleMapsUrl);
                  setVerifiedStayMap(null);
                  setStayMapState("checking");
                  setSaved(false);
                }}
              />
              <label className="planner-field stay-map-field"><span>Google Maps place or share link <small>optional with a suggestion</small></span><div><MapPin size={17} /><input type="url" value={stayMapsUrl} onChange={(event) => { setStayMapsUrl(event.target.value); setVerifiedStayMap(null); setSaved(false); }} placeholder="https://maps.app.goo.gl/..." /><a href={googleMapsStaySearchUrl(stayKind, stayName)} target="_blank" rel="noreferrer" aria-label="Find this stay in Google Maps" title="Find in Google Maps"><ExternalLink size={17} /></a></div></label>
              <div className="stay-schedule-grid">
                <section className="stay-schedule-group">
                  <header><strong>Check-in</strong><small>We will arrive at the property at this time.</small></header>
                  <div>
                    <label className="planner-field"><span>Day</span><select value={checkInDay} onChange={(event) => setCheckInDay(Number(event.target.value))}>{Array.from({ length: numberOfDays }, (_, index) => <option value={index} key={index}>Day {index + 1}</option>)}</select></label>
                    <label className="planner-field"><span>Time</span><input type="time" value={checkInTime} onChange={(event) => setCheckInTime(event.target.value)} /></label>
                  </div>
                </section>
                <section className="stay-schedule-group checkout">
                  <header><strong>Checkout</strong><small>Your final-day route starts around this time.</small></header>
                  <div>
                    <label className="planner-field"><span>Day</span><input type="text" value={`Day ${numberOfDays}`} readOnly aria-label={`Checkout on Day ${numberOfDays}`} /></label>
                    <label className="planner-field"><span>Time</span><input type="time" required value={checkOutTime} onChange={(event) => setCheckOutTime(event.target.value)} /></label>
                  </div>
                  <p className="field-hint">Use the checkout time provided by your hotel or host.</p>
                </section>
              </div>
              <div className="departure-fields">
                <label className="planner-field"><span>Final departure point <small>optional</small></span><select value={departureLocationId} onChange={(event) => setDepartureLocationId(event.target.value)}><option value="">Not decided yet</option>{PLANNER_START_LOCATIONS.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>
                <label className="planner-field"><span>Bus / departure time <small>optional</small></span><input type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} disabled={!departureLocationId} /></label>
              </div>
              {stayMapsUrl ? <p className={`stay-map-status ${stayMapState === "verified" ? "valid" : stayMapState === "checking" ? "checking" : "invalid"}`} aria-live="polite">{stayMapState === "checking" ? <><LoaderCircle className="spin" size={14} /> Checking the exact Google Maps place…</> : stayMapState === "verified" && currentVerifiedStay ? <><Check size={14} /> {currentVerifiedStay.name} — exact pin confirmed.</> : <>{stayMapError || "Paste the exact place or Share link from Google Maps."}</>}</p> : <p className="stay-map-help"><MapPin size={14} /> Find the property in Google Maps, tap Share, then paste its link here.</p>}
            </div> : null}
          </section>

          {baggageOptions.length ? <aside className="arrival-tip-rich"><header><span><BaggageClaim size={20} /></span><div><h2>Store heavy bags before sightseeing</h2><p>Arriving before check-in? Ask your hotel or a terminal counter to hold your bags first. Confirm availability, fees, closing time, and the claim-stub process; keep valuables with you.</p></div></header><div>{baggageOptions.map((option) => <article key={option.name}><strong>{option.name}</strong><p>{option.detail}</p><a href={googleSearchUrl(option.query)} target="_blank" rel="noreferrer">View in Google Maps ↗</a></article>)}</div></aside> : null}
        </section>

        <section className="planner-form-section" id="destinations" data-planner-step="2">
          <header className="planner-step-heading destination-heading"><span>02</span><div><h2>Choose your destinations</h2><p>Pick the places you actually want. Baguio Buddy will arrange only those selections into a practical route.</p></div><div className="selected-count"><strong>{selectedIds.length}</strong><small>selected</small></div></header>

          <div className="selected-destination-drawer"><header><div><strong>Your selected places</strong><small>{selectedIds.length >= 2 ? `${selectedIds.length} places ready to arrange.` : "Choose at least two destinations."}</small></div><button type="button" onClick={() => { setSelectedIds([]); setSaved(false); }}>Clear all</button></header><div className="selected-chip-row">{selectedDestinations.length ? selectedDestinations.map((destination) => <button type="button" key={destination.id} onClick={() => toggleDestination(destination.id)} aria-label={`Remove ${destination.name}`}>{destination.name}<X size={12} /></button>) : <span>No destinations selected yet.</span>}</div></div>

          <div className="destination-tools"><label className="planner-search"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a place, activity, or area…" /></label><label className="auto-pick-select"><span>Auto-pick theme</span><select value={autoPickTheme} onChange={(event) => setAutoPickTheme(event.target.value as AutoPickTheme)}>{AUTO_PICK_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></label><button type="button" className="auto-pick-button" onClick={autoChoose}><Sparkles size={16} /> Let Buddy choose</button></div>

          <div className="destination-filters" aria-label="Filter destinations">{PLANNER_CATEGORY_ORDER.map((category) => <button type="button" className={filter === category ? "active" : ""} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div>

          <div className="destination-rail-shell"><div className="destination-rail" aria-label="Destination choices">{filteredDestinations.map((destination) => { const selected = selectedIds.includes(destination.id); return <article className={`destination-choice ${selected ? "selected" : ""}`} key={destination.id}><div className="destination-choice-image"><img src={destination.image} alt="" loading="lazy" />{destination.popular ? <span className="must-visit">★ Must visit</span> : null}<button type="button" aria-pressed={selected} onClick={() => toggleDestination(destination.id)}>{selected ? <><Check size={13} /> Selected</> : "+ Add"}</button></div><div className="destination-choice-body"><span>{destination.icon} {destination.category}</span><h3>{destination.name}</h3><p>{destination.area}</p><div><small>{destination.open}–{destination.close}</small><small>{destination.duration} min</small></div></div></article>; })}{!filteredDestinations.length ? <div className="destination-empty"><Search size={25} /><strong>No matching places</strong><span>Try another search or category.</span></div> : null}</div></div>
          <p className="swipe-destinations">Swipe sideways to explore all {filteredDestinations.length} places ↔</p>
        </section>

        <section className="planner-form-section" id="preferences" data-planner-step="3">
          <header className="planner-step-heading"><span>03</span><div><h2>Pick your travel style</h2><p>We will balance time, cost, walking, and convenience around this preference.</p></div></header>

          <div className="preference-grid-rich">{PREFERENCES.map((item) => <button type="button" key={item.value} aria-pressed={preference === item.value} className={preference === item.value ? "active" : ""} onClick={() => { setPreference(item.value); setSaved(false); }}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small>{preference === item.value ? <i><Check size={13} /></i> : null}</button>)}</div>

          <fieldset className="transport-modes"><legend>Allowed transportation</legend><div>{MODES.map((mode) => <button type="button" key={mode.value} aria-pressed={modes.includes(mode.value)} className={modes.includes(mode.value) ? "active" : ""} onClick={() => toggleMode(mode.value)}><span>{mode.icon}</span>{mode.label}{modes.includes(mode.value) ? <Check size={13} /> : null}</button>)}</div></fieldset>

          <details className="fare-policy-card">
            <summary>
              <span className="fare-policy-seal"><BadgeCheck size={20} /></span>
              <div><small>FARE ESTIMATES</small><h3>Planning fares are filled in for you</h3><p>Tap to review the LTFRB-sourced jeepney and taxi rates.</p></div>
              <span className="fare-policy-reviewed">Checked {farePolicy.reviewedLabel}</span>
              <ChevronDown className="fare-policy-chevron" size={18} aria-hidden="true" />
            </summary>
            <div className="fare-policy-content">
              <p className="fare-policy-intro">You do not need to know the jeepney type in advance. Baguio Buddy automatically uses the modern-jeepney rate as a safe “up to” budget; your actual fare may be lower when a traditional jeepney serves the route.</p>
              <div className="fare-policy-rates">
              <article>
                <span><BusFront size={18} /> {farePolicy.jeepney.traditional.label}</span>
                <strong>₱{farePolicy.jeepney.traditional.minimum}<small> first {farePolicy.jeepney.traditional.baseKilometers} km</small></strong>
                <p>+₱{farePolicy.jeepney.traditional.perKilometer.toFixed(2)} for every succeeding kilometer</p>
                <small className="fare-policy-effective">{farePolicy.effectiveLabel}</small>
                <a href={farePolicy.sourceUrl} target="_blank" rel="noreferrer">Fare announcement <ExternalLink size={12} /></a>
              </article>
              <article>
                <span><BusFront size={18} /> {farePolicy.jeepney.modern.label}</span>
                <strong>₱{farePolicy.jeepney.modern.minimum}<small> first {farePolicy.jeepney.modern.baseKilometers} km</small></strong>
                <p>+₱{farePolicy.jeepney.modern.perKilometer.toFixed(2)} for every succeeding kilometer</p>
                <small className="fare-policy-effective">{farePolicy.effectiveLabel}</small>
                <a href={farePolicy.sourceUrl} target="_blank" rel="noreferrer">Fare announcement <ExternalLink size={12} /></a>
              </article>
              <article>
                <span><CarFront size={18} /> {LTFRB_FARE_POLICY.taxi.label}</span>
                <strong>₱{LTFRB_FARE_POLICY.taxi.flagDown}<small> flag-down</small></strong>
                <p>+₱{LTFRB_FARE_POLICY.taxi.perKilometer.toFixed(2)}/km + ₱{LTFRB_FARE_POLICY.taxi.perMinute.toFixed(2)}/minute</p>
                <small className="fare-policy-effective">{LTFRB_FARE_POLICY.taxi.effectiveLabel}</small>
                <a href={LTFRB_FARE_POLICY.taxi.sourceUrl} target="_blank" rel="noreferrer">Official fare rates <ExternalLink size={12} /></a>
              </article>
              </div>
              <footer><span>{farePolicy.verificationNote} Estimates still vary with the actual route, traffic, authorized discounts, and taxi meter.</span><span className="fare-policy-links"><a href={LTFRB_FARE_POLICY.taxi.orderUrl} target="_blank" rel="noreferrer">Taxi order <ExternalLink size={12} /></a>{farePolicy.localAdvisory ? <a href={farePolicy.localAdvisory.url} target="_blank" rel="noreferrer" title={farePolicy.localAdvisory.note}>Local advisory <ExternalLink size={12} /></a> : null}</span></footer>
            </div>
          </details>

          {error ? <p className="planner-error" role="alert">{error}</p> : null}
          <button className="generate-plan-button" type="submit" disabled={generating} aria-busy={generating}><span><small>{generating ? "Mapping time, fare, and directions" : "Ready when you are"}</small><strong>{generating ? "Building your Baguio route…" : "Generate my itinerary"}</strong></span>{generating ? <LoaderCircle className="spin" size={22} /> : <ChevronRight size={22} />}</button>
          <p className="planner-estimate-note">Routes are planning suggestions. Confirm opening hours, fares, admission rules, weather, and loading areas locally.</p>
        </section>
        </form>
      </> : null}

      {initialView === "itinerary" && restored && result ? <ItineraryResults itinerary={result} activeDay={activeDay} saved={saved} onActiveDayChange={setActiveDay} onEdit={() => router.push("/plan")} onSave={savePlan} /> : null}
      {initialView === "itinerary" && !restored ? <div className="loading-card itinerary-loading">Opening your itinerary…</div> : null}
      {reviewResult ? <ItineraryReviewDialog itinerary={reviewResult} confirming={confirming} onConfirm={confirmReviewedPlan} onEdit={editReviewedPlan} onDefer={removeReviewedDestination} onDelete={deleteReviewedDestination} onEvaluateMove={evaluateReviewedMove} onMove={moveReviewedDestination} /> : null}
      {toast ? <div className="planner-toast" role="status">{toast}</div> : null}
    </div>
  );
}
