"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, Clock3, Compass, MapPin, Search, SlidersHorizontal, Trees, Utensils } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlaceCard, PlaceDetailsModal } from "./place-card";
import { places } from "@/lib/places";
import type { Place, PlaceKind } from "@/lib/types";

const tabs: { value: "all" | PlaceKind; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "✦" },
  { value: "park", label: "Parks & places", icon: "🌲" },
  { value: "restaurant", label: "Restaurants", icon: "🍜" },
  { value: "hotel", label: "Hotels", icon: "🛎️" },
];

const featuredIds = ["mines-view-park", "bencab-museum", "strawberry-farm"];
const featuredPlaces = featuredIds.flatMap((id) => {
  const place = places.find((item) => item.id === id);
  return place ? [place] : [];
});

const categoryCards: { kind: PlaceKind; label: string; copy: string; icon: typeof Trees; image: string }[] = [
  { kind: "park", label: "Parks & landmarks", copy: "Fresh air, views, and heritage", icon: Trees, image: "/assets/img/destinations/wright-park.jpg" },
  { kind: "restaurant", label: "Restaurants", copy: "Menus, dining rooms, and local flavor", icon: Utensils, image: "/assets/img/venues/restaurant-warm-3.jpg" },
  { kind: "hotel", label: "Hotels & stays", copy: "Cozy rooms and booking options", icon: BedDouble, image: "/assets/img/venues/stay-cozy-1.jpg" },
];

function CuratedCard({ place, primary = false }: { place: Place; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`curated-place-card ${primary ? "primary" : ""}`}>
        <img src={place.image} alt="" loading="lazy" />
        <span className="curated-shade" />
        <span className="curated-badge">{primary ? "Editor’s trail" : place.area}</span>
        <span className="curated-copy"><small><MapPin size={12} /> {place.area}</small><strong>{place.name}</strong><em><Clock3 size={12} /> {place.duration} min · {place.price}</em></span>
        <span className="curated-action"><ArrowRight size={17} /></span>
      </button>
      {open ? <PlaceDetailsModal place={place} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function ExploreGrid() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const [kind, setKind] = useState<"all" | PlaceKind>(initialType === "restaurant" || initialType === "hotel" || initialType === "park" ? initialType : "all");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("all");
  const [filtersCompact, setFiltersCompact] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScrollYRef = useRef(0);
  const keepExpandedUntilRef = useRef(0);

  const areas = useMemo(() => [...new Set(places.map((place) => place.area))].sort(), []);
  const filtered = useMemo(() => places.filter((place) => {
    const matchesKind = kind === "all" || place.kind === kind;
    const matchesArea = area === "all" || place.area === area;
    const haystack = `${place.name} ${place.description} ${place.tags.join(" ")}`.toLowerCase();
    return matchesKind && matchesArea && haystack.includes(query.toLowerCase().trim());
  }), [area, kind, query]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    const updateFilterMode = () => {
      const stickyTop = window.innerWidth <= 700 ? 82 : 96;
      const shouldCompact = (filterSentinelRef.current?.getBoundingClientRect().top ?? stickyTop + 1) <= stickyTop;
      setFiltersCompact(shouldCompact);
      if (!shouldCompact) {
        setFiltersExpanded(false);
      } else if (
        filtersExpanded
        && window.scrollY > lastScrollYRef.current + 8
        && Date.now() > keepExpandedUntilRef.current
      ) {
        setFiltersExpanded(false);
      }
      lastScrollYRef.current = window.scrollY;
    };

    updateFilterMode();
    window.addEventListener("scroll", updateFilterMode, { passive: true });
    window.addEventListener("resize", updateFilterMode);
    return () => {
      window.removeEventListener("scroll", updateFilterMode);
      window.removeEventListener("resize", updateFilterMode);
    };
  }, [filtersExpanded]);

  function openCompactFilters() {
    const opening = !filtersExpanded;
    keepExpandedUntilRef.current = Date.now() + 700;
    setFiltersExpanded(opening);
    if (opening) window.setTimeout(() => searchInputRef.current?.focus(), 260);
  }

  function chooseKind(nextKind: PlaceKind) {
    setKind(nextKind);
    setQuery("");
    keepExpandedUntilRef.current = Date.now() + 1300;
    setFiltersExpanded(true);
    filterSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="explore-curated-section">
        <div className="explore-section-heading"><div><span className="eyebrow"><Compass size={14} /> Start with a classic</span><h2>Popular, with good reason.</h2></div><p>Three different sides of the highlands—from a sunrise lookout to art and farm country.</p></div>
        <div className="curated-place-grid">
          {featuredPlaces.map((place, index) => <CuratedCard place={place} primary={index === 0} key={place.id} />)}
        </div>
      </section>

      <section className="explore-category-section">
        <div className="explore-section-heading compact"><div><span className="eyebrow">Browse your way</span><h2>What are you looking for?</h2></div></div>
        <div className="explore-category-grid">
          {categoryCards.map(({ kind: itemKind, label, copy, icon: Icon, image }) => (
            <button type="button" onClick={() => chooseKind(itemKind)} className="explore-category-card" key={itemKind}>
              <img src={image} alt="" loading="lazy" /><span className="category-shade" />
              <span className="category-icon"><Icon size={19} /></span><span className="category-copy"><strong>{label}</strong><small>{copy}</small></span><ArrowRight size={19} />
            </button>
          ))}
        </div>
      </section>

      <div className="explore-filter-sentinel" ref={filterSentinelRef} aria-hidden="true" />
      <section className={`explore-filter-panel ${filtersCompact ? "is-compact" : ""} ${filtersExpanded ? "is-expanded" : ""}`} id="all-places">
        <button type="button" className="explore-compact-toggle" aria-expanded={filtersExpanded} aria-controls="explore-filter-options" onClick={openCompactFilters}>
          <span><Search /><strong>{query || (tabs.find((tab) => tab.value === kind)?.label ?? "Search places")}</strong><small>{area === "all" ? `${filtered.length} places` : area}</small></span>
          <SlidersHorizontal />
        </button>
        <div className="explore-filter-shell" id="explore-filter-options">
          <div className="explore-filter-title"><div><span className="eyebrow">The complete guide</span><h2>Find your next stop</h2></div><span className="place-count"><strong>{filtered.length}</strong> places</span></div>
          <div className="explore-toolbar">
          <div className="explore-tabs" role="tablist" aria-label="Place type">
            {tabs.map((tab) => (
              <button key={tab.value} type="button" role="tab" aria-selected={kind === tab.value} className={kind === tab.value ? "active" : ""} onClick={() => setKind(tab.value)}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          <div className="explore-controls">
            <label className="search-field"><Search size={18} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places or experiences" /></label>
            <label className="select-field"><SlidersHorizontal size={17} /><select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filter by area"><option value="all">All areas</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          </div>
        </div>
      </section>

      {filtered.length ? (
        <div className="place-grid explore-place-grid">{filtered.map((place) => <PlaceCard key={place.id} place={place} />)}</div>
      ) : (
        <div className="empty-state"><span>🍃</span><h2>No matches yet</h2><p>Try another search or remove an area filter.</p></div>
      )}

      <section className="explore-route-cta">
        <div><span className="eyebrow light">Found a few favorites?</span><h2>Turn them into a practical Baguio day.</h2><p>Baguio Buddy organizes your selected stops with timing, directions, and estimated transport fares.</p></div>
        <Link href="/plan" className="button lime">Create my itinerary <ArrowRight size={18} /></Link>
      </section>
    </>
  );
}
