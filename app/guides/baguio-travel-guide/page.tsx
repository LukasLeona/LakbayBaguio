import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Backpack,
  BusFront,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CloudSun,
  Compass,
  Hotel,
  MapPinned,
  Route,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import {
  GuideByline,
  GuideFactGrid,
  GuideTableOfContents,
  type GuideTocItem,
} from "@/components/guide-data";
import {
  BAGUIO_GUIDE_PUBLISHED_DATE,
  BAGUIO_GUIDE_REVIEW_LABEL,
} from "@/lib/baguio-guide-data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { formatPeso, sampleBasePerPerson, sampleReadyPerPerson } from "@/lib/travel-guide-data";

const canonicalPath = "/guides/baguio-travel-guide";

export const metadata: Metadata = pageMetadata({
  title: "Baguio Travel Guide 2026: DIY Itinerary, Tourist Spots & Budget",
  description:
    "Plan a Baguio DIY trip without a car. Compare tourist-spot loops, a practical 3D2N itinerary, commute guidance, accommodation areas, meals, luggage, and an itemized budget.",
  path: canonicalPath,
  type: "article",
  image: "/assets/img/destinations/botanical-garden.jpg",
  keywords: [
    "Baguio travel guide 2026",
    "Baguio DIY travel guide",
    "Baguio itinerary without car",
    "Baguio tourist spots itinerary",
    "Baguio trip expenses",
  ],
});

const tocItems: readonly GuideTocItem[] = [
  { href: "#quick-plan", label: "Trip at a glance", description: "How many days, how much, and what kind of route" },
  { href: "#when-to-go", label: "When to visit", description: "Weather, crowds, rain, and festival periods" },
  { href: "#getting-there", label: "Getting to Baguio", description: "Bus booking and exact terminal checks" },
  { href: "#where-to-stay", label: "Where to stay", description: "Choose an area around your route, not only room price" },
  { href: "#getting-around", label: "Getting around", description: "Walks, jeepneys, taxis, loading points, and transfers" },
  { href: "#tourist-spots", label: "Tourist-spot loops", description: "Nearby places grouped into practical days" },
  { href: "#sample-itineraries", label: "Sample itineraries", description: "2D1N, 3D2N, and 4D3N route ideas" },
  { href: "#budget", label: "Budget and expenses", description: "A transparent per-person planning example" },
  { href: "#food-and-rest", label: "Food, rest, and luggage", description: "The parts efficient-looking plans often forget" },
  { href: "#faq", label: "First-timer FAQ", description: "Fast answers before you generate a route" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${SITE_URL}${canonicalPath}#article`,
      headline: "Baguio Travel Guide 2026: DIY Itinerary, Tourist Spots and Budget",
      description: "A commuter-first Baguio travel guide with route clusters, sample itineraries, budget planning, luggage, meals, and hotel timing.",
      datePublished: BAGUIO_GUIDE_PUBLISHED_DATE,
      dateModified: BAGUIO_GUIDE_PUBLISHED_DATE,
      inLanguage: "en-PH",
      isAccessibleForFree: true,
      author: { "@type": "Organization", name: "Baguio Buddy", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Baguio Buddy",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/baguio-buddy-logo-512.png` },
      },
      image: `${SITE_URL}/assets/img/destinations/botanical-garden.jpg`,
      mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
      about: [
        { "@type": "City", name: "Baguio City" },
        { "@type": "Thing", name: "Baguio itinerary" },
        { "@type": "Thing", name: "Baguio tourist spots" },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Travel guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: "Baguio travel guide", item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  ],
};

export default function BaguioTravelGuidePage() {
  return (
    <main id="main-content" className="seo-guide complete-baguio-guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <section className="section seo-guide-hero complete-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides">Travel guides</Link><span aria-hidden="true">/</span><span>Baguio travel guide</span>
          </nav>
          <span className="eyebrow"><Compass size={15} /> Complete commuter-first guide</span>
          <h1>Baguio travel guide: plan a DIY trip that works beyond the checklist</h1>
          <p className="seo-guide-lead">
            Build a first-time Baguio trip around nearby places, realistic commute time, meals, luggage, hotel timing,
            hills, and weather. This guide shows the decisions behind the route—then lets you generate your own.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Reviewed {BAGUIO_GUIDE_REVIEW_LABEL}</span>
            <span><BusFront size={16} /> Written for DIY commuters</span>
            <span><ShieldCheck size={16} /> Changing details are labeled</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/plan">Generate my itinerary <ArrowRight size={18} /></Link>
            <a className="button dark" href="#quick-plan">Read the guide <Compass size={18} /></a>
          </div>
        </div>
      </section>

      <section className="section complete-guide-byline-section">
        <div className="shell">
          <GuideByline
            reviewed={BAGUIO_GUIDE_REVIEW_LABEL}
            scope="Built from the destination, route, timing, fare, and luggage records used by the Baguio Buddy itinerary planner. Live operating details still require a final check."
          />
        </div>
      </section>

      <section className="section complete-guide-toc-section">
        <div className="shell"><GuideTableOfContents items={tocItems} /></div>
      </section>

      <section id="quick-plan" className="section guide-trip-snapshot complete-guide-section" aria-labelledby="quick-plan-title">
        <div className="shell">
          <div className="section-heading split">
            <div>
              <span className="eyebrow"><Route size={15} /> The short answer</span>
              <h2 id="quick-plan-title">A useful first Baguio trip in four decisions</h2>
              <p>Start with your available hours, accommodation timing, must-see places, and tolerance for hills. Everything else should support those choices.</p>
            </div>
            <Link className="text-link" href="/guides/baguio-itinerary-3-days-2-nights">See the detailed 3D2N example <ArrowRight size={16} /></Link>
          </div>
          <GuideFactGrid facts={[
            { label: "Recommended first visit", value: "3 days / 2 nights", detail: "Enough for two main loops and a lighter departure day", icon: <CalendarDays size={19} /> },
            { label: "Prepared target", value: `${formatPeso(sampleReadyPerPerson)}/person`, detail: "Worked example with shopping cap and contingency", icon: <CircleDollarSign size={19} /> },
            { label: "Route principle", value: "One area at a time", detail: "Avoid crossing the city after every attraction", icon: <MapPinned size={19} /> },
            { label: "Transport mix", value: "Walk + jeep + taxi", detail: "Use taxis strategically for luggage, rain, or difficult transfers", icon: <BusFront size={19} /> },
          ]} />

          <div className="complete-guide-decision-grid">
            <article><span><Backpack /></span><h3>Arriving before check-in?</h3><p>Confirm a staffed hotel or terminal bag counter before sightseeing. Never make a relaxed route depend on carrying heavy luggage.</p></article>
            <article><span><Hotel /></span><h3>Staying outside the center?</h3><p>Budget the morning access ride and the trip home. A cheaper room can add repeated fares and transfers.</p></article>
            <article><span><Utensils /></span><h3>Planning a packed day?</h3><p>Protect lunch, one seated recovery period, and a weather buffer before adding another place.</p></article>
            <article><span><CloudSun /></span><h3>Traveling in uncertain weather?</h3><p>Keep a museum, café, market, or city-center alternative that does not depend on a clear viewpoint.</p></article>
          </div>

          <aside className="complete-guide-answer">
            <strong>How much is a Baguio trip?</strong>
            <p>
              The worked 3D2N example starts at about <b>{formatPeso(sampleBasePerPerson)} per person</b> for two adults sharing a room,
              before optional shopping and contingency. Your actual bus, stay, food choices, attractions, and group size will change it.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

