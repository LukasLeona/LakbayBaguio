"use client";

import {
  AlertTriangle,
  BaggageClaim,
  BedDouble,
  BusFront,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Copy,
  ExternalLink,
  Footprints,
  Heart,
  Lightbulb,
  MapPin,
  Mountain,
  Navigation,
  Pencil,
  Printer,
  Route,
  Save,
  Share2,
  ShieldCheck,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ItineraryShareDialog } from "@/components/itinerary-share-dialog";
import { resolveFarePolicy } from "@/lib/fare-policy";
import { getPlannerDestinationById, getPlannerStartLocationById } from "@/lib/planner-data";
import {
  arrivalLuggagePlanLabel,
  buildDayRouteUrls,
  checkoutLuggagePlanLabel,
  formatCurrency,
  formatDayDate,
  formatDuration,
  formatTripDate,
  googleDirectionsUrl,
  googleLocationUrl,
  googleMapEmbedLocationUrl,
  getArrivalLuggagePlan,
  getCheckoutLuggagePlan,
  itineraryToText,
  JEEPNEY_ROAD_PATH_DISCLAIMER,
  minutesToTime,
  parseTimeToMinutes,
  transportLabel,
  type PlannedItinerary,
  type PlannedCommuteStage,
  type PlannerLocation,
  type PlannedStop,
  type TransportMode,
} from "@/lib/planner-engine";

type ItineraryResultsProps = {
  itinerary: PlannedItinerary;
  activeDay: number;
  saved: boolean;
  onActiveDayChange: (day: number) => void;
  onEdit?: () => void;
  onSave?: () => void;
  variant?: "owned" | "shared";
};

const JOURNEY_PREVIEW_MODES: readonly TransportMode[] = ["jeepney", "walk", "taxi"];

function TransportIcon({ mode }: { mode: TransportMode }) {
  if (mode === "walk") return <Footprints size={19} aria-hidden="true" />;
  if (mode === "jeepney") return <BusFront size={19} aria-hidden="true" />;
  return <Car size={19} aria-hidden="true" />;
}

function fareLabel(stop: PlannedStop) {
  if (stop.transport.mode === "walk") return "Free";
  if (stop.transport.mode === "jeepney") {
    const rides = stop.transport.boardings ?? 1;
    const perPersonMinimum = stop.transport.farePerPersonMinimum ?? stop.transport.farePerPerson;
    const perPersonMaximum = stop.transport.farePerPersonMaximum ?? stop.transport.farePerPerson;
    const totalMinimum = stop.transport.totalFareMinimum ?? stop.transport.totalFare;
    const totalMaximum = stop.transport.totalFareMaximum ?? stop.transport.totalFare;
    return `${budgetFareLabel(perPersonMinimum, perPersonMaximum)} each · ${rides} ${rides === 1 ? "ride" : "rides"} · ${budgetFareLabel(totalMinimum, totalMaximum)} total`;
  }
  return `${formatCurrency(stop.transport.vehicleFare)} per vehicle`;
}

function budgetFareLabel(minimum: number, maximum: number) {
  return minimum === maximum
    ? formatCurrency(maximum)
    : `Up to ${formatCurrency(maximum)}`;
}

function confidenceLabel(stop: PlannedStop) {
  if (stop.transport.confidence === "high") return "High-confidence route";
  if (stop.transport.confidence === "medium") return "Medium-confidence estimate";
  return "Low-confidence fallback";
}

function routeSourceLabel(stop: PlannedStop) {
  if (stop.transport.estimateSource === "verified-corridor") return "verified public corridor";
  if (stop.transport.estimateSource === "geoapify-routing") return "road/walk network";
  return "conservative fallback";
}

function fixedStopLabel(stop: PlannedStop) {
  if (stop.kind === "meal") return "Meal";
  if (stop.kind === "rest") return "Rest";
  if (stop.kind === "check-in") return "Check in";
  if (stop.kind === "check-out") return "Checkout";
  if (stop.kind === "departure") return "Departure";
  if (stop.kind === "bag-drop") return "Bag drop";
  if (stop.kind === "bag-pickup") return "Bag pickup";
  return "Visit";
}

function fixedStopMeta(stop: PlannedStop, itinerary: PlannedItinerary) {
  if (stop.kind === "meal") return "Protected meal time · Near the current route";
  if (stop.kind === "rest") return "Protected recovery time · No extra travel";
  if (stop.kind === "check-in") return `${itinerary.stay?.kind === "airbnb" ? "Airbnb" : "Hotel"} · Fixed check-in`;
  if (stop.kind === "check-out") return `${itinerary.stay?.kind === "airbnb" ? "Airbnb" : "Hotel"} · Fixed checkout`;
  if (stop.kind === "departure") return "Final transfer · Departure point";
  if (stop.kind === "bag-drop") return "Planned luggage handoff—confirm on arrival";
  if (stop.kind === "bag-pickup") return "Return for stored luggage";
  return `${stop.destination.area} · ${stop.destination.category}`;
}

function isComfortStop(stop: PlannedStop) {
  return stop.kind === "meal" || stop.kind === "rest";
}

function CommuteStageIcon({ stage }: { stage: PlannedCommuteStage }) {
  if (stage.kind === "ride") return <BusFront size={14} aria-hidden="true" />;
  if (stage.kind === "wait" || stage.kind === "transfer-wait") return <Clock3 size={14} aria-hidden="true" />;
  return <Footprints size={14} aria-hidden="true" />;
}

function JeepneyCommuteGuide({ stop, className = "" }: { stop: PlannedStop; className?: string }) {
  if (!stop.transport.stages?.length) return null;

  return (
    <section className={`jeepney-commute ${className}`.trim()} aria-label={`Complete jeepney commute to ${stop.destination.name}`}>
      <header>
        <div>
          <strong>Complete commute</strong>
          <small>{stop.transport.boardings ?? 1} {(stop.transport.boardings ?? 1) === 1 ? "boarding" : "boardings"} · fare counted per boarding</small>
        </div>
        {stop.transport.routeReference ? <span className={stop.transport.routeReference.verification === "official-directory" ? "official" : "confirm"}>{stop.transport.routeReference.verification === "official-directory" ? "CITY ROUTE REFERENCE" : "CONFIRM ON SITE"}</span> : null}
      </header>
      <ol>{stop.transport.stages.map((stage) => <li key={`${stage.kind}-${stage.label}`}><span><CommuteStageIcon stage={stage} /></span><div><strong>{stage.label}</strong><small>{formatDuration(stage.minutes)}</small><p>{stage.detail}</p>{stage.mapUrl ? <a href={stage.mapUrl} target="_blank" rel="noreferrer">{stage.mapLabel || "Open map"} <ExternalLink size={11} /></a> : null}</div></li>)}</ol>
      {stop.transport.routeReference ? <footer><strong>{stop.transport.routeReference.name}</strong>{stop.transport.routeReference.serviceHours ? <span>{stop.transport.routeReference.serviceHours}</span> : null}<a href={stop.transport.routeReference.sourceUrl} target="_blank" rel="noreferrer">Baguio City route directory <ExternalLink size={11} /></a></footer> : null}
    </section>
  );
}

function canonicalRouteLocation(location: PlannerLocation): PlannerLocation {
  return location.id
    ? getPlannerStartLocationById(location.id) ?? getPlannerDestinationById(location.id) ?? location
    : location;
}

function canonicalizeStop(stop: PlannedStop): PlannedStop {
  const destination = getPlannerDestinationById(stop.destination.id) ?? stop.destination;
  const from = canonicalRouteLocation(stop.from);
  if (destination === stop.destination && from === stop.from) return stop;

  return {
    ...stop,
    destination,
    from,
    transport: {
      ...stop.transport,
      legMapUrl: stop.stationary || stop.transport.mode === "jeepney"
        ? stop.transport.legMapUrl
        : googleDirectionsUrl(from, destination, stop.transport.mode),
    },
    placeMapUrl: stop.kind === "destination"
      ? googleLocationUrl(destination)
      : stop.placeMapUrl,
    mapPreviewUrl: stop.kind === "destination"
      ? googleMapEmbedLocationUrl(destination)
      : stop.mapPreviewUrl,
  };
}

export function ItineraryResults({
  itinerary,
  activeDay,
  saved,
  onActiveDayChange,
  onEdit,
  onSave,
  variant = "owned",
}: ItineraryResultsProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commuteGuideStop, setCommuteGuideStop] = useState<PlannedStop | null>(null);
  const commuteGuideTriggerRef = useRef<HTMLButtonElement | null>(null);
  const commuteGuideCloseRef = useRef<HTMLButtonElement | null>(null);
  const farePolicy = itinerary.farePolicy ?? resolveFarePolicy(itinerary.date);
  const totalFareMinimum = itinerary.totals.fareMinimum ?? itinerary.totals.fare;
  const totalFareMaximum = itinerary.totals.fareMaximum ?? itinerary.totals.fare;
  const totalFare = budgetFareLabel(totalFareMinimum, totalFareMaximum);
  const canonicalStart = getPlannerStartLocationById(itinerary.start.id) ?? itinerary.start;
  const canonicalDeparture = itinerary.departure
    ? getPlannerStartLocationById(itinerary.departure.location.id) ?? itinerary.departure.location
    : null;
  const currentItinerary = {
    ...itinerary,
    start: canonicalStart,
    ...(itinerary.departure && canonicalDeparture
      ? { departure: { ...itinerary.departure, location: canonicalDeparture } }
      : {}),
    days: itinerary.days.map((tripDay) => ({
      ...tripDay,
      items: tripDay.items.map(canonicalizeStop),
    })),
  };
  const day = currentItinerary.days[activeDay] ?? currentItinerary.days[0];
  const firstStop = day?.items.find((item) => item.kind === "destination")
    ?? day?.items.find((item) => item.kind === "departure")
    ?? day?.items[0];
  const dayRouteStart = firstStop
    ? canonicalRouteLocation(firstStop.from)
    : canonicalStart;
  const routeLinks = day ? buildDayRouteUrls(dayRouteStart, day) : [];
  const allJourneyStops = [...new Map(
    currentItinerary.days
      .flatMap((tripDay) => tripDay.items)
      .filter((stop) => stop.kind === "destination")
      .map((stop) => [stop.destination.id, stop]),
  ).values()];
  const journeyStops = allJourneyStops.length <= 3
    ? allJourneyStops
    : [
        allJourneyStops[0],
        allJourneyStops[Math.floor((allJourneyStops.length - 1) / 2)],
        allJourneyStops[allJourneyStops.length - 1],
      ];

  useEffect(() => {
    if (!commuteGuideStop) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCommuteGuideStop(null);
    };
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const closeOutsideMobile = (event: MediaQueryListEvent) => {
      if (!event.matches) setCommuteGuideStop(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    mobileQuery.addEventListener("change", closeOutsideMobile);
    commuteGuideCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      mobileQuery.removeEventListener("change", closeOutsideMobile);
      window.requestAnimationFrame(() => commuteGuideTriggerRef.current?.focus());
    };
  }, [commuteGuideStop]);

  async function copyPlan() {
    const value = itineraryToText(currentItinerary);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function printPlan() {
    const previousTitle = document.title;
    let fallbackTimer = 0;
    const cleanup = () => {
      document.title = previousTitle;
      document.body.classList.remove("printing-itinerary");
      window.removeEventListener("afterprint", cleanup);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    document.title = `${itinerary.title} - Baguio Buddy`;
    document.body.classList.add("printing-itinerary");
    window.addEventListener("afterprint", cleanup, { once: true });
    fallbackTimer = window.setTimeout(cleanup, 120_000);
    window.requestAnimationFrame(() => window.setTimeout(() => window.print(), 80));
  }

  return (
    <section className="generated-plan" id="itinerary-result" aria-labelledby="generated-plan-title">
      <section className="itinerary-overview" aria-label="Itinerary overview">
        <header className="generated-plan-header">
          <div className="plan-title-row">
            <div className="plan-heading-copy">
              <span className="result-kicker"><i /> {variant === "shared" ? "Itinerary shared with you" : "Your generated plan"}</span>
              <h1 id="generated-plan-title">{itinerary.title}</h1>
            </div>
          </div>

          <div className="plan-context-row">
            <span><MapPin /> From {canonicalStart.name}</span>
            {itinerary.date ? <span><CalendarDays /> Starts {formatTripDate(itinerary.date)}</span> : null}
            {itinerary.stay ? <span><BedDouble /> {itinerary.stay.name}</span> : null}
          </div>

          {canonicalStart.terminalIdentity ? <section className="result-terminal-identity" aria-label="Starting terminal details">
            <span className="terminal-branch-badge">{canonicalStart.terminalIdentity.branchLabel}</span>
            <div><strong>{canonicalStart.terminalIdentity.officialName}</strong><p>{canonicalStart.terminalIdentity.address}</p><small>{canonicalStart.lat.toFixed(5)}, {canonicalStart.lng.toFixed(5)}</small></div>
            <p className="terminal-confirm-warning"><AlertTriangle size={14} /> {canonicalStart.terminalIdentity.warning}</p>
          </section> : null}

          {journeyStops.length ? <div className="plan-journey" aria-label={`Trip route from ${canonicalStart.name} to ${journeyStops[journeyStops.length - 1].destination.name}`}>
            <div className="journey-point journey-start">
              <span><MapPin /></span><strong>Start</strong><small>{canonicalStart.name}</small>
            </div>
            {journeyStops.map((stop, index) => {
              const previewMode = JOURNEY_PREVIEW_MODES[index] ?? stop.transport.mode;
              return <div className={`journey-step journey-step-${index + 1}`} data-journey-leg={index + 1} key={stop.destination.id}>
                <div className={`journey-segment mode-${previewMode}`} aria-label={`${transportLabel(previewMode)} to ${stop.destination.name}`}>
                  <i className="journey-leg-line" />
                  <span className="journey-moving-icon"><TransportIcon mode={previewMode} /></span>
                </div>
                <div className={`journey-point ${index === journeyStops.length - 1 ? "journey-finish" : ""}`}>
                  <span>{index === journeyStops.length - 1 ? <Navigation /> : <MapPin />}</span>
                  <strong>{index === journeyStops.length - 1 ? "Finish" : `Stop ${index + 1}`}</strong>
                  <small>{stop.destination.name}</small>
                </div>
              </div>;
            })}
          </div> : null}
        </header>

        <div className="trip-metrics" aria-label="Itinerary summary">
          <article aria-label={`${itinerary.numberOfDays} travel ${itinerary.numberOfDays === 1 ? "day" : "days"}`}><div><i><CalendarDays /></i><strong>{itinerary.numberOfDays}</strong></div><span>Travel days</span></article>
          <article aria-label={`${itinerary.totals.scheduledStops} scheduled stops`}><div><i><MapPin /></i><strong>{itinerary.totals.scheduledStops}</strong></div><span>Scheduled stops</span></article>
          <article aria-label={`${formatDuration(itinerary.totals.travelMinutes)} estimated travel time`}><div><i><Clock3 /></i><strong>{formatDuration(itinerary.totals.travelMinutes)}</strong></div><span>Travel time</span></article>
          <article aria-label={`${totalFare} estimated transport fare`}><div><i><WalletCards /></i><strong>{totalFare}</strong></div><span>Transport</span></article>
        </div>
      </section>

      <section className="itinerary-day-selector" aria-label="Choose itinerary day">
        <header><div><span>DAILY ROUTE</span><strong>Choose a day</strong></div><small>Tap a day to see its agenda and map.</small></header>
        <div className="itinerary-day-tabs" role="tablist">
          {itinerary.days.map((item) => (
            <button
              key={item.index}
              type="button"
              role="tab"
              aria-selected={item.index === activeDay}
              className={item.index === activeDay ? "active" : ""}
              onClick={() => onActiveDayChange(item.index)}
            >
              <span>Day {item.index + 1}</span>
              <strong>{itinerary.date ? formatDayDate(itinerary.date, item.index) : `Route ${item.index + 1}`}</strong>
              <small>{item.items.filter((stop) => stop.kind === "destination").length} places · {item.items.filter(isComfortStop).length} breaks</small>
            </button>
          ))}
        </div>
      </section>

      <div className="generated-results-grid">
        <article className="route-panel-rich">
          <header className="panel-heading-rich">
            <div><small>STEP-BY-STEP ROUTE</small><h2>Your day at a glance</h2></div>
            <span>Planning estimate</span>
          </header>

          {day?.notices.length ? (
            <div className="route-notices">
              {day.notices.map((notice) => <p key={notice}><AlertTriangle size={16} /> {notice}</p>)}
            </div>
          ) : null}

          {day?.items.length ? (
            <div className="route-timeline-rich">
              {day.items.map((stop) => (
                <article className={`route-stop-rich ${isComfortStop(stop) ? `comfort-route-stop ${stop.kind}` : stop.kind === "check-in" || stop.kind === "check-out" ? "stay-check-in-stop" : stop.kind === "bag-drop" || stop.kind === "bag-pickup" ? "luggage-route-stop" : stop.kind === "departure" ? "departure-stop" : ""}`} key={`${day.index}-${stop.destination.id}`}>
                  <div className="route-stop-time">{minutesToTime(stop.arrivalMinutes)}</div>
                  <div className="route-stop-marker">{stop.kind !== "destination" ? (stop.kind === "meal" ? <Utensils size={15} aria-hidden="true" /> : stop.kind === "rest" ? <Coffee size={15} aria-hidden="true" /> : stop.kind === "departure" ? <Route size={15} aria-hidden="true" /> : stop.kind === "bag-drop" || stop.kind === "bag-pickup" ? <BaggageClaim size={15} aria-hidden="true" /> : <BedDouble size={15} aria-hidden="true" />) : stop.number}</div>
                  <div className="route-stop-content">
                    <header>
                      <div>
                        <h3><span aria-hidden="true">{stop.destination.icon}</span> {stop.destination.name}</h3>
                        <p>{fixedStopMeta(stop, itinerary)}</p>
                      </div>
                      <span className="visit-time">{fixedStopLabel(stop)} {stop.destination.duration ? formatDuration(stop.destination.duration) : ""}</span>
                    </header>
                    <p className="stop-description">{stop.destination.description}</p>

                    {isComfortStop(stop) ? <section className={`comfort-break-card ${stop.kind}`} aria-label={stop.destination.name}>
                      <span>{stop.kind === "meal" ? <Utensils /> : <Coffee />}</span>
                      <div><strong>{stop.kind === "meal" ? "Meal time is protected" : "Pause before the next leg"}</strong><p>{stop.destination.description}</p><small>This block already counts toward the day&apos;s schedule.</small></div>
                    </section> : stop.stationary && stop.kind === "check-out" ? <section className="checkout-reminder-card" aria-label={`Checkout reminder for ${stop.destination.name}`}>
                      <span className="checkout-reminder-icon"><Clock3 /></span>
                      <div>
                        <strong>Checkout reminder</strong>
                        <p>You are already at your stay—no travel leg is needed. Pack up, return the key if needed, and check out without rushing.</p>
                        <small>We hope you enjoyed your stay in Baguio.</small>
                      </div>
                      <a href={stop.placeMapUrl} target="_blank" rel="noreferrer"><BedDouble size={14} /> Open saved stay <ExternalLink size={12} /></a>
                    </section> : <section className={`transport-card mode-${stop.transport.mode}`} aria-label={`Travel to ${stop.destination.name}`}>
                      <header>
                        <span className="transport-icon"><TransportIcon mode={stop.transport.mode} /></span>
                        <div><strong>{transportLabel(stop.transport.mode)} from {canonicalRouteLocation(stop.from).name}</strong><small>{stop.destination.routeGuide.modeLabel}</small></div>
                        <div className="transport-stats">
                          <span>{stop.distance.toFixed(1)} km {stop.transport.estimateSource !== "baguio-fallback" ? "routed" : "est."}</span>
                          <span>{formatDuration(stop.transport.minutes)}</span>
                          <span>{fareLabel(stop)}</span>
                        </div>
                      </header>
                      {stop.transport.durationRange ? <p className={`route-estimate-confidence confidence-${stop.transport.confidence ?? "low"}`}><Route size={14} /> <strong>{stop.transport.durationRange.minimum}–{stop.transport.durationRange.maximum} min</strong><span>{confidenceLabel(stop)} · {routeSourceLabel(stop)}</span></p> : null}
                      {stop.transport.mode === "jeepney" ? <p className="jeepney-fare-basis"><WalletCards size={14} /><span><strong>Safe budget: up to {formatCurrency(stop.transport.farePerPersonMaximum ?? stop.transport.farePerPerson)} each</strong> · based on the modern rate. A traditional jeepney may be about {formatCurrency(stop.transport.farePerPersonMinimum ?? stop.transport.farePerPerson)} each. Confirm the posted matrix.</span></p> : null}
                      {stop.transport.terrain ? <p className={`terrain-note terrain-${stop.transport.terrain.level}`}><Mountain size={14} /><span><strong>{stop.transport.terrain.level === "steep" ? "Steep walk" : stop.transport.terrain.level === "hilly" ? "Hilly walk" : "Gentle walk"}</strong> · {stop.transport.terrain.elevationGainMeters} m climb{stop.transport.terrain.warning ? ` — ${stop.transport.terrain.warning}` : ""}</span></p> : null}
                      {stop.transport.bufferMinutes > 0 ? <p className="travel-buffer-note"><ShieldCheck size={14} /> {stop.transport.mode === "jeepney" ? `${formatDuration(stop.transport.baseMinutes)} covers walking, queues, ride${(stop.transport.boardings ?? 1) > 1 ? "s, transfer" : ""}, and final access` : `${formatDuration(stop.transport.baseMinutes)} typical travel`} + {formatDuration(stop.transport.bufferMinutes)} traffic/loading allowance.</p> : null}
                      {stop.queueMinutes > 0 ? <p className="queue-note"><Clock3 size={14} /> {formatDuration(stop.queueMinutes)} is reserved for entrance, ticketing, or a short queue before the visit.</p> : null}
                      {stop.waitMinutes > 0 ? <p className="wait-note"><Clock3 size={14} /> {stop.kind === "destination" ? `Includes a ${formatDuration(stop.waitMinutes)} wait for opening.` : `${formatDuration(stop.waitMinutes)} is protected before this fixed-time agenda item.`}</p> : null}
                      {stop.transport.mode === "jeepney" && stop.transport.stages?.length ? <>
                        <JeepneyCommuteGuide stop={stop} className="desktop-commute-guide" />
                        <button type="button" className="mobile-commute-guide-button" onClick={(event) => { commuteGuideTriggerRef.current = event.currentTarget; setCommuteGuideStop(stop); }} aria-haspopup="dialog" aria-label={`Open commute guide to ${stop.destination.name}`}>
                          <span><BusFront aria-hidden="true" /></span>
                          <span><strong>Commute guide</strong><small>{stop.transport.stages.length} steps · {stop.transport.boardings ?? 1} {(stop.transport.boardings ?? 1) === 1 ? "boarding" : "boardings"}</small></span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      </> : <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>}
                      {stop.transport.mode === "jeepney" ? <p className="jeepney-road-warning"><AlertTriangle size={14} /> {stop.transport.routeReference?.disclaimer || JEEPNEY_ROAD_PATH_DISCLAIMER}</p> : null}
                      {stop.destination.navigation ? <p className="verified-pin-note"><ShieldCheck size={14} /> {stop.destination.navigation.entranceLabel} · pin reviewed {formatTripDate(stop.destination.navigation.verifiedAt)}</p> : null}
                      <div className="route-link-row">
                        {stop.transport.loadingMapUrl ? <a href={stop.transport.loadingMapUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> {stop.transport.mode === "jeepney" ? "Access / loading map" : "Loading area"} <ExternalLink size={12} /></a> : null}
                        {stop.transport.mode === "jeepney" ? <a href={stop.transport.legMapUrl} target="_blank" rel="noreferrer"><Navigation size={14} /> Road-path reference <ExternalLink size={12} /></a> : <a href={googleDirectionsUrl(canonicalRouteLocation(stop.from), stop.destination, stop.transport.mode)} target="_blank" rel="noreferrer"><Navigation size={14} /> Open this leg <ExternalLink size={12} /></a>}
                        <a href={stop.placeMapUrl} target="_blank" rel="noreferrer"><Route size={14} /> {stop.destination.navigation ? "Exact entrance" : stop.kind === "check-in" || stop.kind === "check-out" ? "Open saved stay" : stop.kind === "departure" ? "Open departure point" : "View place"} <ExternalLink size={12} /></a>
                      </div>
                    </section>}

                    {stop.gapSuggestions?.length ? <section className="gap-options-card"><strong><Coffee size={14} /> Use this protected gap gently</strong><ul>{stop.gapSuggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul></section> : null}

                    <section className="stop-ideas">
                      <strong>{stop.kind === "meal" ? <Utensils size={15} /> : stop.kind === "rest" ? <Coffee size={15} /> : stop.kind === "bag-drop" || stop.kind === "bag-pickup" ? <BaggageClaim size={15} /> : stop.kind !== "destination" ? <BedDouble size={15} /> : <Lightbulb size={15} />} {stop.kind === "meal" ? "A useful meal break" : stop.kind === "rest" ? "Reset without rushing" : stop.kind === "check-in" ? "Check-in checklist" : stop.kind === "check-out" ? "Checkout checklist" : stop.kind === "bag-drop" ? "Safe handoff checklist" : stop.kind === "bag-pickup" ? "Before leaving storage" : stop.kind === "departure" ? "Before leaving Baguio" : "Make the most of this stop"}</strong>
                      <ul>{stop.destination.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
                    </section>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-route-day"><Clock3 size={28} /><h3>No stops fit this day</h3><p>Edit your choices or increase the time available per day.</p></div>
          )}

          {day?.unscheduled.length ? (
            <details className="unscheduled-stops">
              <summary><AlertTriangle size={16} /> {day.unscheduled.length} selected {day.unscheduled.length === 1 ? "place needs" : "places need"} another time</summary>
              <div>{day.unscheduled.map((place) => <span key={place.id}>{place.name} · {place.open}–{place.close}</span>)}</div>
            </details>
          ) : null}

          {day?.index === itinerary.days.length - 1 ? <section className="itinerary-farewell">
            <span><Heart /></span>
            <div><small>INGAT SA BIYAHE</small><strong>Agyaman kami iti panagbisita yo ditoy Baguio. Agsubli kayo manen!</strong><p>Thank you for visiting Baguio. We hope to welcome you back again.</p></div>
          </section> : null}
        </article>

        <aside className="route-map-panel">
          <header className="panel-heading-rich">
            <div><small>GOOGLE MAPS</small><h2>See the route</h2></div>
            {routeLinks[0] ? <a href={routeLinks[0]} target="_blank" rel="noreferrer" aria-label="Open day route in Google Maps"><ExternalLink size={17} /></a> : null}
          </header>
          {firstStop ? (
            <>
              <div className="route-map-frame">
                <iframe
                  key={`${day.index}-${firstStop.destination.id}`}
                  src={firstStop.mapPreviewUrl}
                  title={`Map preview for ${firstStop.destination.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <span>Previewing Day {day.index + 1}. Open {routeLinks.length > 1 ? "each route part" : "the complete route"} to see every stop.</span>
              </div>
              <div className="route-map-actions">
                {routeLinks.map((url, index) => <a className={`button ${index === 0 ? "primary" : "secondary"}`} href={url} target="_blank" rel="noreferrer" key={url}><Navigation size={16} /> {routeLinks.length > 1 ? `Open route part ${index + 1} of ${routeLinks.length}` : `Open complete Day ${day.index + 1} route`}</a>)}
                <a className="button secondary" href={googleDirectionsUrl(canonicalRouteLocation(firstStop.from), firstStop.destination, firstStop.transport.mode)} target="_blank" rel="noreferrer">Navigate to first stop</a>
              </div>
            </>
          ) : <div className="map-empty"><MapPin size={28} /><p>No map route for this day yet.</p></div>}
          <p className="route-map-note">Google Maps may use your device location when the route opens. Longer days are divided into mobile-safe route parts so no later stop is dropped. Confirm live traffic, jeepney loading points, and temporary road changes locally.</p>
        </aside>
      </div>

      <div className="planning-disclaimer"><WalletCards size={17} /><p><strong>Planning note:</strong> {itinerary.disclaimer}</p></div>
      <footer className="itinerary-action-dock" aria-label="Itinerary actions">
        <div>
          {variant === "owned" ? <button type="button" className="result-action icon-only" onClick={onEdit} aria-label="Edit itinerary choices" title="Edit choices"><Pencil /></button> : null}
          <button type="button" className="result-action icon-only" onClick={copyPlan} aria-label={copied ? "Itinerary copied" : "Copy itinerary"} title={copied ? "Copied" : "Copy itinerary"}>{copied ? <Check /> : <Copy />}</button>
          {variant === "owned" ? <button type="button" className="result-action icon-only share" onClick={() => setShareOpen(true)} aria-label="Share itinerary" title="Share itinerary"><Share2 /></button> : null}
          <button type="button" className="result-action icon-only strong" onClick={printPlan} aria-label="Print or save itinerary as PDF" title="Print / Save PDF"><Printer /></button>
        </div>
        {variant === "owned" ? <button type="button" className={`result-action save ${saved ? "saved" : ""}`} onClick={onSave}>{saved ? <Check /> : <Save />} <span>{saved ? "Saved to Home" : "Save to Home"}</span></button> : <Link href="/" className="result-action save saved"><Check /> <span>Saved on Home</span></Link>}
      </footer>
      <section className="print-itinerary" aria-hidden="true">
        <header>
          <div className="print-brand"><img src="/assets/img/favicon.svg" alt="" /><strong>Baguio Buddy</strong><span>{variant === "shared" ? "Shared route" : "Personal itinerary"}</span></div>
          <h1>{itinerary.title}</h1>
          <p>Starting point: {canonicalStart.name}</p>
          {canonicalStart.terminalIdentity ? <div className="print-terminal-identity"><p><strong>{canonicalStart.terminalIdentity.branchLabel} — {canonicalStart.terminalIdentity.officialName}</strong></p><p>{canonicalStart.terminalIdentity.address}</p><p>Coordinates: {canonicalStart.lat.toFixed(5)}, {canonicalStart.lng.toFixed(5)}</p><p><strong>Ticket reminder:</strong> {canonicalStart.terminalIdentity.warning}</p></div> : null}
          {itinerary.stay ? <><p>Stay: {itinerary.stay.name} · {itinerary.stay.kind === "hotel" ? "Hotel" : "Airbnb"} · Check-in Day {itinerary.stay.checkInDay + 1} at {minutesToTime(parseTimeToMinutes(itinerary.stay.checkInTime) ?? 0)} · Checkout Day {(itinerary.stay.checkOutDay ?? itinerary.numberOfDays - 1) + 1} at {minutesToTime(parseTimeToMinutes(itinerary.stay.checkOutTime || "11:00") ?? 660)}</p><p>Luggage: {arrivalLuggagePlanLabel(getArrivalLuggagePlan(itinerary.stay))} · {checkoutLuggagePlanLabel(getCheckoutLuggagePlan(itinerary.stay))}</p></> : null}
          <p>Pacing safeguards are automatic · meal, rest, queue, and commute allowances included</p>
          <p>{itinerary.date ? `Trip date: ${formatTripDate(itinerary.date)} · ` : ""}{itinerary.totals.scheduledStops} stops · {formatDuration(itinerary.totals.travelMinutes)} travel · {totalFare} transport</p>
          {itinerary.modes.includes("jeepney") ? <p><strong>Jeepney fare basis:</strong> Safe budget uses the modern-jeepney ceiling; traditional jeepneys may cost less. {farePolicy.effectiveLabel} · source reviewed {farePolicy.reviewedLabel}. {farePolicy.verificationNote} <a href={farePolicy.sourceUrl}>Fare source</a></p> : null}
          {canonicalDeparture?.terminalIdentity ? <div className="print-terminal-identity departure"><p><strong>Departure: {canonicalDeparture.terminalIdentity.branchLabel} — {canonicalDeparture.terminalIdentity.officialName}</strong></p><p>{canonicalDeparture.terminalIdentity.address}</p><p>Coordinates: {canonicalDeparture.lat.toFixed(5)}, {canonicalDeparture.lng.toFixed(5)}</p><p><strong>Ticket reminder:</strong> {canonicalDeparture.terminalIdentity.warning}</p></div> : null}
        </header>
        {currentItinerary.days.map((printDay) => (
          <article key={printDay.index}>
            <h2>Day {printDay.index + 1}{itinerary.date ? ` · ${formatDayDate(itinerary.date, printDay.index)}` : ""}</h2>
            {printDay.notices.map((notice) => <p className="print-notice" key={notice}>Note: {notice}</p>)}
            {printDay.items.map((stop) => (
              <section key={stop.destination.id}>
                <h3>{stop.number}. {minutesToTime(stop.arrivalMinutes)} — {stop.destination.name}</h3>
                <p className="print-place-meta">{fixedStopMeta(stop, itinerary)}{stop.destination.duration ? ` · ${formatDuration(stop.destination.duration)}` : ""}</p>
                {isComfortStop(stop) ? <p className="print-leg"><strong>{stop.kind === "meal" ? "Protected meal time" : "Protected recovery time"}:</strong> {stop.destination.description}</p> : stop.stationary && stop.kind === "check-out" ? <p className="print-leg"><strong>Checkout reminder:</strong> You are already at your stay. Pack up, return the key if needed, and check out without rushing. We hope you enjoyed your stay in Baguio.</p> : <>
                  <p className="print-leg"><strong>{transportLabel(stop.transport.mode)} from {canonicalRouteLocation(stop.from).name}</strong> · {stop.distance.toFixed(1)} km · {formatDuration(stop.transport.minutes)} · {fareLabel(stop)}</p>
                  {stop.transport.mode === "jeepney" ? <p className="print-leg"><strong>Fare basis:</strong> Safe budget up to {formatCurrency(stop.transport.farePerPersonMaximum ?? stop.transport.farePerPerson)} each using the modern rate; the traditional estimate is about {formatCurrency(stop.transport.farePerPersonMinimum ?? stop.transport.farePerPerson)} each. {farePolicy.effectiveLabel}. Confirm the posted fare matrix.</p> : null}
                  {stop.transport.durationRange ? <p className="print-leg"><strong>Planning range:</strong> {stop.transport.durationRange.minimum}–{stop.transport.durationRange.maximum} min · {confidenceLabel(stop)} · {routeSourceLabel(stop)}.</p> : null}
                  {stop.transport.terrain ? <p className="print-leg"><strong>Terrain:</strong> {stop.transport.terrain.level} · {stop.transport.terrain.elevationGainMeters} m climb{stop.transport.terrain.warning ? ` · ${stop.transport.terrain.warning}` : ""}</p> : null}
                  {stop.transport.bufferMinutes > 0 ? <p className="print-leg">Travel estimate includes {formatDuration(stop.transport.bufferMinutes)} for traffic/loading uncertainty.</p> : null}
                  {stop.queueMinutes > 0 ? <p className="print-leg">Queue allowance: {formatDuration(stop.queueMinutes)}.</p> : null}
                  {stop.transport.mode === "jeepney" && stop.transport.stages?.length ? <div className="print-jeepney-commute"><p><strong>Complete jeepney commute · {stop.transport.boardings ?? 1} {(stop.transport.boardings ?? 1) === 1 ? "boarding" : "boardings"}</strong></p><ol>{stop.transport.stages.map((stage) => <li key={`${stage.kind}-${stage.label}`}><strong>{stage.label} ({formatDuration(stage.minutes)}):</strong> {stage.detail}{stage.mapUrl ? <> — <a href={stage.mapUrl}>{stage.mapLabel || "Map"}</a></> : null}</li>)}</ol>{stop.transport.routeReference ? <p><strong>Route reference:</strong> {stop.transport.routeReference.name}{stop.transport.routeReference.serviceHours ? ` · ${stop.transport.routeReference.serviceHours}` : ""}<br /><a href={stop.transport.routeReference.sourceUrl}>Baguio City route directory</a><br /><strong>Map warning:</strong> {stop.transport.routeReference.disclaimer}</p> : null}</div> : null}
                  {stop.transport.mode !== "jeepney" || !stop.transport.stages?.length ? <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol> : null}
                  <p className="print-map-link"><a href={stop.transport.mode === "jeepney" ? stop.transport.legMapUrl : googleDirectionsUrl(canonicalRouteLocation(stop.from), stop.destination, stop.transport.mode)}>{stop.transport.mode === "jeepney" ? "Open road-path reference in Google Maps" : "Open this leg in Google Maps"}</a></p>
                </>}
                {stop.gapSuggestions?.length ? <ul>{stop.gapSuggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul> : null}
              </section>
            ))}
            {printDay.index === itinerary.days.length - 1 ? <p className="print-farewell"><strong>Agyaman kami iti panagbisita yo ditoy Baguio. Agsubli kayo manen!</strong><br />Thank you for visiting Baguio. We hope to welcome you back again.</p> : null}
          </article>
        ))}
        <footer>{itinerary.disclaimer}</footer>
      </section>
      {commuteGuideStop ? <div className="commute-guide-backdrop" role="presentation" onClick={() => setCommuteGuideStop(null)}>
        <section className="commute-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="commute-guide-title" onClick={(event) => event.stopPropagation()}>
          <header className="commute-guide-sheet-header">
            <div><small>COMMUTE GUIDE</small><h2 id="commute-guide-title">To {commuteGuideStop.destination.name}</h2><p>Follow each stage in order and confirm the loading point on site.</p></div>
            <button ref={commuteGuideCloseRef} type="button" onClick={() => setCommuteGuideStop(null)} aria-label="Close commute guide"><X /></button>
          </header>
          <JeepneyCommuteGuide stop={commuteGuideStop} className="commute-guide-sheet-content" />
        </section>
      </div> : null}
      {variant === "owned" ? <ItineraryShareDialog itinerary={currentItinerary} open={shareOpen} onClose={() => setShareOpen(false)} /> : null}
    </section>
  );
}
