import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BusFront,
  CarFront,
  ExternalLink,
  Info,
  MapPinned,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { LTFRB_FARE_POLICY, resolveFarePolicy } from "@/lib/fare-policy";
import { PLANNER_BAGGAGE_OPTIONS } from "@/lib/planner-data";
import { JEEPNEY_ROAD_PATH_DISCLAIMER } from "@/lib/planner-engine";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Baguio Commute Guide, Jeepney Fares & Luggage Storage",
  description: "Review Baguio jeepney and taxi fare references, commute limits, luggage storage options, map notes, and exact-pin guidance for a smoother DIY trip.",
  path: "/resources",
  keywords: [
    "Baguio jeepney fare",
    "Baguio taxi fare",
    "Baguio luggage storage",
    "Baguio bus terminal baggage counter",
    "Baguio commute resources",
  ],
});

const routeDirectoryUrl = "https://alternateroutes.baguio.gov.ph/jeepneyroutes/";
const baggageResources = PLANNER_BAGGAGE_OPTIONS["victory-liner"];

function pesos(value: number) {
  return `₱${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function ResourcesPage() {
  const farePolicy = resolveFarePolicy();

  return (
    <main id="main-content" className="resources-page">
      <div className="shell resources-shell">
        <header className="resources-hero">
          <div>
            <span className="eyebrow light"><ShieldCheck size={15} /> Traveler reference desk</span>
            <h1>Baguio commute, fare, and luggage guide.</h1>
            <p>Review jeepney and taxi fare references, commute limits, map notes, and possible luggage counters before building your daily route.</p>
          </div>
          <aside>
            <span>Last fare review</span>
            <strong>{farePolicy.reviewedLabel}</strong>
            <small>Always confirm posted rates and local operating details on the day you travel.</small>
          </aside>
        </header>

        <nav className="resources-jump-links" aria-label="Travel resource sections">
          <a href="#fares">Fares</a>
          <a href="#commuting">Jeepney travel</a>
          <a href="#luggage">Luggage</a>
          <a href="#maps">Maps &amp; pins</a>
        </nav>

        <section className="resource-section" id="fares" aria-labelledby="fares-title">
          <header className="resource-section-heading">
            <span><BusFront /></span>
            <div><small>PLANNING BASIS</small><h2 id="fares-title">Public transport fares</h2><p>Baguio Buddy uses a conservative “up to” amount when the exact jeepney class is unknown.</p></div>
          </header>

          <div className="resource-rate-grid">
            <article>
              <span>Traditional jeepney</span>
              <strong>{pesos(farePolicy.jeepney.traditional.minimum)}</strong>
              <p>Minimum for the first {farePolicy.jeepney.traditional.baseKilometers} km, then {pesos(farePolicy.jeepney.traditional.perKilometer)} per succeeding km.</p>
              <small>{farePolicy.effectiveLabel}</small>
            </article>
            <article className="recommended-rate">
              <span>Modern jeepney · budget ceiling</span>
              <strong>{pesos(farePolicy.jeepney.modern.minimum)}</strong>
              <p>Minimum for the first {farePolicy.jeepney.modern.baseKilometers} km, then {pesos(farePolicy.jeepney.modern.perKilometer)} per succeeding km.</p>
              <small>Used automatically for a safer estimate</small>
            </article>
            <article>
              <span><CarFront size={15} /> Regular taxi</span>
              <strong>{pesos(LTFRB_FARE_POLICY.taxi.flagDown)}</strong>
              <p>Flag-down, plus {pesos(LTFRB_FARE_POLICY.taxi.perKilometer)} per km and {pesos(LTFRB_FARE_POLICY.taxi.perMinute)} per minute.</p>
              <small>{LTFRB_FARE_POLICY.taxi.effectiveLabel}</small>
            </article>
          </div>

          <div className="resource-note"><Info /><p>{farePolicy.verificationNote} Actual totals still depend on the route, traffic, authorized discounts, and the taxi meter.</p></div>
          <div className="resource-source-links" aria-label="Fare sources">
            <a href={farePolicy.sourceUrl} target="_blank" rel="noreferrer"><span><strong>{farePolicy.sourceLabel}</strong><small>Jeepney policy · reviewed {farePolicy.reviewedLabel}</small></span><ExternalLink /></a>
            <a href={LTFRB_FARE_POLICY.taxi.orderUrl} target="_blank" rel="noreferrer"><span><strong>{LTFRB_FARE_POLICY.taxi.orderLabel}</strong><small>Taxi fare order</small></span><ExternalLink /></a>
            {farePolicy.localAdvisory ? <a href={farePolicy.localAdvisory.url} target="_blank" rel="noreferrer"><span><strong>{farePolicy.localAdvisory.label}</strong><small>{farePolicy.localAdvisory.note}</small></span><ExternalLink /></a> : null}
          </div>
        </section>

        <section className="resource-section" id="commuting" aria-labelledby="commuting-title">
          <header className="resource-section-heading">
            <span><Navigation /></span>
            <div><small>FIRST-TIME COMMUTER</small><h2 id="commuting-title">How to read a jeepney leg</h2><p>Each commute is separated into the parts Google Maps cannot reliably explain for Baguio jeepneys.</p></div>
          </header>
          <ol className="commute-resource-steps">
            <li><strong>1</strong><span><b>Walk to the loading area</b><small>Use the access map, then confirm the nearest official loading point.</small></span></li>
            <li><strong>2</strong><span><b>Check the signboard</b><small>Tell the dispatcher or driver your destination before boarding.</small></span></li>
            <li><strong>3</strong><span><b>Ride and confirm the drop-off</b><small>Ask where to alight for the safest public entrance.</small></span></li>
            <li><strong>4</strong><span><b>Walk the final approach</b><small>Open the verified destination pin after leaving the jeepney.</small></span></li>
          </ol>
          <div className="resource-note warning"><Info /><p>{JEEPNEY_ROAD_PATH_DISCLAIMER}</p></div>
          <a className="resource-primary-link" href={routeDirectoryUrl} target="_blank" rel="noreferrer">Open the Baguio City jeepney route directory <ExternalLink /></a>
        </section>

        <section className="resource-section" id="luggage" aria-labelledby="luggage-title">
          <header className="resource-section-heading">
            <span><BaggageClaim /></span>
            <div><small>ARRIVING BEFORE CHECK-IN</small><h2 id="luggage-title">Possible luggage counters</h2><p>These are practical places to ask about baggage safekeeping before sightseeing.</p></div>
          </header>
          <div className="luggage-resource-grid">
            {baggageResources.map((resource) => (
              <article key={resource.name}>
                <div><strong>{resource.name}</strong><p>{resource.detail}</p></div>
                <a href={mapsSearchUrl(resource.query)} target="_blank" rel="noreferrer">View in Google Maps <ExternalLink /></a>
              </article>
            ))}
          </div>
          <div className="resource-note warning"><Info /><p>Storage is not guaranteed. Confirm eligibility, fees, closing time, prohibited items, and the claim-stub process before leaving a bag. Keep valuables with you.</p></div>
        </section>

        <section className="resource-section" id="maps" aria-labelledby="maps-title">
          <header className="resource-section-heading">
            <span><MapPinned /></span>
            <div><small>NAVIGATION NOTES</small><h2 id="maps-title">Maps, suggestions, and exact pins</h2><p>The app combines discovery data with traveler-ready Google Maps links.</p></div>
          </header>
          <div className="map-resource-grid">
            <article><strong>Stay suggestions</strong><p>Accommodation suggestions help you find a property quickly. You can still type any hotel or Airbnb name yourself.</p></article>
            <article><strong>Exact property location</strong><p>Paste the property’s Google Maps place or Share link so check-in, checkout, and route estimates use the correct pin.</p></article>
            <article><strong>Live conditions</strong><p>Confirm traffic, temporary closures, opening hours, and the public entrance shortly before each trip leg.</p></article>
          </div>
        </section>

        <section className="resources-return-card">
          <div><small>READY TO PLAN?</small><h2>Keep the references here and the itinerary easy to scan.</h2></div>
          <Link href="/plan">Build or edit an itinerary <ArrowRight /></Link>
        </section>
      </div>
    </main>
  );
}
