"use client";

import {
  AlertTriangle,
  BaggageClaim,
  BedDouble,
  BusFront,
  CalendarDays,
  Car,
  Check,
  Clock3,
  Coffee,
  Copy,
  ExternalLink,
  Footprints,
  Heart,
  Lightbulb,
  MapPin,
  Navigation,
  Pencil,
  Printer,
  Route,
  Save,
  Share2,
  ShieldCheck,
  Utensils,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ItineraryShareDialog } from "@/components/itinerary-share-dialog";
import { getPlannerStartLocationById } from "@/lib/planner-data";
import {
  arrivalLuggagePlanLabel,
  buildDayRouteUrls,
  checkoutLuggagePlanLabel,
  formatCurrency,
  formatDayDate,
  formatDuration,
  formatTripDate,
  googleDirectionsUrl,
  getArrivalLuggagePlan,
  getCheckoutLuggagePlan,
  itineraryToText,
  minutesToTime,
  parseTimeToMinutes,
  transportLabel,
  type PlannedItinerary,
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
    return `${formatCurrency(stop.transport.farePerPerson)} each · ${formatCurrency(stop.transport.totalFare)} total`;
  }
  return `${formatCurrency(stop.transport.vehicleFare)} per vehicle`;
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
  if (stop.kind === "bag-drop") return "Confirmed luggage handoff";
  if (stop.kind === "bag-pickup") return "Return for stored luggage";
  return `${stop.destination.area} · ${stop.destination.category}`;
}

function isComfortStop(stop: PlannedStop) {
  return stop.kind === "meal" || stop.kind === "rest";
}

function canonicalRouteLocation(location: PlannerLocation): PlannerLocation {
  return location.id ? getPlannerStartLocationById(location.id) ?? location : location;
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
  const day = itinerary.days[activeDay] ?? itinerary.days[0];
  const firstStop = day?.items.find((item) => item.kind === "destination")
    ?? day?.items.find((item) => item.kind === "departure")
    ?? day?.items[0];
  const canonicalStart = getPlannerStartLocationById(itinerary.start.id) ?? itinerary.start;
  const currentItinerary = canonicalStart === itinerary.start
    ? itinerary
    : { ...itinerary, start: canonicalStart };
  const dayRouteStart = firstStop
    ? canonicalRouteLocation(firstStop.from)
    : canonicalStart;
  const routeLinks = day ? buildDayRouteUrls(dayRouteStart, day) : [];
  const allJourneyStops = [...new Map(
    itinerary.days
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
          <article aria-label={`${formatCurrency(itinerary.totals.fare)} estimated transport fare`}><div><i><WalletCards /></i><strong>{formatCurrency(itinerary.totals.fare)}</strong></div><span>Transport</span></article>
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
                          <span>{stop.distance.toFixed(1)} km est.</span>
                          <span>{formatDuration(stop.transport.minutes)}</span>
                          <span>{fareLabel(stop)}</span>
                        </div>
                      </header>
                      {stop.transport.bufferMinutes > 0 ? <p className="travel-buffer-note"><ShieldCheck size={14} /> {formatDuration(stop.transport.baseMinutes)} typical travel + {formatDuration(stop.transport.bufferMinutes)} traffic/loading allowance.</p> : null}
                      {stop.queueMinutes > 0 ? <p className="queue-note"><Clock3 size={14} /> {formatDuration(stop.queueMinutes)} is reserved for entrance, ticketing, or a short queue before the visit.</p> : null}
                      {stop.waitMinutes > 0 ? <p className="wait-note"><Clock3 size={14} /> {stop.kind === "destination" ? `Includes a ${formatDuration(stop.waitMinutes)} wait for opening.` : `${formatDuration(stop.waitMinutes)} is protected before this fixed-time agenda item.`}</p> : null}
                      <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
                      {stop.destination.navigation ? <p className="verified-pin-note"><ShieldCheck size={14} /> {stop.destination.navigation.entranceLabel} · pin reviewed {formatTripDate(stop.destination.navigation.verifiedAt)}</p> : null}
                      <div className="route-link-row">
                        {stop.transport.loadingMapUrl ? <a href={stop.transport.loadingMapUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> Loading area <ExternalLink size={12} /></a> : null}
                        <a href={googleDirectionsUrl(canonicalRouteLocation(stop.from), stop.destination, stop.transport.mode)} target="_blank" rel="noreferrer"><Navigation size={14} /> Open this leg <ExternalLink size={12} /></a>
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
          {itinerary.stay ? <><p>Stay: {itinerary.stay.name} · {itinerary.stay.kind === "hotel" ? "Hotel" : "Airbnb"} · Check-in Day {itinerary.stay.checkInDay + 1} at {minutesToTime(parseTimeToMinutes(itinerary.stay.checkInTime) ?? 0)} · Checkout Day {(itinerary.stay.checkOutDay ?? itinerary.numberOfDays - 1) + 1} at {minutesToTime(parseTimeToMinutes(itinerary.stay.checkOutTime || "11:00") ?? 660)}</p><p>Luggage: {arrivalLuggagePlanLabel(getArrivalLuggagePlan(itinerary.stay))} · {checkoutLuggagePlanLabel(getCheckoutLuggagePlan(itinerary.stay))}</p></> : null}
          <p>Pace: {itinerary.pace === "relaxed" ? "Relaxed" : itinerary.pace === "packed" ? "Packed" : "Comfortable"} · meal, rest, queue, and commute allowances included</p>
          <p>{itinerary.date ? `Trip date: ${formatTripDate(itinerary.date)} · ` : ""}{itinerary.totals.scheduledStops} stops · {formatDuration(itinerary.totals.travelMinutes)} travel · {formatCurrency(itinerary.totals.fare)} transport</p>
        </header>
        {itinerary.days.map((printDay) => (
          <article key={printDay.index}>
            <h2>Day {printDay.index + 1}{itinerary.date ? ` · ${formatDayDate(itinerary.date, printDay.index)}` : ""}</h2>
            {printDay.notices.map((notice) => <p className="print-notice" key={notice}>Note: {notice}</p>)}
            {printDay.items.map((stop) => (
              <section key={stop.destination.id}>
                <h3>{stop.number}. {minutesToTime(stop.arrivalMinutes)} — {stop.destination.name}</h3>
                <p className="print-place-meta">{fixedStopMeta(stop, itinerary)}{stop.destination.duration ? ` · ${formatDuration(stop.destination.duration)}` : ""}</p>
                {isComfortStop(stop) ? <p className="print-leg"><strong>{stop.kind === "meal" ? "Protected meal time" : "Protected recovery time"}:</strong> {stop.destination.description}</p> : stop.stationary && stop.kind === "check-out" ? <p className="print-leg"><strong>Checkout reminder:</strong> You are already at your stay. Pack up, return the key if needed, and check out without rushing. We hope you enjoyed your stay in Baguio.</p> : <>
                  <p className="print-leg"><strong>{transportLabel(stop.transport.mode)} from {canonicalRouteLocation(stop.from).name}</strong> · {stop.distance.toFixed(1)} km · {formatDuration(stop.transport.minutes)} · {fareLabel(stop)}</p>
                  {stop.transport.bufferMinutes > 0 ? <p className="print-leg">Travel estimate includes {formatDuration(stop.transport.bufferMinutes)} for traffic/loading uncertainty.</p> : null}
                  {stop.queueMinutes > 0 ? <p className="print-leg">Queue allowance: {formatDuration(stop.queueMinutes)}.</p> : null}
                  <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
                  <p className="print-map-link"><a href={googleDirectionsUrl(canonicalRouteLocation(stop.from), stop.destination, stop.transport.mode)}>Open this leg in Google Maps</a></p>
                </>}
                {stop.gapSuggestions?.length ? <ul>{stop.gapSuggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul> : null}
              </section>
            ))}
            {printDay.index === itinerary.days.length - 1 ? <p className="print-farewell"><strong>Agyaman kami iti panagbisita yo ditoy Baguio. Agsubli kayo manen!</strong><br />Thank you for visiting Baguio. We hope to welcome you back again.</p> : null}
          </article>
        ))}
        <footer>{itinerary.disclaimer}</footer>
      </section>
      {variant === "owned" ? <ItineraryShareDialog itinerary={currentItinerary} open={shareOpen} onClose={() => setShareOpen(false)} /> : null}
    </section>
  );
}
