"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { Crosshair, LoaderCircle, MapPin, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type LocationPickerValue = {
  lat: number;
  lng: number;
};

type LocationPickerDialogProps = {
  title: string;
  description: string;
  initialValue: LocationPickerValue;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (value: LocationPickerValue) => void;
};

const BAGUIO_PICKER_BOUNDS = {
  minLat: 16.15,
  maxLat: 16.75,
  minLng: 120.35,
  maxLng: 120.95,
};

const OPEN_FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function isInsideSupportedArea({ lat, lng }: LocationPickerValue) {
  return (
    lat >= BAGUIO_PICKER_BOUNDS.minLat &&
    lat <= BAGUIO_PICKER_BOUNDS.maxLat &&
    lng >= BAGUIO_PICKER_BOUNDS.minLng &&
    lng <= BAGUIO_PICKER_BOUNDS.maxLng
  );
}

export function LocationPickerDialog({
  title,
  description,
  initialValue,
  confirmLabel,
  onClose,
  onConfirm,
}: LocationPickerDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [coordinates, setCoordinates] = useState(initialValue);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const insideSupportedArea = isInsideSupportedArea(coordinates);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || OPEN_FREE_MAP_STYLE,
      center: [initialValue.lng, initialValue.lat],
      zoom: 14.2,
      attributionControl: false,
      maxBounds: [
        [BAGUIO_PICKER_BOUNDS.minLng, BAGUIO_PICKER_BOUNDS.minLat],
        [BAGUIO_PICKER_BOUNDS.maxLng, BAGUIO_PICKER_BOUNDS.maxLat],
      ],
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    const syncCoordinates = () => {
      const center = map.getCenter();
      setCoordinates({ lat: center.lat, lng: center.lng });
    };

    map.on("move", syncCoordinates);
    map.once("load", () => map.resize());
    mapRef.current = map;

    return () => {
      map.off("move", syncCoordinates);
      map.remove();
      mapRef.current = null;
    };
  }, [initialValue.lat, initialValue.lng]);

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location access is not available on this device. Move the map pin instead.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude };
        if (!isInsideSupportedArea(next)) {
          setLocationError("Your location is outside the Baguio planning area. Move the map to your Baguio starting point.");
          setLocating(false);
          return;
        }
        setCoordinates(next);
        mapRef.current?.flyTo({ center: [next.lng, next.lat], zoom: 15.4, duration: 700 });
        setLocating(false);
      },
      () => {
        setLocationError("We could not access your location. Allow location access or move the map manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div
      className="location-picker-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="location-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="location-picker-header">
          <div>
            <span className="eyebrow">Choose from map</span>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close map picker">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="location-picker-map-wrap">
          <div ref={mapContainerRef} className="location-picker-map" aria-label="Interactive map of Baguio" />
          <div className="location-picker-center-pin" aria-hidden="true">
            <MapPin />
            <span />
          </div>
          <div className="location-picker-tip">Move the map until the pin is on the exact entrance</div>
          <button className="location-picker-locate" type="button" onClick={useDeviceLocation} disabled={locating}>
            {locating ? <LoaderCircle className="spin" aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
            {locating ? "Finding you" : "Use my location"}
          </button>
        </div>

        <footer className="location-picker-footer">
          <div className={`location-picker-coordinate ${insideSupportedArea ? "valid" : "invalid"}`}>
            <MapPin aria-hidden="true" />
            <span>
              <strong>{insideSupportedArea ? "Pin is inside the Baguio planning area" : "Move the pin back to the Baguio area"}</strong>
              <small>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</small>
            </span>
          </div>
          {locationError ? <p className="location-picker-error" role="alert">{locationError}</p> : null}
          <div className="location-picker-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button
              className="button primary"
              type="button"
              disabled={!insideSupportedArea}
              onClick={() => onConfirm(coordinates)}
            >
              <MapPin aria-hidden="true" />
              {confirmLabel}
            </button>
          </div>
          <small className="location-picker-credit">
            Map data © OpenStreetMap contributors · map tiles by OpenFreeMap
          </small>
        </footer>
      </section>
    </div>
  );
}
