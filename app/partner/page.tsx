import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import { PartnerForm } from "@/components/partner-form";

export const metadata: Metadata = { title: "Local business feature inquiry" };

export default function PartnerPage() {
  return (
    <main id="main-content" className="partner-page">
      <div className="shell partner-layout">
        <aside className="partner-intro">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back home</Link>
          <span className="eyebrow light">For Baguio local businesses</span>
          <h1>Put your place on the traveler’s map.</h1>
          <p>Restaurants, cozy stays, tours, and local shops can share their story for a thoughtful Baguio Buddy feature review.</p>
          <ul>
            <li><MapPin /><span><strong>Local discovery</strong>Reach visitors who are already planning where to eat.</span></li>
            <li><BadgeCheck /><span><strong>Reviewed information</strong>We check details before anything is featured.</span></li>
            <li><ShieldCheck /><span><strong>No automatic placement</strong>Your inquiry stays private while it is reviewed.</span></li>
          </ul>
          <div className="partner-quote"><HeartHandshake /><p>“Good trips are remembered by the places—and people—that fed us.”</p></div>
        </aside>
        <section className="partner-form-wrap">
          <span className="eyebrow">Local feature inquiry</span>
          <h2>Tell us about your place</h2>
          <p>Fields marked with * are required. We only use this information to review and respond to your inquiry.</p>
          <PartnerForm />
        </section>
      </div>
    </main>
  );
}
