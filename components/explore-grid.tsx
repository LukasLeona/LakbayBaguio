"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PlaceCard } from "./place-card";
import { places } from "@/lib/places";
import type { PlaceKind } from "@/lib/types";

const tabs: { value: "all" | PlaceKind; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "✦" },
  { value: "park", label: "Parks & places", icon: "🌲" },
  { value: "restaurant", label: "Restaurants", icon: "🍜" },
  { value: "hotel", label: "Hotels", icon: "🛎️" },
];

export function ExploreGrid() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const [kind, setKind] = useState<"all" | PlaceKind>(initialType === "restaurant" || initialType === "hotel" || initialType === "park" ? initialType : "all");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("all");

  const areas = useMemo(() => [...new Set(places.map((place) => place.area))].sort(), []);
  const filtered = useMemo(() => places.filter((place) => {
    const matchesKind = kind === "all" || place.kind === kind;
    const matchesArea = area === "all" || place.area === area;
    const haystack = `${place.name} ${place.description} ${place.tags.join(" ")}`.toLowerCase();
    return matchesKind && matchesArea && haystack.includes(query.toLowerCase().trim());
  }), [area, kind, query]);

  return (
    <>
      <div className="explore-toolbar">
        <div className="explore-tabs" role="tablist" aria-label="Place type">
          {tabs.map((tab) => (
            <button key={tab.value} type="button" role="tab" aria-selected={kind === tab.value} className={kind === tab.value ? "active" : ""} onClick={() => setKind(tab.value)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
        <div className="explore-controls">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places or experiences" /></label>
          <label className="select-field"><SlidersHorizontal size={17} /><select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filter by area"><option value="all">All areas</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </div>
      <div className="result-summary"><strong>{filtered.length}</strong> places ready to explore</div>
      {filtered.length ? (
        <div className="place-grid explore-place-grid">{filtered.map((place) => <PlaceCard key={place.id} place={place} />)}</div>
      ) : (
        <div className="empty-state"><span>🍃</span><h2>No matches yet</h2><p>Try another search or remove an area filter.</p></div>
      )}
    </>
  );
}
