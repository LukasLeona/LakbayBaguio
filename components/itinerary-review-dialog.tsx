"use client";

import {
  AlertTriangle,
  BaggageClaim,
  BedDouble,
  CalendarCheck,
  Check,
  ChevronDown,
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
  destinationId?: string;
  targetDayIndex?: number;
};

type ReviewDayIntensity = {
  level: "easy" | "balanced" | "full" | "attention";
  label: string;
};

function reviewDayIntensity(
  day: PlannedItinerary["days"][number],
  availableMinutes: number,
  hasRemainingPlaces: boolean,
): ReviewDayIntensity {
  const sightseeing = day.items.filter((item) => item.kind === "destination");
  const activeMinutes = sightseeing.reduce(
    (total, item) => total + item.transport.minutes + item.queueMinutes + item.destination.duration,
    0,
  );
  const placeCount = sightseeing.length;
  const utilization = activeMinutes / Math.max(1, availableMinutes);
  if (day.items.some((item) => item.kind === "check-out") && placeCount <= 1) {
    return { level: "easy", label: "Checkout day" };
  }
  if (placeCount === 0) {
    return day.items.length
      ? { level: "easy", label: "Logistics day" }
      : { level: "easy", label: "Open day" };
  }
  if (day.index === 1 && placeCount < 4 && hasRemainingPlaces) {
    return { level: "attention", label: "Needs more stops" };
  }
  if (placeCount >= 4) return { level: "full", label: "Full day" };
  if (placeCount >= 3 || (placeCount >= 2 && utilization >= 0.5)) return { level: "balanced", label: "Balanced day" };
  return { level: "easy", label: "Easygoing day" };
}

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
  const [expandedExcludedId, setExpandedExcludedId] = useState<string | null>(null);
  const [acknowledgedFullDays, setAcknowledgedFullDays] = useState<Set<number>>(() => new Set());
  const holdTimer = useRef<number | null>(null);
  const holdOrigin = useRef<{ x: number; y: number } | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const edgeScrollFrame = useRef<number | null>(null);
  const edgePointerY = useRef<number | null>(null);
  const uniqueExcluded = useMemo(() => {
    const excluded = itinerary.days.flatMap((day) => day.unscheduled);
    return [...new Map(excluded.map((place) => [place.id, place])).values()];
  }, [itinerary.days]);
  const dayEffort = itinerary.days.map((day) => Math.max(0, day.endMinutes - day.startMinutes));
  const spread = dayEffort.length ? Math.max(...dayEffort) - Math.min(...dayEffort) : 0;
  const overloaded = uniqueExcluded.length > 0 || spread > 150;
  const suggestedIds = useMemo(
    () => new Set(itinerary.suggestedDestinationIds ?? []),
    [itinerary.suggestedDestinationIds],
  );
  const dayIntensities = useMemo(
    () => itinerary.days.map((day) => reviewDayIntensity(day, itinerary.availableMinutes, uniqueExcluded.length > 0)),
    [itinerary, uniqueExcluded.length],
  );
  const fullDayIndexes = useMemo(
    () => dayIntensities.flatMap((intensity, index) => intensity.level === "full" ? [index] : []),
    [dayIntensities],
  );
  const unconfirmedFullDays = fullDayIndexes.filter((index) => !acknowledgedFullDays.has(index));
  const moveOptions = useMemo(
    () => moving
      ? itinerary.days.map((day) => onEvaluateMove(moving.id, day.index))
      : [],
    [itinerary, moving, onEvaluateMove],
  );
  const excludedMoveOptions = useMemo(
    () => new Map(uniqueExcluded.map((place) => [
      place.id,
      itinerary.days.map((day) => onEvaluateMove(place.id, day.index)),
    ])),
    [itinerary.days, onEvaluateMove, uniqueExcluded],
  );

  useEffect(() => {
    setAcknowledgedFullDays(new Set());
    setExpandedExcludedId(null);
  }, [itinerary.id]);

  function clearHoldTimer() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    holdOrigin.current = null;
  }

  function stopEdgeAutoScroll() {
    if (edgeScrollFrame.current !== null) window.cancelAnimationFrame(edgeScrollFrame.current);
    edgeScrollFrame.current = null;
    edgePointerY.current = null;
  }

  function updateEdgeAutoScroll(clientY: number) {
    edgePointerY.current = clientY;
    if (edgeScrollFrame.current !== null) return;
    const tick = () => {
      const dialog = dialogRef.current;
      const pointerY = edgePointerY.current;
      if (!dialog || pointerY === null) {
        edgeScrollFrame.current = null;
        return;
      }
      const bounds = dialog.getBoundingClientRect();
      const edgeSize = Math.min(110, bounds.height * 0.22);
      const topDistance = pointerY - bounds.top;
      const bottomDistance = bounds.bottom - pointerY;
      const speed = topDistance < edgeSize
        ? -Math.ceil((edgeSize - topDistance) / 7)
        : bottomDistance < edgeSize
          ? Math.ceil((edgeSize - bottomDistance) / 7)
          : 0;
      if (!speed) {
        edgeScrollFrame.current = null;
        return;
      }
      dialog.scrollTop += Math.max(-18, Math.min(18, speed));
      edgeScrollFrame.current = window.requestAnimationFrame(tick);
    };
    edgeScrollFrame.current = window.requestAnimationFrame(tick);
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
    if (moving) {
      updateEdgeAutoScroll(event.clientY);
      return;
    }
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
    updateEdgeAutoScroll(event.clientY);
  }

  function finishMove(targetDayIndex: number) {
    if (!moving) return;
    const destinationId = moving.id;
    const evaluation = onMove(destinationId, targetDayIndex);
    setMoveFeedback({
      tone: evaluation.allowed ? "success" : "error",
      text: evaluation.reason,
      destinationId,
      targetDayIndex,
    });
    if (evaluation.allowed) {
      setExpandedExcludedId((current) => current === destinationId ? null : current);
      setMoving(null);
    } else {
      setExpandedExcludedId(destinationId);
      window.requestAnimationFrame(() => {
        document.getElementById(`review-excluded-${destinationId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }

  function dayMoveState(dayIndex: number) {
    if (!moving) return "";
    if (moveOptions[dayIndex]?.allowed) return "move-allowed";
    const movingIsUnscheduled = uniqueExcluded.some((place) => place.id === moving.id);
    if (moving.sourceDay === dayIndex && !movingIsUnscheduled) return "move-current";
    return "move-blocked";
  }

  function cancelMove() {
    clearHoldTimer();
    stopEdgeAutoScroll();
    setMoving(null);
    setMoveFeedback(null);
  }

  function focusDayAdjustments(dayIndex: number) {
    const removeButton = document.querySelector<HTMLButtonElement>(
      `#review-day-${dayIndex + 1} .review-remove-button`,
    );
    removeButton?.scrollIntoView({ behavior: "smooth", block: "center" });
    removeButton?.focus({ preventScroll: true });
    setMoveFeedback({
      tone: "error",
      text: `Remove or move a Day ${dayIndex + 1} place, then review the updated pace before confirming.`,
    });
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (moving) {
        clearHoldTimer();
        setMoving(null);
        setMoveFeedback(null);
      } else if (!confirming) {
        onEdit();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      clearHoldTimer();
      stopEdgeAutoScroll();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [confirming, moving, onEdit]);

  return (
    <div
      className="itinerary-review-backdrop"
      role="presentation"
      onClick={(event) => {
        if (confirming) return;
        const target = event.target as HTMLElement;
        if (moving) {
          if (target.closest('[data-move-control="true"]')) return;
          cancelMove();
          return;
        }
        if (event.target === event.currentTarget) onEdit();
      }}
    >
      <section ref={dialogRef} className={`itinerary-review-dialog ${confirming ? "is-confirming" : ""} ${moving ? "is-moving-place" : ""}`} role="dialog" aria-modal="true" aria-labelledby="itinerary-review-title" aria-busy={confirming}>
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
              ? `${uniqueExcluded.length} selected ${uniqueExcluded.length === 1 ? "place is" : "places are"} still waiting for a day. Move one below to see the exact distance, timing, or fixed-schedule reason.`
              : spread > 150
                ? "One day is noticeably fuller than another because of opening hours or longer visits. Review the day cards below."
                : "Nearby places stay together, and fixed hotel times divide the route into practical segments."}</p>
          </div>
        </div>

        {itinerary.stay ? <section className="review-luggage-plan" aria-label="Planned luggage reminder">
          <BaggageClaim />
          <div><strong>Store bags before sightseeing</strong><span><b>Before check-in:</b> {arrivalLuggagePlanLabel(getArrivalLuggagePlan(itinerary.stay))}</span><span><b>After checkout:</b> {checkoutLuggagePlanLabel(getCheckoutLuggagePlan(itinerary.stay))}</span><span>Confirm the handoff on arrival and keep valuables with you.</span></div>
        </section> : null}

        <div className={`review-move-guide ${moving ? "active" : ""}`} data-move-control={moving ? "true" : undefined}>
          <GripVertical />
          <div>
            <strong>{moving ? `Moving ${moving.name}` : "Fine-tune this route"}</strong>
            <p>{moving
              ? "Choose a day below—there is no need to keep holding. Green days can take this stop."
              : "Tap the move handle on mobile, or drag a place on desktop. Fixed hotel and departure times stay locked."}</p>
          </div>
          {moving ? <button type="button" onClick={cancelMove}>Cancel</button> : null}
        </div>

        {moving ? <aside className="review-move-tray" data-move-control="true" aria-label={`Move ${moving.name} to another day`}>
          <div><strong>Move {moving.name}</strong><span>Choose a day</span></div>
          <div className="review-move-tray-days">{itinerary.days.map((day) => {
            const option = moveOptions[day.index];
            const movingIsUnscheduled = uniqueExcluded.some((place) => place.id === moving.id);
            const current = moving.sourceDay === day.index
              && !movingIsUnscheduled
              && !itinerary.deferredDestinationIds?.includes(moving.id);
            return <button
              type="button"
              key={day.index}
              className={current ? "current" : option?.allowed ? "allowed" : "blocked"}
              onClick={() => finishMove(day.index)}
              title={option?.reason}
            ><b>Day {day.index + 1}</b><small>{current ? "Current" : option?.allowed ? "Fits here" : "Unavailable"}</small></button>;
          })}</div>
          {moveFeedback ? <p className={moveFeedback.tone} role="status">{moveFeedback.text}</p> : null}
          <button type="button" className="review-move-tray-cancel" onClick={cancelMove}><X /> Cancel</button>
        </aside> : null}

        {moveFeedback && !moving ? <div className={`review-move-feedback ${moveFeedback.tone}`} role="status">{moveFeedback.text}</div> : null}

        <div className="review-day-grid">
          {itinerary.days.map((day) => {
            const areas = [...new Set(day.items.filter((item) => item.kind === "destination").map((item) => item.destination.area))];
            const placeCount = day.items.filter((item) => item.kind === "destination").length;
            const comfortCount = day.items.filter((item) => item.kind === "meal" || item.kind === "rest").length;
            const moveOption = moveOptions[day.index];
            const intensity = dayIntensities[day.index];
            const areaCounts = day.items
              .filter((item) => item.kind === "destination")
              .reduce<Record<string, number>>((counts, item) => ({
                ...counts,
                [item.destination.area]: (counts[item.destination.area] ?? 0) + 1,
              }), {});
            const [dominantArea, dominantCount = 0] = Object.entries(areaCounts)
              .sort((first, second) => second[1] - first[1])[0] ?? [];
            const fullDayLabel = dominantArea && dominantCount >= 3
              ? `${dominantArea} loop`
              : "sightseeing day";
            return (
              <article
                className={`review-day-card ${dayMoveState(day.index)}`}
                key={day.index}
                id={`review-day-${day.index + 1}`}
                onDragOver={(event) => { if (moving) { event.preventDefault(); updateEdgeAutoScroll(event.clientY); event.dataTransfer.dropEffect = moveOption?.allowed ? "move" : "none"; } }}
                onDrop={(event) => { event.preventDefault(); stopEdgeAutoScroll(); finishMove(day.index); }}
              >
                <header>
                  <div><small>DAY {day.index + 1}</small><strong>{placeCount} {placeCount === 1 ? "place" : "places"}{comfortCount ? ` · ${comfortCount} comfort ${comfortCount === 1 ? "break" : "breaks"}` : ""}</strong></div>
                  <div className="review-day-meta">
                    <b className={`review-day-load ${intensity.level}`}>{intensity.label}</b>
                    <span><Clock3 size={13} /> {minutesToTime(day.startMinutes)}–{minutesToTime(day.endMinutes)}</span>
                    {moving ? (
                      <button
                        type="button"
                        className={moveOption?.allowed ? "allowed" : "blocked"}
                        aria-disabled={!moveOption?.allowed}
                        title={moveOption?.reason}
                        data-move-control="true"
                        onClick={() => finishMove(day.index)}
                      ><MoveRight /> {moveOption?.allowed ? "Move here" : dayMoveState(day.index) === "move-current" ? "Current day" : "Unavailable"}</button>
                    ) : null}
                  </div>
                </header>
                {areas.length ? <p className="review-area-line"><MapPin size={13} /> {areas.join(" · ")}</p> : null}
                {intensity.level === "full" ? <aside className={`review-day-callout ${acknowledgedFullDays.has(day.index) ? "acknowledged" : ""}`} role="alert">
                  <AlertTriangle />
                  <div><strong>Day {day.index + 1} is a full {fullDayLabel}</strong><p>You’ll visit {placeCount} places from {minutesToTime(day.startMinutes)} to {minutesToTime(day.endMinutes)} with limited downtime. Are you comfortable keeping this schedule?</p></div>
                  <div className="review-day-callout-actions">
                    <button
                      type="button"
                      className="keep"
                      aria-pressed={acknowledgedFullDays.has(day.index)}
                      disabled={acknowledgedFullDays.has(day.index)}
                      onClick={() => setAcknowledgedFullDays((current) => new Set(current).add(day.index))}
                    >{acknowledgedFullDays.has(day.index) ? <><Check /> Packed day accepted</> : "Keep this packed day"}</button>
                    <button type="button" onClick={() => focusDayAdjustments(day.index)}>Adjust places</button>
                  </div>
                </aside> : null}
                {!day.items.length ? <div className="review-open-day">
                  <Coffee />
                  <div><strong>Keep this day open—or add another place</strong><p>Your selected stops already fit elsewhere. Use this as a recovery day, or choose Edit choices to add more of Baguio.</p></div>
                </div> : <ol>
                  {day.items.map((stop) => (
                    <li
                      className={`review-stop ${stop.kind} ${moving?.id === stop.destination.id ? "is-moving" : moving ? "move-dimmed" : ""}`}
                      key={`${day.index}-${stop.destination.id}`}
                      draggable={stop.kind === "destination"}
                      data-move-control={moving?.id === stop.destination.id ? "true" : undefined}
                      aria-grabbed={stop.kind === "destination" ? moving?.id === stop.destination.id : undefined}
                      onDragStart={stop.kind === "destination" ? (event) => startDrag(event, stop.destination.id, stop.destination.name, day.index) : undefined}
                      onDragEnd={stop.kind === "destination" ? () => { stopEdgeAutoScroll(); setMoving(null); } : undefined}
                      onPointerDown={stop.kind === "destination" ? (event) => scheduleLongPress(event, stop.destination.id, stop.destination.name, day.index) : undefined}
                      onPointerMove={stop.kind === "destination" ? cancelLongPressOnMove : undefined}
                      onPointerUp={stop.kind === "destination" ? () => { clearHoldTimer(); stopEdgeAutoScroll(); } : undefined}
                      onPointerCancel={stop.kind === "destination" ? () => { clearHoldTimer(); stopEdgeAutoScroll(); } : undefined}
                    >
                      <span>{stopIcon(stop)}</span>
                      <div className="review-stop-copy"><strong>{stop.destination.name}</strong><small>{minutesToTime(stop.arrivalMinutes)} · {stopLabel(stop)}</small>{suggestedIds.has(stop.destination.id) ? <em>Buddy suggested</em> : null}</div>
                      {stop.kind === "destination" ? <div className="review-stop-actions" data-move-control="true">
                        <button type="button" className="review-grab-button" onClick={() => beginMove(stop.destination.id, stop.destination.name, day.index)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Move ${stop.destination.name}`} title="Move to another day"><GripVertical /></button>
                        <button type="button" className="review-remove-button" onClick={() => onDefer(stop.destination.id)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Move ${stop.destination.name} out of Day ${day.index + 1}`} title="Move out of this day"><Trash2 /></button>
                      </div> : null}
                    </li>
                  ))}
                </ol>}
                <footer><span>{formatDuration(day.totalTravelMinutes)} travel</span><span>{day.totalDistance.toFixed(1)} km estimated</span></footer>
              </article>
            );
          })}
        </div>

        {uniqueExcluded.length ? (
          <section className="review-excluded">
            <header><AlertTriangle size={17} /><div><strong>Your remaining selected places</strong><p>Tap a place to see which days fit and the exact route, time, or opening-hour reason.</p></div></header>
            <div>{uniqueExcluded.map((place) => {
              const sourceDay = itinerary.days.find((day) => day.unscheduled.some((item) => item.id === place.id))?.index ?? null;
              const expanded = expandedExcludedId === place.id;
              return <article
                className={`${expanded ? "is-expanded" : ""} ${moving?.id === place.id ? "is-moving" : moving ? "move-dimmed" : ""} ${moveFeedback?.tone === "error" && moveFeedback.destinationId === place.id ? "has-move-error" : ""}`}
                key={place.id}
                id={`review-excluded-${place.id}`}
                draggable
                data-move-control={moving?.id === place.id ? "true" : undefined}
                aria-grabbed={moving?.id === place.id}
                onDragStart={(event) => startDrag(event, place.id, place.name, sourceDay)}
                onDragEnd={() => { stopEdgeAutoScroll(); setMoving(null); }}
                onPointerDown={(event) => scheduleLongPress(event, place.id, place.name, sourceDay)}
                onPointerMove={cancelLongPressOnMove}
                onPointerUp={() => { clearHoldTimer(); stopEdgeAutoScroll(); }}
                onPointerCancel={() => { clearHoldTimer(); stopEdgeAutoScroll(); }}
              >
                <button
                  type="button"
                  className="review-excluded-toggle"
                  aria-expanded={expanded}
                  aria-controls={`review-excluded-fit-${place.id}`}
                  onClick={() => setExpandedExcludedId((current) => current === place.id ? null : place.id)}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <span className="review-excluded-copy"><strong>{place.name}</strong><small>{place.area} · {place.open}–{place.close}</small>{suggestedIds.has(place.id) ? <em className="review-suggested-label">Buddy suggested</em> : null}<em className="review-excluded-hint">{expanded ? "Hide day-by-day reasons" : "Tap to see why it wasn’t scheduled"}</em></span>
                  <ChevronDown aria-hidden="true" />
                </button>
                <div className="review-excluded-actions" data-move-control="true">
                  <button type="button" className="review-grab-button" onClick={() => beginMove(place.id, place.name, sourceDay)} onPointerDown={(event) => event.stopPropagation()} aria-label={`Add ${place.name} to a day`} title="Add back to a day"><GripVertical /></button>
                  <button type="button" className="review-remove-button" onClick={() => { if (expanded) setExpandedExcludedId(null); onDelete(place.id); }} onPointerDown={(event) => event.stopPropagation()}><Trash2 size={14} /> Delete choice</button>
                </div>
                {expanded ? <ul id={`review-excluded-fit-${place.id}`} className="review-excluded-fit" aria-label={`Day-by-day fit for ${place.name}`}>
                  {(excludedMoveOptions.get(place.id) ?? []).map((option, dayIndex) => {
                    const highlighted = moveFeedback?.tone === "error"
                      && moveFeedback.destinationId === place.id
                      && moveFeedback.targetDayIndex === dayIndex;
                    return <li className={`${option.allowed ? "allowed" : "blocked"} ${highlighted ? "highlighted" : ""}`} key={dayIndex}>
                      <span className="review-fit-day">{option.allowed ? <Check /> : <AlertTriangle />}<b>Day {dayIndex + 1}</b></span>
                      <span className="review-fit-copy"><strong>{option.allowed ? "Can be added" : "Doesn’t fit this day"}</strong><small>{option.reason}</small></span>
                    </li>;
                  })}
                </ul> : null}
              </article>;
            })}</div>
          </section>
        ) : null}

        <footer className="itinerary-review-actions">
          <button type="button" className="review-edit-button" onClick={onEdit} disabled={confirming}><Pencil /> Edit choices</button>
          <button
            type="button"
            className="review-confirm-button"
            onClick={onConfirm}
            disabled={confirming || unconfirmedFullDays.length > 0}
            title={unconfirmedFullDays.length ? "Confirm each packed-day warning first." : undefined}
          >{confirming ? <LoaderCircle className="spin" /> : <Check />} {confirming ? "Finalizing itinerary…" : unconfirmedFullDays.length ? `Review ${unconfirmedFullDays.length} packed ${unconfirmedFullDays.length === 1 ? "day" : "days"}` : "Use this itinerary"}</button>
        </footer>
        {confirming ? <div className="review-finalizing" role="status" aria-live="polite"><LoaderCircle className="spin" /><strong>Finalizing your Baguio itinerary…</strong><span>Rechecking the route, schedule, and travel time.</span></div> : null}
      </section>
    </div>
  );
}
