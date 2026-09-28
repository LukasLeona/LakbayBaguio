import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getPlace, places } from "@/lib/places";
import {
  absoluteUrl,
  LAST_CONTENT_REVIEW,
  pageMetadata,
  serializeJsonLd,
  SITE_URL,
} from "@/lib/seo";
import type { Place } from "@/lib/types";

export const dynamicParams = false;

type PlacePageProps = { params: Promise<{ slug: string }> };

const kindCopy = {
  park: {
    label: "Baguio place to visit",
    titleSuffix: "Route, Visit Time & Nearby Spots",
    action: "Add this tourist spot",
  },
  restaurant: {
    label: "Baguio restaurant",
    titleSuffix: "Location, Dining Time & Nearby Stops",
    action: "Plan around this restaurant",
  },
  hotel: {
    label: "Baguio stay",
    titleSuffix: "Location & Nearby Tourist Spots",
    action: "Plan around this stay",
  },
} as const;

function directionsUrl(place: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
}

function entityType(place: Place) {
  if (place.kind === "restaurant") return "Restaurant";
  if (place.kind === "hotel") return "Hotel";
  return "TouristAttraction";
}

function priceRange(place: Place) {
  if (place.price === "Free") return "Free";
  if (place.price === "Premium") return "₱₱₱";
  if (place.price === "Mid-range") return "₱₱";
  return "₱";
}

function placeSearchName(place: Place) {
  const location = place.area === "La Trinidad" ? "La Trinidad" : "Baguio";
  return place.name.toLocaleLowerCase().includes(location.toLocaleLowerCase())
    ? place.name
    : `${place.name} ${location}`;
}

export function generateStaticParams() {
  return places.map((place) => ({ slug: place.id }));
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlace(slug);
  if (!place) return {};

  const descriptor = kindCopy[place.kind];
  const searchName = placeSearchName(place);
  return pageMetadata({
    title: `${searchName}: ${descriptor.titleSuffix}`,
    description: `${place.description} Review its ${place.area} location, suggested visit time, practical map link, nearby stops, and itinerary-planning options.`,
    path: `/places/${place.id}`,
    image: place.image,
    type: "article",
    keywords: [
      searchName,
      `${place.name} location`,
      `${place.name} tourist guide`,
      `${place.area} tourist spots`,
      `places near ${place.name}`,
    ],
  });
}

export default async function PlaceGuidePage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = getPlace(slug);
  if (!place) notFound();

  const descriptor = kindCopy[place.kind];
  const nearby = places
    .filter((candidate) => candidate.id !== place.id && candidate.area === place.area)
    .slice(0, 4);
  const locality = place.area === "La Trinidad" ? "La Trinidad" : "Baguio City";
  const entityJsonLd = {
    "@context": "https://schema.org",
    "@type": entityType(place),
    "@id": `${SITE_URL}/places/${place.id}#place`,
    name: place.name,
    url: `${SITE_URL}/places/${place.id}`,
    description: place.description,
    ...(place.image ? { image: absoluteUrl(place.image) } : {}),
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    },
    address: {
      "@type": "PostalAddress",
      ...(place.address ? { streetAddress: place.address } : {}),
      addressLocality: locality,
      addressRegion: "Benguet",
      addressCountry: "PH",
    },
    hasMap: directionsUrl(place),
    priceRange: priceRange(place),
    ...(place.externalUrl ? { sameAs: [place.externalUrl] } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Explore Baguio", item: `${SITE_URL}/explore` },
      { "@type": "ListItem", position: 3, name: place.name, item: `${SITE_URL}/places/${place.id}` },
    ],
  };

  return (
    <main id="main-content" className="place-guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([entityJsonLd, breadcrumbJsonLd]) }} />
      <div className="shell place-guide-shell">
        <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/explore">Explore</Link><span>/</span><span aria-current="page">{place.name}</span>
        </nav>

        <article>
          <header className="place-guide-hero">
            <div className="place-guide-copy">
              <span className="eyebrow"><MapPin size={14} /> {descriptor.label} · {place.area}</span>
              <h1>{place.name}: practical visitor guide</h1>
              <p>{place.description}</p>
              <div className="place-guide-actions">
                <Link className="button primary" href={`/plan?place=${place.id}`}><CalendarPlus size={17} /> {descriptor.action}</Link>
                <a className="button secondary" href={directionsUrl(place)} target="_blank" rel="noreferrer">Open Google Maps <Navigation size={16} /></a>
              </div>
            </div>
            {place.image ? <div className="place-guide-image"><Image src={place.image} alt={`${place.name} in ${place.area}`} fill sizes="(max-width: 800px) 100vw, 48vw" priority /></div> : null}
          </header>

          <section className="place-guide-facts" aria-label="Visit facts">
            <div><Clock3 /><span><small>Suggested time</small><strong>About {place.duration} minutes</strong></span></div>
            <div><Sparkles /><span><small>Planning budget</small><strong>{place.price || "Confirm locally"}</strong></span></div>
            <div><MapPin /><span><small>Area</small><strong>{place.area}</strong></span></div>
          </section>

          <div className="place-guide-layout">
            <div className="place-guide-main">
              <section>
                <span className="eyebrow">What to expect</span>
                <h2>Plan enough time to enjoy {place.name}</h2>
                <p>{place.description} The suggested visit time includes a little room to look around without treating the stop like a quick checklist.</p>
                <div className="tag-row">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </section>

              <section>
                <span className="eyebrow">Before you go</span>
                <h2>Check the live details on your travel date</h2>
                <ul className="place-guide-checklist">
                  <li><ShieldCheck /><span><strong>Confirm current access.</strong> Opening hours, entrance fees, reservations, menus, and property rules can change.</span></li>
                  <li><Clock3 /><span><strong>Protect the travel buffer.</strong> Baguio traffic, queues, rain, hills, and the final walk from a drop-off can add time.</span></li>
                  <li><MapPin /><span><strong>Use the public entrance.</strong> Check the final pin and ask staff or a dispatcher when a large property has several gates.</span></li>
                </ul>
                <p className="place-guide-review-note">Guide reviewed {LAST_CONTENT_REVIEW}. Live operating details should still be verified directly.</p>
              </section>

              {nearby.length ? <section>
                <span className="eyebrow">Nearby route ideas</span>
                <h2>Pair it with other stops in {place.area}</h2>
                <div className="nearby-place-links">
                  {nearby.map((candidate) => (
                    <Link href={`/places/${candidate.id}`} key={candidate.id}>
                      <span>{candidate.name}</span><small>{candidate.duration} min · {candidate.price}</small><ArrowRight />
                    </Link>
                  ))}
                </div>
              </section> : null}
            </div>

            <aside className="place-guide-sidebar">
              <span>Location reference</span>
              <h2>{place.address || `${place.area}, Benguet`}</h2>
              <p>{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</p>
              <a href={directionsUrl(place)} target="_blank" rel="noreferrer">Open directions <ExternalLink /></a>
              {place.externalUrl ? <a href={place.externalUrl} target="_blank" rel="noreferrer">Visit {place.externalLabel || "official provider"} <ExternalLink /></a> : null}
              <hr />
              <strong>Build a complete route</strong>
              <p>Let the planner group this stop with compatible places around your hotel, available hours, check-in, and checkout.</p>
              <Link href={`/plan?place=${place.id}`}>Customize my Baguio itinerary <ArrowRight /></Link>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}
