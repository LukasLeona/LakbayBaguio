"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, LoaderCircle, MapPin, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ItineraryResults } from "@/components/itinerary-results";
import type { PlannedItinerary } from "@/lib/planner-engine";
import { isPlannedItinerary, isShareToken, rememberSharedItinerary } from "@/lib/shared-itinerary";

type SharedPayload = { itinerary: unknown; created_at: string; expires_at: string };

export function SharedItineraryView({ token }: { token: string }) {
  const [itinerary, setItinerary] = useState<PlannedItinerary | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!isShareToken(token)) {
      setState("missing");
      return;
    }
    let active = true;
    void fetch(`/api/itineraries/shared/${token}`, { cache: "no-store" })
      .then(async (response) => ({ response, payload: response.ok ? await response.json() as SharedPayload : null }))
      .then(({ response, payload }) => {
        if (!active) return;
        if (response.status === 404) {
          setState("missing");
          return;
        }
        if (!response.ok || !payload || !isPlannedItinerary(payload.itinerary)) {
          setState("error");
          return;
        }
        setItinerary(payload.itinerary);
        setExpiresAt(payload.expires_at);
        setState("ready");
        try { rememberSharedItinerary(token, payload.itinerary); } catch { /* Home recall is optional. */ }
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [token]);

  if (state === "loading") return <div className="shared-itinerary-state"><LoaderCircle className="spin" /><h1>Opening a shared Baguio route…</h1><p>Fetching the days, stops, directions, and fare estimates.</p></div>;

  if (state === "missing") return <div className="shared-itinerary-state"><Share2 /><span>Shared itinerary</span><h1>This route is no longer available.</h1><p>The link may be incomplete or its 90-day sharing window has ended.</p><div><Link className="button primary" href="/plan">Build a new itinerary</Link><Link className="button secondary" href="/">Back home</Link></div></div>;

  if (state === "error" || !itinerary) return <div className="shared-itinerary-state"><Share2 /><span>Shared itinerary</span><h1>We couldn’t open this route.</h1><p>Check your connection and try the shared link again.</p><div><button className="button primary" type="button" onClick={() => window.location.reload()}>Try again</button><Link className="button secondary" href="/">Back home</Link></div></div>;

  return (
    <div className="shared-itinerary-view">
      <header className="shared-itinerary-banner">
        <div className="shared-itinerary-mark"><Share2 /></div>
        <div><span>Shared with you</span><strong>A traveler sent you this Baguio route.</strong><small><CalendarDays /> {itinerary.numberOfDays} {itinerary.numberOfDays === 1 ? "day" : "days"} <MapPin /> {itinerary.totals.scheduledStops} stops{expiresAt ? ` · Available until ${new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(expiresAt))}` : ""}</small></div>
        <Link href="/" className="button secondary"><ArrowLeft /> Exit to Home</Link>
      </header>
      <ItineraryResults itinerary={itinerary} activeDay={activeDay} saved variant="shared" onActiveDayChange={setActiveDay} />
    </div>
  );
}
