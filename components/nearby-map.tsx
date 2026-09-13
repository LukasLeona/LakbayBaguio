"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

export type MapTraveler = {
  user_id: string;
  alias: string;
  avatar_seed: number;
  display_latitude?: number | null;
  display_longitude?: number | null;
};

export function NearbyMap({ travelers, ownLocation }: { travelers: MapTraveler[]; ownLocation: { lat: number; lng: number } | null }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json",
      center: [120.596, 16.413],
      zoom: 12.7,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (ownLocation) {
      const own = document.createElement("div");
      own.className = "map-marker own";
      own.innerHTML = "<span></span>";
      markersRef.current.push(new maplibregl.Marker({ element: own }).setLngLat([ownLocation.lng, ownLocation.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setText("You — visible only on your device")).addTo(map));
    }

    travelers.forEach((traveler) => {
      if (typeof traveler.display_latitude !== "number" || typeof traveler.display_longitude !== "number") return;
      const marker = document.createElement("button");
      marker.className = "map-marker traveler";
      marker.type = "button";
      marker.setAttribute("aria-label", `${traveler.alias}, approximate location`);
      marker.textContent = traveler.alias.replace(/[0-9]/g, "").match(/[A-Z]/g)?.slice(0, 2).join("") || "T";
      markersRef.current.push(new maplibregl.Marker({ element: marker }).setLngLat([traveler.display_longitude, traveler.display_latitude]).setPopup(new maplibregl.Popup({ offset: 22 }).setHTML(`<strong>${traveler.alias}</strong><br><small>Approximate area only</small>`)).addTo(map));
    });
  }, [ownLocation, travelers]);

  return <div className="nearby-map" ref={container} aria-label="Map of approximate nearby traveler locations" />;
}
