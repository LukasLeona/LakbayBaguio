import type { Metadata } from "next";
import { Suspense } from "react";
import { Planner } from "@/components/planner";

export const metadata: Metadata = { title: "Your itinerary" };

export default function ItineraryPage() {
  return (
    <main id="main-content" className="plan-page itinerary-page">
      <section className="planner-section">
        <div className="planner-shell">
          <Suspense fallback={<div className="loading-card">Opening your itinerary…</div>}>
            <Planner initialView="itinerary" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
