import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BedDouble,
  BusFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Footprints,
  Hotel,
  MapPin,
  Route,
  ShieldCheck,
  Trees,
} from "lucide-react";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";

const canonicalPath = "/guides/where-to-stay-in-baguio";
const publishedDate = "2026-10-02";
const officialStayDirectory = "https://visita.baguio.gov.ph/";

export const metadata: Metadata = pageMetadata({
  title: "Where to Stay in Baguio: Best Areas for First-Time Visitors",
  description:
    "Choose where to stay in Baguio based on Burnham Park, Session Road, tourist spots, bus terminals, walkability, luggage, check-in, and your DIY itinerary.",
  path: canonicalPath,
  type: "article",
  keywords: [
    "where to stay in Baguio",
    "hotel near Burnham Park",
    "hotel near Session Road Baguio",
    "Baguio accommodation for first timers",
    "Baguio transient house",
    "Baguio Airbnb",
    "best area to stay in Baguio without a car",
  ],
});

const stayAreas = [
  {
    area: "Burnham Park and the city center",
    icon: Footprints,
    bestFor: "First-time visitors, travelers without a car, evening walks, and short stays",
    tradeoff: "Central convenience can mean more street activity, weekend traffic, and limited parking.",
    nearby: "Burnham Park, Session Road, Baguio Cathedral, City Market, cafés, and the Night Market area",
  },
  {
    area: "Upper Session Road and Marcoville",
    icon: BusFront,
    bestFor: "Travelers prioritizing terminal access, city-center connections, and a practical arrival or departure",
    tradeoff: "Confirm the exact address and hill approach; a property described as near Session Road may still involve a climb.",
    nearby: "Bus facilities, SM Baguio, Session Road, and roads toward Camp John Hay or East Baguio",
  },
  {
    area: "Leonard Wood, Teachers Camp, and East Baguio approach",
    icon: MapPin,
    bestFor: "Visitors focused on Botanical Garden, Wright Park, The Mansion, and Mines View",
    tradeoff: "You may need a ride for the city-center evening and should verify where the nearest jeepney loading point actually is.",
    nearby: "Botanical Garden, Teachers Camp, Wright Park, The Mansion, and the Mines View corridor",
  },
  {
    area: "Camp John Hay and south Baguio",
    icon: Trees,
    bestFor: "Quiet pine surroundings, resort time, trail walks, and travelers who want the stay itself to be part of the trip",
    tradeoff: "The estate is large. Check the exact building pin, on-site transport, and distance to the entrance before booking.",
    nearby: "Camp John Hay attractions, forest walks, restaurants, and roads toward Loakan or the city center",
  },
  {
    area: "Dominican Hill and west Baguio",
    icon: Hotel,
    bestFor: "Travelers visiting Mirador, Diplomat Hotel, Lourdes Grotto, or quieter residential areas",
    tradeoff: "Slopes can make a short map distance tiring. Plan a taxi fallback for luggage, rain, or late arrivals.",
    nearby: "Mirador Heritage and Eco Park, Diplomat Hotel, Lourdes Grotto, and roads toward Tam-awan",
  },
] as const;

const bookingChecks = [
  "Confirm the property name, complete address, and Google Maps share link—not only a social-media pin.",
  "Check the exact check-in and checkout times and whether late arrival is accepted.",
  "Ask whether staffed luggage storage is available before check-in and after checkout.",
  "Verify stairs, steep access roads, elevator availability, and room location when mobility matters.",
  "Review taxes, cleaning fees, deposits, parking charges, and cancellation conditions before paying.",
  "Keep the host or front-desk contact and booking receipt available offline.",
] as const;

const faqs = [
  {
    question: "What is the best area to stay in Baguio for first-time visitors?",
    answer:
      "The Burnham Park and Session Road area is usually the easiest base for a first visit without a car because food, shops, and several city-center sights are walkable. The best choice still depends on your exact itinerary and tolerance for traffic or hills.",
  },
  {
    question: "Should I book a hotel near Burnham Park?",
    answer:
      "A hotel near Burnham Park works well when you want a walkable evening, easy meals, and quick access to the market or city-center transport. Check the actual walking route because nearby listings may still sit above or below a steep road.",
  },
  {
    question: "Is Camp John Hay a convenient place to stay without a car?",
    answer:
      "It is excellent for a quieter pine setting, but less convenient for a city-center-heavy itinerary. Confirm the property's exact location inside the estate and budget for taxis or longer access walks.",
  },
  {
    question: "How can I check whether a Baguio accommodation is registered?",
    answer:
      "Use the City Government's Baguio VISITA portal to review registered accommodation listings, then confirm booking and property details through the accommodation's official channel or a provider you trust.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Where to Stay in Baguio: Best Areas for First-Time Visitors",
      description: "A practical guide to choosing a Baguio accommodation area around an itinerary, transport, and luggage needs.",
      datePublished: publishedDate,
      dateModified: publishedDate,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
      image: `${SITE_URL}/assets/img/destinations/burnham-park.jpg`,
      about: { "@type": "City", name: "Baguio City" },
    },
    {
      "@type": "ItemList",
      name: "Areas to stay in Baguio",
      numberOfItems: stayAreas.length,
      itemListElement: stayAreas.map((area, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: area.area,
        description: area.bestFor,
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
        { "@type": "ListItem", position: 3, name: "Where to stay in Baguio", item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  ],
};

export default function WhereToStayInBaguioPage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-stays">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides">Guides</Link><span aria-hidden="true">/</span><span>Where to stay</span>
          </nav>
          <span className="eyebrow"><BedDouble size={15} /> Accommodation planning</span>
          <h1>Where to stay in Baguio: choose an area that fits your itinerary</h1>
          <p className="seo-guide-lead">
            The best Baguio hotel, transient, or Airbnb is not always the cheapest or closest-looking pin. Choose a base around the places you want to visit,
            your bus terminal, the city&apos;s hills, and what happens to your luggage before check-in and after checkout.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Reviewed October 2, 2026</span>
            <span><Footprints size={16} /> Written for DIY travelers without a car</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/explore?type=hotel">Browse Baguio stays <ArrowRight size={18} /></Link>
            <Link className="button dark" href="/plan">Plan around my hotel <Route size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="areas-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><MapPin size={15} /> Neighborhood guide</span>
            <h2 id="areas-title">The best Baguio area depends on how you want to spend the day</h2>
            <p>Use these areas as planning zones. Always verify the exact property entrance and walking route before booking.</p>
          </div>
          <div className="seo-guide-day-list">
            {stayAreas.map(({ area, icon: Icon, bestFor, tradeoff, nearby }, index) => (
              <article className="seo-guide-day-card" key={area}>
                <header><span>0{index + 1}</span><div><small>Stay area</small><h3>{area}</h3></div></header>
                <p><strong>Best for:</strong> {bestFor}</p>
                <p><strong>Near:</strong> {nearby}</p>
                <div className="seo-guide-day-note"><Icon size={18} /><p><strong>Consider:</strong> {tradeoff}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="booking-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><ShieldCheck size={15} /> Before paying</span>
            <h2 id="booking-title">A safer Baguio accommodation checklist</h2>
            <ul className="seo-guide-checklist">
              {bookingChecks.map((check) => <li key={check}><CheckCircle2 size={17} /><span>{check}</span></li>)}
            </ul>
          </div>
          <aside className="seo-guide-warning">
            <h3>Check the official stay directory</h3>
            <p>Baguio VISITA is the City Government&apos;s tourism portal for registered accommodations, attractions, and local advisories. Registration does not replace your own booking checks.</p>
            <a href={officialStayDirectory} target="_blank" rel="noreferrer">Open Baguio VISITA <ExternalLink size={16} /></a>
          </aside>
        </div>
      </section>

      <section className="section" aria-labelledby="luggage-title">
        <div className="shell">
          <div className="seo-guide-callout">
            <BaggageClaim size={22} />
            <strong id="luggage-title">Arriving before hotel check-in?</strong>
            <p>Ask your property about early bag drop before building a morning sightseeing route. If it is unavailable, confirm a staffed terminal or luggage counter and keep valuables, medicines, and travel documents with you.</p>
          </div>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="stay-faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Accommodation questions</span><h2 id="stay-faq-title">Where-to-stay FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="stay-next-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Continue planning</span><h2 id="stay-next-title">Match the stay to the whole trip</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/baguio-itinerary-3-days-2-nights"><Route /><span><strong>Read the 3D2N itinerary</strong><small>See where hotel check-in and rest belong in the route.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-trip-budget"><Hotel /><span><strong>Build a trip budget</strong><small>Calculate the room share with transport, food, and activities.</small></span><ArrowRight /></Link>
            <Link href="/resources"><BusFront /><span><strong>Review luggage resources</strong><small>Check possible counters and terminal reminders.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
