import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { ExploreGrid } from "@/components/explore-grid";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <main id="main-content" className="explore-revamp">
      <section className="explore-intro-hero">
        <div className="shell explore-hero-panel">
          <img src="/assets/img/destinations/camp-john-hay.jpg" alt="Pine forest landscape at Camp John Hay" />
          <span className="explore-hero-shade" />
          <div className="explore-hero-top"><span><MapPin size={14} /> Baguio City</span><span><Sparkles size={14} /> Curated local guide</span></div>
          <div className="explore-hero-copy"><span className="eyebrow light">Find your kind of Baguio</span><h1>Go where the pines lead.</h1><p>Explore storied parks, memorable tables, and stays that put the city within reach.</p><div><a href="#discover-places" className="button lime">Start exploring <ArrowDown size={18} /></a><Link href="/plan" className="button story-glass">Build a route <ArrowRight size={18} /></Link></div></div>
          <aside className="explore-hero-note"><strong>24</strong><span>handpicked places across the highlands</span></aside>
        </div>
      </section>
      <section className="section explore-content" id="discover-places">
        <div className="shell"><Suspense fallback={<div className="loading-card">Loading places…</div>}><ExploreGrid /></Suspense></div>
      </section>
    </main>
  );
}
