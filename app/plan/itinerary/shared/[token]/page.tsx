import type { Metadata } from "next";
import { SharedItineraryView } from "@/components/shared-itinerary-view";

export const metadata: Metadata = {
  title: "Shared itinerary",
  description: "Open a read-only Baguio itinerary shared through Baguio Buddy.",
};

export default async function SharedItineraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main id="main-content" className="plan-page itinerary-page shared-itinerary-page">
      <section className="planner-section"><div className="planner-shell"><SharedItineraryView token={token} /></div></section>
    </main>
  );
}
