"use client";

import {
  AlertTriangle,
  BedDouble,
  CalendarCheck,
  Check,
  Clock3,
  MapPin,
  Pencil,
  Route,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";
import {
  formatDuration,
  minutesToTime,
  type PlannedItinerary,
  type PlannedStop,
} from "@/lib/planner-engine";

type ItineraryReviewDialogProps = {
  itinerary: PlannedItinerary;
  onConfirm: () => void;
  onEdit: () => void;
  onRemove: (destinationId: string) => void;
};

function stopLabel(stop: PlannedStop) {
  if (stop.kind === "check-in") return "Check-in";
  if (stop.kind === "check-out") return "Checkout";
  if (stop.kind === "departure") return "Departure";
  return stop.destination.area;
}

function stopIcon(stop: PlannedStop) {
  if (stop.kind === "check-in" || stop.kind === "check-out") return <BedDouble size={14} />;
  if (stop.kind === "departure") return <Route size={14} />;
  return <MapPin size={14} />;
}

export function ItineraryReviewDialog({
  itinerary,
  onConfirm,
  onEdit,
  onRemove,
}: ItineraryReviewDialogProps) {
  const excluded = itinerary.days.flatMap((day) => day.unscheduled);
  const uniqueExcluded = [...new Map(excluded.map((place) => [place.id, place])).values()];
  const dayEffort = itinerary.days.map((day) => Math.max(0, day.endMinutes - day.startMinutes));
  const spread = dayEffort.length ? Math.max(...dayEffort) - Math.min(...dayEffort) : 0;
  const overloaded = uniqueExcluded.length > 0 || spread > 150;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEdit();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onEdit]);

  return (
    <div className="itinerary-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onEdit(); }}>
      <section className="itinerary-review-dialog" role="dialog" aria-modal="true" aria-labelledby="itinerary-review-title">
        <header className="itinerary-review-header">
          <div>
            <span><CalendarCheck size={15} /> BEFORE WE LOCK IT IN</span>
            <h2 id="itinerary-review-title">Your Baguio route, at a glance</h2>
            <p>Check the pace and areas first. Nothing is saved until you approve this version.</p>
          </div>
          <button type="button" onClick={onEdit} aria-label="Close preview and edit choices"><X /></button>
        </header>

        <div className={`review-health ${overloaded ? "warning" : "comfortable"}`}>
          {overloaded ? <AlertTriangle /> : <Check />}
          <div>
            <strong>{overloaded ? "A few choices need your attention" : "This route has a comfortable shape"}</strong>
            <p>{uniqueExcluded.length
              ? `${uniqueExcluded.length} selected ${uniqueExcluded.length === 1 ? "place does" : "places do"} not fit safely. You can accept the plan without them or edit your choices.`
              : spread > 150
                ? "One day is noticeably fuller than another because of opening hours or longer visits. Review the day cards below."
                : "Nearby places stay together, and fixed hotel times divide the route into practical segments."}</p>
          </div>
        </div>

        <div className="review-day-grid">
          {itinerary.days.map((day) => {
            const areas = [...new Set(day.items.filter((item) => item.kind === "destination").map((item) => item.destination.area))];
            return (
              <article className="review-day-card" key={day.index}>
                <header>
                  <div><small>DAY {day.index + 1}</small><strong>{day.items.length} agenda {day.items.length === 1 ? "item" : "items"}</strong></div>
                  <span><Clock3 size={13} /> {minutesToTime(day.startMinutes)}–{minutesToTime(day.endMinutes)}</span>
                </header>
                {areas.length ? <p className="review-area-line"><MapPin size={13} /> {areas.join(" · ")}</p> : null}
                <ol>
                  {day.items.map((stop) => (
                    <li className={`review-stop ${stop.kind}`} key={`${day.index}-${stop.destination.id}`}>
                      <span>{stopIcon(stop)}</span>
                      <div><strong>{stop.destination.name}</strong><small>{minutesToTime(stop.arrivalMinutes)} · {stopLabel(stop)}</small></div>
                      {stop.kind === "destination" ? <button type="button" onClick={() => onRemove(stop.destination.id)} aria-label={`Remove ${stop.destination.name}`} title="Remove and rebalance"><Trash2 /></button> : null}
                    </li>
                  ))}
                </ol>
                <footer><span>{formatDuration(day.totalTravelMinutes)} travel</span><span>{day.totalDistance.toFixed(1)} km estimated</span></footer>
              </article>
            );
          })}
        </div>

        {uniqueExcluded.length ? (
          <section className="review-excluded">
            <header><AlertTriangle size={17} /><div><strong>These places need another time</strong><p>They exceed the safe schedule or opening hours.</p></div></header>
            <div>{uniqueExcluded.map((place) => <article key={place.id}><span><strong>{place.name}</strong><small>{place.area} · {place.open}–{place.close}</small></span><button type="button" onClick={() => onRemove(place.id)}><Trash2 size={14} /> Remove</button></article>)}</div>
          </section>
        ) : null}

        <footer className="itinerary-review-actions">
          <button type="button" className="review-edit-button" onClick={onEdit}><Pencil /> Edit choices</button>
          <button type="button" className="review-confirm-button" onClick={onConfirm}><Check /> Use this itinerary</button>
        </footer>
      </section>
    </div>
  );
}
