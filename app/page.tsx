import Link from "next/link";
import { ArrowRight, BadgeCheck, Compass, MapPin, Route, Store } from "lucide-react";
import { HomePendingItinerary } from "@/components/home-pending-itinerary";
import { Kabsat } from "@/components/kabsat";
import { PlaceCard } from "@/components/place-card";
import { featuredRestaurants } from "@/lib/places";

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="home-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow light"><MapPin size={14} /> Your local Baguio companion</span>
            <h1>Find your way through the <em>City of Pines.</em></h1>
            <p>Discover places worth the climb, build a route that fits your pace, and connect with fellow travelers nearby.</p>
            <div className="hero-actions">
              <Link href="/plan" className="button sun">Plan my trip <Route size={18} /></Link>
              <Link href="/explore" className="button glass">Explore Baguio <Compass size={18} /></Link>
            </div>
            <div className="hero-trust"><BadgeCheck size={18} /> Built around local context and privacy-first community features.</div>
          </div>

          <div className="hero-collage" aria-hidden="true">
            <div className="hero-photo primary-photo"><img src="/assets/img/destinations/burnham-park.jpg" alt="" /></div>
            <div className="hero-photo secondary-photo"><img src="/assets/img/destinations/botanical-garden.jpg" alt="" /></div>
            <div className="weather-card"><span>Today in Baguio</span><strong>Cool &amp; misty</strong><small>Bring a light layer</small></div>
            <div className="hero-stamp">Est. 2025<br /><strong>LAKBAY</strong></div>
          </div>
        </div>
        <div className="mountain-line" />
      </section>

      <section className="section section-overlap">
        <div className="shell">
          <div className="section-heading split">
            <div><span className="eyebrow">Pick up where you left off</span><h2>Your pending itinerary</h2></div>
            <Link href="/plan" className="text-link">Open planner <ArrowRight size={16} /></Link>
          </div>
          <HomePendingItinerary />
        </div>
      </section>

      <section className="section restaurants-section">
        <div className="shell">
          <div className="section-heading split">
            <div><span className="eyebrow">Eat like you belong here</span><h2>Discover local restaurants</h2><p>From mountain comfort food to creative city cafés.</p></div>
            <Link href="/explore?type=restaurant" className="text-link">See all restaurants <ArrowRight size={16} /></Link>
          </div>
          <div className="place-grid home-place-grid">
            {featuredRestaurants.map((restaurant) => <PlaceCard key={restaurant.id} place={restaurant} compact />)}
          </div>
        </div>
      </section>

      <section className="section owner-section">
        <div className="shell owner-card">
          <div className="owner-visual">
            <div className="store-icon"><Store size={34} /></div>
            <span className="owner-badge">For local businesses</span>
          </div>
          <div className="owner-copy">
            <span className="eyebrow">Restaurant owners</span>
            <h2>Put your table on the traveler’s map.</h2>
            <p>Tell us what makes your restaurant special. We’ll review your details for a possible feature in Lakbay Baguio—no automatic or paid placement.</p>
            <Link href="/partner" className="button primary">Inquire about a feature <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section quick-paths">
        <div className="shell">
          <div className="quick-path-grid">
            <Link href="/explore"><span>01</span><div><strong>Explore</strong><small>Parks, food &amp; stays</small></div><ArrowRight /></Link>
            <Link href="/plan"><span>02</span><div><strong>Plan</strong><small>Generate a smart route</small></div><ArrowRight /></Link>
            <Link href="/nearby"><span>03</span><div><strong>Nearby</strong><small>Meet travelers safely</small></div><ArrowRight /></Link>
          </div>
        </div>
      </section>

      <Kabsat />
    </main>
  );
}
