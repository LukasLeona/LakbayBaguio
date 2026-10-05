import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BusFront,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Compass,
  Hotel,
  MapPinned,
  Route,
  SearchCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { GuideFactGrid } from "@/components/guide-data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { formatPeso, GUIDE_REVIEW_LABEL, sampleBasePerPerson, sampleBaseTotal, sampleReadyPerPerson } from "@/lib/travel-guide-data";

const canonicalPath = "/guides";
const reviewedDate = "2026-10-03";

export const metadata: Metadata = pageMetadata({
  title: "Baguio Travel Guides: Itinerary, Tourist Spots, Commute & Budget",
  description:
    "Read practical Baguio travel guides for a 3 days 2 nights itinerary, tourist spots, DIY commuting, trip budgets, hotels, bus travel, and first-time planning.",
  path: canonicalPath,
  type: "article",
  keywords: [
    "Baguio travel guide",
    "Baguio itinerary for first timers",
    "things to do in Baguio",
    "how to commute in Baguio",
    "where to stay in Baguio",
    "Manila to Baguio bus",
  ],
});

const guides = [
  {
    title: "Complete Baguio travel guide",
    description: "The main DIY planning guide: when to visit, buses, stays, commuter routes, 48 tourist spots, sample itineraries, expenses, meals, and luggage.",
    href: "/guides/baguio-travel-guide",
    label: "Start here",
    icon: BookOpenCheck,
  },
  {
    title: "Baguio itinerary: 3 days and 2 nights",
    description: "A practical DIY route with area clusters, meals, luggage, hotel timing, and a lighter departure day.",
    href: "/guides/baguio-itinerary-3-days-2-nights",
    label: "3D2N itinerary",
    icon: CalendarDays,
  },
  {
    title: "Tourist spots in Baguio by area",
    description: "Compare the East Baguio loop, city-center sights, Camp John Hay, west-side parks, and a La Trinidad side trip.",
    href: "/tourist-spots",
    label: "Places to visit",
    icon: MapPinned,
  },
  {
    title: "How to commute in Baguio without a car",
    description: "Understand jeepney loading points, taxi fallbacks, walking approaches, transfers, and exact map pins.",
    href: "/guides/baguio-commute-guide",
    label: "DIY commute",
    icon: BusFront,
  },
  {
    title: "Baguio trip budget guide",
    description: "Build a realistic allowance for transport, food, attractions, accommodation, shopping, and a contingency fund.",
    href: "/guides/baguio-trip-budget",
    label: "Budget and expenses",
    icon: CircleDollarSign,
  },
  {
    title: "Where to stay in Baguio",
    description: "Choose a hotel, transient, or Airbnb area based on walkability, your tourist spots, bus terminal, luggage, and checkout plan.",
    href: "/guides/where-to-stay-in-baguio",
    label: "Hotels and accommodation",
    icon: Hotel,
  },
  {
    title: "Manila to Baguio bus guide",
    description: "Compare booking and terminal checks for Victory Liner, Genesis, and JoyBus without relying on an outdated copied schedule.",
    href: "/guides/manila-to-baguio-bus-guide",
    label: "Bus schedules and terminals",
    icon: BusFront,
  },
  {
    title: "Baguio guide for first-time visitors",
    description: "Prepare for cool and changing weather, hills, attraction checks, food stops, the Night Market, and an enjoyable first day.",
    href: "/guides/baguio-first-timer-guide",
    label: "Weather, packing, and things to do",
    icon: Sparkles,
  },
] as const;

const planningQuestions = [
  {
    title: "How many days do I need?",
    copy: "Three days and two nights works well for a first visit when nearby attractions stay together and the final day remains flexible.",
  },
  {
    title: "Which tourist spots are near each other?",
    copy: "Botanical Garden, The Mansion, Wright Park, Mines View, and Good Shepherd belong in one East Baguio route rather than separate days.",
  },
  {
    title: "Can I tour Baguio without a car?",
    copy: "Yes. A practical DIY trip combines walkable city-center sections, verified jeepney legs, and taxis for luggage, rain, or difficult transfers.",
  },
  {
    title: "How much should I budget?",
    copy: "Start with your room share and bus tickets, then add food, local transport, entrance fees, pasalubong, and a 10–15% buffer.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}${canonicalPath}#collection`,
      name: "Baguio travel guides",
      description: "Practical guides for planning a DIY Baguio itinerary, tourist spots, commuting, and trip expenses.",
      url: `${SITE_URL}${canonicalPath}`,
      dateModified: reviewedDate,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "City", name: "Baguio City" },
      mainEntity: { "@id": `${SITE_URL}${canonicalPath}#guides` },
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}${canonicalPath}#guides`,
      name: "Baguio Buddy planning guides",
      numberOfItems: guides.length,
      itemListElement: guides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: `${SITE_URL}${guide.href}`,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Baguio travel guides", item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  ],
};

export default function GuidesPage() {
  return (
    <main id="main-content" className="seo-guide guide-library-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Travel guides</span>
          </nav>
          <span className="eyebrow"><BookOpenCheck size={15} /> Baguio Buddy guide library</span>
          <h1>Practical Baguio travel guides for planning your own trip</h1>
          <p className="seo-guide-lead">
            Start with a Baguio itinerary, compare tourist spots, learn how to commute without a car, and prepare a realistic trip budget.
            Every guide is written for first-time visitors who want a useful route—not only a long list of places.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Reviewed {GUIDE_REVIEW_LABEL}</span>
            <span><SearchCheck size={16} /> Helpful answers in one place</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/plan">Generate my Baguio itinerary <ArrowRight size={18} /></Link>
            <Link className="button dark" href="/explore">Explore Baguio places <Compass size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section guide-library-start" aria-labelledby="guide-start-title">
        <div className="shell">
          <div className="section-heading split">
            <div>
              <span className="eyebrow"><WalletCards size={15} /> Start with a real trip</span>
              <h2 id="guide-start-title">A complete 3D2N planning example, not a collection of vague tips</h2>
              <p>
                Our worked example follows two adults on a non-holiday weekday trip, with a booked-bus allowance,
                a traceable room example, six main meals, local transport, and selected entrance fees.
              </p>
            </div>
            <Link className="text-link" href="/guides/baguio-itinerary-3-days-2-nights">Open the complete example <ArrowRight size={16} /></Link>
          </div>
          <GuideFactGrid facts={[
            { label: "Base total for 2", value: formatPeso(sampleBaseTotal), detail: `${formatPeso(sampleBasePerPerson)} each before optional shopping`, icon: <WalletCards size={19} /> },
            { label: "Prepared target", value: `${formatPeso(sampleReadyPerPerson)}/person`, detail: "Includes a shopping cap and contingency fund", icon: <CircleDollarSign size={19} /> },
            { label: "Trip format", value: "3 days / 2 nights", detail: "Two adults, one shared room, DIY commute", icon: <CalendarDays size={19} /> },
            { label: "Source standard", value: "Dated + linked", detail: "Every changing price is labeled as a quote, range, or allowance", icon: <SearchCheck size={19} /> },
          ]} />
        </div>
      </section>

      <section className="section" aria-labelledby="guide-library-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Route size={15} /> Choose your next answer</span>
            <h2 id="guide-library-title">Baguio guides for the questions travelers ask most</h2>
            <p>Open the topic you need now. Each guide separates sourced facts from planning allowances and tells you what must be confirmed live.</p>
          </div>
          <div className="seo-guide-card-grid">
            {guides.map(({ title, description, href, label, icon: Icon }) => (
              <Link className="seo-guide-card" href={href} key={href}>
                <span><Icon size={21} /></span>
                <div><small>{label}</small><h3>{title}</h3><p>{description}</p></div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="quick-answers-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Quick planning answers</span>
            <h2 id="quick-answers-title">Build the trip around time, location, and energy</h2>
          </div>
          <div className="seo-guide-cluster-grid">
            {planningQuestions.map((item, index) => (
              <article key={item.title}>
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="guide-next-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Turn research into a route</span><h2 id="guide-next-title">Ready to plan the details?</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/plan"><Route /><span><strong>Build a personalized itinerary</strong><small>Plan around dates, hotel timing, luggage, and selected places.</small></span><ArrowRight /></Link>
            <Link href="/resources"><BookOpenCheck /><span><strong>Open traveler resources</strong><small>Review fares, luggage options, map notes, and verified directories.</small></span><ArrowRight /></Link>
            <a href="https://visita.baguio.gov.ph/" target="_blank" rel="noreferrer"><SearchCheck /><span><strong>Check Baguio VISITA</strong><small>Confirm registered stays, attraction details, and official local advisories.</small></span><ArrowRight /></a>
          </div>
        </div>
      </section>
    </main>
  );
}
