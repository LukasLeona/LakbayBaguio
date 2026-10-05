import type { Metadata } from "next";
import Image from "next/image";
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
  ExternalLink,
  Hotel,
  MapPinned,
  Route,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import {
  GuideByline,
  GuideCostTable,
  GuideDisclosure,
  GuideFactGrid,
  GuideSourceList,
  GuideTableOfContents,
  GuideTimeline,
  GuideVerificationStandard,
  type GuideTocItem,
} from "@/components/guide-data";
import {
  BAGUIO_GUIDE_PUBLISHED_DATE,
  BAGUIO_GUIDE_REVIEW_LABEL,
  BAGUIO_GUIDE_LOOPS,
  formatVisitDuration,
  getLoopDestinations,
  routeGuideForLoop,
} from "@/lib/baguio-guide-data";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import {
  formatPeso,
  guideSources,
  sampleBasePerPerson,
  sampleReadyPerPerson,
  sampleThreeDayPlan,
  sampleTripCosts,
} from "@/lib/travel-guide-data";

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

const guideFaqs = [
  {
    question: "How many days are enough for a first Baguio trip?",
    answer: "Three days and two nights is a practical first visit when Day 1 combines one nearby tourist-spot loop with a flexible evening, Day 2 carries the longest full route, and Day 3 protects checkout and departure.",
  },
  {
    question: "Can I tour Baguio without a private car?",
    answer: "Yes. A realistic DIY route combines walkable city-center sections, verified jeepney corridors, and taxis for luggage, rain, late returns, or difficult transfers. Confirm the loading point and signboard locally.",
  },
  {
    question: "What should a first-time visitor prioritize?",
    answer: "Keep Botanical Garden, The Mansion, Wright Park, Mines View, and Good Shepherd together, then pair Burnham Park, Cathedral, and Session Road in a separate city-center period. Choose Camp John Hay or a west-side loop for another day.",
  },
  {
    question: "How much should I prepare for a 3D2N Baguio trip?",
    answer: `The Baguio Buddy worked example starts at about ${formatPeso(sampleBasePerPerson)} per person for two adults sharing a room. A more prepared target is ${formatPeso(sampleReadyPerPerson)} per person including a shopping cap and contingency fund. Live quotes will vary.`,
  },
  {
    question: "Should I carry luggage while visiting tourist spots?",
    answer: "A relaxing plan should not assume that a traveler will carry heavy bags through parks. Confirm hotel bag drop or a staffed terminal counter, retain valuables, and keep proof of any storage arrangement.",
  },
] as const;

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
      citation: [
        guideSources.visita.url,
        guideSources.genesis.url,
        guideSources.victory.url,
        guideSources.jeepneyRoutes.url,
        guideSources.pagasaNormals.url,
      ],
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
    {
      "@type": "FAQPage",
      mainEntity: guideFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
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

      <section id="when-to-go" className="section complete-guide-section complete-guide-soft" aria-labelledby="when-to-go-title">
        <div className="shell seo-guide-two-column">
          <div>
            <span className="eyebrow"><CloudSun size={15} /> Timing and weather</span>
            <h2 id="when-to-go-title">There is no single perfect month—choose the tradeoff you prefer</h2>
            <p>
              Baguio&apos;s elevation makes it cooler than Metro Manila, but a cool forecast does not guarantee a dry day.
              Check the local forecast again before departure and keep rain protection accessible rather than buried in your luggage.
            </p>
            <div className="complete-guide-season-grid">
              <article><strong>Cooler-season trip</strong><p>Bring layers for early mornings and evenings. Holidays and festival periods can also mean heavier demand and traffic.</p></article>
              <article><strong>Rainy-season trip</strong><p>Use grippy footwear, waterproof essentials, and flexible viewpoints. Museums and the city center are useful alternatives.</p></article>
              <article><strong>Weekend or event trip</strong><p>Reserve the bus and stay earlier, then reduce the number of cross-city transfers in the itinerary.</p></article>
            </div>
          </div>
          <aside className="complete-guide-source-card">
            <CloudSun size={25} />
            <h3>Use climate as context, forecasts as the decision</h3>
            <p>PAGASA climatological normals explain typical monthly patterns; the current forecast should decide what you pack and which outdoor stops remain flexible.</p>
            <a href={guideSources.pagasaNormals.url} target="_blank" rel="noreferrer">Open PAGASA climate normals <ExternalLink size={15} /></a>
          </aside>
        </div>
      </section>

      <section id="getting-there" className="section complete-guide-section" aria-labelledby="getting-there-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><BusFront size={15} /> Manila to Baguio</span>
            <h2 id="getting-there-title">Book the trip, then verify the exact terminal branch</h2>
            <p>Operator names are not precise enough for navigation. Save the branch, full address, departure time, and ticket reference before traveling.</p>
          </div>
          <div className="complete-guide-steps">
            <article><span>01</span><div><h3>Compare the live operator listing</h3><p>Use the operator&apos;s current booking or schedule channel. Do not rely on a copied timetable in an old article.</p></div></article>
            <article><span>02</span><div><h3>Match the terminal on the ticket</h3><p>Victory Liner has more than one Baguio facility. “Victory Liner Baguio” alone can send a traveler to the wrong branch.</p></div></article>
            <article><span>03</span><div><h3>Keep arrival time flexible</h3><p>Road conditions and traffic can shift the first day. Leave the evening plan easy to shorten if the bus arrives late.</p></div></article>
            <article><span>04</span><div><h3>Decide what happens to luggage</h3><p>Confirm hotel bag drop or a staffed terminal counter. Keep money, devices, documents, and medicine with you.</p></div></article>
          </div>
          <div className="complete-guide-link-row">
            <Link href="/guides/manila-to-baguio-bus-guide">Read the full Manila–Baguio bus guide <ArrowRight size={16} /></Link>
            <a href={guideSources.genesis.url} target="_blank" rel="noreferrer">Check Genesis and JoyBus <ExternalLink size={15} /></a>
            <a href={guideSources.victory.url} target="_blank" rel="noreferrer">Check Victory Liner terminals <ExternalLink size={15} /></a>
          </div>
        </div>
      </section>

      <section id="where-to-stay" className="section complete-guide-section complete-guide-soft" aria-labelledby="where-to-stay-title">
        <div className="shell">
          <div className="section-heading split">
            <div>
              <span className="eyebrow"><Hotel size={15} /> Accommodation strategy</span>
              <h2 id="where-to-stay-title">Choose the area that removes the most repeated travel</h2>
              <p>A room is part of the route. Compare total trip convenience—not only the nightly price shown in a listing.</p>
            </div>
            <Link className="text-link" href="/guides/where-to-stay-in-baguio">Compare accommodation areas <ArrowRight size={16} /></Link>
          </div>
          <div className="complete-guide-stay-grid">
            <article><Hotel /><h3>Burnham and city center</h3><p>Best for a first visit with evening walks, market access, and fewer rides after dinner. Expect busier streets and variable noise.</p></article>
            <article><MapPinned /><h3>Upper Session and terminal area</h3><p>Useful for bus access and central connections. Confirm the exact uphill walk and the terminal branch on your ticket.</p></article>
            <article><CloudSun /><h3>Camp John Hay or Outlook</h3><p>Quieter pine surroundings near selected attractions, but more rides are usually needed for central meals and shopping.</p></article>
            <article><Backpack /><h3>Transient or Airbnb outside the core</h3><p>Can suit groups, but check the final road, late transport, stairs, and whether staffed luggage storage actually exists.</p></article>
          </div>
          <GuideDisclosure>
            Confirm the property&apos;s exact map pin, check-in and checkout time, cancellation terms, and luggage policy in writing. A listing name alone is not enough to route a commuter safely.
          </GuideDisclosure>
        </div>
      </section>

      <section id="getting-around" className="section complete-guide-section" aria-labelledby="getting-around-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Route size={15} /> Getting around without a car</span>
            <h2 id="getting-around-title">Treat every commute as four parts—not one optimistic travel time</h2>
            <p>A usable instruction includes the walk to a loading point, the expected wait, the ride, and the final walk to the public entrance.</p>
          </div>
          <div className="complete-guide-mode-grid">
            <article><strong>Walk</strong><h3>Best inside compact clusters</h3><p>Session Road, Cathedral, and parts of Burnham can connect on foot, but elevation and rain make a short map distance feel longer.</p><small>Check slope, crossings, and entrance—not only distance.</small></article>
            <article><strong>Jeepney</strong><h3>Best for known corridors</h3><p>Confirm the loading area and signboard with a dispatcher. Google&apos;s road path is not proof that a public-transport route serves the same leg.</p><small>Carry small bills and allow waiting time.</small></article>
            <article><strong>Taxi</strong><h3>Best used strategically</h3><p>A taxi is useful for luggage, rain, early departures, late returns, or destinations with uncertain transfers.</p><small>Use the meter and verify the public entrance.</small></article>
          </div>
          <aside className="complete-guide-commute-rule">
            <BusFront size={22} />
            <div><strong>First-time commuter rule</strong><p>If a jeepney leg has no confirmed loading point or signboard, present it as a route to verify—not as turn-by-turn certainty.</p></div>
            <Link href="/guides/baguio-commute-guide">Open the complete commute guide <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section id="tourist-spots" className="section complete-guide-section complete-guide-soft" aria-labelledby="tourist-spots-title">
        <div className="shell">
          <div className="section-heading split">
            <div>
              <span className="eyebrow"><MapPinned size={15} /> Tourist spots by route</span>
              <h2 id="tourist-spots-title">Seven practical loops—not 48 pins scattered across a map</h2>
              <p>Choose one geographic anchor for the day, then add nearby places only while meals, rest, opening windows, and return travel still fit.</p>
            </div>
            <Link className="text-link" href="/tourist-spots">Compare all tourist spots <ArrowRight size={16} /></Link>
          </div>

          <div className="complete-guide-loop-list">
            {BAGUIO_GUIDE_LOOPS.map((loop) => {
              const destinations = getLoopDestinations(loop);
              const hero = destinations[0];
              const routeGuide = routeGuideForLoop(loop);
              return (
                <article id={`loop-${loop.id}`} className="complete-guide-loop" key={loop.id}>
                  {hero ? (
                    <div className="complete-guide-loop-image">
                      <Image src={hero.image} alt={`${loop.title} route in and around Baguio`} fill sizes="(max-width: 760px) 100vw, 280px" />
                    </div>
                  ) : null}
                  <div className="complete-guide-loop-copy">
                    <header><span>{loop.area}</span><small>{loop.timeNeeded}</small></header>
                    <h3>{loop.title}</h3>
                    <p>{loop.summary}</p>
                    <dl>
                      <div><dt>Best for</dt><dd>{loop.bestFor}</dd></div>
                      <div><dt>Commute starting point</dt><dd>{routeGuide.loadingArea}</dd></div>
                    </dl>
                    <div className="complete-guide-loop-spots" aria-label={`Places in the ${loop.title} loop`}>
                      {destinations.slice(0, 6).map((destination) => (
                        <Link href={`/plan?place=${destination.id}`} key={destination.id}>
                          <span>{destination.name}</span><small>{formatVisitDuration(destination.duration)}</small>
                        </Link>
                      ))}
                      {destinations.length > 6 ? <span className="complete-guide-more">+{destinations.length - 6} more options</span> : null}
                    </div>
                    <aside><ShieldCheck size={16} /><span>{loop.travelNote}</span></aside>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="complete-guide-cluster-rule">
            <div><strong>Do not split the East Baguio classics unnecessarily.</strong><p>Botanical Garden, The Mansion, Wright Park, Mines View, and Good Shepherd belong in one continuous route when the traveler selected them.</p></div>
            <Link className="button primary" href="/plan">Build my route <Route size={17} /></Link>
          </div>
        </div>
      </section>

      <section id="sample-itineraries" className="section complete-guide-section" aria-labelledby="sample-itineraries-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><CalendarDays size={15} /> Sample Baguio itineraries</span>
            <h2 id="sample-itineraries-title">Choose a trip length, then customize around your real arrival and departure</h2>
            <p>These are route frameworks—not promises that every commute, queue, meal, and attraction will run exactly on time.</p>
          </div>

          <div className="complete-guide-variant-grid">
            <article>
              <span>2D1N</span><h3>First-timer essentials</h3>
              <ol><li>Day 1: East Baguio loop, check-in and rest, then the city center.</li><li>Day 2: Burnham or market near checkout, collect bags, and depart.</li></ol>
              <p>Best only with an early arrival and a later confirmed departure. Skip a major loop rather than rushing both days.</p>
            </article>
            <article className="recommended">
              <span>3D2N · recommended</span><h3>Balanced highlights</h3>
              <ol><li>Day 1: East Baguio classics and a flexible city evening.</li><li>Day 2: Camp John Hay plus one compatible west-side anchor.</li><li>Day 3: Checkout, market or one easy stop, then departure.</li></ol>
              <p>Gives the first visit two meaningful sightseeing days while protecting hotel and luggage timing.</p>
            </article>
            <article>
              <span>4D3N</span><h3>Slower city plus side trip</h3>
              <ol><li>Days 1–2: East Baguio, city center, Camp John Hay, and west Baguio.</li><li>Day 3: Choose La Trinidad, Asin/Tuba, or Atok—not all three.</li><li>Day 4: Easy breakfast, market, bags, and departure.</li></ol>
              <p>Use the extra day for depth and recovery, not simply a longer checklist.</p>
            </article>
          </div>

          <div className="complete-guide-timeline-heading">
            <div><small>Worked example</small><h3>A detailed 3-day route for two DIY commuters</h3></div>
            <Link href="/guides/baguio-itinerary-3-days-2-nights">Open expenses, booking assumptions, and alternatives <ArrowRight size={16} /></Link>
          </div>
          <GuideTimeline days={sampleThreeDayPlan} />
        </div>
      </section>

      <section id="budget" className="section complete-guide-section complete-guide-soft" aria-labelledby="budget-title">
        <div className="shell">
          <div className="section-heading split">
            <div>
              <span className="eyebrow"><CircleDollarSign size={15} /> Budget and expenses</span>
              <h2 id="budget-title">Show the assumptions behind every total</h2>
              <p>This example is for two adults sharing a room on a non-holiday weekday. Replace every allowance with your ticket, room, menu, and admission quote.</p>
            </div>
            <Link className="text-link" href="/guides/baguio-trip-budget">Build a personal budget <ArrowRight size={16} /></Link>
          </div>
          <GuideCostTable costs={sampleTripCosts} caption="Worked 3D2N Baguio budget for two adults, including optional preparation money" />
          <div className="complete-guide-budget-summary">
            <article><small>Base trip example</small><strong>{formatPeso(sampleBasePerPerson)}</strong><span>per person before optional shopping</span></article>
            <article><small>Prepared target</small><strong>{formatPeso(sampleReadyPerPerson)}</strong><span>per person with shopping cap and contingency</span></article>
            <article><small>Not included automatically</small><strong>Live choices</strong><span>Premium rooms, shopping over the cap, paid activities, and fare changes</span></article>
          </div>
          <GuideDisclosure>
            A search-friendly price is not a quote. Dates, holidays, room occupancy, operator, vehicle class, menus, attraction rates, discounts, and personal shopping change the result.
          </GuideDisclosure>
        </div>
      </section>

      <section id="food-and-rest" className="section complete-guide-section" aria-labelledby="food-rest-title">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow"><Utensils size={15} /> Food, rest, and luggage</span>
            <h2 id="food-rest-title">A route is only practical when the traveler can still enjoy it</h2>
            <p>Meals, queues, rain, hills, bathroom stops, hotel timing, and bags are itinerary events—not empty space between attractions.</p>
          </div>
          <div className="complete-guide-human-grid">
            <article><span><Utensils /></span><h3>Protect a real meal</h3><p>Reserve 60–90 minutes around lunch. A packed day can use a nearby restaurant, but it should not erase the meal to save the schedule.</p></article>
            <article><span><Clock3 /></span><h3>Add a seated recovery</h3><p>After long walks or hotel check-in, protect a short recharge period. Let the traveler remove it voluntarily—not by default.</p></article>
            <article><span><Backpack /></span><h3>Resolve luggage first</h3><p>Show verified or clearly unconfirmed storage options. Do not send someone to several parks with heavy bags as the silent default.</p></article>
            <article><span><CloudSun /></span><h3>Keep one flexible stop</h3><p>When traffic, rain, fog, or queues grow, drop an optional place while preserving the anchor experience and safe return.</p></article>
          </div>
          <aside className="complete-guide-local-note">
            <strong>Food planning without fake precision</strong>
            <p>Pick a dining area that follows the route, set a per-meal allowance, and verify the live menu. Famous restaurants can have queues; a nearby backup protects the day better than a rigid reservation-free promise.</p>
          </aside>
        </div>
      </section>

      <section id="faq" className="section seo-guide-faq complete-guide-section complete-guide-soft" aria-labelledby="complete-guide-faq-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Plan with confidence</span><h2 id="complete-guide-faq-title">Baguio travel guide FAQ</h2></div>
          <div className="seo-guide-faq-list">
            {guideFaqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section complete-guide-trust-section" aria-label="Guide verification and sources">
        <div className="shell">
          <GuideVerificationStandard />
          <GuideSourceList
            reviewed={BAGUIO_GUIDE_REVIEW_LABEL}
            sources={[
              guideSources.visita,
              guideSources.genesis,
              guideSources.victory,
              guideSources.jeepneyRoutes,
              guideSources.fare,
              guideSources.taxi,
              guideSources.pagasaNormals,
            ]}
          />
        </div>
      </section>

      <section className="section complete-guide-final-cta" aria-labelledby="complete-guide-cta-title">
        <div className="shell">
          <div><span className="eyebrow">Turn this guide into your trip</span><h2 id="complete-guide-cta-title">Build around your dates, hotel, bags, and favorite places</h2><p>Baguio Buddy groups nearby attractions, protects fixed hotel times, and explains when a selected place needs another day.</p></div>
          <div><Link className="button lime" href="/plan">Generate my Baguio itinerary <ArrowRight size={18} /></Link><Link className="button secondary" href="/tourist-spots">Browse all tourist spots</Link></div>
        </div>
      </section>
    </main>
  );
}

