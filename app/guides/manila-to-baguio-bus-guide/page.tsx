import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BusFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Route,
  ShieldAlert,
  TicketCheck,
} from "lucide-react";
import { GuideDisclosure, GuideFactGrid, GuideSourceList } from "@/components/guide-data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { GUIDE_REVIEW_LABEL, guideSources } from "@/lib/travel-guide-data";

const canonicalPath = "/guides/manila-to-baguio-bus-guide";
const publishedDate = "2026-10-03";
const victoryTerminalGuide = "https://staging.victoryliner.com/TerminalGuide.aspx";
const genesisSchedules = "https://genesisjoybus.com/schedules/";

export const metadata: Metadata = pageMetadata({
  title: "Manila to Baguio Bus Guide: Victory Liner, Genesis & JoyBus",
  description:
    "Plan a Manila to Baguio bus trip with practical booking, terminal, luggage, arrival, and return-trip checks for Victory Liner, Genesis, and JoyBus.",
  path: canonicalPath,
  type: "article",
  keywords: [
    "Manila to Baguio bus",
    "Victory Liner Manila to Baguio",
    "Victory Liner Baguio terminal",
    "Genesis bus schedule to Baguio",
    "JoyBus Cubao to Baguio",
    "Baguio bus terminal",
    "how to go to Baguio by bus",
  ],
});

const tripSteps = [
  {
    title: "Choose the Metro Manila origin you can reach reliably",
    text: "Operators may serve Cubao, Pasay, Avenida, airport, or other terminals depending on the trip. Compare the exact departure address—not only the operator name.",
  },
  {
    title: "Book from a current official channel",
    text: "Schedules, fares, bus classes, and boarding rules can change. Use the operator's current booking or terminal channel close to your travel date.",
  },
  {
    title: "Save the complete terminal identity",
    text: "Keep the branch name, street address, map pin, departure time, and operator contact with your ticket. A shortened terminal label is not enough.",
  },
  {
    title: "Arrive with a boarding allowance",
    text: "Protect time for traffic to the terminal, ticket or identity checks, baggage loading, restroom use, and locating the correct bay.",
  },
  {
    title: "Plan the Baguio arrival before boarding",
    text: "Know whether you will go to the hotel, use a confirmed baggage counter, eat first, or begin a light city route after arrival.",
  },
  {
    title: "Protect the return trip",
    text: "Confirm the Baguio departure branch shown on the return ticket and collect stored luggage early. Do not assume the arrival and departure facility are identical.",
  },
] as const;

const operatorChecks = [
  {
    name: "Victory Liner",
    detail:
      "The operator's terminal directory lists both a Governor Pack Road facility and a passenger center on Upper Session Road in Marcoville. Follow the exact branch printed on your ticket.",
    link: victoryTerminalGuide,
    linkLabel: "Open Victory Liner terminal guide",
  },
  {
    name: "Genesis / JoyBus",
    detail:
      "Available origins, classes, departure times, and fares vary. The schedule page itself warns that schedules may change, so recheck shortly before travel.",
    link: genesisSchedules,
    linkLabel: "Open Genesis and JoyBus schedules",
  },
] as const;

const faqs = [
  {
    question: "How long is the bus from Manila to Baguio?",
    answer:
      "Plan for a multi-hour trip and allow extra time for Metro Manila traffic, rest stops, weather, and congestion approaching Baguio. Use the duration shown for your specific booked service rather than treating a generic estimate as guaranteed.",
  },
  {
    question: "Should I take Victory Liner or Genesis/JoyBus to Baguio?",
    answer:
      "Choose based on the departure terminal you can reach, a schedule that fits your hotel and first day, the available bus class, current fare, and the exact Baguio terminal. There is no single best option for every traveler.",
  },
  {
    question: "Where does the bus arrive in Baguio?",
    answer:
      "It depends on the operator and service. Save the complete branch name and address from your ticket. Victory Liner, for example, publishes more than one Baguio facility, so the company name alone is ambiguous.",
  },
  {
    question: "Can I start sightseeing immediately after arriving in Baguio?",
    answer:
      "Only if you are rested and have a confirmed plan for your bags. For an early arrival, arrange hotel bag drop or a staffed luggage counter before visiting parks. Keep the first route flexible when an overnight journey leaves you tired.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Manila to Baguio Bus Guide: Victory Liner, Genesis and JoyBus",
      description: "A practical first-timer guide to booking and checking terminals for a Manila to Baguio bus trip.",
      datePublished: publishedDate,
      dateModified: publishedDate,
      inLanguage: "en-PH",
      isAccessibleForFree: true,
      citation: [guideSources.genesis.url, guideSources.victory.url],
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
      image: `${SITE_URL}/assets/img/destinations/session-road.jpg`,
      about: [
        { "@type": "City", name: "Baguio City" },
        { "@type": "Thing", name: "Bus travel" },
      ],
    },
    {
      "@type": "HowTo",
      name: "How to prepare for a Manila to Baguio bus trip",
      step: tripSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.text,
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
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Travel guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: "Manila to Baguio bus guide", item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  ],
};

export default function ManilaToBaguioBusGuidePage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-bus">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides">Guides</Link><span aria-hidden="true">/</span><span>Manila to Baguio bus</span>
          </nav>
          <span className="eyebrow"><BusFront size={15} /> First-timer transport guide</span>
          <h1>Manila to Baguio bus guide: book the trip and the correct terminal</h1>
          <p className="seo-guide-lead">
            Compare Victory Liner, Genesis, and JoyBus using the trip that is actually available for your date. This guide focuses on the checks that remain useful
            when schedules change: the exact terminal, boarding time, baggage plan, Baguio arrival, and return branch.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Reviewed {GUIDE_REVIEW_LABEL}</span>
            <span><TicketCheck size={16} /> Verify live schedules before paying</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/plan">Plan my Baguio arrival <ArrowRight size={18} /></Link>
            <Link className="button dark" href="/guides/baguio-itinerary-3-days-2-nights">Read the 3D2N itinerary <Route size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section guide-trip-snapshot" aria-labelledby="bus-price-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><TicketCheck size={15} /> Current planning snapshot</span>
            <h2 id="bus-price-title">Published Cubao–Baguio fares start around ₱695</h2>
            <p>
              Genesis/JoyBus currently publishes a ₱695–₱880 range across Deluxe, Executive, and Premiere services,
              an estimated 5–6 hour journey, and 15 daily trips on its Cubao–Baguio route page. Treat this as a
              planning snapshot; the ticket checkout for your date and class is the price that matters.
            </p>
          </div>
          <GuideFactGrid facts={[
            { label: "Published fare range", value: "₱695–₱880", detail: "One way on the referenced Cubao–Baguio schedule", icon: <TicketCheck size={19} /> },
            { label: "Published duration", value: "5–6 hours", detail: "Allow more for traffic, weather, stops, and peak periods", icon: <Clock3 size={19} /> },
            { label: "Sample round trip", value: "₱1,390/person", detail: "Two ₱695 tickets; replace with the actual booked fare", icon: <BusFront size={19} /> },
            { label: "Boarding buffer", value: "45–60+ min", detail: "Follow the operator's latest instruction on your ticket", icon: <Navigation size={19} /> },
          ]} />
          <GuideDisclosure>
            Baguio Buddy does not sell bus tickets. We do not recommend choosing solely by the lowest fare: compare the
            exact Metro Manila origin, Baguio terminal, departure time, bus class, baggage policy, and refund or rebooking rules.
          </GuideDisclosure>
        </div>
      </section>

      <section className="section" aria-labelledby="bus-steps-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><Navigation size={15} /> From booking to arrival</span>
            <h2 id="bus-steps-title">Six checks for a smoother Baguio bus trip</h2>
            <ol className="seo-guide-step-list">
              {tripSteps.map((step, index) => (
                <li key={step.title}><strong>{index + 1}</strong><span><b>{step.title}</b><small>{step.text}</small></span></li>
              ))}
            </ol>
          </div>
          <aside className="seo-guide-terminal-card">
            <ShieldAlert size={24} />
            <h3>Do not copy an old timetable into your itinerary</h3>
            <p>Operator schedules and fares can change without notice, particularly around holidays and peak travel periods. Link to a current source, then save the exact booked trip with your ticket.</p>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="operators-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><TicketCheck size={15} /> Operator checks</span>
            <h2 id="operators-title">Victory Liner, Genesis, and JoyBus: what to confirm</h2>
            <p>These links are for live verification. Your ticket remains the source for your specific bus, time, class, and terminal.</p>
          </div>
          <div className="seo-guide-mode-grid">
            {operatorChecks.map((operator) => (
              <article key={operator.name}>
                <span><BusFront size={21} /></span>
                <h3>{operator.name}</h3>
                <p>{operator.detail}</p>
                <p><a href={operator.link} target="_blank" rel="noreferrer">{operator.linkLabel} <ExternalLink size={14} /></a></p>
              </article>
            ))}
            <article>
              <span><MapPin size={21} /></span>
              <h3>Your exact terminal</h3>
              <p>Save the complete branch name, address, and pin in the planner. Confirm that the location matches the ticket before opening directions or sharing the itinerary.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="bus-baggage-title">
        <div className="shell">
          <div className="seo-guide-callout">
            <BaggageClaim size={22} />
            <strong id="bus-baggage-title">Protect your bags and the first morning.</strong>
            <p>If hotel check-in is later than arrival, confirm early bag drop or a staffed baggage counter before sightseeing. Never leave valuables, medicine, identification, or travel documents in stored luggage.</p>
          </div>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="bus-faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Bus travel questions</span><h2 id="bus-faq-title">Manila–Baguio bus FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Bus guide sources">
        <div className="shell"><GuideSourceList reviewed={GUIDE_REVIEW_LABEL} sources={[guideSources.genesis, guideSources.victory]} /></div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="bus-next-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">After booking</span><h2 id="bus-next-title">Build the Baguio side of the journey</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/where-to-stay-in-baguio"><MapPin /><span><strong>Choose where to stay</strong><small>Compare areas around the terminal and tourist spots.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-commute-guide"><BusFront /><span><strong>Learn local commuting</strong><small>Plan jeepney, taxi, and walking connections.</small></span><ArrowRight /></Link>
            <Link href="/resources"><CheckCircle2 /><span><strong>Review traveler resources</strong><small>Open luggage, fare, route, and exact-pin references.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
