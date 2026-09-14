"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef } from "react";

export type MapTraveler = {
  user_id: string;
  alias: string;
  avatar_seed: number;
  display_latitude?: number | null;
  display_longitude?: number | null;
};

const openStreetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "openstreetmap", type: "raster", source: "openstreetmap" }],
};

export function NearbyMap({ travelers, ownLocation }: { travelers: MapTraveler[]; ownLocation: { lat: number; lng: number } | null }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || openStreetMapStyle,
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
    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (ownLocation) {
        const own = document.createElement("div");
        own.className = "map-marker own";
        own.innerHTML = "<span></span>";
        markersRef.current.push(new maplibregl.Marker({ element: own }).setLngLat([ownLocation.lng, ownLocation.lat]).setPopup(new maplibregl.Popup({ offset: 18 }).setText("You — visible only on your device")).addTo(map));
        map.easeTo({ center: [ownLocation.lng, ownLocation.lat], zoom: 13.8, duration: 700 });
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
      map.resize();
    };

    if (map.loaded()) renderMarkers();
    else map.once("load", renderMarkers);
    return () => { map.off("load", renderMarkers); };
  }, [ownLocation, travelers]);

  return <><div className="nearby-map" ref={container} aria-label="Map of approximate nearby traveler locations" /><div className="map-fallback-labels" aria-hidden="true"><strong>Baguio City</strong><span className="burnham">Burnham Park</span><span className="session">Session Road</span><span className="botanical">Botanical Garden</span></div></>;
}
