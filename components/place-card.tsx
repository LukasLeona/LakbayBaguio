"use client";

import Link from "next/link";
import { ArrowUpRight, BedDouble, CalendarPlus, Clock3, ExternalLink, MapPin, Navigation, Sparkles, Trees, Utensils, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Place } from "@/lib/types";

const kindLabels = {
  park: "Place to visit",
  restaurant: "Restaurant",
  hotel: "Stay",
};

function directionsUrl(place: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
}

export function PlaceDetailsModal({ place, onClose }: { place: Place; onClose: () => void }) {
  const gallery = place.gallery?.length ? place.gallery : place.image ? [place.image] : [];
  const highlights = place.highlights?.length ? place.highlights : place.tags;
  const hotel = place.kind === "hotel";
  const restaurant = place.kind === "restaurant";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="place-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`place-modal ${place.kind}`} role="dialog" aria-modal="true" aria-labelledby={`place-modal-${place.id}`}>
        <button className="place-modal-close" type="button" onClick={onClose} aria-label="Close place details"><X /></button>
        <div className="place-modal-gallery">
          {gallery.slice(0, 3).map((image, index) => <img key={`${image}-${index}`} src={image} alt={index === 0 ? `${place.name} atmosphere preview` : ""} />)}
          <span className="place-modal-kind">{hotel ? <BedDouble /> : restaurant ? <Utensils /> : <Trees />} {kindLabels[place.kind]}</span>
        </div>
        <div className="place-modal-content">
          <div className="place-modal-overline"><MapPin size={14} /> {place.address || place.area}</div>
          <h2 id={`place-modal-${place.id}`}>{place.name}</h2>
          <p>{place.description}</p>

          <div className="place-modal-facts">
            <span><Clock3 /> Allow about {place.duration} min</span>
            <span><Sparkles /> {place.price || "Plan ahead"}</span>
          </div>

          <section className="place-highlights">
            <span>{restaurant ? "Menu highlights" : hotel ? "Why it feels cozy" : "Good to know"}</span>
            <div>{highlights.slice(0, 3).map((highlight) => <strong key={highlight}>{highlight}</strong>)}</div>
          </section>

          <div className="place-modal-actions">
            {hotel ? (
              <>
                <a className="button cozy-book" href={place.externalUrl || directionsUrl(place)} target="_blank" rel="noreferrer">Book now <ExternalLink size={17} /></a>
                <Link className="button modal-secondary" href={`/plan?place=${place.id}`} onClick={onClose}><CalendarPlus size={17} /> Add to my itinerary</Link>
              </>
            ) : (
              <>
                <Link className="button primary" href={`/plan?place=${place.id}`} onClick={onClose}><CalendarPlus size={17} /> Add to my itinerary</Link>
                <a className="button modal-secondary" href={directionsUrl(place)} target="_blank" rel="noreferrer"><Navigation size={17} /> Go now</a>
              </>
            )}
          </div>

          {hotel ? <small className="booking-note">Opens {place.externalLabel || "the booking provider"}. Availability and rates are handled by the provider, so check the final listing details before paying.</small> : restaurant ? <small className="booking-note">Menu highlights are a planning preview. Offerings and prices can change, so check with the restaurant before visiting.</small> : null}
          {place.photoCredit ? <a className="photo-credit" href={place.photoCredit.url} target="_blank" rel="noreferrer">Atmosphere preview · {place.photoCredit.label} <ArrowUpRight size={12} /></a> : null}
        </div>
      </section>
    </div>
  );
}

export function PlaceCard({ place, compact = false }: { place: Place; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const fallbackIcon = place.kind === "restaurant" ? "🍜" : place.kind === "hotel" ? "🛎️" : "🌲";

  return (
    <>
      <article className={`place-card kind-${place.kind} ${compact ? "compact" : ""}`}>
        <div className={`place-image ${place.image ? "has-image" : `fallback ${place.kind}`}`}>
          {place.image ? <img src={place.image} alt="" loading="lazy" /> : <span>{fallbackIcon}</span>}
          <span className="place-kind">
            {place.kind === "park" ? <Trees size={13} /> : place.kind === "hotel" ? <BedDouble size={13} /> : <Utensils size={13} />}
            {kindLabels[place.kind]}
          </span>
        </div>
        <div className="place-body">
          <div className="place-location"><MapPin size={14} /> {place.area}</div>
          <h3>{place.name}</h3>
          <p>{place.description}</p>
          <div className="tag-row">
            {place.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="place-meta">
            <strong>{place.price}</strong>
            <button type="button" onClick={() => setOpen(true)} aria-label={`${place.kind === "hotel" ? "View stay" : "Discover"} ${place.name}`}>
              {place.kind === "hotel" ? "View stay" : "Discover"} <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </article>
      {open ? <PlaceDetailsModal place={place} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
