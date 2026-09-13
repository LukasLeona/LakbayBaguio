import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreGrid } from "@/components/explore-grid";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <main id="main-content">
      <section className="page-hero explore-hero">
        <div className="shell"><span className="eyebrow light">Find your kind of Baguio</span><h1>Wander well.</h1><p>Pine-filled parks, favorite local tables, and stays for every kind of trip—all in one place.</p></div>
      </section>
      <section className="section explore-content">
        <div className="shell"><Suspense fallback={<div className="loading-card">Loading places…</div>}><ExploreGrid /></Suspense></div>
      </section>
    </main>
  );
}
