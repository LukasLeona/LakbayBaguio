"use client";

import {
  AlertTriangle,
  BaggageClaim,
  BedDouble,
  CalendarCheck,
  Check,
  Clock3,
  Coffee,
  GripVertical,
  LoaderCircle,
  MapPin,
  MoveRight,
  Pencil,
  Route,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  arrivalLuggagePlanLabel,
  checkoutLuggagePlanLabel,
  formatDuration,
  getArrivalLuggagePlan,
  getCheckoutLuggagePlan,
  minutesToTime,
  type ItineraryMoveEvaluation,
  type PlannedItinerary,
  type PlannedStop,
} from "@/lib/planner-engine";

type ItineraryReviewDialogProps = {
  itinerary: PlannedItinerary;
  confirming: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onDefer: (destinationId: string) => void;
  onDelete: (destinationId: string) => void;
  onEvaluateMove: (destinationId: string, targetDayIndex: number) => ItineraryMoveEvaluation;
  onMove: (destinationId: string, targetDayIndex: number) => ItineraryMoveEvaluation;
};

type MovingPlace = {
  id: string;
  name: string;
  sourceDay: number | null;
};

type MoveFeedback = {
  tone: "success" | "error";
  text: string;
};

function stopLabel(stop: PlannedStop) {
  if (stop.kind === "meal") return "Protected meal break";
  if (stop.kind === "rest") return "Recovery break";
  if (stop.kind === "check-in") return "Check-in";
  if (stop.kind === "check-out") return "Checkout";
  if (stop.kind === "departure") return "Departure";
  if (stop.kind === "bag-drop") return "Luggage drop-off";
  if (stop.kind === "bag-pickup") return "Luggage pickup";
  return stop.destination.area;
}

function stopIcon(stop: PlannedStop) {
  if (stop.kind === "meal") return <Utensils size={14} />;
  if (stop.kind === "rest") return <Coffee size={14} />;
  if (stop.kind === "check-in" || stop.kind === "check-out") return <BedDouble size={14} />;
  if (stop.kind === "departure") return <Route size={14} />;
  if (stop.kind === "bag-drop" || stop.kind === "bag-pickup") return <BaggageClaim size={14} />;
  return <MapPin size={14} />;
}

export function ItineraryReviewDialog({
  itinerary,
  confirming,
  onConfirm,
  onEdit,
  onDefer,
  onDelete,
  onEvaluateMove,
  onMove,
}: ItineraryReviewDialogProps) {
  const [moving, setMoving] = useState<MovingPlace | null>(null);
  const [moveFeedback, setMoveFeedback] = useState<MoveFeedback | null>(null);
  const holdTimer = useRef<number | null>(null);
  const holdOrigin = useRef<{ x: number; y: number } | null>(null);
  const excluded = itinerary.days.flatMap((day) => day.unscheduled);
  const uniqueExcluded = [...new Map(excluded.map((place) => [place.id, place])).values()];
  const dayEffort = itinerary.days.map((day) => Math.max(0, day.endMinutes - day.startMinutes));
  const spread = dayEffort.length ? Math.max(...dayEffort) - Math.min(...dayEffort) : 0;
  const overloaded = uniqueExcluded.length > 0 || spread > 150;
  const moveOptions = useMemo(
    () => moving
      ? itinerary.days.map((day) => onEvaluateMove(moving.id, day.index))
      : [],
    [itinerary, moving, onEvaluateMove],
  );

  function clearHoldTimer() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    holdOrigin.current = null;
  }

  function beginMove(id: string, name: string, sourceDay: number | null) {
    clearHoldTimer();
    setMoving({ id, name, sourceDay });
    setMoveFeedback(null);
  }

  function scheduleLongPress(
    event: ReactPointerEvent<HTMLElement>,
    id: string,
    name: string,
    sourceDay: number | null,
  ) {
    if (event.pointerType === "mouse" || event.button !== 0) return;
    clearHoldTimer();
    holdOrigin.current = { x: event.clientX, y: event.clientY };
    holdTimer.current = window.setTimeout(() => {
      beginMove(id, name, sourceDay);
    }, 420);
  }

  function cancelLongPressOnMove(event: ReactPointerEvent<HTMLElement>) {
    if (!holdOrigin.current) return;
    if (
      Math.abs(event.clientX - holdOrigin.current.x) > 10 ||
      Math.abs(event.clientY - holdOrigin.current.y) > 10
    ) {
      clearHoldTimer();
    }
  }

  function startDrag(
    event: DragEvent<HTMLElement>,
    id: string,
    name: string,
    sourceDay: number | null,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    beginMove(id, name, sourceDay);
  }

  function finishMove(targetDayIndex: number) {
    if (!moving) return;
    const evaluation = onMove(moving.id, targetDayIndex);
    setMoveFeedback({
      tone: evaluation.allowed ? "success" : "error",
      text: evaluation.reason,
    });
    if (evaluation.allowed) setMoving(null);
  }

  function dayMoveState(dayIndex: number) {
    if (!moving) return "";
    if (moveOptions[dayIndex]?.allowed) return "move-allowed";
    if (moving.sourceDay === dayIndex) return "move-current";
    return "move-blocked";
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (moving) {
        setMoving(null);
        setMoveFeedback(null);
      } else if (!confirming) {
        onEdit();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      clearHoldTimer();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [confirming, moving, onEdit]);

  return (
    <div className="itinerary-review-backdrop" role="presentation" onMouseDown={(event) => { if (!confirming && event.target === event.currentTarget) onEdit(); }}>
      <section className={`itinerary-review-dialog ${confirming ? "is-confirming" : ""}`} role="dialog" aria-modal="true" aria-labelledby="itinerary-review-title" aria-busy={confirming}>
        <header className="itinerary-review-header">
          <div>
            <span><CalendarCheck size={15} /> BEFORE WE LOCK IT IN</span>
            <h2 id="itinerary-review-title">Your Baguio route, at a glance</h2>
            <p>Check the pace and areas first. Nothing is saved until you approve this version.</p>
          </div>
          <button type="button" onClick={onEdit} disabled={confirming} aria-label="Close preview and edit choices"><X /></button>
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

        {itinerary.stay ? <section className="review-luggage-plan" aria-label="Confirmed luggage plan">
          <BaggageClaim />
          <div><strong>Your luggage route is accounted for</strong><span><b>Before check-in:</b> {arrivalLuggagePlanLabel(getArrivalLuggagePlan(itinerary.stay))}</span><span><b>After checkout:</b> {checkoutLuggagePlanLabel(getCheckoutLuggagePlan(itinerary.stay))}</span></div>
        </section> : null}

        <section className="review-pace-plan" aria-label="Itinerary pacing safeguards">
          <Clock3 />
          <div><strong>{itinerary.pace === "relaxed" ? "Relaxed" : itinerary.pace === "packed" ? "Packed" : "Comfortable"} pace is built into the schedule</strong><span>Meal and recovery blocks are real agenda time. Attraction queues and traffic/loading allowances are included before deciding what fits.</span></div>
        </section>

        <div className={`review-move-guide ${moving ? "active" : ""}`}>
          <GripVertical />
          <div>
            <strong>{moving ? `Moving ${moving.name}` : "Fine-tune this route"}</strong>
            <p>{moving
              ? "Green days can take this stop. Tap Move here, or drop it on a green card."
              : "Drag a place on desktop, or press and hold on mobile. Fixed hotel and departure times stay locked."}</p>
          </div>
          {moving ? <button type="button" onClick={() => setMoving(null)}>Cancel</button> : null}
        </div>

        {moveFeedback ? <div className={`review-move-feedback ${moveFeedback.tone}`} role="status">{moveFeedback.text}</div> : null}

        <div className="review-day-grid">
          {itinerary.days.map((day) => {
            const areas = [...new Set(day.items.filter((item) => item.kind === "destination").map((item) => item.destination.area))];
            const placeCount = day.items.filter((item) => item.kind === "destination").length;
            const comfortCount = day.items.filter((item) => item.kind === "meal" || item.kind === "rest").length;
            const moveOption = moveOptions[day.index];
            return (
              <article
                className={`review-day-card ${dayMoveState(day.index)}`}
                key={day.index}
                onDragOver={(event) => { if (moving) { event.preventDefault(); event.dataTransfer.dropEffect = moveOption?.allowed ? "move" : "none"; } }}
                onDrop={(event) => { event.preventDefault(); finishMove(day.index); }}
              >
                <header>
                  <div><small>DAY {day.index + 1}</small><strong>{placeCount} {placeCount === 1 ? "place" : "places"}{comfortCount ? ` · ${comfortCount} comfort ${comfortCount === 1 ? "break" : "breaks"}` : ""}</strong></div>
                  <div className="review-day-meta">
                    <span><Clock3 size={13} /> {minutesToTime(day.startMinutes)}–{minutesToTime(day.endMinutes)}</span>
                    {moving ? (
                      <button
                        type="button"
                        className={moveOption?.allowed ? "allowed" : "blocked"}
                        aria-disabled={!moveOption?.allowed}
                        title={moveOption?.reason}
                        onClick={() => finishMove(day.index)}
                      ><MoveRight /> {moveOption?.allowed ? "Move here" : moving.sourceDay === day.index ? "Current day" : "Doesn't fit"}</button>
                    ) : null}
                  </div>
                </header>
                {areas.length ? <p className="review-area-line"><MapPin size={13} /> {areas.join(" · ")}</p> : null}
                <ol>
                  {day.items.map((stop) => (
                    <li
                      className={`review-stop ${stop.kind} ${moving?.id === stop.destination.id ? "is-moving" : ""}`}
                      key={`${day.index}-${stop.destination.id}`}
                      draggable={stop.kind === "destination"}
                      aria-grabbed={stop.kind === "destination" ? moving?.id === stop.destination.id : undefined}
                      onDragStart={stop.kind === "destination" ? (event) => startDrag(event, stop.destination.id, stop.destination.name, day.index) : undefined}
                      onPointerDown={stop.kind === "destination" ? (event) => scheduleLongPress(event, stop.destination.id, stop.destination.name, day.index) : undefined}
                      onPointerMove={stop.kind === "destination" ? cancelLongPressOnMove : undefined}
                      onPointerUp={stop.kind === "destination" ? clearHoldTimer : undefined}
                      onPointerCancel={stop.kind === "destination" ? clearHoldTimer : undefined}
                    >
                      <span>{stopIcon(stop)}</span>
                      <div className="review-stop-copy"><strong>{stop.destination.name}</strong><small>{minutesToTime(stop.arrivalMinutes)} · {stopLabel(stop)}</small></div>
                      {stop.kind === "destination" ? <div className="review-stop-actions">
                        <button type="button" className="review-grab-button" onClick={() => beginMove(stop.destination.id, stop.destination.name, day.index)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Move ${stop.destination.name}`} title="Move to another day"><GripVertical /></button>
                        <button type="button" className="review-remove-button" onClick={() => onDefer(stop.destination.id)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Move ${stop.destination.name} out of Day ${day.index + 1}`} title="Move out of this day"><Trash2 /></button>
                      </div> : null}
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
            <header><AlertTriangle size={17} /><div><strong>These places need another time</strong><p>Add one back to its previous day, or test another day that can safely take it.</p></div></header>
            <div>{uniqueExcluded.map((place) => {
              const sourceDay = itinerary.days.find((day) => day.unscheduled.some((item) => item.id === place.id))?.index ?? null;
              return <article
                className={moving?.id === place.id ? "is-moving" : ""}
                key={place.id}
                draggable
                aria-grabbed={moving?.id === place.id}
                onDragStart={(event) => startDrag(event, place.id, place.name, sourceDay)}
                onPointerDown={(event) => scheduleLongPress(event, place.id, place.name, sourceDay)}
                onPointerMove={cancelLongPressOnMove}
                onPointerUp={clearHoldTimer}
                onPointerCancel={clearHoldTimer}
              >
                <span><strong>{place.name}</strong><small>{place.area} · {place.open}–{place.close}</small></span>
                <div className="review-excluded-actions">
                  <button type="button" className="review-grab-button" onClick={() => beginMove(place.id, place.name, sourceDay)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Add ${place.name} to a day`} title="Add back to a day"><GripVertical /></button>
                  <button type="button" className="review-remove-button" onClick={() => onDelete(place.id)} onPointerDown={(event) => event.stopPropagation()}><Trash2 size={14} /> Delete choice</button>
                </div>
              </article>;
            })}</div>
          </section>
        ) : null}

        <footer className="itinerary-review-actions">
          <button type="button" className="review-edit-button" onClick={onEdit} disabled={confirming}><Pencil /> Edit choices</button>
          <button type="button" className="review-confirm-button" onClick={onConfirm} disabled={confirming}>{confirming ? <LoaderCircle className="spin" /> : <Check />} {confirming ? "Finalizing itinerary…" : "Use this itinerary"}</button>
        </footer>
        {confirming ? <div className="review-finalizing" role="status" aria-live="polite"><LoaderCircle className="spin" /><strong>Finalizing your Baguio itinerary…</strong><span>Rechecking the route, schedule, and travel time.</span></div> : null}
      </section>
    </div>
  );
}
