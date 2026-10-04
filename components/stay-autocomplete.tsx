"use client";

import { BedDouble, Check, LoaderCircle, MapPin, Search } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import type { StayPlaceDetails, StaySuggestion } from "@/lib/stay-places";
import type { StayKind } from "@/lib/planner-types";

type StayAutocompleteProps = {
  kind: StayKind;
  value: string;
  locationSelected: boolean;
  onValueChange: (value: string) => void;
  onSelect: (place: StayPlaceDetails) => void;
  onChooseFromMap: () => void;
};

export function StayAutocomplete({ kind, value, locationSelected, onValueChange, onSelect, onChooseFromMap }: StayAutocompleteProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const committedValueRef = useRef("");
  const [suggestions, setSuggestions] = useState<StaySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [poweredByGeoapify, setPoweredByGeoapify] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const input = value.replace(/\s+/g, " ").trim();
    if (input && input === committedValueRef.current) {
      committedValueRef.current = "";
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (input.length < 2) {
      setSuggestions([]);
      setMessage("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const query = new URLSearchParams({ input });
        const response = await fetch(`/api/places/autocomplete?${query}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null) as {
          suggestions?: StaySuggestion[];
          poweredByGeoapify?: boolean;
          configured?: boolean;
          error?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.error || "Accommodation search is unavailable.");
        const nextSuggestions = payload?.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setPoweredByGeoapify(Boolean(payload?.poweredByGeoapify));
        setConfigured(payload?.configured !== false);
        setMessage(nextSuggestions.length ? "" : "No matching Baguio stay yet. Keep the property name, then choose its exact location on the map.");
        setActiveIndex(nextSuggestions.length ? 0 : -1);
        setOpen(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setMessage(error instanceof Error ? error.message : "Accommodation search is unavailable.");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 380);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  async function chooseSuggestion(suggestion: StaySuggestion) {
    setSelectingId(suggestion.id);
    setMessage("");
    try {
      const place: StayPlaceDetails = {
        placeId: suggestion.placeId || suggestion.id,
        name: suggestion.name,
        address: suggestion.address,
        ...suggestion.location,
      };
      committedValueRef.current = place.name;
      onSelect(place);
      setSuggestions([]);
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not open that accommodation.");
      setOpen(true);
    } finally {
      setSelectingId("");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="stay-autocomplete stay-name-field" ref={rootRef}>
      <div className="planner-field">
        <label htmlFor="stay-property-name">Property name</label>
        <div className="stay-autocomplete-input">
          <Search size={17} aria-hidden="true" />
          <input
            id="stay-property-name"
            type="search"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="stay-suggestion-list"
            aria-activedescendant={activeIndex >= 0 ? `stay-suggestion-${activeIndex}` : undefined}
            value={value}
            onChange={(event) => { committedValueRef.current = ""; onValueChange(event.target.value); }}
            onFocus={() => { if (value.trim().length >= 2) setOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={kind === "hotel" ? "Start typing a hotel name" : "Start typing a stay or Airbnb name"}
          />
          <span className="stay-search-state">{loading ? <LoaderCircle className="spin" size={17} aria-label="Searching accommodations" /> : null}</span>
          <button
            id="stay-map-picker-button"
            type="button"
            className={locationSelected ? "selected" : ""}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { setOpen(false); onChooseFromMap(); }}
            aria-label={locationSelected ? "Change property location on map" : "Choose property location from map"}
            title={locationSelected ? "Change map location" : "Choose from map"}
          >
            {locationSelected ? <Check aria-hidden="true" /> : <MapPin aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="stay-suggestion-popover">
          {suggestions.length ? (
            <ul id="stay-suggestion-list" role="listbox" aria-label="Accommodation suggestions">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    id={`stay-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? "active" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void chooseSuggestion(suggestion)}
                  >
                    <i>{selectingId === suggestion.id ? <LoaderCircle className="spin" /> : suggestion.source === "curated" ? <Check /> : <BedDouble />}</i>
                    <span><strong>{suggestion.name}</strong><small><MapPin /> {suggestion.address}</small></span>
                    {suggestion.source === "curated" ? <em>Buddy pick</em> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : message ? <p className="stay-suggestion-message">{message}</p> : null}
          <footer>
            {!configured ? <span>Showing Baguio Buddy stays. You can also type any property name and choose its location on the map.</span> : <span>Select a result or use the map button to set the exact pin.</span>}
            {poweredByGeoapify ? <span className="stay-data-credit">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></span> : null}
          </footer>
        </div>
      ) : null}
    </div>
  );
}
