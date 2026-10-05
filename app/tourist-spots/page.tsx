import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BusFront,
  Camera,
  Clock3,
  Compass,
  Map,
  MapPin,
  Mountain,
  Route,
  ShieldCheck,
  Trees,
} from "lucide-react";
import { GuideByline, GuideDisclosure, GuideSourceList, GuideTableOfContents } from "@/components/guide-data";
import {
  BAGUIO_GUIDE_DESTINATIONS,
  BAGUIO_GUIDE_LOOPS,
  BAGUIO_GUIDE_REVIEW_LABEL,
  destinationPlanningNote,
  formatGuideTime,
  formatVisitDuration,
  getLoopDestinations,
  routeGuideForLoop,
} from "@/lib/baguio-guide-data";
import { getPlace } from "@/lib/places";
import { GUIDE_REVIEW_LABEL, guideSources } from "@/lib/travel-guide-data";

const canonicalUrl = "https://baguiobuddy.com/tourist-spots";
const updatedDate = "2026-10-05";

const planningFees = [
  { place: "Botanical Garden", area: "East Baguio", time: "60–90 min", allowance: "₱100 adult", extra: "Reduced rates may require valid ID; verify at the entrance" },
  { place: "The Mansion", area: "East Baguio", time: "20–40 min", allowance: "₱0 exterior", extra: "Public gate/viewing stop only; access rules can change" },
  { place: "Wright Park", area: "East Baguio", time: "45–75 min", allowance: "₱0 public area", extra: "Horseback rides, photos, and rentals are separate" },
  { place: "Mines View Park", area: "East Baguio", time: "45–60 min", allowance: "₱10 buffer", extra: "Use as a small-fee allowance and confirm live collection" },
  { place: "Burnham Park", area: "City center", time: "60–120 min", allowance: "₱0 general entry", extra: "Bike, boat, food, and other activities are separate" },
  { place: "Camp John Hay", area: "South Baguio", time: "2–4 hr", allowance: "₱75+", extra: "Depends on the exact attraction; the estate itself is not one ticket" },
  { place: "Mirador Heritage and Eco Park", area: "West Baguio", time: "90–150 min", allowance: "₱100 buffer", extra: "Planning allowance only; confirm the current gate rate" },
] as const;

export const metadata: Metadata = {
  title: "48 Baguio Tourist Spots: Area Guide, Routes & Visit Times",
  description:
    "Compare 48 Baguio tourist spots and nearby Benguet side trips, grouped into practical routes with visit times, reference hours, commute notes, and itinerary actions.",
  alternates: { canonical: canonicalUrl },
  authors: [{ name: "Baguio Buddy", url: "https://baguiobuddy.com" }],
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "48 Baguio Tourist Spots: A Practical First-Timer Area Guide",
    description:
      "Plan Baguio tourist spots by area instead of zigzagging across the city. Includes East Baguio, city-center, south, west, and La Trinidad ideas.",
    siteName: "Baguio Buddy",
    publishedTime: updatedDate,
    modifiedTime: updatedDate,
    images: [
      {
        url: "https://baguiobuddy.com/assets/img/destinations/camp-john-hay.jpg",
        alt: "Pine trees at Camp John Hay in Baguio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "48 Tourist Spots in Baguio and Nearby Benguet",
    description: "A practical, area-by-area directory with visit times, route notes, and itinerary actions.",
    images: ["https://baguiobuddy.com/assets/img/destinations/camp-john-hay.jpg"],
  },
};

const allSpots = BAGUIO_GUIDE_DESTINATIONS;

const faqs = [
  {
    question: "What are the must-visit tourist spots in Baguio for first-timers?",
    answer: "A strong first visit usually includes Botanical Garden, The Mansion, Wright Park, Mines View Park, Burnham Park, Session Road, and one larger destination such as Camp John Hay or Mirador.",
  },
  {
    question: "How many Baguio tourist spots can I visit in one day?",
    answer: "Four to six nearby stops can be reasonable when some are short photo visits. Fewer is better when the day includes Camp John Hay, Mirador, bad weather, long meals, or cross-city travel.",
  },
  {
    question: "Which Baguio tourist spots are near each other?",
    answer: "Botanical Garden, The Mansion, Wright Park, Mines View, and Good Shepherd form the main East Baguio cluster. Burnham Park, Session Road, Cathedral, and City Market form a separate city-center cluster.",
  },
  {
    question: "Are all Baguio tourist spots free?",
    answer: "No. Some public spaces have no general admission, while other attractions, activities, parking areas, or special sections may charge. Verify official rates shortly before your visit.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "48 Baguio Tourist Spots: Area Guide, Routes and Visit Times",
      description: "An area-by-area directory of Baguio tourist spots and nearby Benguet side trips with practical timing and commute notes.",
      datePublished: updatedDate,
      dateModified: updatedDate,
      inLanguage: "en-PH",
      isAccessibleForFree: true,
      citation: [guideSources.visita.url, guideSources.botanical.url, guideSources.minesView.url],
      author: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      publisher: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      mainEntityOfPage: canonicalUrl,
      image: "https://baguiobuddy.com/assets/img/destinations/camp-john-hay.jpg",
    },
    {
      "@type": "ItemList",
      name: "Tourist spots in Baguio",
      numberOfItems: allSpots.length,
      itemListElement: allSpots.map((spot, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: spot.name,
        description: spot.description,
        url: `${canonicalUrl}#spot-${spot.id}`,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://baguiobuddy.com" },
        { "@type": "ListItem", position: 2, name: "Tourist Spots in Baguio", item: canonicalUrl },
      ],
    },
  ],
};

export default function TouristSpotsPage() {
  return (
    <main id="main-content" className="seo-hub seo-hub-tourist-spots">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="section seo-hub-hero">
        <div className="shell seo-hub-hero-inner">
          <nav className="seo-hub-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Tourist spots</span></nav>
          <span className="eyebrow"><Compass size={15} /> Area-by-area guide</span>
          <h1>48 Baguio tourist spots: choose the right places for your route</h1>
          <p className="seo-hub-lead">
            Compare places in Baguio City and nearby Benguet without turning the trip into a race. Every destination below belongs to a practical area loop
            and connects to the same catalog used by the itinerary generator.
          </p>
          <div className="seo-hub-meta"><span><Clock3 size={16} /> Updated {BAGUIO_GUIDE_REVIEW_LABEL}</span><span><MapPin size={16} /> 48 places · 7 route loops</span></div>
          <div className="seo-hub-actions">
            <Link href="/explore" className="button dark">Browse places and photos <ArrowRight size={18} /></Link>
            <Link href="/plan" className="button lime">Add places to an itinerary <Route size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section tourist-directory-intro">
        <div className="shell">
          <GuideByline
            reviewed={BAGUIO_GUIDE_REVIEW_LABEL}
            scope="Destination names, coordinates, planning hours, visit lengths, route areas, and itinerary actions come from Baguio Buddy's shared planner catalog. Confirm changing access details before departure."
          />
          <GuideTableOfContents items={BAGUIO_GUIDE_LOOPS.map((loop) => ({
            href: `#area-${loop.id}` as `#${string}`,
            label: loop.title,
            description: `${getLoopDestinations(loop).length} places · ${loop.timeNeeded}`,
          }))} />
        </div>
      </section>

      <section className="section guide-trip-snapshot" aria-labelledby="spot-cost-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Camera size={15} /> Time and fee planner</span>
            <h2 id="spot-cost-title">How long to stay and what admission to set aside</h2>
            <p>Use these amounts to build a cash buffer, not as prepaid prices. “Free” means no general-entry amount is assumed; activities, food, parking, and purchases can still cost extra.</p>
          </div>
          <div className="guide-table-wrap">
            <table className="guide-data-table">
              <caption>Planning time and fee allowances for popular Baguio tourist spots</caption>
              <thead><tr><th scope="col">Place</th><th scope="col">Area</th><th scope="col">Visit time</th><th scope="col">Fee allowance</th><th scope="col">What to check</th></tr></thead>
              <tbody>
                {planningFees.map((item) => (
                  <tr key={item.place}>
                    <th scope="row" data-label="Place">{item.place}</th>
                    <td data-label="Area">{item.area}</td>
                    <td data-label="Visit time">{item.time}</td>
                    <td data-label="Fee allowance">{item.allowance}</td>
                    <td data-label="Check live">{item.extra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GuideDisclosure>
            Rates and access rules can change after publication. Check Baguio VISITA and the attraction&apos;s current official channel shortly before the visit; carry valid ID if you expect a discounted rate.
          </GuideDisclosure>
        </div>
      </section>

      <section className="section seo-hub-route-principle" aria-labelledby="route-principle-title">
        <div className="shell seo-hub-two-column">
          <div>
            <span className="eyebrow"><Map size={15} /> Start with geography</span>
            <h2 id="route-principle-title">Plan clusters, not a zigzag across Baguio</h2>
            <p>East Baguio deserves one continuous loop. The city center works well after check-in. Camp John Hay and west-side viewpoints need their own time. This reduces repeat commutes and makes a full day feel more enjoyable.</p>
          </div>
          <aside className="seo-hub-route-card">
            <strong>A simple first-timer sequence</strong>
            <ol>
              <li>East Baguio classics</li>
              <li>Hotel check-in and rest</li>
              <li>Burnham, Cathedral, and Session Road</li>
              <li>Camp John Hay or west Baguio on another day</li>
              <li>City Market close to departure</li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="section seo-hub-spots" aria-labelledby="spots-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Camera size={15} /> Popular places</span>
            <h2 id="spots-title">All 48 places grouped into routes that make geographic sense</h2>
            <p>Suggested hours and visit lengths are planner references, not official promises. Reconfirm the attraction&apos;s current access, fee, and last-entry rules.</p>
          </div>
          <div className="seo-hub-group-list">
            {BAGUIO_GUIDE_LOOPS.map((loop) => {
              const destinations = getLoopDestinations(loop);
              const routeGuide = routeGuideForLoop(loop);
              return (
              <section id={`area-${loop.id}`} className="seo-hub-area-group tourist-directory-group" key={loop.id} aria-labelledby={`area-title-${loop.id}`}>
                <header>
                  <Mountain size={22} />
                  <div><small>{loop.area} · {loop.timeNeeded}</small><h3 id={`area-title-${loop.id}`}>{loop.title}</h3><p>{loop.summary}</p></div>
                </header>
                <div className="tourist-directory-route-note">
                  <BusFront size={17} />
                  <span><strong>Commute reference:</strong> {routeGuide.loadingArea}</span>
                </div>
                <div className="seo-hub-spot-grid">
                  {destinations.map((spot) => {
                    const curatedPlace = getPlace(spot.id);
                    return (
                    <article id={`spot-${spot.id}`} className="tourist-directory-card" key={spot.id}>
                      <span><MapPin size={18} /></span>
                      <div>
                        <small className="tourist-directory-type">{spot.category} · {spot.scope}</small>
                        <h4>{curatedPlace ? <Link href={`/places/${spot.id}`}>{spot.name}</Link> : spot.name}</h4>
                        <p>{spot.description}</p>
                        <div className="tourist-directory-facts">
                          <span><Clock3 size={13} /> {formatVisitDuration(spot.duration)}</span>
                          <span>{formatGuideTime(spot.open)}–{formatGuideTime(spot.close)}*</span>
                        </div>
                        <small className="tourist-directory-caution">{destinationPlanningNote(spot)}</small>
                        <div className="tourist-directory-actions">
                          <Link href={`/plan?place=${spot.id}`}>Add to itinerary <ArrowRight size={14} /></Link>
                          {curatedPlace ? <Link href={`/places/${spot.id}`}>Visitor guide</Link> : null}
                        </div>
                      </div>
                    </article>
                  );})}
                </div>
                <aside className="tourist-directory-loop-warning"><ShieldCheck size={16} /><span>{loop.travelNote}</span></aside>
              </section>
            );})}
          </div>
        </div>
      </section>

      <section className="section seo-hub-sample-routes" aria-labelledby="sample-routes-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><Route size={15} /> Ready-made combinations</span><h2 id="sample-routes-title">Choose a route that matches your available time</h2></div>
          <div className="seo-hub-route-grid">
            <article><strong>Half day</strong><h3>City-center walk</h3><p>Burnham Park → Baguio Cathedral → Session Road. Add City Market only when you are ready to carry purchases.</p></article>
            <article><strong>One full day</strong><h3>East Baguio classics</h3><p>Botanical Garden → Mansion and Wright Park → Mines View → Good Shepherd, with lunch and commute buffers.</p></article>
            <article><strong>Three days</strong><h3>First-timer highlights</h3><p>East Baguio and city center on Day 1, Camp John Hay plus west Baguio on Day 2, then market and departure on Day 3.</p><Link href="/guides/baguio-itinerary-3-days-2-nights">Read the complete 3D2N guide <ArrowRight size={16} /></Link></article>
          </div>
        </div>
      </section>

      <section className="section seo-hub-practical" aria-labelledby="practical-title">
        <div className="shell seo-hub-two-column">
          <div>
            <span className="eyebrow"><Trees size={15} /> Enjoy the city</span>
            <h2 id="practical-title">Small choices that make the day easier</h2>
            <ul className="seo-hub-checklist">
              <li>Wear shoes with traction for slopes, stairs, and wet pavements.</li>
              <li>Carry light rain protection and a water bottle.</li>
              <li>Confirm the exact public entrance, not only the attraction name.</li>
              <li>Ask before photographing people, worship spaces, or private property.</li>
              <li>Keep a flexible final stop for changing weather and traffic.</li>
            </ul>
          </div>
          <aside className="seo-hub-commute-card">
            <BusFront size={24} />
            <h3>Visiting without a car?</h3>
            <p>Our commute guide separates access walks, loading-point checks, the ride itself, and the final walk to the public entrance.</p>
            <Link href="/guides/baguio-commute-guide">Read the Baguio commute guide <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="section seo-hub-faq" aria-labelledby="faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Visitor questions</span><h2 id="faq-title">Baguio tourist-spots FAQ</h2></div>
          <div className="seo-hub-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Tourist spot sources">
        <div className="shell">
          <GuideSourceList reviewed={GUIDE_REVIEW_LABEL} sources={[guideSources.visita, guideSources.botanical, guideSources.minesView]} />
        </div>
      </section>

      <section className="section seo-hub-related" aria-labelledby="related-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Next step</span><h2 id="related-title">Turn your shortlist into a trip</h2></div>
          <div className="seo-hub-related-grid">
            <Link href="/plan"><Route /><span><strong>Create an itinerary</strong><small>Arrange chosen places around your dates and stay.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-travel-guide"><Compass /><span><strong>Read the complete travel guide</strong><small>Connect these places with buses, stays, meals, luggage, and expenses.</small></span><ArrowRight /></Link>
            <Link href="/resources"><MapPin /><span><strong>Check traveler resources</strong><small>Review fares, luggage notes, and map guidance.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
