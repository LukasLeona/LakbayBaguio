import { SharedItineraryView } from "@/components/shared-itinerary-view";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Shared itinerary",
  "Open a read-only Baguio itinerary shared through Baguio Buddy.",
);

export default async function SharedItineraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main id="main-content" className="plan-page itinerary-page shared-itinerary-page">
      <section className="planner-section"><div className="planner-shell"><SharedItineraryView token={token} /></div></section>
    </main>
  );
}
