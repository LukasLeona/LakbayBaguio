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
  Trees,
} from "lucide-react";

const canonicalUrl = "https://baguiobuddy.com/tourist-spots";
const updatedDate = "2026-09-29";

export const metadata: Metadata = {
  title: "Tourist Spots in Baguio: First-Timer Area Guide",
  description:
    "Discover the best-known tourist spots in Baguio, grouped by area for easier commuting. Compare parks, views, heritage stops, timing, and sample routes.",
  alternates: { canonical: canonicalUrl },
  authors: [{ name: "Baguio Buddy", url: "https://baguiobuddy.com" }],
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Tourist Spots in Baguio: A Practical First-Timer Guide",
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
    title: "Tourist Spots in Baguio for First-Time Visitors",
    description: "A practical, area-by-area guide to Baguio parks, views, heritage, and city sights.",
    images: ["https://baguiobuddy.com/assets/img/destinations/camp-john-hay.jpg"],
  },
};

type TouristSpotSummary = {
  name: string;
  detail: string;
  time: string;
  slug?: string;
};

type TouristSpotGroup = {
  area: string;
  intro: string;
  spots: readonly TouristSpotSummary[];
};

const spotGroups: readonly TouristSpotGroup[] = [
  {
    area: "East Baguio",
    intro: "Keep these classics together. They form the easiest first-timer sightseeing cluster.",
    spots: [
      { name: "Baguio Botanical Garden", slug: "botanical-garden", detail: "Landscaped gardens, Cordilleran-inspired features, and an easy introduction to the city's pine-covered side.", time: "Allow about 60–90 minutes" },
      { name: "The Mansion", detail: "A landmark best treated as a short exterior and gate-area stop unless official access information says otherwise.", time: "Allow about 20–40 minutes" },
      { name: "Wright Park", slug: "wright-park", detail: "Known for its tree-lined Pool of Pines and nearby horseback-riding area; expect slopes and steps in parts of the park.", time: "Allow about 45–75 minutes" },
      { name: "Mines View Park", slug: "mines-view-park", detail: "A popular mountain-view stop with souvenir stalls. Visibility depends on the weather, so earlier hours can be helpful.", time: "Allow about 45–60 minutes" },
      { name: "Good Shepherd Convent", detail: "A common pasalubong stop near Mines View. Product availability and queues can vary by day.", time: "Allow about 30–45 minutes" },
    ],
  },
  {
    area: "City center",
    intro: "These stops work well after hotel check-in because several can be connected on foot.",
    spots: [
      { name: "Burnham Park", slug: "burnham-park", detail: "Baguio's central park for lake views, gardens, cycling, and an easy late-afternoon stroll.", time: "Allow about 60–120 minutes" },
      { name: "Baguio Cathedral", slug: "baguio-cathedral", detail: "A prominent hilltop church near Session Road. Visit respectfully and avoid disrupting services.", time: "Allow about 30–45 minutes" },
      { name: "Session Road", detail: "The city's best-known commercial street for cafés, shops, and people-watching.", time: "Allow about 45–90 minutes" },
      { name: "Baguio City Market", detail: "A practical stop for vegetables and pasalubong, ideally near checkout so purchases do not travel through every park.", time: "Allow about 60–90 minutes" },
      { name: "Baguio Night Market", detail: "An evening bargain-shopping experience when operations and conditions allow. Confirm the schedule on your travel date.", time: "Allow about 60–90 minutes" },
    ],
  },
  {
    area: "South and west Baguio",
    intro: "Give these larger or more spread-out destinations their own half-day instead of squeezing them between East Baguio stops.",
    spots: [
      { name: "Camp John Hay", slug: "camp-john-hay", detail: "A broad pine estate rather than one compact attraction. Choose specific places or walking areas before you go.", time: "Allow about 2–4 hours" },
      { name: "Mirador Heritage and Eco Park", slug: "mirador-heritage-eco-park", detail: "A scenic hillside destination with gardens and viewpoints. Account for stairs, slopes, and travel time.", time: "Allow about 90–150 minutes" },
      { name: "Diplomat Hotel", detail: "A heritage ruin and viewpoint on Dominican Hill. Treat it as a focused visit and confirm current access before leaving.", time: "Allow about 45–75 minutes" },
    ],
  },
  {
    area: "La Trinidad side trip",
    intro: "This is outside Baguio City, so protect enough commute time and avoid pairing it with a packed East Baguio loop.",
    spots: [
      { name: "Valley of Colors", detail: "A roadside mural community commonly viewed as a brief photo stop while traveling toward La Trinidad.", time: "Allow about 20–40 minutes plus commute" },
      { name: "Strawberry Farm area", slug: "strawberry-farm", detail: "A seasonal agricultural visit where activities and produce depend on weather, harvest conditions, and local operations.", time: "Allow about 60–120 minutes plus commute" },
    ],
  },
];

const allSpots = spotGroups.flatMap((group) => group.spots);

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
      headline: "Tourist Spots in Baguio: First-Timer Area Guide",
      description: "An area-by-area guide to popular Baguio tourist spots with practical timing and commute notes.",
      datePublished: updatedDate,
      dateModified: updatedDate,
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
        description: spot.detail,
        ...(spot.slug ? { url: `https://baguiobuddy.com/places/${spot.slug}` } : {}),
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
          <h1>Tourist spots in Baguio: where to go and how to group your route</h1>
          <p className="seo-hub-lead">
            The best Baguio tourist-spot plan is not simply the longest list. Group nearby places, choose one larger destination at a time,
            and reserve space for meals, traffic, queues, rain, and uphill walking.
          </p>
          <div className="seo-hub-meta"><span><Clock3 size={16} /> Updated September 29, 2026</span><span><MapPin size={16} /> Baguio City and one La Trinidad side trip</span></div>
          <div className="seo-hub-actions">
            <Link href="/explore" className="button dark">Browse places and photos <ArrowRight size={18} /></Link>
            <Link href="/plan" className="button lime">Add places to an itinerary <Route size={18} /></Link>
          </div>
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
            <h2 id="spots-title">Baguio tourist spots grouped by area</h2>
            <p>Suggested times are planning allowances, not official visit limits. Always check current entry rules and operating details.</p>
          </div>
          <div className="seo-hub-group-list">
            {spotGroups.map((group) => (
              <section className="seo-hub-area-group" key={group.area} aria-labelledby={`area-${group.area.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <header>
                  <Mountain size={22} />
                  <div><h3 id={`area-${group.area.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{group.area}</h3><p>{group.intro}</p></div>
                </header>
                <div className="seo-hub-spot-grid">
                  {group.spots.map((spot) => (
                    <article key={spot.name}>
                      <span><MapPin size={18} /></span>
                      <div><h4>{spot.slug ? <Link href={`/places/${spot.slug}`}>{spot.name}</Link> : spot.name}</h4><p>{spot.detail}</p><small><Clock3 size={14} /> {spot.time}</small></div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
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

      <section className="section seo-hub-related" aria-labelledby="related-title">
        <div className="shell">
          <div className="section-heading"><span className="eyebrow">Next step</span><h2 id="related-title">Turn your shortlist into a trip</h2></div>
          <div className="seo-hub-related-grid">
            <Link href="/plan"><Route /><span><strong>Create an itinerary</strong><small>Arrange chosen places around your dates and stay.</small></span><ArrowRight /></Link>
            <Link href="/guides/baguio-trip-budget"><Compass /><span><strong>Estimate your Baguio budget</strong><small>Plan for transport, food, stays, and extras.</small></span><ArrowRight /></Link>
            <Link href="/resources"><MapPin /><span><strong>Check traveler resources</strong><small>Review fares, luggage notes, and map guidance.</small></span><ArrowRight /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
