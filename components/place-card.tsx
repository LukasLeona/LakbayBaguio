import Link from "next/link";
import { ArrowUpRight, BedDouble, MapPin, Trees } from "lucide-react";
import type { Place } from "@/lib/types";

const kindLabels = {
  park: "Place to visit",
  restaurant: "Restaurant",
  hotel: "Stay",
};

export function PlaceCard({ place, compact = false }: { place: Place; compact?: boolean }) {
  const fallbackIcon = place.kind === "restaurant" ? "🍜" : place.kind === "hotel" ? "🛎️" : "🌲";

  return (
    <article className={`place-card ${compact ? "compact" : ""}`}>
      <div className={`place-image ${place.image ? "has-image" : `fallback ${place.kind}`}`}>
        {place.image ? <img src={place.image} alt="" loading="lazy" /> : <span>{fallbackIcon}</span>}
        <span className="place-kind">
          {place.kind === "park" ? <Trees size={13} /> : place.kind === "hotel" ? <BedDouble size={13} /> : null}
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
          <Link href={`/plan?place=${place.id}`} aria-label={`Add ${place.name} to a trip`}>
            Add to plan <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
