import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BedDouble,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPinned,
  Route,
  Ticket,
  Utensils,
  WalletCards,
} from "lucide-react";
import { GuideCostTable, GuideDisclosure, GuideFactGrid } from "@/components/guide-data";
import {
  formatPeso,
  GUIDE_REVIEW_LABEL,
  sampleBasePerPerson,
  sampleBaseTotal,
  sampleReadyPerPerson,
  sampleReadyTotal,
  sampleTripAssumptions,
  sampleTripCosts,
} from "@/lib/travel-guide-data";

const canonicalUrl = "https://baguiobuddy.com/guides/baguio-itinerary-3-days-2-nights";
const updatedDate = "2026-10-03";

export const metadata: Metadata = {
  title: "Baguio Itinerary 3 Days 2 Nights: DIY Commuter Guide",
  description:
    "Plan a practical Baguio itinerary for 3 days and 2 nights without a car. Follow an area-by-area route with realistic breaks, luggage tips, and commute notes.",
  alternates: { canonical: canonicalUrl },
  authors: [{ name: "Baguio Buddy", url: "https://baguiobuddy.com" }],
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Baguio Itinerary for 3 Days and 2 Nights",
    description:
      "A first-timer-friendly DIY Baguio route grouped by area, with commute guidance, meal breaks, and a relaxed checkout day.",
    siteName: "Baguio Buddy",
    publishedTime: updatedDate,
    modifiedTime: updatedDate,
    images: [
      {
        url: "https://baguiobuddy.com/assets/img/destinations/burnham-park.jpg",
        alt: "Burnham Park in Baguio City",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baguio 3 Days 2 Nights DIY Itinerary",
    description: "A practical, area-by-area Baguio itinerary for first-time commuters.",
    images: ["https://baguiobuddy.com/assets/img/destinations/burnham-park.jpg"],
  },
};

const days = [
  {
    name: "Day 1",
    area: "East Baguio and the city center",
    summary: "Classic parks in one cluster, then a slow city-center evening after hotel check-in.",
    stops: [
      "Arrival terminal and luggage storage or hotel bag drop",
      "Baguio Botanical Garden",
      "The Mansion and Wright Park",
      "Mines View Park and Good Shepherd Convent",
      "Hotel check-in and a proper rest",
      "Burnham Park, Baguio Cathedral, and Session Road",
      "Baguio Night Market when it is operating",
    ],
  },
  {
    name: "Day 2",
    area: "Camp John Hay, heritage, and west-side views",
    summary: "Use the full sightseeing day for larger places and protect time for lunch and traffic.",
    stops: [
      "Camp John Hay morning walk",
      "Lunch and commute buffer near the city center",
      "Mirador Heritage and Eco Park",
      "Diplomat Hotel or another nearby west-side stop",
      "Early dinner, café time, or an unhurried evening",
    ],
  },
  {
    name: "Day 3",
    area: "Checkout, pasalubong, and departure",
    summary: "Keep the final day light so luggage collection and the return trip never feel rushed.",
    stops: [
      "Breakfast, packing, and hotel checkout",
      "Leave luggage at the hotel or confirmed terminal counter",
      "Baguio City Market for vegetables and pasalubong",
      "Lunch near the city center",
      "Collect bags and arrive early at the exact departure terminal",
    ],
  },
] as const;

const faqs = [
  {
    question: "Is 3 days and 2 nights enough for Baguio?",
    answer:
      "Yes for a first visit, provided you group attractions by area. Three days can cover the East Baguio classics, one longer park or heritage day, and a relaxed market-and-departure morning without crossing the city repeatedly.",
  },
  {
    question: "Can I follow this Baguio itinerary without a car?",
    answer:
      "Yes. The route is designed for walking, jeepneys, and taxis. Confirm the jeepney signboard and loading point locally, and use Google Maps as a road or walking reference rather than proof of a jeepney route.",
  },
  {
    question: "Where should I put my luggage before hotel check-in?",
    answer:
      "Ask your hotel about early bag drop first. If it is unavailable, confirm baggage services with your exact bus terminal or another staffed counter before leaving anything. Keep valuables, medicines, and travel documents with you.",
  },
  {
    question: "Should Baguio City Market be on the last day?",
    answer:
      "Usually, yes. Buying vegetables and pasalubong near departure avoids carrying them through parks. Move the market earlier only when your checkout, departure time, or market plans make that safer.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Baguio Itinerary for 3 Days and 2 Nights: DIY Commuter Guide",
      description:
        "A practical three-day Baguio itinerary for first-time travelers using public transport.",
      datePublished: updatedDate,
      dateModified: updatedDate,
      author: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      publisher: { "@type": "Organization", name: "Baguio Buddy", url: "https://baguiobuddy.com" },
      mainEntityOfPage: canonicalUrl,
      image: "https://baguiobuddy.com/assets/img/destinations/burnham-park.jpg",
    },
    {
      "@type": "ItemList",
      name: "Baguio 3 days and 2 nights itinerary",
      numberOfItems: days.length,
      itemListElement: days.map((day, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${day.name}: ${day.area}`,
        description: day.summary,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://baguiobuddy.com" },
        { "@type": "ListItem", position: 2, name: "Baguio 3 Days 2 Nights Itinerary", item: canonicalUrl },
      ],
    },
  ],
};

export default function BaguioThreeDayItineraryPage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-itinerary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="seo-guide-hero section">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides">Guides</Link><span aria-hidden="true">/</span><span>3D2N itinerary</span>
          </nav>
          <span className="eyebrow"><CalendarDays size={15} /> First-timer route</span>
          <h1>Baguio itinerary for 3 days and 2 nights: a practical DIY commute plan</h1>
          <p className="seo-guide-lead">
            This Baguio 3 days and 2 nights itinerary groups nearby tourist spots, protects hotel and luggage time,
            and leaves room for meals, queues, traffic, and the city&apos;s hills. It is a starting plan—not a promise
            that every stop will fit every travel date.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Updated {GUIDE_REVIEW_LABEL}</span>
            <span><BusFront size={16} /> Best for DIY travelers without a car</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/plan">Build your own Baguio itinerary <ArrowRight size={18} /></Link>
            <Link className="button dark" href="/tourist-spots">Compare tourist spots</Link>
          </div>
        </div>
      </section>

      <section className="section guide-trip-snapshot" aria-labelledby="sample-cost-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><WalletCards size={15} /> Sample trip cost first</span>
            <h2 id="sample-cost-title">A 3D2N Baguio trip can cost about {formatPeso(sampleBasePerPerson)} per person</h2>
            <p>
              This worked example is for two adults traveling on non-holiday weekdays, sharing one room, commuting without a car,
              and following the sample itinerary below. The base total is {formatPeso(sampleBaseTotal)} for two; a more prepared
              total with shopping and a contingency fund is {formatPeso(sampleReadyTotal)}, or {formatPeso(sampleReadyPerPerson)} each.
            </p>
          </div>
          <GuideFactGrid facts={[
            { label: "Base trip for 2", value: formatPeso(sampleBaseTotal), detail: "Bus, shared room, food, local transport, and selected admissions", icon: <WalletCards size={19} /> },
            { label: "Stay example", value: `${formatPeso(sampleTripAssumptions.stayRate)}/night`, detail: `${sampleTripAssumptions.room}; 2 weekday nights`, icon: <BedDouble size={19} /> },
            { label: "Round-trip bus", value: `${formatPeso(sampleTripAssumptions.busFareEachWay * 2)}/person`, detail: `${sampleTripAssumptions.bus} planning example`, icon: <BusFront size={19} /> },
            { label: "Admissions", value: "₱285/person", detail: "Selected paid-stop allowances; free public areas excluded", icon: <Ticket size={19} /> },
          ]} />
          <GuideDisclosure>
            This is a transparent sample, not a package price or booking promise. The featured stay and restaurant are independent examples,
            not sponsors. Rates, availability, entrance policies, menus, bus classes, and storage fees can change; replace every allowance
            with a live quote for your dates before paying.
          </GuideDisclosure>
          <div className="section-heading guide-subheading">
            <span className="eyebrow">Where the total goes</span>
            <h2>Sample expenses for two travelers</h2>
          </div>
          <GuideCostTable costs={sampleTripCosts} caption="Sample Baguio 3 days and 2 nights expenses for two travelers" />
        </div>
      </section>

      <section className="section seo-guide-summary" aria-labelledby="quick-answer-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Quick answer</span>
            <h2 id="quick-answer-title">The most practical way to divide three days in Baguio</h2>
          </div>
          <div className="seo-guide-answer-grid">
            <article><MapPinned /><h3>Day 1</h3><p>East Baguio cluster, hotel check-in, then the walkable city-center sights.</p></article>
            <article><Route /><h3>Day 2</h3><p>Camp John Hay plus a west-side park or heritage stop, with a real lunch break.</p></article>
            <article><BaggageClaim /><h3>Day 3</h3><p>Checkout, City Market, pasalubong, luggage collection, and an early terminal arrival.</p></article>
          </div>
          <aside className="seo-guide-callout">
            <strong>Do not carry heavy bags around the parks.</strong>
            <p>Arrange a confirmed hotel bag drop or staffed luggage counter before sightseeing. Storage availability, fees, and closing times can change.</p>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="daily-route-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Day-by-day route</span>
            <h2 id="daily-route-title">A balanced Baguio itinerary with realistic transitions</h2>
            <p>Start earlier on busy weekends. Reverse a cluster when live traffic or opening conditions make another order more practical.</p>
          </div>

          <div className="seo-guide-day-list">
            {days.map((day, dayIndex) => (
              <article className="seo-guide-day-card" key={day.name}>
                <header>
                  <span>0{dayIndex + 1}</span>
                  <div><small>{day.name}</small><h3>{day.area}</h3><p>{day.summary}</p></div>
                </header>
                <ol>
                  {day.stops.map((stop) => <li key={stop}><CheckCircle2 size={17} /><span>{stop}</span></li>)}
                </ol>
                {dayIndex === 0 ? (
                  <div className="seo-guide-day-note">
                    <BedDouble size={18} />
                    <p><strong>Protect the middle of the day.</strong> Return for your luggage, check in, eat, and rest before the city-center evening.</p>
                  </div>
                ) : null}
                {dayIndex === 1 ? (
                  <div className="seo-guide-day-note">
                    <Utensils size={18} />
                    <p><strong>Keep one stop optional.</strong> If weather or traffic runs long, choose either Mirador or Diplomat instead of rushing both.</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-timing" aria-labelledby="timing-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><Clock3 size={15} /> Suggested rhythm</span>
            <h2 id="timing-title">How much time should you allow?</h2>
            <ul className="seo-guide-checklist">
              <li><strong>30–60 minutes</strong> for compact photo stops</li>
              <li><strong>60–120 minutes</strong> for larger parks and estates</li>
              <li><strong>45–75 minutes</strong> for lunch or dinner</li>
              <li><strong>15–30 minutes</strong> of uncertainty around each commute</li>
              <li><strong>At least 60 minutes</strong> before an important bus departure, or more when your operator advises it</li>
            </ul>
          </div>
          <aside className="seo-guide-warning">
            <h3>Check these before you leave</h3>
            <p>Opening days, admission fees, weather, Night Market operations, road closures, and bus-terminal details may change. Confirm the live information for your dates.</p>
            <Link href="/resources">Open traveler resources <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Planning questions</span><h2 id="faq-title">Baguio 3D2N itinerary FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="related-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Plan the details</span><h2 id="related-title">Continue building your Baguio trip</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/baguio-commute-guide"><BusFront /><span><strong>Baguio commute guide</strong><small>Understand jeepney, taxi, and walking legs.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-trip-budget"><Utensils /><span><strong>Baguio trip budget</strong><small>Estimate food, transport, stays, and extras.</small></span><ArrowRight /></Link>
            <Link href="/guides/where-to-stay-in-baguio"><BedDouble /><span><strong>Choose where to stay</strong><small>Match the hotel area to your route and luggage plan.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
