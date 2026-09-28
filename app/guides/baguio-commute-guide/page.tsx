import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BusFront,
  CarFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Footprints,
  Info,
  MapPin,
  Navigation,
  Route,
  Signpost,
} from "lucide-react";

const canonicalUrl = "https://baguiobuddy.com/guides/baguio-commute-guide";
const updatedDate = "2026-09-29";
const officialJeepneyDirectory = "https://alternateroutes.baguio.gov.ph/jeepneyroutes/";

export const metadata: Metadata = {
  title: "Baguio Commute Guide: Jeepney, Taxi and Walking Tips",
  description:
    "Learn how to commute in Baguio without a car. Understand jeepney loading points, taxi use, walking routes, fare planning, terminal checks, and hill-friendly timing.",
  alternates: { canonical: canonicalUrl },
  authors: [{ name: "Baguio Buddy", url: "https://baguiobuddy.com" }],
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Baguio Commute Guide for First-Time Visitors",
    description:
      "A no-car guide to Baguio jeepneys, taxis, walking, terminal branches, luggage, and realistic travel time.",
    siteName: "Baguio Buddy",
    publishedTime: updatedDate,
    modifiedTime: updatedDate,
    images: [
      {
        url: "https://baguiobuddy.com/assets/img/destinations/session-road.jpg",
        alt: "Session Road in Baguio City",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Commute in Baguio Without a Car",
    description: "Jeepney, taxi, walking, terminal, luggage, and route-planning tips for first-time visitors.",
    images: ["https://baguiobuddy.com/assets/img/destinations/session-road.jpg"],
  },
};

const modes = [
  {
    name: "Walk",
    icon: Footprints,
    bestFor: "Burnham Park, Session Road, Cathedral, and short final approaches",
    advice: "Distance alone can be misleading in Baguio. Allow extra time for hills, stairs, rain, crowds, and safe pedestrian crossings.",
  },
  {
    name: "Jeepney",
    icon: BusFront,
    bestFor: "Budget travel between established districts and loading areas",
    advice: "Confirm the signboard, official loading point, transfer, and drop-off with a dispatcher or driver before boarding.",
  },
  {
    name: "Taxi",
    icon: CarFront,
    bestFor: "Luggage, small groups, rain, tight transitions, and unfamiliar hillside approaches",
    advice: "Use the meter, show the exact destination pin, and add a traffic allowance. A taxi route is not evidence of a jeepney route.",
  },
] as const;

const commuteSteps = [
  { title: "Pin the exact destination", text: "Use the public entrance or specific venue, not only a broad estate such as Camp John Hay." },
  { title: "Walk to the proper loading area", text: "The nearest road is not always the jeepney terminal. Use an access map, then confirm locally." },
  { title: "Read and confirm the signboard", text: "Tell the dispatcher or driver your destination and ask whether a transfer is required." },
  { title: "Allow waiting and traffic time", text: "Include the queue before boarding, loading time, city traffic, and possible rerouting." },
  { title: "Confirm your drop-off", text: "Ask the driver where to alight for the safest public approach to your destination." },
  { title: "Walk the final approach", text: "Open the exact destination pin after alighting and follow safe public paths." },
] as const;

const faqs = [
  {
    question: "Can tourists get around Baguio without a car?",
    answer: "Yes. Many first-time routes combine walking in the city center, jeepneys for budget travel, and taxis for luggage, rain, steep approaches, or difficult transfers.",
  },
  {
    question: "Does Google Maps show Baguio jeepney routes?",
    answer: "Do not assume a Google driving route is a valid jeepney route. Use it as a road-path or walking reference, then verify the jeepney loading point, signboard, transfer, and drop-off through the city's route directory and people on site.",
  },
  {
    question: "How much is a jeepney ride in Baguio?",
    answer: "The amount depends on the fare policy effective on your travel date, distance, jeepney class, and any valid discount. Use a conservative fare allowance and confirm the posted fare matrix inside the vehicle.",
  },
  {
    question: "Which bus terminal should I enter in my itinerary?",
    answer: "Use the full branch name and address printed on your ticket. Operators can have more than one facility in Baguio, and a shortened company name may lead to the wrong terminal.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Baguio Commute Guide: Jeepney, Taxi and Walking Tips",
      description: "A practical guide to commuting around Baguio City without a private car.",
      datePublished: updatedDate,
      dateModified: updatedDate,
      author: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      publisher: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      mainEntityOfPage: canonicalUrl,
      image: "https://baguiobuddy.com/assets/img/destinations/session-road.jpg",
    },
    {
      "@type": "ItemList",
      name: "Steps for a Baguio jeepney commute",
      numberOfItems: commuteSteps.length,
      itemListElement: commuteSteps.map((step, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: step.title,
        description: step.text,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://baguiobuddy.com" },
        { "@type": "ListItem", position: 2, name: "Baguio Commute Guide", item: canonicalUrl },
      ],
    },
  ],
};

export default function BaguioCommuteGuidePage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-commute">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Commute guide</span></nav>
          <span className="eyebrow"><Navigation size={15} /> First-time commuter</span>
          <h1>Baguio commute guide: how to travel by jeepney, taxi, and foot</h1>
          <p className="seo-guide-lead">
            You can explore Baguio without a private car, but a usable commute plan needs more than a map line.
            It should explain where to walk, what to confirm before boarding, where to alight, and how much uncertainty to allow.
          </p>
          <div className="seo-guide-meta"><span><Clock3 size={16} /> Updated September 29, 2026</span><span><BusFront size={16} /> For DIY and first-time visitors</span></div>
          <div className="seo-guide-actions">
            <Link href="/plan" className="button lime">Build a commute-aware itinerary <ArrowRight size={18} /></Link>
            <Link href="/resources" className="button dark">Check fares and resources</Link>
          </div>
        </div>
      </section>

      <section className="section seo-guide-mode-section" aria-labelledby="mode-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><Route size={15} /> Choose each leg</span><h2 id="mode-title">Use the right transport mode for the situation</h2><p>A practical Baguio day often uses all three modes rather than forcing every trip into one.</p></div>
          <div className="seo-guide-mode-grid">
            {modes.map(({ name, icon: Icon, bestFor, advice }) => (
              <article key={name}><span><Icon size={23} /></span><h3>{name}</h3><p><strong>Best for:</strong> {bestFor}</p><p>{advice}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-steps" aria-labelledby="jeepney-steps-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><Signpost size={15} /> Complete commute</span>
            <h2 id="jeepney-steps-title">Six parts of a safer Baguio jeepney trip</h2>
            <ol className="seo-guide-step-list">
              {commuteSteps.map((step, index) => (
                <li key={step.title}><strong>{index + 1}</strong><span><b>{step.title}</b><small>{step.text}</small></span></li>
              ))}
            </ol>
          </div>
          <aside className="seo-guide-warning">
            <Info size={22} />
            <h3>Google Maps is a road-path reference</h3>
            <p>When Google Maps cannot provide verified public-transit directions for a jeepney leg, a driving line only shows the road path. It does not verify the loading point, route signboard, transfer, or drop-off.</p>
            <a href={officialJeepneyDirectory} target="_blank" rel="noreferrer">Open the Baguio City jeepney route directory <ExternalLink size={16} /></a>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-clusters" aria-labelledby="clusters-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><MapPin size={15} /> Route examples</span><h2 id="clusters-title">Commute by area to avoid unnecessary backtracking</h2></div>
          <div className="seo-guide-cluster-grid">
            <article>
              <span>01</span><h3>East Baguio loop</h3>
              <p>Travel to Botanical Garden, then continue through The Mansion and Wright Park before Mines View and Good Shepherd. Confirm the best local sequence from your actual starting point and live traffic.</p>
              <Link href="/tourist-spots">See the East Baguio attractions <ArrowRight size={16} /></Link>
            </article>
            <article>
              <span>02</span><h3>City-center walk</h3>
              <p>Burnham Park, Baguio Cathedral, and Session Road can form a mostly walkable cluster. Use safer crossings and add time for uphill sections.</p>
              <Link href="/explore">Browse city-center places <ArrowRight size={16} /></Link>
            </article>
            <article>
              <span>03</span><h3>Camp John Hay visit</h3>
              <p>Choose an exact gate or attraction inside the estate. “Camp John Hay” is too broad for reliable arrival instructions, so plan the internal walk separately.</p>
              <Link href="/plan">Set your exact itinerary stops <ArrowRight size={16} /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section seo-guide-terminal" aria-labelledby="terminal-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><BaggageClaim size={15} /> Arrival and departure</span>
            <h2 id="terminal-title">Protect the parts of the trip that involve luggage</h2>
            <ul className="seo-guide-checklist">
              <li><CheckCircle2 size={17} /><span>Copy the full bus-terminal branch and address from your ticket.</span></li>
              <li><CheckCircle2 size={17} /><span>Ask the hotel about early bag drop or post-checkout storage.</span></li>
              <li><CheckCircle2 size={17} /><span>Confirm terminal-counter availability, fees, closing time, and claim process.</span></li>
              <li><CheckCircle2 size={17} /><span>Keep cash, documents, devices, medication, and other valuables with you.</span></li>
              <li><CheckCircle2 size={17} /><span>Arrive with the buffer required by your operator; do not plan around a last-minute terminal arrival.</span></li>
            </ul>
          </div>
          <aside className="seo-guide-terminal-card">
            <BusFront size={26} />
            <h3>Branch names matter</h3>
            <p>A company may use more than one Baguio facility. “Victory Liner Baguio” or another shortened operator name is not precise enough for navigation.</p>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-time-fare" aria-labelledby="time-fare-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow"><Clock3 size={15} /> Realistic allowance</span><h2 id="time-fare-title">What to include beyond the time shown on a map</h2></div>
          <div className="seo-guide-answer-grid">
            <article><Footprints /><h3>Access walk</h3><p>Time from the attraction exit to the actual loading area, including hills and crossings.</p></article>
            <article><Clock3 /><h3>Queue and wait</h3><p>Time before boarding, plus loading, traffic, and transfer uncertainty.</p></article>
            <article><MapPin /><h3>Final approach</h3><p>Time from drop-off to the safest public entrance—not merely the nearest map coordinate.</p></article>
          </div>
          <aside className="seo-guide-callout">
            <strong>Budget with a margin.</strong>
            <p>Jeepney and taxi rates can change. Review the fare policy effective on your travel date, then confirm posted fares or the taxi meter locally.</p>
            <Link href="/resources#fares">See Baguio Buddy&apos;s fare references <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Getting around</span><h2 id="faq-title">Baguio commute FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="related-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Keep planning</span><h2 id="related-title">Build a Baguio trip that fits your time</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/baguio-itinerary-3-days-2-nights"><Route /><span><strong>3 days and 2 nights itinerary</strong><small>Follow a practical first-timer route.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-trip-budget"><CarFront /><span><strong>Baguio trip budget</strong><small>Plan transport, meals, lodging, and extras.</small></span><ArrowRight /></Link>
            <Link href="/resources"><Info /><span><strong>Traveler resources</strong><small>Review live-reference notes before your trip.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
