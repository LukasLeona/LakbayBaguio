"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ITINERARY_STORAGE_KEY } from "@/lib/itinerary";

type PendingTripPreview = {
  title: string;
  dayCount: number;
  stops: { id: string; name: string }[];
};

function readPendingTrip(value: string): PendingTripPreview | null {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") return null;

  const candidate = parsed as {
    title?: unknown;
    days?: unknown;
    numberOfDays?: unknown;
    stops?: unknown;
  };

  if (Array.isArray(candidate.days) && typeof candidate.numberOfDays === "number") {
    const stops = candidate.days.flatMap((day) => {
      if (!day || typeof day !== "object" || !Array.isArray((day as { items?: unknown[] }).items)) return [];
      return (day as { items: { destination?: { id?: unknown; name?: unknown } }[] }).items.flatMap((item) => {
        const destination = item?.destination;
        return destination && typeof destination.id === "string" && typeof destination.name === "string"
          ? [{ id: destination.id, name: destination.name }]
          : [];
      });
    });
    return {
      title: typeof candidate.title === "string" ? candidate.title : "Your Baguio route",
      dayCount: candidate.numberOfDays,
      stops,
    };
  }

  if (Array.isArray(candidate.stops) && typeof candidate.days === "number") {
    const stops = (candidate.stops as { id?: unknown; name?: unknown }[]).flatMap((stop) =>
      typeof stop.id === "string" && typeof stop.name === "string" ? [{ id: stop.id, name: stop.name }] : [],
    );
    return {
      title: typeof candidate.title === "string" ? candidate.title : "Your Baguio route",
      dayCount: candidate.days,
      stops,
    };
  }

  return null;
}

export function HomePendingItinerary() {
  const [trip, setTrip] = useState<PendingTripPreview | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ITINERARY_STORAGE_KEY);
      if (stored) setTrip(readPendingTrip(stored));
    } catch {
      localStorage.removeItem(ITINERARY_STORAGE_KEY);
    }
  }, []);

  if (!trip) {
    return (
      <div className="pending-empty">
        <div className="empty-icon"><Sparkles size={24} /></div>
        <div>
          <span className="eyebrow">Your next escape</span>
          <h3>No pending itinerary yet</h3>
          <p>Choose your destinations, schedule, and transport preferences. We’ll arrange a practical Baguio route.</p>
        </div>
        <Link href="/plan" className="button primary">Build my itinerary <ArrowRight size={17} /></Link>
      </div>
    );
  }

  return (
    <article className="pending-trip">
      <div className="pending-copy">
        <span className="status-pill"><span /> Pending trip</span>
        <h3>{trip.title}</h3>
        <div className="pending-stats">
          <span><CalendarDays size={16} /> {trip.dayCount} {trip.dayCount === 1 ? "day" : "days"}</span>
          <span><MapPin size={16} /> {trip.stops.length} stops</span>
        </div>
        <div className="pending-stops">
          {trip.stops.slice(0, 3).map((stop, index) => (
            <span key={stop.id}>{index + 1}. {stop.name}</span>
          ))}
          {trip.stops.length > 3 && <span>+{trip.stops.length - 3} more</span>}
        </div>
      </div>
      <Link href="/plan" className="button dark">View itinerary <ArrowRight size={17} /></Link>
    </article>
  );
}
