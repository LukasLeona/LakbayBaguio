import type { Metadata } from "next";
import { NearbyExperience } from "@/components/nearby-experience";

export const metadata: Metadata = { title: "Nearby" };

export default function NearbyPage() {
  return (
    <main id="main-content" className="community-page">
      <section className="page-hero nearby-hero"><div className="shell"><span className="eyebrow light">Traveler radar</span><h1>Nearby, never pinpointed.</h1><p>Meet other people exploring Baguio without exposing anyone’s exact location.</p></div></section>
      <section className="section nearby-section"><div className="shell"><NearbyExperience /></div></section>
    </main>
  );
}
