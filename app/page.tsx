import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Camera,
  CloudSun,
  Coffee,
  Compass,
  Footprints,
  MapPin,
  Route,
  Sparkles,
  Store,
  Trees,
  Utensils,
} from "lucide-react";
import { HomePendingItinerary } from "@/components/home-pending-itinerary";
import { Kabsat } from "@/components/kabsat";
import { PlaceCard } from "@/components/place-card";
import { featuredRestaurants, hotels, parks } from "@/lib/places";

const moodCards = [
  { title: "Pine & quiet", copy: "Forest paths and slow mornings", image: "/assets/img/destinations/camp-john-hay.jpg", icon: Trees, href: "/explore?type=park" },
  { title: "Culture trail", copy: "Art, heritage, and Cordilleran stories", image: "/assets/img/destinations/tam-awan-village.jpg", icon: Camera, href: "/explore?type=park" },
  { title: "City appetite", copy: "Local tables and café weather", image: "/assets/img/venues/restaurant-warm-3.jpg", icon: Coffee, href: "/explore?type=restaurant" },
];

const quickActions = [
  { label: "Build a route", detail: "Fare & directions", icon: Route, href: "/plan" },
  { label: "Find a place", detail: "Parks, food & stays", icon: Compass, href: "/explore" },
  { label: "Meet travelers", detail: "Privacy-first radar", icon: MapPin, href: "/nearby" },
];

export default function HomePage() {
  return (
    <main id="main-content" className="home-revamp">
      <section className="home-hero home-discovery-hero">
        <div className="shell home-discovery-shell">
          <div className="home-hero-topline">
            <div className="traveler-greeting">
              <span className="traveler-avatar-mini">LB</span>
              <div><small>Welcome to the highlands</small><strong>Ready to lakbay?</strong></div>
            </div>
            <div className="weather-chip"><CloudSun size={21} /><span><small>Baguio weather</small><strong>15°C · Cool</strong></span></div>
          </div>

          <div className="home-story-card">
            <img src="/assets/img/destinations/burnham-park.jpg" alt="Burnham Park lake surrounded by pine trees" />
            <div className="home-story-shade" />
            <div className="home-story-copy">
              <span className="eyebrow light"><MapPin size={14} /> Baguio, Philippines</span>
              <h1>Make room for <em>mountain moments.</em></h1>
              <p>Choose the places you love. Lakbay arranges the route, directions, estimated fare, and time around your trip.</p>
              <div className="story-activity-row" aria-label="Popular Baguio experiences">
                <span><Footprints size={14} /> Walk</span>
                <span><Utensils size={14} /> Eat</span>
                <span><Camera size={14} /> Discover</span>
              </div>
              <div className="hero-actions">
                <Link href="/plan" className="button lime">Start planning <ArrowRight size={18} /></Link>
                <Link href="/explore" className="button story-glass">Explore first <Compass size={18} /></Link>
              </div>
            </div>
            <div className="story-fact-card"><span>Today’s local pick</span><strong>Burnham to Session Road</strong><small><Footprints size={13} /> Easy city-center walk</small></div>
          </div>

          <div className="home-hero-shortcuts">
            {quickActions.map(({ label, detail, icon: Icon, href }, index) => (
              <Link href={href} key={label}><span className="shortcut-index">0{index + 1}</span><span className="shortcut-icon"><Icon size={20} /></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={18} /></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-pending-section">
        <div className="shell">
          <div className="section-heading split compact-heading">
            <div><span className="eyebrow"><CalendarDays size={14} /> Continue your journey</span><h2>Your pending itinerary</h2></div>
            <Link href="/plan" className="round-text-link" aria-label="Open planner"><ArrowRight size={19} /></Link>
          </div>
          <HomePendingItinerary />
        </div>
      </section>

      <section className="section home-popular-section">
        <div className="shell">
          <div className="section-heading split compact-heading">
            <div><span className="eyebrow"><Sparkles size={14} /> Popular right now</span><h2>Baguio favorites for first-timers</h2><p>Classic stops, fresh air, and the views people come back for.</p></div>
            <Link href="/explore" className="text-link">View every place <ArrowRight size={16} /></Link>
          </div>
          <div className="home-feature-rail">
            {parks.slice(0, 4).map((place, index) => (
              <Link href={`/plan?place=${place.id}`} className={`home-feature-card feature-${index + 1}`} key={place.id}>
                <img src={place.image} alt="" loading="lazy" />
                <span className="feature-shade" />
                <span className="feature-number">0{index + 1}</span>
                <span className="feature-copy"><small>{place.area}</small><strong>{place.name}</strong><em>{place.duration} min · {place.price}</em></span>
                <span className="feature-arrow"><ArrowRight size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section mood-section">
        <div className="shell">
          <div className="section-heading center-heading"><span className="eyebrow">Choose your Baguio mood</span><h2>What kind of day are you after?</h2><p>Start with a feeling. We’ll help turn it into a route.</p></div>
          <div className="mood-card-grid">
            {moodCards.map(({ title, copy, image, icon: Icon, href }) => (
              <Link href={href} className="mood-card" key={title}>
                <img src={image} alt="" loading="lazy" /><span className="mood-shade" />
                <span className="mood-icon"><Icon size={20} /></span>
                <span className="mood-copy"><strong>{title}</strong><small>{copy}</small></span>
                <ArrowRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section restaurants-section home-food-section">
        <div className="shell">
          <div className="section-heading split compact-heading">
            <div><span className="eyebrow"><Utensils size={14} /> Eat like you belong here</span><h2>Tables worth finding</h2><p>Local flavors, creative rooms, and café stops for cool afternoons.</p></div>
            <Link href="/explore?type=restaurant" className="text-link">All restaurants <ArrowRight size={16} /></Link>
          </div>
          <div className="place-grid home-place-grid">
            {featuredRestaurants.map((restaurant) => <PlaceCard key={restaurant.id} place={restaurant} compact />)}
          </div>
        </div>
      </section>

      <section className="section home-stays-section">
        <div className="shell stays-layout">
          <div className="stays-intro">
            <span className="eyebrow"><BedDouble size={14} /> Stay close to the story</span>
            <h2>A good base changes the whole trip.</h2>
            <p>Pick a stay near the neighborhoods and places you want to spend time in.</p>
            <Link href="/explore?type=hotel" className="button dark">Browse stays <ArrowRight size={17} /></Link>
          </div>
          <div className="stay-card-stack">
            {hotels.slice(0, 3).map((hotel) => <PlaceCard key={hotel.id} place={hotel} compact />)}
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
            <span className="eyebrow">Baguio business owners</span>
            <h2>Put your place on the traveler’s map.</h2>
            <p>Restaurant, cozy stay, tour, or local shop—tell us what makes it special. We’ll review your details for a possible Lakbay feature, with no automatic or paid placement.</p>
            <Link href="/partner" className="button lime">Inquire about a feature <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <Kabsat />
    </main>
  );
}
