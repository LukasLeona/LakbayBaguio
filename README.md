# Lakbay Baguio

A responsive, single-page Baguio itinerary planner built with HTML, CSS, and vanilla JavaScript.

## Open the project

1. Extract the project folder.
2. Open it in VS Code.
3. Run `index.html` with the Live Server extension.

Opening `index.html` directly also works for most features, but Live Server is recommended for Google Maps previews, browser location access, and local testing.

## Main features

- Sticky three-step navigation that follows the active planner section
- Trip planning for 1 to 5 days
- Victory Liner, Gov. Pack, Genesis Transport, and JoyBus starting points
- Early-arrival baggage-storage suggestions for supported terminals
- 48 destination cards with a working horizontal carousel and touch swiping
- Destination-name overlays that remain visible after photos are replaced
- Improved Must visit badges and highly visible selected states
- Selected-place chips that wrap, scroll vertically, and never require sideways scrolling
- Individual remove buttons and Clear all
- Automatic destination selection by travel theme
- Route ordering based on distance, time windows, and visit duration
- Night-only scheduling for Baguio Night Market
- Walk, jeepney, and taxi icons, fare estimates, and step-by-step directions
- Google Maps destination previews and external multi-stop route links
- Local browser saving, itinerary copying, desktop printing / PDF saving, and mobile responsiveness
- Mobile step navigation that highlights the current section while scrolling
- Restored information, travel-reminder, call-to-action, and full footer sections
- Kabsat, a Taglish emotional-support and travel-companion bot with quick replies, Baguio-curse conversation, trip-aware reactions, mute controls, and a guided breathing pause

## Color palette

```text
#819A91  Primary sage
#A7C1A8  Secondary sage
#D1D8BE  Soft sage
#EEEFE0  Cream background
#FFA02E  Orange highlight
#FFEF91  Yellow highlight
```

## Destination image size

Replace destination images inside:

```text
assets/img/destinations/
```

Recommended dimensions:

```text
800 × 500 pixels
```

A larger `1200 × 750` image also works. Keep the same filename and use an 8:5 landscape ratio. CSS uses `object-fit: cover`, so images crop neatly without changing card dimensions.

Examples:

```text
assets/img/destinations/burnham-park.jpg
assets/img/destinations/camp-john-hay.jpg
assets/img/destinations/igorot-stone-kingdom.jpg
```

Destination labels are HTML text, not part of the photos, so names remain visible after images are replaced.

## Google Maps

The project uses:

- Standard Google Maps search URLs
- Google Maps directions URLs for each route leg
- Multi-stop Google Maps URLs for each itinerary day
- A no-key Google Maps place preview iframe

A paid Google Maps API key is not required for the current implementation. The embedded preview shows a selected place, while the route buttons open full directions in Google Maps.

## Kabsat travel companion

Kabsat is a fully local, scripted bot. It does not require an API key, internet connection, or paid AI service. It includes:

- A floating avatar with short speech-bubble messages that pop out beside it
- Several rotating Taglish prompts per visit, with click-to-open chat behavior
- Taglish comfort, solo-trip, couple-trip, barkada, food, weather, and itinerary messages
- An interactive Baguio-curse conversation
- Context messages when destinations are selected or an itinerary is generated
- A 30-second guided breathing pause
- Mute and close controls
- Mobile-friendly chat layout
- A clear notice that it is not professional counseling or live transport advice

Edit its messages and conversation branches inside:

```text
assets/js/bot.js
```

The avatar is located at:

```text
assets/img/kabsat-avatar.svg
```

## Data and fare notes

`assets/js/data.js` contains:

- Attractions and side trips
- Approximate coordinates
- Planning hours
- Suggested visit durations
- Activity suggestions
- General jeepney-loading guidance
- Terminal baggage suggestions

Transport instructions, attraction hours, storage availability, and fares can change. The interface deliberately labels them as estimates and tells tourists to verify details locally.

## Files

```text
lakbay-baguio/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    ├── img/
    │   ├── logo.svg
    │   ├── favicon.svg
    │   ├── kabsat-avatar.svg
    │   └── destinations/
    └── js/
        ├── data.js
        ├── app.js
        └── bot.js
```

## Mobile printing

The Print / Save PDF control is hidden on narrow mobile screens because browser printing support is inconsistent across mobile devices. Tourists can still copy the complete itinerary on mobile. On desktop and supported tablets, the print button opens the system print dialog, where the plan can be saved as a PDF.
