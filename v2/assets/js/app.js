(() => {
  "use strict";

  const data = window.LAKBAY_DATA;
  if (!data) throw new Error("Lakbay Baguio data failed to load.");

  const state = {
    selected: new Set(),
    activeArea: "All",
    customStart: null,
    liveLocation: null,
    itinerary: null,
    activeMapStopId: null,
    toastTimer: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const elements = {
    loader: $("#pageLoader"),
    header: $(".site-header"),
    menuToggle: $("#menuToggle"),
    mainNav: $("#mainNav"),
    form: $("#plannerForm"),
    startLocation: $("#startLocation"),
    useLocation: $("#useLocation"),
    tripDate: $("#tripDate"),
    startTime: $("#startTime"),
    tripHours: $("#tripHours"),
    travelers: $("#travelers"),
    destinationSearch: $("#destinationSearch"),
    areaFilters: $("#areaFilters"),
    destinationGrid: $("#destinationGrid"),
    selectionCount: $("#selectionCount"),
    destinationError: $("#destinationError"),
    destinationTotal: $("#destinationTotal"),
    results: $("#results"),
    resultsTitle: $("#resultsTitle"),
    resultsSubtitle: $("#resultsSubtitle"),
    summaryGrid: $("#summaryGrid"),
    timeline: $("#timeline"),
    excludedStops: $("#excludedStops"),
    editPlan: $("#editPlan"),
    copyPlan: $("#copyPlan"),
    printPlan: $("#printPlan"),
    googleMapFrame: $("#googleMapFrame"),
    locateOnMap: $("#locateOnMap"),
    mapLocationTitle: $("#mapLocationTitle"),
    mapLocationStatus: $("#mapLocationStatus"),
    nextStopNav: $("#nextStopNav"),
    openRouteParts: $("#openRouteParts"),
    routeParts: $("#routeParts"),
    mapStopList: $("#mapStopList"),
    toast: $("#toast")
  };

  function init() {
    populateStartLocations();
    setMinimumDate();
    renderAreaFilters();
    restoreSavedState();
    renderDestinations();
    updateProgress();
    bindEvents();
    setupRevealObserver();

    if (elements.destinationTotal) elements.destinationTotal.textContent = `${data.destinations.length}`;
    $("#currentYear").textContent = new Date().getFullYear();

    const hideLoader = () => elements.loader?.classList.add("is-hidden");
    window.addEventListener("load", () => window.setTimeout(hideLoader, 250), { once: true });
    window.setTimeout(hideLoader, 1200);
  }

  function populateStartLocations() {
    elements.startLocation.innerHTML = data.startLocations
      .map((location) => `<option value="${escapeHTML(location.id)}">${escapeHTML(location.name)}</option>`)
      .join("");
  }

  function setMinimumDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    elements.tripDate.min = localDate;
    if (!elements.tripDate.value) elements.tripDate.value = localDate;
  }

  function renderAreaFilters() {
    elements.areaFilters.innerHTML = data.areaOrder
      .map((area) => `<button class="area-filter ${state.activeArea === area ? "active" : ""}" type="button" data-area="${escapeHTML(area)}">${escapeHTML(area)}</button>`)
      .join("");
  }

  function renderDestinations() {
    const query = elements.destinationSearch.value.trim().toLowerCase();
    const filtered = data.destinations.filter((destination) => {
      const matchesArea = state.activeArea === "All" || destination.area === state.activeArea;
      const haystack = [
        destination.name,
        destination.area,
        destination.category,
        destination.description,
        ...(destination.tags || []),
        ...(destination.thingsToDo || [])
      ].join(" ").toLowerCase();
      return matchesArea && haystack.includes(query);
    });

    if (!filtered.length) {
      elements.destinationGrid.innerHTML = `<div class="destination-empty">No destinations match this search. Try another name, activity, or area.</div>`;
      return;
    }

    elements.destinationGrid.innerHTML = filtered.map((destination) => {
      const selected = state.selected.has(destination.id);
      return `
        <label class="destination-option ${selected ? "selected" : ""}" data-id="${escapeHTML(destination.id)}">
          <input type="checkbox" value="${escapeHTML(destination.id)}" ${selected ? "checked" : ""} />
          <span class="destination-icon">${destination.icon}</span>
          <span class="destination-name">${escapeHTML(destination.name)}</span>
          <span class="destination-meta">${escapeHTML(destination.area)} · ${formatDuration(destination.duration)}</span>
          ${destination.outsideBaguio ? '<span class="destination-side-trip">Side trip</span>' : ""}
          <span class="destination-check">✓</span>
        </label>
      `;
    }).join("");
  }

  function bindEvents() {
    window.addEventListener("scroll", () => elements.header.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

    elements.menuToggle.addEventListener("click", () => {
      const open = elements.mainNav.classList.toggle("open");
      elements.menuToggle.classList.toggle("open", open);
      elements.menuToggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });
    $$("#mainNav a").forEach((link) => link.addEventListener("click", closeMenu));

    elements.areaFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-area]");
      if (!button) return;
      state.activeArea = button.dataset.area;
      renderAreaFilters();
      renderDestinations();
    });

    elements.destinationSearch.addEventListener("input", renderDestinations);
    elements.destinationGrid.addEventListener("change", (event) => {
      const checkbox = event.target.closest("input[type='checkbox']");
      if (!checkbox) return;
      toggleDestination(checkbox.value, checkbox.checked);
    });

    $$("input[name='preference']").forEach((radio) => {
      radio.addEventListener("change", () => {
        $$(".preference-card").forEach((card) => card.classList.toggle("active", Boolean($("input:checked", card))));
        updateProgress();
      });
    });

    elements.useLocation.addEventListener("click", () => requestLocation({ setAsStart: true, updateMap: true }));
    elements.locateOnMap?.addEventListener("click", () => requestLocation({ setAsStart: false, updateMap: true }));
    elements.form.addEventListener("submit", generateItinerary);
    elements.editPlan.addEventListener("click", () => $("#planner").scrollIntoView({ behavior: "smooth" }));
    elements.copyPlan.addEventListener("click", copyItinerary);
    elements.printPlan.addEventListener("click", () => window.print());
    elements.openRouteParts?.addEventListener("click", toggleRouteParts);

    elements.mapStopList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-map-stop]");
      if (!button || !state.itinerary) return;
      previewMapStop(button.dataset.mapStop);
    });

    elements.timeline.addEventListener("click", (event) => {
      const action = event.target.closest("[data-map-action]");
      if (!action || !state.itinerary) return;
      const item = state.itinerary.items.find((entry) => entry.destination.id === action.dataset.stopId);
      if (!item) return;

      const type = action.dataset.mapAction;
      if (type === "preview") {
        previewLeg(item);
      } else if (type === "place") {
        window.open(mapsSearchUrl(item.destination), "_blank", "noopener");
      } else if (type === "terminal") {
        window.open(mapsQueryUrl(item.destination.commute.terminalQuery), "_blank", "noopener");
      }
    });

    $$(".cluster-button").forEach((button) => button.addEventListener("click", () => addCluster(button.dataset.cluster)));
    [elements.startLocation, elements.tripDate, elements.startTime, elements.tripHours, elements.travelers]
      .forEach((control) => control.addEventListener("change", updateProgress));
    window.addEventListener("beforeunload", saveFormState);
  }

  function closeMenu() {
    elements.mainNav.classList.remove("open");
    elements.menuToggle.classList.remove("open");
    elements.menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function toggleDestination(id, checked) {
    if (checked) state.selected.add(id);
    else state.selected.delete(id);
    elements.selectionCount.textContent = state.selected.size;
    elements.destinationError.textContent = "";
    renderDestinations();
    updateProgress();
    saveFormState();
  }

  function addCluster(area) {
    data.destinations.filter((destination) => destination.area === area).forEach((destination) => state.selected.add(destination.id));
    elements.selectionCount.textContent = state.selected.size;
    state.activeArea = area;
    renderAreaFilters();
    renderDestinations();
    updateProgress();
    showToast(`${area} destinations added. The time limit may exclude longer stops.`);
    $("#planner").scrollIntoView({ behavior: "smooth" });
  }

  function updateProgress() {
    const statuses = [
      Boolean(elements.startLocation.value && elements.startTime.value),
      state.selected.size >= 2,
      Boolean($("input[name='preference']:checked"))
    ];
    $$('[data-progress]').forEach((item, index) => item.classList.toggle("active", statuses[index]));
  }

  function requestLocation({ setAsStart, updateMap }) {
    if (!navigator.geolocation) {
      showToast("Location access is not supported by this browser.");
      return;
    }

    const button = setAsStart ? elements.useLocation : elements.locateOnMap;
    const originalText = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = "Locating…";
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          id: "current-location",
          name: "My current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          area: "Current location",
          googleQuery: `${position.coords.latitude},${position.coords.longitude}`
        };
        state.liveLocation = location;

        if (setAsStart) {
          state.customStart = location;
          let option = elements.startLocation.querySelector("option[value='current-location']");
          if (!option) {
            option = new Option("My current location", "current-location");
            elements.startLocation.prepend(option);
          }
          elements.startLocation.value = "current-location";
          updateProgress();
        }

        if (updateMap && elements.googleMapFrame) {
          elements.googleMapFrame.src = mapEmbedPlace(location);
          elements.mapLocationTitle.textContent = "Your current location";
          elements.mapLocationStatus.textContent = `Accuracy: about ${Math.round(position.coords.accuracy)} meters. Open Google Maps for live movement.`;
          if (state.itinerary?.items.length) setNavigationTarget(state.itinerary.items[0].destination, "Navigate from my location");
        }

        if (button) {
          button.disabled = false;
          button.textContent = setAsStart ? "✓" : "Location found";
          window.setTimeout(() => { button.textContent = originalText || (setAsStart ? "⌖" : "Use my location"); }, 1800);
        }
        showToast(setAsStart ? "Current location set as your starting point." : "Current location shown on the map.");
      },
      (error) => {
        if (button) {
          button.disabled = false;
          button.textContent = originalText || (setAsStart ? "⌖" : "Use my location");
        }
        const message = error.code === 1
          ? "Location permission was denied. You can still open every stop in Google Maps."
          : "We could not read your location. Try again on HTTPS or localhost.";
        showToast(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  }

  function generateItinerary(event) {
    event.preventDefault();

    if (!elements.form.checkValidity()) {
      elements.form.reportValidity();
      return;
    }
    if (state.selected.size < 2) {
      elements.destinationError.textContent = "Please select at least two destinations to build a useful route.";
      $(".destination-toolbar").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const modes = $$("input[name='mode']:checked").map((input) => input.value);
    if (!modes.length) {
      showToast("Choose at least one allowed travel mode.");
      return;
    }

    const start = getSelectedStart();
    const selectedDestinations = data.destinations.filter((destination) => state.selected.has(destination.id));
    const preference = $("input[name='preference']:checked").value;
    const availableMinutes = Number(elements.tripHours.value) * 60;
    const travelers = clamp(Number(elements.travelers.value), 1, 12);
    const fareSettings = getFareSettings();
    const optimized = optimizeRoute(start, selectedDestinations, preference);
    const built = buildTimedItinerary(start, optimized, {
      preference,
      availableMinutes,
      travelers,
      modes,
      fareSettings,
      startTime: elements.startTime.value
    });

    state.itinerary = { start, ...built, preference, travelers, fareSettings, date: elements.tripDate.value };
    renderResults(state.itinerary);
    renderGoogleMap(state.itinerary);
    saveFormState();

    elements.results.hidden = false;
    window.setTimeout(() => {
      elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
      setupRevealObserver();
    }, 50);
  }

  function getSelectedStart() {
    if (elements.startLocation.value === "current-location" && state.customStart) return state.customStart;
    return data.startLocations.find((location) => location.id === elements.startLocation.value) || data.startLocations[0];
  }

  function getFareSettings() {
    return {
      jeepMinimum: nonNegativeNumber($("#jeepMinimum").value, 13),
      jeepBaseKm: nonNegativeNumber($("#jeepBaseKm").value, 4),
      jeepPerKm: nonNegativeNumber($("#jeepPerKm").value, 1.8),
      taxiFlag: nonNegativeNumber($("#taxiFlag").value, 50),
      taxiPerKm: nonNegativeNumber($("#taxiPerKm").value, 15)
    };
  }

  function optimizeRoute(start, destinations, preference) {
    const remaining = [...destinations];
    const route = [];
    let current = start;

    while (remaining.length) {
      let bestIndex = 0;
      let bestScore = Infinity;
      remaining.forEach((candidate, index) => {
        const distance = haversine(current, candidate);
        const sameAreaBonus = current.area === candidate.area ? -0.45 : 0;
        const nearbyPairBonus = candidate.tags?.includes("nearby pair") || candidate.tags?.includes("walkable pair") ? -0.12 : 0;
        const sideTripPenalty = candidate.outsideBaguio && !current.outsideBaguio ? 1.1 : 0;
        const longVisitPenalty = preference === "fastest" ? candidate.duration / 750 : 0;
        const score = distance + sameAreaBonus + nearbyPairBonus + sideTripPenalty + longVisitPenalty;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      const [next] = remaining.splice(bestIndex, 1);
      route.push(next);
      current = next;
    }
    return improveRouteWithTwoOpt(start, route);
  }

  function improveRouteWithTwoOpt(start, route) {
    if (route.length < 4) return route;
    let improved = [...route];
    let changed = true;
    let passes = 0;
    while (changed && passes < 4) {
      changed = false;
      passes += 1;
      for (let i = 0; i < improved.length - 2; i += 1) {
        for (let j = i + 1; j < improved.length - 1; j += 1) {
          const candidate = [...improved.slice(0, i), ...improved.slice(i, j + 1).reverse(), ...improved.slice(j + 1)];
          if (routeDistance(start, candidate) + 0.02 < routeDistance(start, improved)) {
            improved = candidate;
            changed = true;
          }
        }
      }
    }
    return improved;
  }

  function routeDistance(start, route) {
    let distance = 0;
    let current = start;
    route.forEach((stop) => {
      distance += haversine(current, stop);
      current = stop;
    });
    return distance;
  }

  function buildTimedItinerary(start, route, options) {
    const startMinutes = timeToMinutes(options.startTime);
    const endLimit = startMinutes + options.availableMinutes;
    let cursor = startMinutes;
    let current = start;
    let totalDistance = 0;
    let totalFare = 0;
    let totalTravel = 0;
    const items = [];
    const excluded = [];

    for (const destination of route) {
      const straightDistance = haversine(current, destination);
      const roadDistance = Math.max(straightDistance, straightDistance * (destination.outsideBaguio ? 1.34 : 1.22));
      const transport = chooseTransport(current, destination, roadDistance, options);
      const projectedArrival = cursor + transport.minutes;
      const openMinutes = timeToMinutes(destination.open);
      const closeMinutes = timeToMinutes(destination.close);
      const waitMinutes = projectedArrival < openMinutes ? openMinutes - projectedArrival : 0;
      const visitStart = projectedArrival + waitMinutes;
      const visitEnd = visitStart + destination.duration;

      if (visitEnd > endLimit && items.length >= 1) {
        excluded.push(destination);
        continue;
      }

      const item = {
        index: items.length + 1,
        destination,
        from: current,
        distance: roadDistance,
        transport,
        depart: cursor,
        arrival: projectedArrival,
        waitMinutes,
        visitStart,
        visitEnd,
        mayBeClosed: visitStart > closeMinutes
      };
      items.push(item);
      cursor = visitEnd;
      current = destination;
      totalDistance += roadDistance;
      totalFare += transport.fareTotal;
      totalTravel += transport.minutes + waitMinutes;
    }

    return { items, excluded, totalDistance, totalFare, totalTravel, startMinutes, endMinutes: cursor };
  }

  function chooseTransport(from, to, distance, options) {
    const candidates = [];
    const allowed = options.modes;
    const commute = to.commute || {};

    if (allowed.includes("walk")) {
      candidates.push({
        mode: "walk",
        label: "Walk",
        icon: "🚶",
        minutes: Math.max(4, Math.round(distance * 15 + 2)),
        fareTotal: 0,
        farePerPerson: 0,
        score: 0
      });
    }

    if (allowed.includes("jeepney") && !commute.noJeep) {
      const individualFare = distance <= options.fareSettings.jeepBaseKm
        ? options.fareSettings.jeepMinimum
        : options.fareSettings.jeepMinimum + ((distance - options.fareSettings.jeepBaseKm) * options.fareSettings.jeepPerKm);
      candidates.push({
        mode: "jeepney",
        label: "Jeepney",
        icon: "🚌",
        minutes: Math.max(14, Math.round(distance * 7.3 + (to.outsideBaguio ? 17 : 10))),
        fareTotal: roundMoney(individualFare * options.travelers),
        farePerPerson: roundMoney(individualFare),
        score: 0
      });
    }

    if (allowed.includes("taxi")) {
      const taxiFare = options.fareSettings.taxiFlag + distance * options.fareSettings.taxiPerKm;
      candidates.push({
        mode: "taxi",
        label: to.outsideBaguio ? "Taxi / hired car" : "Taxi",
        icon: "🚕",
        minutes: Math.max(7, Math.round(distance * 5.2 + (to.outsideBaguio ? 8 : 5))),
        fareTotal: roundMoney(taxiFare),
        farePerPerson: roundMoney(taxiFare / options.travelers),
        score: 0
      });
    }

    if (!candidates.length) {
      const taxiFare = options.fareSettings.taxiFlag + distance * options.fareSettings.taxiPerKm;
      candidates.push({
        mode: "taxi",
        label: "Taxi fallback",
        icon: "🚕",
        minutes: Math.max(7, Math.round(distance * 5.2 + 5)),
        fareTotal: roundMoney(taxiFare),
        farePerPerson: roundMoney(taxiFare / options.travelers),
        forced: true,
        score: 0
      });
    }

    candidates.forEach((candidate) => {
      const walkPenalty = candidate.mode === "walk" ? Math.max(0, distance - 0.7) * 25 : 0;
      const jeepUncertainty = candidate.mode === "jeepney" && commute.confidence === "local-guide" ? 5 : 0;
      const noJeepPreference = commute.confidence === "taxi-preferred" && candidate.mode !== "taxi" ? 85 : 0;
      const costPerPerson = candidate.farePerPerson;

      if (options.preference === "cheapest") {
        candidate.score = costPerPerson * 2.8 + candidate.minutes * 0.22 + walkPenalty * 0.2 + noJeepPreference;
      } else if (options.preference === "fastest") {
        candidate.score = candidate.minutes * 2.6 + costPerPerson * 0.08 + jeepUncertainty + noJeepPreference;
      } else if (options.preference === "less-walking") {
        candidate.score = candidate.minutes + costPerPerson * 0.22 + (candidate.mode === "walk" ? 180 + distance * 30 : 0) + noJeepPreference;
      } else {
        candidate.score = candidate.minutes * 1.15 + costPerPerson * 0.55 + walkPenalty + jeepUncertainty + noJeepPreference;
      }

      if (candidate.mode === "walk" && distance <= 0.55) candidate.score -= 55;
      if (candidate.mode === "walk" && distance > 3) candidate.score += 120;
      if (candidate.mode === "jeepney" && distance < 0.75) candidate.score += 35;
      if (candidate.mode === "taxi" && distance < 0.85 && options.preference !== "less-walking") candidate.score += 25;
      if (candidate.mode === "jeepney" && from.area === to.area && distance < 1.25) candidate.score += 10;
      if (to.outsideBaguio && candidate.mode === "taxi" && options.travelers >= 3) candidate.score -= 12;
    });

    const chosen = candidates.sort((a, b) => a.score - b.score)[0];
    chosen.steps = buildDirectionSteps(from, to, chosen.mode, distance);
    chosen.instruction = chosen.steps.join(" ");
    return chosen;
  }

  function buildDirectionSteps(from, to, mode, distance) {
    if (mode === "walk") {
      return [
        distance < 0.55
          ? `${to.name} is close to ${from.name}; use the safest pedestrian route.`
          : `Open the walking route in Google Maps and head toward ${to.name}.`,
        "Use designated crossings and expect Baguio slopes, stairs, wet pavement, or fog."
      ];
    }

    if (mode === "jeepney") {
      const c = to.commute;
      return [
        `From ${from.name}, go to: ${c.board}`,
        `Route/signboard: ${c.signboard}`,
        `Tell the dispatcher and driver: “${to.name}.” ${c.alight}`,
        `For the return: ${c.return}`,
        c.note
      ].filter(Boolean);
    }

    return [
      `Take a metered taxi or verified hired vehicle from ${from.name} to ${to.name}.`,
      "Open the Google Maps pin and show it to the driver; ask for the official entrance or safe drop-off.",
      to.commute?.note || "Confirm the meter and keep the route open on your phone."
    ];
  }

  function renderResults(itinerary) {
    const completedStops = itinerary.items.length;
    const preferenceLabels = { balanced: "Balanced", cheapest: "Cheapest", fastest: "Fastest", "less-walking": "Less walking" };
    const dateLabel = itinerary.date ? formatDate(itinerary.date) : "your selected date";

    elements.resultsTitle.textContent = completedStops ? `${completedStops}-stop Baguio itinerary` : "Your Baguio itinerary";
    elements.resultsSubtitle.textContent = `Starting at ${itinerary.start.name} on ${dateLabel} · ${preferenceLabels[itinerary.preference]} route`;

    elements.summaryGrid.innerHTML = [
      ["📍", "Included stops", String(completedStops)],
      ["🕒", "Trip window", `${minutesToTime(itinerary.startMinutes)}–${minutesToTime(itinerary.endMinutes)}`],
      ["🧭", "Approx. road distance", `${itinerary.totalDistance.toFixed(1)} km`],
      ["💵", "Estimated transport", itinerary.totalFare === 0 ? "Free" : formatCurrency(itinerary.totalFare)]
    ].map(([icon, label, value]) => `<div class="summary-card"><span>${icon}</span><div><small>${label}</small><strong>${value}</strong></div></div>`).join("");

    elements.timeline.innerHTML = itinerary.items.map(renderTimelineItem).join("");

    if (itinerary.excluded.length) {
      elements.excludedStops.hidden = false;
      elements.excludedStops.innerHTML = `
        <strong>${itinerary.excluded.length} selected ${itinerary.excluded.length === 1 ? "stop was" : "stops were"} left out of the time window.</strong>
        <p>Extend your available time or make a second day for longer and out-of-city stops:</p>
        <ul>${itinerary.excluded.map((stop) => `<li>${escapeHTML(stop.name)}</li>`).join("")}</ul>
      `;
    } else {
      elements.excludedStops.hidden = true;
      elements.excludedStops.innerHTML = "";
    }
  }

  function renderTimelineItem(item) {
    const fareText = item.transport.fareTotal === 0
      ? "Free"
      : item.transport.mode === "taxi"
        ? `${formatCurrency(item.transport.fareTotal)} vehicle est.`
        : `${formatCurrency(item.transport.farePerPerson)} / person`;
    const confidenceLabel = item.transport.mode === "jeepney"
      ? '<span class="route-confidence">Local route guide · verify with dispatcher</span>'
      : "";

    return `
      <article class="timeline-item" id="itinerary-${escapeHTML(item.destination.id)}">
        <div class="timeline-time">${minutesToTime(item.visitStart)}</div>
        <div class="timeline-marker">${item.index}</div>
        <div class="timeline-content">
          <div class="timeline-stop-head">
            <div>
              <h4>${item.destination.icon} ${escapeHTML(item.destination.name)}</h4>
              <small>${escapeHTML(item.destination.area)} · ${escapeHTML(item.destination.category)}</small>
            </div>
            <div class="stop-badges">
              ${item.destination.outsideBaguio ? '<span class="outside-badge">Nearby Benguet side trip</span>' : ""}
              <span class="visit-duration">Visit ${formatDuration(item.destination.duration)}</span>
            </div>
          </div>
          <p>${escapeHTML(item.destination.description)}</p>

          <div class="activity-box">
            <strong>✨ Make the most of this stop</strong>
            <ul>${item.destination.thingsToDo.map((activity) => `<li>${escapeHTML(activity)}</li>`).join("")}</ul>
          </div>

          <div class="travel-leg">
            <div class="travel-leg-top">
              <span class="travel-mode">${item.transport.icon} ${escapeHTML(item.transport.label)} from ${escapeHTML(item.from.name)}</span>
              <div class="travel-metrics"><span>${item.distance.toFixed(1)} km est.</span><span>${item.transport.minutes} min est.</span><span>${fareText}</span></div>
            </div>
            ${confidenceLabel}
            <ol class="commute-steps">${item.transport.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
            <div class="leg-actions">
              <button type="button" data-map-action="preview" data-stop-id="${escapeHTML(item.destination.id)}">Preview this leg</button>
              <a href="${mapsDirectionsUrl(item.from, item.destination, item.transport.mode, false)}" target="_blank" rel="noopener noreferrer">Open route ↗</a>
              <a href="${mapsDirectionsUrl(null, item.destination, item.transport.mode, true)}" target="_blank" rel="noopener noreferrer">Navigate now ↗</a>
              <button type="button" data-map-action="place" data-stop-id="${escapeHTML(item.destination.id)}">View place</button>
              ${item.transport.mode === "jeepney" ? `<button type="button" data-map-action="terminal" data-stop-id="${escapeHTML(item.destination.id)}">View loading area</button>` : ""}
            </div>
            ${item.transport.forced ? '<span class="warning-chip">Taxi was used as a fallback because the selected travel modes did not provide a practical verified option.</span>' : ""}
            ${item.waitMinutes ? `<span class="warning-chip">Arrive before opening · wait about ${item.waitMinutes} min</span>` : ""}
            ${item.mayBeClosed ? '<span class="warning-chip">This arrival may be after the listed closing time. Verify hours before visiting.</span>' : ""}
          </div>
        </div>
      </article>
    `;
  }

  function renderGoogleMap(itinerary) {
    const first = itinerary.items[0]?.destination;
    state.activeMapStopId = first?.id || itinerary.start.id;
    elements.mapStopList.innerHTML = [
      { ...itinerary.start, mapLabel: "Start", order: "S" },
      ...itinerary.items.map((item) => ({ ...item.destination, mapLabel: item.destination.name, order: item.index }))
    ].map((point) => `
      <button class="map-stop-button ${point.id === state.activeMapStopId ? "active" : ""}" type="button" data-map-stop="${escapeHTML(point.id)}">
        <span>${point.order}</span><div><strong>${escapeHTML(point.mapLabel)}</strong><small>${escapeHTML(point.area || "Start point")}</small></div>
      </button>
    `).join("");

    renderRouteParts(itinerary);
    if (first) previewMapStop(first.id);
    else previewMapStop(itinerary.start.id);
  }

  function previewMapStop(id) {
    if (!state.itinerary) return;
    const point = id === state.itinerary.start.id
      ? state.itinerary.start
      : state.itinerary.items.find((item) => item.destination.id === id)?.destination;
    if (!point) return;

    state.activeMapStopId = id;
    elements.googleMapFrame.src = mapEmbedPlace(point);
    elements.mapLocationTitle.textContent = id === state.itinerary.start.id ? `Start: ${point.name}` : point.name;
    elements.mapLocationStatus.textContent = id === state.itinerary.start.id
      ? "Your selected starting point."
      : `${point.area} · Open navigation to use your live device location.`;
    setNavigationTarget(point, id === state.itinerary.start.id ? "Open start point" : "Navigate to this stop");
    $$("[data-map-stop]", elements.mapStopList).forEach((button) => button.classList.toggle("active", button.dataset.mapStop === id));
  }

  function previewLeg(item) {
    elements.googleMapFrame.src = mapEmbedDirections(item.from, item.destination, item.transport.mode);
    elements.mapLocationTitle.textContent = `${item.from.name} → ${item.destination.name}`;
    elements.mapLocationStatus.textContent = `${item.transport.label} road preview. Open Google Maps for live navigation and traffic.`;
    setNavigationTarget(item.destination, "Navigate this leg");
    state.activeMapStopId = item.destination.id;
    $$("[data-map-stop]", elements.mapStopList).forEach((button) => button.classList.toggle("active", button.dataset.mapStop === item.destination.id));
    elements.googleMapFrame.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setNavigationTarget(point, label) {
    elements.nextStopNav.href = mapsDirectionsUrl(null, point, "driving", true);
    elements.nextStopNav.textContent = `${label} ↗`;
  }

  function renderRouteParts(itinerary) {
    const links = buildRoutePartLinks(itinerary);
    elements.routeParts.innerHTML = `
      <strong>Full route in mobile-safe parts</strong>
      <p>Google Maps limits the number of waypoints on some mobile browsers, so long itineraries are split into route parts.</p>
      <div>${links.map((part, index) => `<a href="${part.url}" target="_blank" rel="noopener noreferrer">Part ${index + 1}: ${escapeHTML(part.label)} ↗</a>`).join("")}</div>
    `;
  }

  function toggleRouteParts() {
    if (!state.itinerary) return;
    elements.routeParts.hidden = !elements.routeParts.hidden;
    elements.openRouteParts.textContent = elements.routeParts.hidden ? "Open full route" : "Hide route links";
  }

  function buildRoutePartLinks(itinerary) {
    const stops = itinerary.items.map((item) => item.destination);
    const parts = [];
    let origin = itinerary.start;
    for (let index = 0; index < stops.length; index += 4) {
      const chunk = stops.slice(index, index + 4);
      const destination = chunk[chunk.length - 1];
      const waypoints = chunk.slice(0, -1);
      const params = new URLSearchParams({
        api: "1",
        origin: coordinate(origin),
        destination: coordinate(destination),
        travelmode: "driving"
      });
      if (waypoints.length) params.set("waypoints", waypoints.map(coordinate).join("|"));
      parts.push({
        url: `https://www.google.com/maps/dir/?${params.toString()}`,
        label: `${origin.name} to ${destination.name}`
      });
      origin = destination;
    }
    return parts;
  }

  function mapsSearchUrl(point) {
    return mapsQueryUrl(point.googleQuery || `${point.name}, ${point.area || "Baguio"}`);
  }

  function mapsQueryUrl(query) {
    const params = new URLSearchParams({ api: "1", query });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }

  function mapsDirectionsUrl(from, to, mode, navigate) {
    const params = new URLSearchParams({
      api: "1",
      destination: mapsLocationValue(to),
      travelmode: mode === "walk" ? "walking" : "driving"
    });
    if (from) params.set("origin", mapsLocationValue(from));
    if (navigate) params.set("dir_action", "navigate");
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  function mapsLocationValue(point) {
    if (!point) return "Baguio City, Philippines";
    if (point.id === "current-location") return coordinate(point);
    return point.googleQuery || `${point.name}, ${point.area || "Baguio City"}, Philippines`;
  }

  function mapEmbedPlace(point) {
    const query = point.googleQuery || `${point.name}, ${point.area || "Baguio"}` || coordinate(point);
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  }

  function mapEmbedDirections(from, to, mode) {
    const dirFlag = mode === "walk" ? "w" : "d";
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(coordinate(from))}&daddr=${encodeURIComponent(coordinate(to))}&dirflg=${dirFlag}&output=embed`;
  }

  function coordinate(point) {
    return `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`;
  }

  async function copyItinerary() {
    if (!state.itinerary) return;
    const text = itineraryToText(state.itinerary);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Itinerary copied to your clipboard.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("Itinerary copied to your clipboard.");
    }
  }

  function itineraryToText(itinerary) {
    const lines = [
      "LAKBAY BAGUIO — GENERATED ITINERARY",
      `Start: ${itinerary.start.name}`,
      `Date: ${itinerary.date ? formatDate(itinerary.date) : "Not specified"}`,
      `Estimated transport: ${formatCurrency(itinerary.totalFare)}`,
      "",
      ...itinerary.items.flatMap((item) => [
        `${item.index}. ${minutesToTime(item.visitStart)} — ${item.destination.name} (${formatDuration(item.destination.duration)})`,
        `   ${item.transport.label} from ${item.from.name} · ${item.distance.toFixed(1)} km est. · ${item.transport.minutes} min · ${item.transport.fareTotal ? formatCurrency(item.transport.fareTotal) : "Free"}`,
        ...item.transport.steps.map((step, index) => `   ${index + 1}) ${step}`),
        "   Suggested activities:",
        ...item.destination.thingsToDo.map((activity) => `   • ${activity}`),
        `   Navigate: ${mapsDirectionsUrl(null, item.destination, item.transport.mode, true)}`,
        ""
      ]),
      "Planning estimates only. Verify route loading bays, drop-off points, operating hours, trail access, and current fares locally."
    ];
    return lines.join("\n");
  }

  function saveFormState() {
    const payload = {
      selected: [...state.selected],
      startLocation: elements.startLocation.value,
      tripDate: elements.tripDate.value,
      startTime: elements.startTime.value,
      tripHours: elements.tripHours.value,
      travelers: elements.travelers.value,
      preference: $("input[name='preference']:checked")?.value || "balanced",
      modes: $$("input[name='mode']:checked").map((input) => input.value),
      fares: getFareSettings()
    };
    try { localStorage.setItem("lakbayBaguioPlanner", JSON.stringify(payload)); } catch { /* private browsing */ }
  }

  function restoreSavedState() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem("lakbayBaguioPlanner")); } catch { saved = null; }
    if (!saved) return;

    if (Array.isArray(saved.selected)) {
      const validIds = new Set(data.destinations.map((destination) => destination.id));
      saved.selected.filter((id) => validIds.has(id)).forEach((id) => state.selected.add(id));
    }
    if (saved.startLocation && elements.startLocation.querySelector(`option[value="${cssEscape(saved.startLocation)}"]`)) elements.startLocation.value = saved.startLocation;
    if (saved.tripDate && saved.tripDate >= elements.tripDate.min) elements.tripDate.value = saved.tripDate;
    if (saved.startTime) elements.startTime.value = saved.startTime;
    if (saved.tripHours) elements.tripHours.value = saved.tripHours;
    if (saved.travelers) elements.travelers.value = saved.travelers;

    if (saved.preference) {
      const preferenceInput = $(`input[name='preference'][value="${cssEscape(saved.preference)}"]`);
      if (preferenceInput) preferenceInput.checked = true;
    }
    $$(".preference-card").forEach((card) => card.classList.toggle("active", Boolean($("input:checked", card))));

    if (Array.isArray(saved.modes)) {
      $$("input[name='mode']").forEach((input) => { input.checked = saved.modes.includes(input.value); });
    }

    const fareMap = { jeepMinimum: "#jeepMinimum", jeepBaseKm: "#jeepBaseKm", jeepPerKm: "#jeepPerKm", taxiFlag: "#taxiFlag", taxiPerKm: "#taxiPerKm" };
    Object.entries(fareMap).forEach(([key, selector]) => {
      if (saved.fares && Number.isFinite(Number(saved.fares[key]))) $(selector).value = saved.fares[key];
    });
    elements.selectionCount.textContent = state.selected.size;
  }

  function setupRevealObserver() {
    const targets = $$(".reveal:not(.visible)");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach((element) => observer.observe(element));
  }

  function showToast(message) {
    clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 3400);
  }

  function haversine(a, b) {
    const radius = 6371;
    const dLat = degreesToRadians(b.lat - a.lat);
    const dLng = degreesToRadians(b.lng - a.lng);
    const lat1 = degreesToRadians(a.lat);
    const lat2 = degreesToRadians(b.lat);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function degreesToRadians(value) { return value * Math.PI / 180; }
  function timeToMinutes(time) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
  function minutesToTime(total) {
    const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
    const date = new Date(2000, 0, 1, Math.floor(normalized / 60), normalized % 60);
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  function formatDuration(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : `${minutes}m`; }
  function formatCurrency(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value); }
  function formatDate(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
  function roundMoney(value) { return Math.round(value * 100) / 100; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function nonNegativeNumber(value, fallback) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : fallback; }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }
  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  init();
})();
