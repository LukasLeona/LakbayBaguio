import { Suspense } from "react";
import { Planner } from "@/components/planner";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free Baguio Itinerary Planner for DIY Trips",
  description: "Create a personalized Baguio itinerary for 1–5 days. Group tourist spots by area and get commute steps, fares, walking time, meal breaks, hotel timing, and baggage reminders.",
  path: "/plan",
  keywords: [
    "free Baguio itinerary planner",
    "personalized Baguio itinerary",
    "Baguio itinerary generator",
    "Baguio commute itinerary planner",
  ],
});

const plannerJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Baguio Buddy Itinerary Planner",
  url: `${SITE_URL}/plan`,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "PHP" },
  description: "A free Baguio itinerary planner that groups tourist spots and plans commute guidance, travel estimates, meals, baggage, hotel check-in, and checkout timing.",
};

export default function PlanPage() {
  return (
    <main id="main-content" className="plan-page">
      <section className="planner-section">
        <div className="planner-shell">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(plannerJsonLd) }} />
          <header className="planner-seo-intro">
            <span>Free DIY trip planner</span>
            <h1>Build your personalized Baguio itinerary</h1>
            <p>Choose your dates, hotel, available time, and must-see tourist spots. We will group practical routes and account for commute, meals, luggage, check-in, and checkout.</p>
          </header>
          <Suspense fallback={<div className="loading-card">Preparing your planner…</div>}>
            <Planner />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
