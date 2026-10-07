import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowRight, MapPin, Route, Sparkles } from "lucide-react";
import { ExploreGrid } from "@/components/explore-grid";
import { places } from "@/lib/places";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Baguio Tourist Spots, Restaurants & Stays",
  description: "Explore Baguio tourist spots by area, visit time, budget, food, stays, and route-friendly groups for a smoother DIY trip.",
  path: "/explore",
  keywords: [
    "places to visit in Baguio",
    "things to do in Baguio",
    "Baguio attractions",
    "Baguio restaurants",
    "Baguio hotels",
  ],
});

const routeCollections = [
  {
    title: "East Baguio classics",
    copy: "Keep the mountain-view stops together and reduce backtracking.",
    links: [
      ["Mines View Park", "/places/mines-view-park"],
      ["Wright Park", "/places/wright-park"],
      ["Botanical Garden", "/places/botanical-garden"],
    ],
  },
  {
    title: "Pines and heritage",
    copy: "Allow a longer visit for the forest, trails, and historic sites.",
    links: [
      ["Camp John Hay", "/places/camp-john-hay"],
      ["Baguio Cathedral", "/places/baguio-cathedral"],
      ["Museo Kordilyera", "/places/museo-kordilyera"],
    ],
  },
  {
    title: "Art and a slower meal",
    copy: "Pair a focused museum visit with an unrushed evening in town.",
    links: [
      ["BenCab Museum", "/places/bencab-museum"],
      ["Chaya", "/places/chaya"],
      ["Complete travel guide", "/guides/baguio-travel-guide"],
    ],
  },
] as const;

const exploreJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/explore#collection`,
      name: "Baguio tourist spots, restaurants, and stays",
      url: `${SITE_URL}/explore`,
      description: "A route-friendly directory of Baguio places with practical visit times, areas, maps, and itinerary links.",
      mainEntity: { "@id": `${SITE_URL}/explore#places` },
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/explore#places`,
      name: "Places to visit in Baguio",
      numberOfItems: places.length,
      itemListElement: places.map((place, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: place.name,
        url: `${SITE_URL}/places/${place.id}`,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Explore Baguio", item: `${SITE_URL}/explore` },
      ],
    },
  ],
};

export default function ExplorePage() {
  return (
    <main id="main-content" className="explore-revamp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(exploreJsonLd) }} />
      <section className="explore-intro-hero">
        <div className="shell explore-hero-panel">
          <img src="/assets/img/destinations/camp-john-hay.jpg" alt="Pine forest landscape at Camp John Hay" />
          <span className="explore-hero-shade" />
          <div className="explore-hero-top"><span><MapPin size={14} /> Baguio City</span><span><Sparkles size={14} /> Curated local guide</span></div>
          <div className="explore-hero-copy"><span className="eyebrow light">Find your kind of Baguio</span><h1>Baguio tourist spots and places to visit.</h1><p>Explore parks, landmarks, restaurants, and stays by area—then turn your favorites into a practical route.</p><div><a href="#discover-places" className="button lime">Start exploring <ArrowDown size={18} /></a><Link href="/plan" className="button story-glass">Build a route <ArrowRight size={18} /></Link></div></div>
          <aside className="explore-hero-note"><strong>{places.length}</strong><span>handpicked places across the highlands</span></aside>
        </div>
      </section>
      <section className="section explore-route-index" aria-labelledby="explore-route-index-title">
        <div className="shell">
          <div className="explore-section-heading">
            <div><span className="eyebrow"><Route size={14} /> Browse by practical route</span><h2 id="explore-route-index-title">Start with places that belong together.</h2></div>
            <p>These direct visitor guides explain the location, suggested visit time, nearby stops, and planning checks before you add a place.</p>
          </div>
          <div className="explore-route-index-grid">
            {routeCollections.map((route) => (
              <article key={route.title}>
                <h3>{route.title}</h3>
                <p>{route.copy}</p>
                <div>{route.links.map(([label, href]) => <Link href={href} key={href}>{label}<ArrowRight size={14} /></Link>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section explore-content" id="discover-places">
        <div className="shell"><Suspense fallback={<div className="loading-card">Loading places…</div>}><ExploreGrid /></Suspense></div>
      </section>
    </main>
  );
}
