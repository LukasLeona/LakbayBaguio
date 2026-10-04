import * as maplibregl from "maplibre-gl";

// Next.js can rewrite MapLibre's import.meta.url when bundling client modules,
// which makes the default worker point at the current page instead of the
// worker module. Pin the matching worker build so vector tiles can load.
const MAPLIBRE_WORKER_URL = "https://unpkg.com/maplibre-gl@6.9.0/dist/maplibre-gl-worker.mjs";

export function configureMapLibreWorker() {
  if (maplibregl.getWorkerUrl() !== MAPLIBRE_WORKER_URL) {
    maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
  }
}
