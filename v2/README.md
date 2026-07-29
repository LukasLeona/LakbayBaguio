# Lakbay Baguio

Lakbay Baguio is a responsive, single-page itinerary planner for tourists visiting Baguio City and selected nearby Benguet destinations.

## What is included

- 44 major attractions and popular nearby side trips
- Search and area filters
- Automatic stop ordering to reduce backtracking
- Time-window handling and estimated visit durations
- Walking, jeepney, and taxi/hired-car suggestions
- Editable planning fare assumptions
- Detailed jeepney guidance with:
  - suggested loading area
  - route or signboard to look for
  - where to ask to alight
  - return-trip reminder
  - Google Maps link to the loading area
- Suggested activities for every destination
- Google Maps destination preview
- Google Maps leg preview
- “Navigate now” links that can use the tourist’s current device location
- Mobile-safe full-route links split into parts for long itineraries
- Browser geolocation for the starting point and map preview
- Copy and print itinerary controls
- Saved planner choices through `localStorage`

## Google Maps implementation

This static project uses Google Maps URLs and a Google Maps preview iframe. It does **not** require an API key for the included features.

- Place links open a destination in Google Maps.
- Leg links open directions from one itinerary stop to the next.
- “Navigate now” omits the origin so Google Maps can use the device’s current location when available.
- Long routes are divided into mobile-safe parts because waypoint limits differ across devices.

A future production version can use the Google Maps JavaScript API and Routes API for richer in-page traffic-aware routing. That upgrade requires a Google Cloud project, billing, an API key, and proper key restrictions.

## Important transport limitation

Google Maps road directions and Baguio jeepney guidance solve different parts of the trip:

- Google Maps handles road, walking, and live navigation.
- The project’s jeepney instructions provide curated loading-area and signboard guidance.
- Google transit coverage may not represent every Baguio PUJ route.
- Loading bays, route operations, fares, drop-off points, attraction hours, trail access, and road controls can change.

Tourists should always verify the exact route with a driver or dispatcher before boarding.

## Destination coverage

The dataset includes major stops across:

- City Center
- East Baguio
- South Baguio
- West Baguio
- Nearby Benguet

Requested additions include Igorot Stone Kingdom, Ili-Likha Artists Village, La Trinidad Strawberry Farm, Dragon Treasure Castle, Mt. Camisong Forest Park, and Valley of Colors. Other additions include BenCab Museum, Mount Costa, Mt. Kalugong, Mt. Yangbew, Bell Church, PMA, Lion’s Head, Easter Weaving Room, Camp John Hay’s historical core, and more.

“Nearby Benguet” destinations are clearly labeled because they are not within Baguio proper and usually need more travel time.

## Run locally

### VS Code Live Server

1. Open the `lakbay-baguio` folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

### Python local server

From the project folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Geolocation generally works on HTTPS websites and on `localhost`. It may be blocked when `index.html` is opened directly as a `file://` page.

## Project structure

```text
lakbay-baguio/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    ├── img/
    │   ├── favicon.svg
    │   └── logo.svg
    └── js/
        ├── app.js
        └── data.js
```

## Editing destination information

Destination content is stored in `assets/js/data.js`.

Each destination can include:

- name and coordinates
- area and category
- estimated duration and hours
- description
- `thingsToDo`
- `commute` guidance
- Google Maps search query
- side-trip label

Keep transport guidance conservative. When a direct jeepney connection is uncertain, recommend confirming with a dispatcher or using a taxi for the last mile.

## Production checklist

Before publishing publicly:

- Field-check every listed jeepney loading bay and drop-off point.
- Confirm attraction operating hours and admission requirements.
- Add a visible “last verified” date to each route.
- Add an admin editor or database for route updates.
- Review accessibility with keyboard and screen-reader testing.
- Add analytics and privacy information if collecting usage data.
- Restrict any future Google Maps API key by domain and API.
