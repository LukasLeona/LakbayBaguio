import type { Metadata } from "next";
import { NearbyExperience } from "@/components/nearby-experience";

export const metadata: Metadata = { title: "Nearby" };

export default function NearbyPage() {
  return (
    <main id="main-content" className="community-page">
      <section className="page-hero nearby-hero"><div className="shell"><span className="eyebrow light">Traveler radar</span><h1>Ang daming tao sa Baguio, pero wala pa ring organic encounter? <span>Baka nandito sya teh 👀</span></h1></div></section>
      <section className="section nearby-section"><div className="shell"><NearbyExperience /></div></section>
    </main>
  );
}
