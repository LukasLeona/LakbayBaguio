"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BusFront,
  Car,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Footprints,
  Lightbulb,
  MapPin,
  Navigation,
  Pencil,
  Printer,
  Route,
  Save,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import {
  formatCurrency,
  formatDayDate,
  formatDuration,
  formatTripDate,
  itineraryToText,
  minutesToTime,
  transportLabel,
  type PlannedItinerary,
  type PlannedStop,
  type TransportMode,
} from "@/lib/planner-engine";

type ItineraryResultsProps = {
  itinerary: PlannedItinerary;
  activeDay: number;
  saved: boolean;
  onActiveDayChange: (day: number) => void;
  onEdit: () => void;
  onSave: () => void;
};

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

export function ItineraryResults({
  itinerary,
  activeDay,
  saved,
  onActiveDayChange,
  onEdit,
  onSave,
}: ItineraryResultsProps) {
  const [copied, setCopied] = useState(false);
  const day = itinerary.days[activeDay] ?? itinerary.days[0];
  const firstStop = day?.items[0];

  async function copyPlan() {
    const value = itineraryToText(itinerary);
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

  return (
    <section className="generated-plan" id="itinerary-result" aria-labelledby="generated-plan-title">
      <header className="generated-plan-header">
        <div>
          <span className="result-kicker"><i /> Your generated plan</span>
          <h1 id="generated-plan-title">{itinerary.title}</h1>
          <p>
            {itinerary.totals.scheduledStops} scheduled stops from {itinerary.start.name}
            {itinerary.date ? ` beginning ${formatTripDate(itinerary.date)}` : ""}.
          </p>
        </div>
        <div className="generated-plan-actions" aria-label="Itinerary actions">
          <button type="button" className="result-action" onClick={onEdit}><Pencil size={16} /> Edit choices</button>
          <button type="button" className="result-action" onClick={copyPlan}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy plan"}
          </button>
          <button type="button" className="result-action strong" onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>
          <button type="button" className={`result-action save ${saved ? "saved" : ""}`} onClick={onSave}>
            {saved ? <Check size={16} /> : <Save size={16} />} {saved ? "Saved to Home" : "Save as pending"}
          </button>
        </div>
      </header>

      <div className="trip-metrics" aria-label="Itinerary summary">
        <article><span>Travel days</span><strong>{itinerary.numberOfDays}</strong></article>
        <article><span>Scheduled stops</span><strong>{itinerary.totals.scheduledStops}</strong></article>
        <article><span>Estimated travel</span><strong>{formatDuration(itinerary.totals.travelMinutes)}</strong></article>
        <article><span>Estimated transport</span><strong>{formatCurrency(itinerary.totals.fare)}</strong></article>
      </div>

      <div className="itinerary-day-tabs" role="tablist" aria-label="Choose itinerary day">
        {itinerary.days.map((item) => (
          <button
            key={item.index}
            type="button"
            role="tab"
            aria-selected={item.index === activeDay}
            className={item.index === activeDay ? "active" : ""}
            onClick={() => onActiveDayChange(item.index)}
          >
            Day {item.index + 1}
            {itinerary.date ? ` · ${formatDayDate(itinerary.date, item.index)}` : ""}
            <small>{item.items.length} {item.items.length === 1 ? "stop" : "stops"}</small>
          </button>
        ))}
      </div>

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
                <article className="route-stop-rich" key={`${day.index}-${stop.destination.id}`}>
                  <div className="route-stop-time">{minutesToTime(stop.arrivalMinutes)}</div>
                  <div className="route-stop-marker">{stop.number}</div>
                  <div className="route-stop-content">
                    <header>
                      <div>
                        <h3><span aria-hidden="true">{stop.destination.icon}</span> {stop.destination.name}</h3>
                        <p>{stop.destination.area} · {stop.destination.category}</p>
                      </div>
                      <span className="visit-time">Visit {formatDuration(stop.destination.duration)}</span>
                    </header>
                    <p className="stop-description">{stop.destination.description}</p>

                    <section className={`transport-card mode-${stop.transport.mode}`} aria-label={`Travel to ${stop.destination.name}`}>
                      <header>
                        <span className="transport-icon"><TransportIcon mode={stop.transport.mode} /></span>
                        <div><strong>{transportLabel(stop.transport.mode)} from {stop.from.name}</strong><small>{stop.destination.routeGuide.modeLabel}</small></div>
                        <div className="transport-stats">
                          <span>{stop.distance.toFixed(1)} km est.</span>
                          <span>{formatDuration(stop.transport.minutes)}</span>
                          <span>{fareLabel(stop)}</span>
                        </div>
                      </header>
                      {stop.waitMinutes > 0 ? <p className="wait-note"><Clock3 size={14} /> Includes a {formatDuration(stop.waitMinutes)} wait for opening.</p> : null}
                      <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
                      <div className="route-link-row">
                        {stop.transport.loadingMapUrl ? <a href={stop.transport.loadingMapUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> Loading area <ExternalLink size={12} /></a> : null}
                        <a href={stop.transport.legMapUrl} target="_blank" rel="noreferrer"><Navigation size={14} /> Open this leg <ExternalLink size={12} /></a>
                        <a href={stop.placeMapUrl} target="_blank" rel="noreferrer"><Route size={14} /> View place <ExternalLink size={12} /></a>
                      </div>
                    </section>

                    <section className="stop-ideas">
                      <strong><Lightbulb size={15} /> Make the most of this stop</strong>
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
        </article>

        <aside className="route-map-panel">
          <header className="panel-heading-rich">
            <div><small>GOOGLE MAPS</small><h2>See the route</h2></div>
            {day?.routeMapUrl ? <a href={day.routeMapUrl} target="_blank" rel="noreferrer" aria-label="Open day route in Google Maps"><ExternalLink size={17} /></a> : null}
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
                <span>Previewing Day {day.index + 1}. Open the complete route to see every stop.</span>
              </div>
              <div className="route-map-actions">
                <a className="button primary" href={day.routeMapUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> Open complete Day {day.index + 1} route</a>
                <a className="button secondary" href={firstStop.transport.legMapUrl} target="_blank" rel="noreferrer">Navigate to first stop</a>
              </div>
            </>
          ) : <div className="map-empty"><MapPin size={28} /><p>No map route for this day yet.</p></div>}
          <p className="route-map-note">Google Maps may use your device location when the route opens. Confirm live traffic, jeepney loading points, and temporary road changes locally.</p>
        </aside>
      </div>

      <div className="planning-disclaimer"><WalletCards size={17} /><p><strong>Planning note:</strong> {itinerary.disclaimer}</p></div>
      <section className="print-itinerary" aria-hidden="true">
        <header>
          <h1>{itinerary.title}</h1>
          <p>Starting point: {itinerary.start.name}</p>
          <p>{itinerary.date ? `Trip date: ${formatTripDate(itinerary.date)} · ` : ""}{itinerary.totals.scheduledStops} stops · {formatDuration(itinerary.totals.travelMinutes)} travel · {formatCurrency(itinerary.totals.fare)} transport</p>
        </header>
        {itinerary.days.map((printDay) => (
          <article key={printDay.index}>
            <h2>Day {printDay.index + 1}{itinerary.date ? ` · ${formatDayDate(itinerary.date, printDay.index)}` : ""}</h2>
            {printDay.notices.map((notice) => <p className="print-notice" key={notice}>Note: {notice}</p>)}
            {printDay.items.map((stop) => (
              <section key={stop.destination.id}>
                <h3>{stop.number}. {minutesToTime(stop.arrivalMinutes)} — {stop.destination.name}</h3>
                <p>{transportLabel(stop.transport.mode)} from {stop.from.name} · {stop.distance.toFixed(1)} km · {formatDuration(stop.transport.minutes)} · {fareLabel(stop)}</p>
                <ol>{stop.transport.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
              </section>
            ))}
          </article>
        ))}
        <footer>{itinerary.disclaimer}</footer>
      </section>
      {saved ? <div className="saved-home-link"><Check size={16} /> Pending itinerary saved. <Link href="/">View it on Home</Link></div> : null}
    </section>
  );
}
