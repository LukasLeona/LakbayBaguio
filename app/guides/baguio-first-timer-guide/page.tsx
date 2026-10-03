import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BaggageClaim,
  BusFront,
  CheckCircle2,
  Clock3,
  CloudRain,
  Coffee,
  ExternalLink,
  Footprints,
  MapPinned,
  Route,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trees,
  Umbrella,
  Utensils,
} from "lucide-react";
import { GuideDisclosure, GuideFactGrid, GuideSourceList } from "@/components/guide-data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { GUIDE_REVIEW_LABEL, guideSources } from "@/lib/travel-guide-data";

const canonicalPath = "/guides/baguio-first-timer-guide";
const publishedDate = "2026-10-03";
const baguioVisitaUrl = "https://visita.baguio.gov.ph/";
const pagasaUrl = "https://www.pagasa.dost.gov.ph/weather";

export const metadata: Metadata = pageMetadata({
  title: "Baguio Travel Guide for First-Time Visitors: Things to Do & Tips",
  description:
    "Prepare for your first Baguio trip with practical advice on weather, what to wear, things to do, tourist-spot hours and fees, food, Night Market, and commuting.",
  path: canonicalPath,
  type: "article",
  keywords: [
    "Baguio travel guide",
    "Baguio guide for first timers",
    "things to do in Baguio",
    "best time to visit Baguio",
    "Baguio weather what to wear",
    "Baguio entrance fees",
    "Baguio tourist spots opening hours",
    "Baguio Night Market schedule",
    "where to eat in Baguio",
  ],
});

const firstTripPriorities = [
  {
    title: "See one complete area at a time",
    icon: MapPinned,
    text: "Visit the East Baguio cluster together, keep the city center together, and give Camp John Hay or a west-side park its own protected time.",
  },
  {
    title: "Leave space to enjoy the weather",
    icon: Trees,
    text: "A café stop, pine walk, or slow park visit is part of the Baguio experience. Avoid turning every hour into another transfer.",
  },
  {
    title: "Keep a rain and traffic fallback",
    icon: CloudRain,
    text: "Opening conditions, visibility, queues, road traffic, and rain can change the plan. Mark one stop optional instead of rushing the whole day.",
  },
] as const;

const thingsToDo = [
  {
    title: "Parks and mountain views",
    icon: Trees,
    text: "Walk through Botanical Garden or Burnham Park, then choose a clear-weather viewpoint such as Mines View. Allow more time than the map distance suggests because of hills and crowds.",
  },
  {
    title: "Cordilleran culture and local art",
    icon: Sparkles,
    text: "Add a cultural stop such as Tam-awan, a museum, or a local craft space. Read current access details and engage respectfully with people, artworks, and traditions.",
  },
  {
    title: "Food, cafés, and warm breaks",
    icon: Utensils,
    text: "Reserve actual meal blocks and one unhurried café or snack stop. The city is more enjoyable when eating is part of the plan rather than something squeezed between rides.",
  },
  {
    title: "Night Market and evening walks",
    icon: ShoppingBag,
    text: "Pair Session Road, Cathedral, and the Night Market area after a hotel rest. Confirm current Night Market operations and street conditions on the day you visit.",
  },
  {
    title: "Pasalubong and the City Market",
    icon: ShoppingBag,
    text: "Place shopping close to checkout or departure so you do not carry produce and souvenirs through parks. Protect time to collect stored luggage afterward.",
  },
  {
    title: "A DIY commute experience",
    icon: BusFront,
    text: "Use jeepneys only after confirming the loading point and signboard. Keep taxis as a practical fallback for luggage, rain, unfamiliar transfers, or steep access roads.",
  },
] as const;

const packingList = [
  "A light layer or jacket that can be removed as the day warms",
  "Compact rain protection and a cover or pouch for electronics",
  "Comfortable shoes with grip for hills, steps, and wet pavement",
  "Water, essential medicine, and a small reusable bag",
  "A charged phone, power bank, and offline copies of tickets and booking details",
  "Only the valuables you can comfortably keep with you",
] as const;

const liveChecks = [
  {
    title: "Weather and rain",
    text: "Check the official forecast close to departure and again each morning.",
    href: pagasaUrl,
    label: "Open PAGASA weather",
  },
  {
    title: "Attraction hours and entrance fees",
    text: "Review Baguio VISITA or the attraction's official channel instead of relying on an old copied list.",
    href: baguioVisitaUrl,
    label: "Open Baguio VISITA",
  },
  {
    title: "Events and local advisories",
    text: "Weekend activities, holidays, closures, and traffic rules can change access and travel time.",
    href: `${baguioVisitaUrl}bulletin`,
    label: "Open local bulletins",
  },
] as const;

const faqs = [
  {
    question: "What is the best time to visit Baguio?",
    answer:
      "The best date depends on the experience you want and your tolerance for crowds, rain, and holiday traffic. Review the seasonal forecast, city events, accommodation availability, and transport before booking rather than choosing by temperature alone.",
  },
  {
    question: "What should I wear in Baguio?",
    answer:
      "Dress in light layers and wear comfortable shoes with grip. Bring compact rain protection because conditions can change during the day. Check the current forecast instead of assuming Baguio will always feel cold.",
  },
  {
    question: "What are the best things to do in Baguio for first-timers?",
    answer:
      "A strong first visit combines the East Baguio parks and viewpoints, a city-center walk around Burnham and Session Road, one larger destination such as Camp John Hay or Mirador, local food, and relaxed time rather than nonstop transfers.",
  },
  {
    question: "What time is the Baguio Night Market?",
    answer:
      "Operating schedules and street conditions can change. Confirm the current city advisory on your travel date and keep another evening option in case the market is delayed, crowded, or not operating.",
  },
  {
    question: "Are Baguio tourist spots free?",
    answer:
      "Some public spaces have no general admission, while other attractions, parking areas, activities, or special sections charge fees. Check current official details for every paid stop before finalizing the budget.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Baguio Travel Guide for First-Time Visitors: Things to Do and Practical Tips",
      description: "A first-time Baguio guide covering weather, packing, things to do, live attraction checks, food, and commuting.",
      datePublished: publishedDate,
      dateModified: publishedDate,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
      image: `${SITE_URL}/assets/img/destinations/botanical-garden.jpg`,
      about: { "@type": "City", name: "Baguio City" },
    },
    {
      "@type": "ItemList",
      name: "Things to do in Baguio for first-time visitors",
      numberOfItems: thingsToDo.length,
      itemListElement: thingsToDo.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        description: item.text,
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
        { "@type": "ListItem", position: 3, name: "Baguio first-timer guide", item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  ],
};

export default function BaguioFirstTimerGuidePage() {
  return (
    <main id="main-content" className="seo-guide seo-guide-first-timer">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <section className="section seo-guide-hero">
        <div className="shell seo-guide-hero-inner">
          <nav className="seo-guide-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides">Guides</Link><span aria-hidden="true">/</span><span>First-timer guide</span>
          </nav>
          <span className="eyebrow"><Sparkles size={15} /> First Baguio trip</span>
          <h1>Baguio travel guide for first-time visitors: enjoy the city without rushing it</h1>
          <p className="seo-guide-lead">
            Prepare for hills, cool and changing weather, busy roads, park queues, good food, and the temptation to add too many stops.
            This first-timer guide helps you decide what to do, what to pack, and what must be checked live before leaving.
          </p>
          <div className="seo-guide-meta">
            <span><Clock3 size={16} /> Reviewed {GUIDE_REVIEW_LABEL}</span>
            <span><Footprints size={16} /> Designed for DIY commuters</span>
          </div>
          <div className="seo-guide-actions">
            <Link className="button lime" href="/plan">Create my Baguio itinerary <ArrowRight size={18} /></Link>
            <Link className="button dark" href="/tourist-spots">Compare tourist spots <MapPinned size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section guide-trip-snapshot" aria-labelledby="weather-reality-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><CloudRain size={15} /> Weather reality</span>
            <h2 id="weather-reality-title">Baguio is cooler—but your month changes the experience</h2>
            <p>
              PAGASA&apos;s 1991–2020 normals show why one packing list does not fit every trip. January normally averages about
              23.1°C by day and 13°C at night with three rainy days, while August normally records about 25 rainy days and much heavier rainfall.
            </p>
          </div>
          <GuideFactGrid facts={[
            { label: "January normal", value: "23.1° / 13°C", detail: "Normal maximum/minimum; about 3 rainy days", icon: <Trees size={19} /> },
            { label: "April normal", value: "25.5° / 15.9°C", detail: "Warmer afternoons; about 8 rainy days", icon: <Footprints size={19} /> },
            { label: "August normal", value: "22.3° / 16.2°C", detail: "About 25 rainy days; rain gear and flexible views matter", icon: <CloudRain size={19} /> },
            { label: "October normal", value: "23.6° / 15.6°C", detail: "About 13 rainy days; check the live forecast", icon: <Umbrella size={19} /> },
          ]} />
          <GuideDisclosure>
            Climate normals describe long-term averages, not your travel-day forecast. Check PAGASA again near departure and each morning;
            fog, thunderstorms, and tropical cyclones can change visibility, walking safety, and transport.
          </GuideDisclosure>
        </div>
      </section>

      <section className="section" aria-labelledby="food-example-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><Utensils size={15} /> A useful food plan</span>
            <h2 id="food-example-title">Budget meals before choosing restaurants by queue</h2>
            <p>
              Our 3D2N worked itinerary sets aside ₱2,130 per person for food and snacks. For one traceable example,
              Good Taste publishes half buttered chicken at ₱260; adding rice and drinks can fit a ₱500 shared-lunch allowance for two,
              depending on the counter prices and what you order.
            </p>
            <ul className="seo-guide-checklist">
              <li><CheckCircle2 size={17} /><span>Breakfast: ₱150–₱180 per person in the sample</span></li>
              <li><CheckCircle2 size={17} /><span>Lunch or dinner: ₱250–₱300 per person in the sample</span></li>
              <li><CheckCircle2 size={17} /><span>Merienda and warm drinks: ₱120–₱150 per person</span></li>
              <li><CheckCircle2 size={17} /><span>Keep one alternative nearby when a famous restaurant has a long queue</span></li>
            </ul>
          </div>
          <aside className="seo-guide-terminal-card">
            <Coffee size={25} />
            <h3>Food is also recovery time</h3>
            <p>Use lunch to sit, warm up, recharge a phone, and decide whether the optional afternoon stop still feels enjoyable.</p>
          </aside>
        </div>
      </section>

      <section className="section" aria-labelledby="priorities-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Route size={15} /> The first-trip mindset</span>
            <h2 id="priorities-title">Three choices that make a Baguio itinerary better</h2>
          </div>
          <div className="seo-guide-answer-grid">
            {firstTripPriorities.map(({ title, icon: Icon, text }) => (
              <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="things-to-do-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Sparkles size={15} /> First-timer favorites</span>
            <h2 id="things-to-do-title">Things to do in Baguio beyond collecting photo stops</h2>
            <p>Choose a mix that matches your interests, then leave enough time to experience each place.</p>
          </div>
          <div className="seo-guide-mode-grid">
            {thingsToDo.map(({ title, icon: Icon, text }) => (
              <article key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="packing-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><Umbrella size={15} /> Pack for the actual forecast</span>
            <h2 id="packing-title">What to wear and bring to Baguio</h2>
            <ul className="seo-guide-checklist">
              {packingList.map((item) => <li key={item}><CheckCircle2 size={17} /><span>{item}</span></li>)}
            </ul>
          </div>
          <aside className="seo-guide-warning">
            <h3>Baguio weather changes the route</h3>
            <p>Fog can reduce viewpoint visibility, rain slows walking, and wet roads can extend transfers. Check the forecast near your trip and keep one indoor or café fallback.</p>
            <a href={pagasaUrl} target="_blank" rel="noreferrer">Check the official forecast <ExternalLink size={16} /></a>
          </aside>
        </div>
      </section>

      <section className="section seo-guide-days" aria-labelledby="live-checks-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><ShieldCheck size={15} /> Check before leaving</span>
            <h2 id="live-checks-title">Do not treat old hours, fees, or schedules as permanent</h2>
            <p>Baguio Buddy provides planning guidance. Live operating information should come from the city, attraction, or transport provider.</p>
          </div>
          <div className="seo-guide-cluster-grid">
            {liveChecks.map((check, index) => (
              <article key={check.title}>
                <span>0{index + 1}</span><h3>{check.title}</h3><p>{check.text}</p>
                <Link href={check.href} target="_blank" rel="noreferrer">{check.label} <ExternalLink size={14} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="first-day-title">
        <div className="shell">
          <div className="seo-guide-callout">
            <BaggageClaim size={22} />
            <strong id="first-day-title">Your first day starts with luggage and energy—not the first attraction.</strong>
            <p>Confirm early bag drop or staffed storage, eat after the climb to Baguio, and adjust the route when an overnight bus leaves you tired. A relaxed first hour often saves the whole day.</p>
          </div>
        </div>
      </section>

      <section className="section seo-guide-faq" aria-labelledby="first-timer-faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">First-trip questions</span><h2 id="first-timer-faq-title">Baguio travel FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" aria-label="First-timer guide sources">
        <div className="shell"><GuideSourceList reviewed={GUIDE_REVIEW_LABEL} sources={[guideSources.pagasaNormals, guideSources.visita, guideSources.goodTaste]} /></div>
      </section>

      <section className="section seo-guide-related" aria-labelledby="first-timer-next-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Plan the trip</span><h2 id="first-timer-next-title">Turn these tips into a route you can follow</h2></div>
          <div className="seo-guide-related-grid">
            <Link href="/guides/baguio-itinerary-3-days-2-nights"><Route /><span><strong>Use the 3D2N itinerary</strong><small>Start with an area-grouped first-timer route.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-commute-guide"><BusFront /><span><strong>Learn how to commute</strong><small>Understand jeepney, taxi, and walking legs.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-trip-budget"><Coffee /><span><strong>Prepare the budget</strong><small>Include stays, meals, transport, fees, and a buffer.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
