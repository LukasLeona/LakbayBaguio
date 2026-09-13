"use client";

import {
  BaggageClaim,
  Check,
  ChevronRight,
  Crosshair,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ItineraryResults } from "@/components/itinerary-results";
import {
  DEFAULT_FARE_SETTINGS,
  DEFAULT_PLANNER_SETTINGS,
  PLANNER_CATEGORY_ORDER,
  PLANNER_DESTINATIONS,
  PLANNER_START_LOCATIONS,
  getBaggageOptionsForStart,
  getPlannerDestinationById,
  getPlannerStartLocationById,
} from "@/lib/planner-data";
import {
  generateItinerary,
  googleSearchUrl,
  parseTimeToMinutes,
  validatePlannerRequest,
  type PlannedItinerary,
  type PlannerRequest,
} from "@/lib/planner-engine";
import type {
  AutoPickTheme,
  FareSettings,
  PlannerCategoryFilter,
  PlannerDestination,
  StartLocation,
  TransportMode,
  TravelPreference,
} from "@/lib/planner-types";
import { ITINERARY_STORAGE_KEY } from "@/lib/itinerary";
import { getPlace } from "@/lib/places";

const DRAFT_STORAGE_KEY = "lakbay-baguio-planner";

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
  fareSettings?: Partial<FareSettings>;
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

function isPlannedItinerary(value: unknown): value is PlannedItinerary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlannedItinerary>;
  return Boolean(candidate.start && Array.isArray(candidate.days) && candidate.totals && Array.isArray(candidate.selectedDestinationIds));
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

export function Planner() {
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preference, setPreference] = useState<TravelPreference>(DEFAULT_PLANNER_SETTINGS.preference);
  const [modes, setModes] = useState<TransportMode[]>([...DEFAULT_PLANNER_SETTINGS.modes]);
  const [fareSettings, setFareSettings] = useState<FareSettings>({ ...DEFAULT_FARE_SETTINGS });
  const [autoPickTheme, setAutoPickTheme] = useState<AutoPickTheme>(DEFAULT_PLANNER_SETTINGS.autoPickTheme);
  const [filter, setFilter] = useState<PlannerCategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [result, setResult] = useState<PlannedItinerary | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [locating, setLocating] = useState(false);
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
        if (draft.fareSettings) setFareSettings((current) => ({ ...current, ...draft.fareSettings }));
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
          setSelectedIds(pending.selectedDestinationIds.filter((id) => Boolean(getPlannerDestinationById(id))));
          setPreference(pending.preference);
          setModes(pending.modes);
          setFareSettings(pending.fareSettings);
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
    const draft: PlannerDraft = { startLocation: startLocationId, tripDate, tripDays: numberOfDays, startTime, tripHours: availableHours, travelers, selected: selectedIds, preference, modes, autoPickTheme, fareSettings };
    try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft)); } catch { /* Storage is optional. */ }
  }, [autoPickTheme, availableHours, fareSettings, modes, numberOfDays, preference, restored, selectedIds, startLocationId, startTime, travelers, tripDate]);

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
    setToast(`Lakbay selected ${chosen.length} places for your ${numberOfDays}-day trip.`);
  }

  function toggleMode(mode: TransportMode) {
    setModes((current) => current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]);
    setError("");
  }

  function updateFare(field: keyof FareSettings, value: string) {
    setFareSettings((current) => ({ ...current, [field]: Math.max(0, Number(value) || 0) }));
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

  function buildPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: PlannerRequest = { start: selectedStart, destinations: selectedDestinations, date: tripDate, numberOfDays, availableMinutes: availableHours * 60, travelers, modes, preference, fareSettings, startTime };
    const issues = validatePlannerRequest(request);
    if (issues.length) {
      setError(issues[0].message);
      if (issues[0].field.startsWith("destination")) scrollToStep("destinations");
      else if (issues[0].field === "modes") scrollToStep("preferences");
      else scrollToStep("trip-details");
      return;
    }
    const next = generateItinerary(request);
    setResult(next);
    setActiveDay(0);
    setSaved(false);
    setError("");
    window.setTimeout(() => document.getElementById("itinerary-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function savePlan() {
    if (!result) return;
    try {
      localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(result));
      setSaved(true);
      setToast("Itinerary saved as your pending trip.");
    } catch { setToast("This browser could not save the itinerary locally."); }
  }

  return (
    <div className="trip-planner">
      <nav className="planner-progress" aria-label="Planner steps">
        <span className="progress-line" aria-hidden="true"><i style={{ width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%" }} /></span>
        {([[1, "Trip details", "Dates and schedule", "trip-details"], [2, "Destinations", "Pick or auto-choose", "destinations"], [3, "Preferences", "Choose your pace", "preferences"]] as const).map(([step, label, hint, id]) => (
          <button key={step} type="button" className={`${activeStep === step ? "active" : ""} ${step < activeStep ? "complete" : ""}`} aria-current={activeStep === step ? "step" : undefined} onClick={() => scrollToStep(String(id))}>
            <span>{step < activeStep ? <Check size={14} /> : `0${step}`}</span><span><strong>{label}</strong><small>{hint}</small></span>
          </button>
        ))}
      </nav>

      <form className="planner-form" onSubmit={buildPlan} noValidate>
        <section className="planner-form-section" id="trip-details" data-planner-step="1">
          <header className="planner-step-heading"><span>01</span><div><h1>Begin your trip</h1><p>Tell us where, when, and how long your Baguio trip will be.</p></div></header>

          {requestedPlannerPlace ? <div className="planner-request-notice"><Check size={16} /><span><strong>{requestedPlannerPlace.name}</strong> was added from Explore. Choose at least one more destination below.</span></div> : requestedExplorePlace ? <div className="planner-request-notice warning"><span>ℹ</span><span><strong>{requestedExplorePlace.name}</strong> is listed in Explore but does not yet have verified hours and route guidance, so it was not silently added to your generated route.</span></div> : null}

          <div className="trip-detail-grid">
            <label className="planner-field start-field"><span>Starting point</span><div className="start-input-row"><select value={startLocationId} onChange={(event) => setStartLocationId(event.target.value)}>{customStart ? <option value="current-location">My current location</option> : null}{PLANNER_START_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="button" onClick={useCurrentLocation} disabled={locating} aria-label="Use my current location" title="Use my current location"><Crosshair size={17} className={locating ? "spin" : ""} /></button></div></label>
            <label className="planner-field"><span>Trip date</span><input type="date" min={localDateValue()} value={tripDate} onChange={(event) => setTripDate(event.target.value)} /></label>
            <label className="planner-field"><span>Number of days</span><select value={numberOfDays} onChange={(event) => setNumberOfDays(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((day) => <option key={day} value={day}>{day} {day === 1 ? "day" : "days"}</option>)}</select></label>
            <label className="planner-field"><span>Daily start time</span><input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label className="planner-field"><span>Time available each day</span><select value={availableHours} onChange={(event) => setAvailableHours(Number(event.target.value))}>{[4, 6, 8, 10, 12].map((hours) => <option key={hours} value={hours}>{hours === 12 ? "Full day" : `${hours} hours`}</option>)}</select></label>
            <label className="planner-field"><span>Travelers</span><input type="number" min="1" max="12" required value={travelers} onChange={(event) => setTravelers(clamp(Number(event.target.value) || 1, 1, 12))} /></label>
          </div>

          {baggageOptions.length ? <aside className="arrival-tip-rich"><header><span><BaggageClaim size={20} /></span><div><h2>Arriving before hotel check-in?</h2><p>You may be able to leave your bags before starting the route. Services and rates can change, so verify at the counter and keep valuables with you.</p></div></header><div>{baggageOptions.map((option) => <article key={option.name}><strong>{option.name}</strong><p>{option.detail}</p><a href={googleSearchUrl(option.query)} target="_blank" rel="noreferrer">View in Google Maps ↗</a></article>)}</div></aside> : null}
        </section>

        <section className="planner-form-section" id="destinations" data-planner-step="2">
          <header className="planner-step-heading destination-heading"><span>02</span><div><h2>Choose your destinations</h2><p>Pick the places you actually want. Lakbay will arrange only those selections into a practical route.</p></div><div className="selected-count"><strong>{selectedIds.length}</strong><small>selected</small></div></header>

          <div className="selected-destination-drawer"><header><div><strong>Your selected places</strong><small>{selectedIds.length >= 2 ? `${selectedIds.length} places ready to arrange.` : "Choose at least two destinations."}</small></div><button type="button" onClick={() => { setSelectedIds([]); setSaved(false); }}>Clear all</button></header><div className="selected-chip-row">{selectedDestinations.length ? selectedDestinations.map((destination) => <button type="button" key={destination.id} onClick={() => toggleDestination(destination.id)} aria-label={`Remove ${destination.name}`}>{destination.name}<X size={12} /></button>) : <span>No destinations selected yet.</span>}</div></div>

          <div className="destination-tools"><label className="planner-search"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a place, activity, or area…" /></label><label className="auto-pick-select"><span>Auto-pick theme</span><select value={autoPickTheme} onChange={(event) => setAutoPickTheme(event.target.value as AutoPickTheme)}>{AUTO_PICK_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></label><button type="button" className="auto-pick-button" onClick={autoChoose}><Sparkles size={16} /> Let Lakbay choose</button></div>

          <div className="destination-filters" aria-label="Filter destinations">{PLANNER_CATEGORY_ORDER.map((category) => <button type="button" className={filter === category ? "active" : ""} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div>

          <div className="destination-rail-shell"><div className="destination-rail" aria-label="Destination choices">{filteredDestinations.map((destination) => { const selected = selectedIds.includes(destination.id); return <article className={`destination-choice ${selected ? "selected" : ""}`} key={destination.id}><div className="destination-choice-image"><img src={destination.image} alt="" loading="lazy" />{destination.popular ? <span className="must-visit">★ Must visit</span> : null}<button type="button" aria-pressed={selected} onClick={() => toggleDestination(destination.id)}>{selected ? <><Check size={13} /> Selected</> : "+ Add"}</button></div><div className="destination-choice-body"><span>{destination.icon} {destination.category}</span><h3>{destination.name}</h3><p>{destination.area}</p><div><small>{destination.open}–{destination.close}</small><small>{destination.duration} min</small></div></div></article>; })}{!filteredDestinations.length ? <div className="destination-empty"><Search size={25} /><strong>No matching places</strong><span>Try another search or category.</span></div> : null}</div></div>
          <p className="swipe-destinations">Swipe sideways to explore all {filteredDestinations.length} places ↔</p>
        </section>

        <section className="planner-form-section" id="preferences" data-planner-step="3">
          <header className="planner-step-heading"><span>03</span><div><h2>Pick your travel style</h2><p>We will balance time, cost, walking, and convenience around this preference.</p></div></header>

          <div className="preference-grid-rich">{PREFERENCES.map((item) => <button type="button" key={item.value} aria-pressed={preference === item.value} className={preference === item.value ? "active" : ""} onClick={() => { setPreference(item.value); setSaved(false); }}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small>{preference === item.value ? <i><Check size={13} /></i> : null}</button>)}</div>

          <fieldset className="transport-modes"><legend>Allowed transportation</legend><div>{MODES.map((mode) => <button type="button" key={mode.value} aria-pressed={modes.includes(mode.value)} className={modes.includes(mode.value) ? "active" : ""} onClick={() => toggleMode(mode.value)}><span>{mode.icon}</span>{mode.label}{modes.includes(mode.value) ? <Check size={13} /> : null}</button>)}</div></fieldset>

          <details className="fare-assumptions"><summary>Adjust planning fare assumptions</summary><div><label><span>Jeepney minimum</span><input type="number" min="0" step="1" value={fareSettings.jeepMinimum} onChange={(event) => updateFare("jeepMinimum", event.target.value)} /></label><label><span>Base distance (km)</span><input type="number" min="0" step="0.5" value={fareSettings.jeepBaseKm} onChange={(event) => updateFare("jeepBaseKm", event.target.value)} /></label><label><span>Added per km</span><input type="number" min="0" step="0.1" value={fareSettings.jeepPerKm} onChange={(event) => updateFare("jeepPerKm", event.target.value)} /></label><label><span>Taxi flag-down</span><input type="number" min="0" step="1" value={fareSettings.taxiFlag} onChange={(event) => updateFare("taxiFlag", event.target.value)} /></label><label><span>Taxi per km</span><input type="number" min="0" step="1" value={fareSettings.taxiPerKm} onChange={(event) => updateFare("taxiPerKm", event.target.value)} /></label></div><p>Editable estimates only. Verify current fares with the driver or dispatcher.</p></details>

          {error ? <p className="planner-error" role="alert">{error}</p> : null}
          <button className="generate-plan-button" type="submit"><span><small>Ready when you are</small><strong>Generate my Baguio plan</strong></span><ChevronRight size={22} /></button>
          <p className="planner-estimate-note">Routes are planning suggestions. Confirm opening hours, fares, admission rules, weather, and loading areas locally.</p>
        </section>
      </form>

      {result ? <ItineraryResults itinerary={result} activeDay={activeDay} saved={saved} onActiveDayChange={setActiveDay} onEdit={() => scrollToStep("trip-details")} onSave={savePlan} /> : null}
      {toast ? <div className="planner-toast" role="status">{toast}</div> : null}
    </div>
  );
}
