import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowRight, MapPin, Sparkles } from "lucide-react";
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

const exploreJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Baguio tourist spots, restaurants, and stays",
  url: `${SITE_URL}/explore`,
  numberOfItems: places.length,
  itemListElement: places.map((place, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: place.name,
    url: `${SITE_URL}/places/${place.id}`,
  })),
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
          <aside className="explore-hero-note"><strong>24</strong><span>handpicked places across the highlands</span></aside>
        </div>
      </section>
      <section className="section explore-content" id="discover-places">
        <div className="shell"><Suspense fallback={<div className="loading-card">Loading places…</div>}><ExploreGrid /></Suspense></div>
      </section>
    </main>
  );
}
