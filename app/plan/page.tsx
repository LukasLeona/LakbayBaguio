import type { Metadata } from "next";
import { Suspense } from "react";
import { Planner } from "@/components/planner";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <main id="main-content" className="plan-page">
      <section className="planner-section">
        <div className="planner-shell">
          <Suspense fallback={<div className="loading-card">Preparing your planner…</div>}>
            <Planner />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
