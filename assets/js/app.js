(function () {
  "use strict";

  const data = window.LAKBAY_DATA;
  if (!data) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const state = {
    selected: new Set(),
    activeCategory: "All",
    activeStep: 1,
    activeDay: 0,
    customStart: null,
    itinerary: null,
    lastSelectedId: null,
    toastTimer: null,
    stepScrollFrame: null
  };

  const elements = {
    loader: $("#pageLoader"),
    header: $(".site-header"),
    menuToggle: $("#menuToggle"),
    mainNav: $("#mainNav"),
    form: $("#plannerForm"),
    startLocation: $("#startLocation"),
    useLocation: $("#useLocation"),
    tripDate: $("#tripDate"),
    tripDays: $("#tripDays"),
    startTime: $("#startTime"),
    tripHours: $("#tripHours"),
    travelers: $("#travelers"),
    arrivalTip: $("#arrivalTip"),
    plannerProgress: $("#plannerProgress"),
    progressTrackFill: $("#progressTrackFill"),
    selectionCount: $("#selectionCount"),
    selectedDrawer: $("#selectedDrawer"),
    selectedChips: $("#selectedChips"),
    selectedHint: $("#selectedHint"),
    clearSelections: $("#clearSelections"),
    destinationSearch: $("#destinationSearch"),
    autoPickTheme: $("#autoPickTheme"),
    autoChoose: $("#autoChoose"),
    areaFilters: $("#areaFilters"),
    destinationGrid: $("#destinationGrid"),
    destinationError: $("#destinationError"),
    railPrev: $("#railPrev"),
    railNext: $("#railNext"),
    preferenceGrid: $("#preferenceGrid"),
    results: $("#results"),
    resultsTitle: $("#resultsTitle"),
    resultsSubtitle: $("#resultsSubtitle"),
    tripSummary: $("#tripSummary"),
    dayTabs: $("#dayTabs"),
    routeTimeline: $("#routeTimeline"),
    googleMapFrame: $("#googleMapFrame"),
    mapOverlayNote: $("#mapOverlayNote"),
    mapActions: $("#mapActions"),
    resultsNote: $("#resultsNote"),
    editPlan: $("#editPlan"),
    copyPlan: $("#copyPlan"),
    printPlan: $("#printPlan"),
    fitMap: $("#fitMap"),
    toast: $("#toast"),
    currentYear: $("#currentYear")
  };

  function init() {
    populateStartLocations();
    setMinimumDate();
    restoreSavedState();
    renderCategoryFilters();
    renderDestinations();
    renderSelectedChips();
    updateArrivalTip();
    updateProgressState();
    bindEvents();
    setupStepObserver();
    setupRevealObserver();
    updateRailControls();
    updateActiveStepFromScroll();
    if (elements.currentYear) elements.currentYear.textContent = String(new Date().getFullYear());

    window.setTimeout(() => elements.loader.classList.add("loaded"), 550);
  }

  function populateStartLocations() {
    elements.startLocation.innerHTML = data.startLocations
      .map((location) => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)}</option>`)
      .join("");
  }

  function setMinimumDate() {
    const today = new Date();
    const value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    elements.tripDate.min = value;
    if (!elements.tripDate.value) elements.tripDate.value = value;
  }

  function bindEvents() {
    window.addEventListener("scroll", () => {
      elements.header.classList.toggle("scrolled", window.scrollY > 10);
      if (!state.stepScrollFrame) {
        state.stepScrollFrame = window.requestAnimationFrame(() => {
          updateActiveStepFromScroll();
          state.stepScrollFrame = null;
        });
      }
    }, { passive: true });

    elements.menuToggle.addEventListener("click", () => {
      const open = elements.mainNav.classList.toggle("open");
      elements.menuToggle.classList.toggle("open", open);
      elements.menuToggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });

    $$("#mainNav a").forEach((link) => link.addEventListener("click", closeMenu));

    elements.plannerProgress.addEventListener("click", (event) => {
      const button = event.target.closest("[data-target]");
      if (!button) return;
      const target = document.getElementById(button.dataset.target);
      if (target) {
        setActiveStep(Number(button.dataset.progress));
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    elements.startLocation.addEventListener("change", () => {
      updateArrivalTip();
      updateProgressState();
      saveFormState();
    });
    elements.startTime.addEventListener("change", () => {
      updateArrivalTip();
      saveFormState();
    });
    [elements.tripDate, elements.tripDays, elements.tripHours, elements.travelers].forEach((input) => input.addEventListener("change", saveFormState));

    elements.useLocation.addEventListener("click", useCurrentLocation);

    elements.areaFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.activeCategory = button.dataset.category;
      renderCategoryFilters();
      renderDestinations();
      elements.destinationGrid.scrollTo({ left: 0, behavior: "smooth" });
      window.setTimeout(updateRailControls, 380);
    });

    elements.destinationSearch.addEventListener("input", renderDestinations);

    elements.destinationGrid.addEventListener("change", (event) => {
      const checkbox = event.target.closest("input[type='checkbox']");
      if (!checkbox) return;
      toggleDestination(checkbox.value, checkbox.checked);
    });

    elements.destinationGrid.addEventListener("error", (event) => {
      const image = event.target.closest("img.destination-image");
      if (!image) return;
      image.hidden = true;
      const fallback = image.parentElement.querySelector(".destination-image-fallback");
      if (fallback) fallback.hidden = false;
    }, true);

    elements.selectedChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-id]");
      if (!button) return;
      toggleDestination(button.dataset.removeId, false);
    });

    elements.clearSelections.addEventListener("click", clearSelections);
    elements.autoChoose.addEventListener("click", autoChooseDestinations);
    elements.railPrev.addEventListener("click", () => scrollDestinationRail(-1));
    elements.railNext.addEventListener("click", () => scrollDestinationRail(1));
    elements.destinationGrid.addEventListener("scroll", updateRailControls, { passive: true });
    window.addEventListener("resize", updateRailControls, { passive: true });

    $$("input[name='preference']").forEach((radio) => {
      radio.addEventListener("change", () => {
        $$(".preference-card").forEach((card) => card.classList.toggle("active", Boolean($("input:checked", card))));
        updateProgressState();
        saveFormState();
      });
    });

    elements.form.addEventListener("submit", generateItinerary);
    elements.editPlan.addEventListener("click", () => document.querySelector("#planner").scrollIntoView({ behavior: "smooth" }));
    elements.copyPlan.addEventListener("click", copyItinerary);
    elements.printPlan.addEventListener("click", () => window.print());
    elements.fitMap.addEventListener("click", openActiveDayRoute);

    elements.dayTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-day-index]");
      if (!button) return;
      state.activeDay = Number(button.dataset.dayIndex);
      renderActiveDay();
    });

    elements.routeTimeline.addEventListener("click", (event) => {
      const preview = event.target.closest("[data-preview-query]");
      if (preview) {
        updateMapPreview(preview.dataset.previewQuery, `Previewing ${preview.dataset.previewName || "this stop"}.`);
        return;
      }
      const open = event.target.closest("[data-open-url]");
      if (open) window.open(open.dataset.openUrl, "_blank", "noopener,noreferrer");
    });

    window.addEventListener("beforeunload", saveFormState);
  }

  function closeMenu() {
    elements.mainNav.classList.remove("open");
    elements.menuToggle.classList.remove("open");
    elements.menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function renderCategoryFilters() {
    elements.areaFilters.innerHTML = data.categoryOrder.map((category) => `
      <button class="area-filter ${state.activeCategory === category ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join("");
  }

  function getFilteredDestinations() {
    const query = elements.destinationSearch.value.trim().toLowerCase();
    return data.destinations.filter((destination) => {
      const categoryMatch = matchesCategory(destination, state.activeCategory);
      const haystack = [destination.name, destination.area, destination.category, destination.scope, destination.description, ...(destination.tags || [])].join(" ").toLowerCase();
      return categoryMatch && (!query || haystack.includes(query));
    });
  }

  function matchesCategory(destination, category) {
    switch (category) {
      case "Popular": return destination.popular;
      case "City Center": return destination.area === "City Center";
      case "Nature & Views": return ["Park", "Viewpoint"].includes(destination.category) || destination.tags.some((tag) => ["nature", "hike", "garden", "flowers", "view"].includes(tag));
      case "Arts & Culture": return ["Culture", "Museum"].includes(destination.category) || destination.tags.some((tag) => ["art", "culture", "heritage", "history", "weaving", "craft"].includes(tag));
      case "Food & Shopping": return destination.category === "Food & shopping" || destination.tags.some((tag) => ["food", "shopping", "pasalubong", "souvenirs"].includes(tag));
      case "Family": return destination.tags.includes("family");
      case "Nearby Side Trips": return destination.scope !== "Baguio City";
      default: return true;
    }
  }

  function renderDestinations() {
    const filtered = getFilteredDestinations();
    if (!filtered.length) {
      elements.destinationGrid.innerHTML = `<div class="empty-rail">No places match that search or filter. Try another keyword.</div>`;
      return;
    }

    elements.destinationGrid.innerHTML = filtered.map((destination) => {
      const selected = state.selected.has(destination.id);
      const justSelected = selected && state.lastSelectedId === destination.id;
      return `
        <label class="destination-option ${selected ? "selected" : ""} ${justSelected ? "just-selected" : ""}" data-id="${escapeHtml(destination.id)}">
          <input type="checkbox" value="${escapeHtml(destination.id)}" ${selected ? "checked" : ""} aria-label="${selected ? "Remove" : "Add"} ${escapeHtml(destination.name)}" />
          <span class="destination-image-wrap">
            <img class="destination-image" src="${escapeHtml(destination.image)}" alt="${escapeHtml(destination.name)}" loading="lazy" />
            <span class="destination-image-fallback" hidden aria-hidden="true">${escapeHtml(destination.icon)}</span>
            <span class="destination-image-shade" aria-hidden="true"></span>
            ${destination.popular ? `<span class="popular-badge"><span aria-hidden="true">★</span> Must visit</span>` : ""}
            <span class="destination-overlay">
              <strong>${escapeHtml(destination.name)}</strong>
              <small>${escapeHtml(destination.area)}</small>
            </span>
            <span class="destination-selected-mark" aria-hidden="true"><b>✓</b><small>Selected</small></span>
          </span>
          <span class="destination-card-copy">
            <span class="destination-card-meta"><span>${escapeHtml(destination.category)}</span><span>${formatDuration(destination.duration)}</span></span>
          </span>
        </label>
      `;
    }).join("");

    window.setTimeout(() => {
      state.lastSelectedId = null;
      updateRailControls();
    }, 60);
  }

  function renderSelectedChips() {
    const selected = data.destinations.filter((destination) => state.selected.has(destination.id));
    elements.selectionCount.textContent = String(selected.length);
    elements.selectedHint.textContent = selected.length < 2
      ? `Choose ${2 - selected.length} more ${selected.length === 1 ? "place" : "places"} to generate a route.`
      : `${selected.length} places ready to arrange.`;
    elements.clearSelections.disabled = selected.length === 0;

    if (!selected.length) {
      elements.selectedChips.innerHTML = `<span class="empty-selection">No destinations selected yet.</span>`;
      return;
    }

    elements.selectedChips.innerHTML = selected.map((destination) => `
      <span class="selected-chip">
        ${escapeHtml(destination.name)}
        <button type="button" data-remove-id="${escapeHtml(destination.id)}" aria-label="Remove ${escapeHtml(destination.name)}">×</button>
      </span>
    `).join("");
  }

  function toggleDestination(id, checked) {
    if (checked) {
      state.selected.add(id);
      state.lastSelectedId = id;
    } else {
      state.selected.delete(id);
    }

    elements.destinationError.textContent = "";
    elements.selectionCount.parentElement.classList.remove("bump");
    void elements.selectionCount.parentElement.offsetWidth;
    elements.selectionCount.parentElement.classList.add("bump");
    renderDestinations();
    renderSelectedChips();
    updateProgressState();
    saveFormState();
  }

  function clearSelections() {
    if (!state.selected.size) return;
    state.selected.clear();
    renderDestinations();
    renderSelectedChips();
    updateProgressState();
    saveFormState();
    showToast("All destination choices were cleared.");
  }

  function autoChooseDestinations() {
    const theme = elements.autoPickTheme.value;
    const days = clamp(Number(elements.tripDays.value), 1, 5);
    const hours = clamp(Number(elements.tripHours.value), 4, 12);
    const target = clamp(days * (hours >= 10 ? 5 : hours >= 7 ? 4 : 3), 3, 18);

    let candidates = data.destinations.filter((destination) => {
      if (days < 3 && destination.area === "Atok Side Trip") return false;
      if (days === 1 && destination.scope !== "Baguio City") return false;
      switch (theme) {
        case "popular": return destination.popular;
        case "nature": return matchesCategory(destination, "Nature & Views");
        case "culture": return matchesCategory(destination, "Arts & Culture");
        case "food": return matchesCategory(destination, "Food & Shopping");
        case "family": return matchesCategory(destination, "Family") || destination.popular;
        case "hidden": return !destination.popular;
        default: return true;
      }
    });

    candidates = candidates.sort((a, b) => scoreAutoPick(b, theme) - scoreAutoPick(a, theme));
    const chosen = [];
    const areaCount = new Map();

    for (const candidate of candidates) {
      if (chosen.length >= target) break;
      const currentAreaCount = areaCount.get(candidate.area) || 0;
      const areaLimit = days === 1 ? 3 : 4;
      if (theme === "balanced" && currentAreaCount >= areaLimit) continue;
      chosen.push(candidate);
      areaCount.set(candidate.area, currentAreaCount + 1);
    }

    state.selected = new Set(chosen.map((destination) => destination.id));
    state.lastSelectedId = chosen[0]?.id || null;
    renderDestinations();
    renderSelectedChips();
    updateProgressState();
    saveFormState();
    showToast(`Lakbay selected ${chosen.length} places for a ${days}-day ${theme === "balanced" ? "balanced" : theme} trip.`);
  }

  function scoreAutoPick(destination, theme) {
    let score = destination.popular ? 10 : 3;
    if (destination.scope === "Baguio City") score += 2;
    if (destination.duration <= 90) score += 1.5;
    if (theme === "hidden" && !destination.popular) score += 8;
    if (theme === "balanced") {
      if (["burnham-park", "botanical-garden", "camp-john-hay", "mirador-heritage-eco-park", "baguio-night-market"].includes(destination.id)) score += 5;
    }
    return score;
  }

  function scrollDestinationRail(direction) {
    const card = elements.destinationGrid.querySelector(".destination-option");
    const gap = 12;
    const cardWidth = card ? card.getBoundingClientRect().width + gap : Math.max(260, elements.destinationGrid.clientWidth * 0.72);
    const visibleCards = Math.max(1, Math.floor(elements.destinationGrid.clientWidth / cardWidth));
    elements.destinationGrid.scrollBy({ left: direction * cardWidth * Math.max(1, visibleCards - 1), behavior: "smooth" });
    window.setTimeout(updateRailControls, 420);
  }

  function updateRailControls() {
    if (!elements.destinationGrid || !elements.railPrev || !elements.railNext) return;
    const maxScroll = Math.max(0, elements.destinationGrid.scrollWidth - elements.destinationGrid.clientWidth);
    const hasOverflow = maxScroll > 4;
    elements.railPrev.hidden = !hasOverflow;
    elements.railNext.hidden = !hasOverflow;
    elements.railPrev.disabled = !hasOverflow || elements.destinationGrid.scrollLeft <= 4;
    elements.railNext.disabled = !hasOverflow || elements.destinationGrid.scrollLeft >= maxScroll - 4;
  }

  function updateActiveStepFromScroll() {
    const sections = $$("[data-step-section]");
    if (!sections.length) return;
    const stickyOffset = (elements.header?.offsetHeight || 0) + (elements.plannerProgress?.offsetHeight || 0) + 28;
    let active = 1;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= stickyOffset) active = Number(section.dataset.stepSection);
    });
    setActiveStep(active);
  }

  function setupStepObserver() {
    const sections = $$("[data-step-section]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActiveStep(Number(visible.target.dataset.stepSection));
    }, { rootMargin: "-30% 0px -54% 0px", threshold: [0.05, 0.2, 0.5] });

    sections.forEach((section) => observer.observe(section));
  }

  function setActiveStep(step) {
    state.activeStep = clamp(step, 1, 3);
    updateProgressState();
  }

  function updateProgressState() {
    const detailsComplete = Boolean(elements.startLocation.value && elements.startTime.value && elements.tripDays.value);
    const destinationsComplete = state.selected.size >= 2;
    const preferenceComplete = Boolean($("input[name='preference']:checked"));
    const statuses = [detailsComplete, destinationsComplete, preferenceComplete];

    $$("[data-progress]").forEach((button, index) => {
      const step = index + 1;
      button.classList.toggle("active", step === state.activeStep);
      button.classList.toggle("complete", statuses[index] && step < state.activeStep);
      if (step === state.activeStep) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    elements.progressTrackFill.style.width = state.activeStep === 1 ? "0%" : state.activeStep === 2 ? "50%" : "100%";
  }

  function updateArrivalTip() {
    const start = data.startLocations.find((location) => location.id === elements.startLocation.value);
    const options = data.baggageOptions[elements.startLocation.value] || [];
    const startMinutes = timeToMinutes(elements.startTime.value || "08:00");
    const isEarlyTerminalArrival = Boolean(start?.terminal && startMinutes <= 600);

    if (!isEarlyTerminalArrival || !options.length) {
      elements.arrivalTip.hidden = true;
      elements.arrivalTip.innerHTML = "";
      return;
    }

    elements.arrivalTip.hidden = false;
    elements.arrivalTip.innerHTML = `
      <div class="arrival-tip-head">
        <span aria-hidden="true">🧳</span>
        <div>
          <h4>Arriving before hotel check-in?</h4>
          <p>You may be able to leave your bags before starting the route. These services and rates can change, so verify at the counter and keep valuables with you.</p>
        </div>
      </div>
      <div class="baggage-options">
        ${options.map((option) => `
          <div class="baggage-option">
            <strong>${escapeHtml(option.name)}</strong>
            <p>${escapeHtml(option.detail)}</p>
            <a class="inline-link" href="${googleSearchUrl(option.query)}" target="_blank" rel="noopener noreferrer">View in Google Maps ↗</a>
          </div>
        `).join("")}
      </div>
    `;
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      showToast("Location access is not supported by this browser.");
      return;
    }

    elements.useLocation.disabled = true;
    elements.useLocation.textContent = "…";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.customStart = {
          id: "current-location",
          name: "My current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          area: "Current location",
          googleQuery: `${position.coords.latitude},${position.coords.longitude}`
        };

        let option = elements.startLocation.querySelector("option[value='current-location']");
        if (!option) {
          option = new Option("My current location", "current-location");
          elements.startLocation.prepend(option);
        }
        elements.startLocation.value = "current-location";
        elements.useLocation.textContent = "✓";
        elements.useLocation.disabled = false;
        elements.arrivalTip.hidden = true;
        updateProgressState();
        saveFormState();
        showToast("Current location added as your starting point.");
      },
      () => {
        elements.useLocation.textContent = "⌖";
        elements.useLocation.disabled = false;
        showToast("We could not access your location. Choose a starting point instead.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
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
      document.querySelector("#destinations").scrollIntoView({ behavior: "smooth", block: "start" });
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
    const numberOfDays = clamp(Number(elements.tripDays.value), 1, 5);
    const availableMinutes = clamp(Number(elements.tripHours.value), 4, 12) * 60;
    const travelers = clamp(Number(elements.travelers.value), 1, 12);
    const fareSettings = getFareSettings();
    const startMinutes = timeToMinutes(elements.startTime.value);

    const buckets = buildDayBuckets(start, selectedDestinations, numberOfDays, availableMinutes);
    const days = buckets.map((bucket, index) => buildDayItinerary(start, bucket, {
      dayIndex: index,
      preference,
      availableMinutes,
      travelers,
      modes,
      fareSettings,
      startMinutes
    }));

    state.itinerary = {
      start,
      days,
      preference,
      travelers,
      fareSettings,
      date: elements.tripDate.value,
      numberOfDays,
      availableMinutes,
      selectedCount: selectedDestinations.length
    };
    state.activeDay = 0;

    renderResults();
    saveFormState();
    elements.results.hidden = false;
    window.setTimeout(() => {
      elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
      setupRevealObserver();
    }, 40);
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

  function buildDayBuckets(start, destinations, numberOfDays, availableMinutes) {
    const buckets = Array.from({ length: numberOfDays }, () => []);
    const nightStops = destinations.filter((destination) => destination.timeSlot === "night");
    const atokStops = destinations.filter((destination) => destination.area === "Atok Side Trip" && destination.timeSlot !== "night");
    const regularStops = destinations.filter((destination) => destination.timeSlot !== "night" && destination.area !== "Atok Side Trip");

    let dayOffset = 0;
    if (atokStops.length && numberOfDays > 1) {
      buckets[numberOfDays - 1].push(...atokStops);
    } else if (atokStops.length) {
      regularStops.push(...atokStops);
    }

    const route = optimizeRoute(start, regularStops, "balanced", timeToMinutes(elements.startTime.value));
    const targetPerDay = Math.max(180, availableMinutes - 45);
    let currentDay = dayOffset;
    let load = 0;

    route.forEach((destination) => {
      const estimated = destination.duration + 28;
      const maxRegularDay = atokStops.length && numberOfDays > 1 ? numberOfDays - 2 : numberOfDays - 1;
      if (currentDay < maxRegularDay && load > 0 && load + estimated > targetPerDay) {
        currentDay += 1;
        load = 0;
      }
      buckets[currentDay].push(destination);
      load += estimated;
    });

    nightStops.forEach((destination, index) => {
      const targetDay = Math.min(index, Math.max(0, numberOfDays - 1));
      buckets[targetDay].push(destination);
    });

    return buckets;
  }

  function optimizeRoute(start, destinations, preference, startMinutes) {
    const remaining = [...destinations];
    const route = [];
    let current = start;
    let cursor = startMinutes || 480;

    while (remaining.length) {
      let bestIndex = 0;
      let bestScore = Infinity;

      remaining.forEach((candidate, index) => {
        const distance = haversine(current, candidate);
        const estimatedArrival = cursor + estimateTravelMinutes(distance, "taxi");
        const open = timeToMinutes(candidate.open);
        const close = candidate.timeSlot === "night" ? 26 * 60 : timeToMinutes(candidate.close);
        const waitPenalty = Math.max(0, open - estimatedArrival) * 0.012;
        const closurePenalty = estimatedArrival + candidate.duration > close ? 100 : 0;
        const sameAreaBonus = current.area === candidate.area ? -0.45 : 0;
        const sideTripPenalty = candidate.scope !== "Baguio City" ? 0.8 : 0;
        const preferencePenalty = preference === "fastest" ? candidate.duration / 600 : 0;
        const score = distance + waitPenalty + closurePenalty + sameAreaBonus + sideTripPenalty + preferencePenalty;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });

      const [next] = remaining.splice(bestIndex, 1);
      route.push(next);
      cursor += estimateTravelMinutes(haversine(current, next), "taxi") + next.duration;
      current = next;
    }

    return route;
  }

  function buildDayItinerary(start, bucket, options) {
    const nightStops = bucket.filter((destination) => destination.timeSlot === "night");
    const daytime = bucket.filter((destination) => destination.timeSlot !== "night");
    const ordered = optimizeRoute(start, daytime, options.preference, options.startMinutes);
    const items = [];
    const unscheduled = [];
    const notices = [];
    let current = start;
    let cursor = options.startMinutes;
    const dayEnd = options.startMinutes + options.availableMinutes;

    ordered.forEach((destination) => {
      const distance = haversine(current, destination);
      const transport = chooseTransport(current, destination, distance, options);
      const arrival = cursor + transport.minutes;
      const open = timeToMinutes(destination.open);
      const close = timeToMinutes(destination.close);
      let scheduledArrival = Math.max(arrival, open);
      const wait = Math.max(0, open - arrival);

      if (scheduledArrival + destination.duration > close || scheduledArrival > dayEnd + 90) {
        unscheduled.push(destination);
        return;
      }

      items.push({
        number: items.length + 1,
        destination,
        arrivalMinutes: scheduledArrival,
        departureMinutes: scheduledArrival + destination.duration,
        waitMinutes: wait,
        distance,
        transport,
        from: current
      });
      cursor = scheduledArrival + destination.duration;
      current = destination;
    });

    nightStops.forEach((destination) => {
      const distance = haversine(current, destination);
      const transport = chooseTransport(current, destination, distance, options);
      const afterTravel = cursor + transport.minutes;
      const nightStart = timeToMinutes(destination.open);
      const scheduledArrival = Math.max(afterTravel, nightStart);
      const wait = Math.max(0, scheduledArrival - afterTravel);

      if (scheduledArrival > dayEnd) {
        notices.push(`${destination.name} is an evening add-on at ${minutesToTime(scheduledArrival)} because it does not operate in the morning.`);
      }

      items.push({
        number: items.length + 1,
        destination,
        arrivalMinutes: scheduledArrival,
        departureMinutes: scheduledArrival + destination.duration,
        waitMinutes: wait,
        distance,
        transport,
        from: current,
        eveningAddOn: true
      });
      cursor = scheduledArrival + destination.duration;
      current = destination;
    });

    if (unscheduled.length) {
      notices.push(`${unscheduled.length} selected ${unscheduled.length === 1 ? "place does" : "places do"} not fit safely within this day's opening hours and time allowance.`);
    }

    return {
      index: options.dayIndex,
      items,
      unscheduled,
      notices,
      totalDistance: items.reduce((sum, item) => sum + item.distance, 0),
      totalFare: items.reduce((sum, item) => sum + item.transport.totalFare, 0),
      totalTravelMinutes: items.reduce((sum, item) => sum + item.transport.minutes, 0),
      startMinutes: options.startMinutes,
      endMinutes: cursor
    };
  }

  function chooseTransport(from, to, distance, options) {
    const allowed = new Set(options.modes);
    let mode;

    if (allowed.has("walk") && distance <= (options.preference === "less-walking" ? 0.45 : 0.85)) {
      mode = "walk";
    } else if (options.preference === "fastest" && allowed.has("taxi")) {
      mode = "taxi";
    } else if (options.preference === "less-walking" && allowed.has("taxi")) {
      mode = "taxi";
    } else if (allowed.has("jeepney") && distance <= 10 && to.area !== "Atok Side Trip" && to.area !== "Tuba / Asin") {
      mode = "jeepney";
    } else if (allowed.has("taxi")) {
      mode = "taxi";
    } else if (allowed.has("walk")) {
      mode = "walk";
    } else {
      mode = "jeepney";
    }

    const minutes = estimateTravelMinutes(distance, mode);
    let farePerPerson = 0;
    let vehicleFare = 0;

    if (mode === "jeepney") {
      farePerPerson = options.fareSettings.jeepMinimum + Math.max(0, distance - options.fareSettings.jeepBaseKm) * options.fareSettings.jeepPerKm;
    } else if (mode === "taxi") {
      vehicleFare = options.fareSettings.taxiFlag + distance * options.fareSettings.taxiPerKm;
    }

    const totalFare = mode === "jeepney" ? farePerPerson * options.travelers : vehicleFare;
    return {
      mode,
      minutes,
      farePerPerson: roundMoney(farePerPerson),
      vehicleFare: roundMoney(vehicleFare),
      totalFare: roundMoney(totalFare),
      instructions: buildDirections(from, to, mode),
      loadingMapUrl: mode === "jeepney" ? googleSearchUrl(to.routeGuide.loadingQuery) : null,
      legMapUrl: googleDirectionsUrl(from, to, mode)
    };
  }

  function estimateTravelMinutes(distance, mode) {
    if (mode === "walk") return Math.max(4, Math.round((distance / 4.2) * 60));
    if (mode === "jeepney") return Math.max(12, Math.round(9 + (distance / 14) * 60));
    return Math.max(7, Math.round(5 + (distance / 18) * 60));
  }

  function buildDirections(from, to, mode) {
    if (mode === "walk") {
      return [
        `Start from ${from.name} and open the walking route in Google Maps.`,
        "Use pedestrian crossings and avoid shortcuts through private property.",
        `Continue to the official or safest public entrance of ${to.name}.`
      ];
    }

    if (mode === "taxi") {
      return [
        `Find a metered taxi or verified hired vehicle near ${from.name}.`,
        `Show the driver the Google Maps pin for ${to.name} and ask for the official entrance.`,
        "Use the meter when applicable and confirm any waiting arrangement before leaving the vehicle."
      ];
    }

    const guide = to.routeGuide;
    return [
      `Go to: ${guide.loadingArea}.`,
      `Look for a signboard marked ${guide.signboard}.`,
      `Tell the dispatcher or driver that you are going to ${to.name}.`,
      to.alight || `Ask the driver to announce the nearest safe drop-off for ${to.name}.`,
      guide.returnHint
    ];
  }

  function renderResults() {
    const itinerary = state.itinerary;
    const totalStops = itinerary.days.reduce((sum, day) => sum + day.items.length, 0);
    const totalDistance = itinerary.days.reduce((sum, day) => sum + day.totalDistance, 0);
    const totalFare = itinerary.days.reduce((sum, day) => sum + day.totalFare, 0);
    const totalTravelMinutes = itinerary.days.reduce((sum, day) => sum + day.totalTravelMinutes, 0);

    elements.resultsTitle.textContent = itinerary.numberOfDays > 1 ? `Your ${itinerary.numberOfDays}-day Baguio route` : "Your Baguio day, arranged";
    elements.resultsSubtitle.textContent = `${totalStops} scheduled stops from ${itinerary.start.name}${itinerary.date ? ` beginning ${formatDate(itinerary.date)}` : ""}.`;

    elements.tripSummary.innerHTML = [
      ["Travel days", `${itinerary.numberOfDays}`],
      ["Scheduled stops", `${totalStops}`],
      ["Estimated travel", formatDuration(totalTravelMinutes)],
      ["Estimated transport", formatCurrency(totalFare)]
    ].map(([label, value]) => `<div class="summary-card"><small>${label}</small><strong>${value}</strong></div>`).join("");

    elements.dayTabs.innerHTML = itinerary.days.map((day) => `
      <button class="day-tab ${day.index === state.activeDay ? "active" : ""}" type="button" data-day-index="${day.index}">Day ${day.index + 1}${itinerary.date ? ` · ${formatDayDate(itinerary.date, day.index)}` : ""} · ${day.items.length} stops</button>
    `).join("");

    if (!totalStops) {
      elements.routeTimeline.innerHTML = `<div class="timeline-notice">The selected places do not fit the current schedule. Increase the number of days or daily available time.</div>`;
      return;
    }

    state.activeDay = Math.min(state.activeDay, itinerary.days.length - 1);
    renderActiveDay();

    const unscheduled = itinerary.days.flatMap((day) => day.unscheduled);
    elements.resultsNote.innerHTML = `
      <strong>Planning note:</strong> Travel time, fares, attraction hours, and jeepney loading areas are estimates. Confirm current details locally.
      ${unscheduled.length ? ` <strong>Not scheduled:</strong> ${unscheduled.map((destination) => escapeHtml(destination.name)).join(", ")}. Add a day or increase available time.` : ""}
    `;
  }

  function renderActiveDay() {
    const day = state.itinerary.days[state.activeDay];
    if (!day) return;

    $$(".day-tab", elements.dayTabs).forEach((button) => button.classList.toggle("active", Number(button.dataset.dayIndex) === state.activeDay));

    const notices = [...day.notices];
    if (day.items.some((item) => item.eveningAddOn)) {
      notices.unshift("An evening-only stop is scheduled after 9:00 PM. Use the break for dinner, hotel check-in, or rest.");
    }

    elements.routeTimeline.innerHTML = `
      ${notices.map((notice) => `<div class="timeline-notice">${escapeHtml(notice)}</div>`).join("")}
      ${day.items.map((item, index) => renderTimelineItem(item, index)).join("")}
      ${!day.items.length ? `<div class="timeline-notice">No stops fit this day yet. Add more available time or move selected destinations.</div>` : ""}
    `;

    renderMapForDay(day);
  }

  function renderTimelineItem(item, index) {
    const destination = item.destination;
    const transport = item.transport;
    const fareLabel = transport.mode === "walk"
      ? "Free"
      : transport.mode === "jeepney"
        ? `${formatCurrency(transport.farePerPerson)} each est.`
        : `${formatCurrency(transport.vehicleFare)} vehicle est.`;

    return `
      <div class="timeline-entry">
        <time class="timeline-time">${minutesToTime(item.arrivalMinutes)}</time>
        <div class="timeline-marker"><span class="timeline-dot">${index + 1}</span></div>
        <div class="timeline-content">
          <article class="stop-card">
            <div class="stop-card-head">
              <div>
                <div class="stop-card-title"><span aria-hidden="true">${escapeHtml(destination.icon)}</span><h4>${escapeHtml(destination.name)}</h4></div>
                <div class="stop-meta">${escapeHtml(destination.area)} · ${escapeHtml(destination.category)}${destination.scope !== "Baguio City" ? ` · ${escapeHtml(destination.scope)}` : ""}</div>
              </div>
              <span class="visit-chip">Visit ${formatDuration(destination.duration)}</span>
            </div>
            <p class="stop-description">${escapeHtml(destination.description)}</p>

            <div class="travel-leg">
              <div class="travel-leg-head">
                <span class="transport-icon" aria-hidden="true">${transportIcon(transport.mode)}</span>
                <strong>${transportLabel(transport.mode)} from ${escapeHtml(item.from.name)}</strong>
                <span class="leg-metric">${item.distance.toFixed(1)} km est.</span>
                <span class="leg-metric">${formatDuration(transport.minutes)}</span>
                <span class="leg-metric">${fareLabel}</span>
              </div>
              ${item.waitMinutes > 0 ? `<p class="stop-description">You may have about ${formatDuration(item.waitMinutes)} before this place opens or before the evening schedule begins.</p>` : ""}
              <ol class="direction-list">
                ${transport.instructions.map((instruction, directionIndex) => `<li><b>${directionIndex + 1}.</b><span>${escapeHtml(instruction)}</span></li>`).join("")}
              </ol>
              <div class="leg-actions">
                ${transport.loadingMapUrl ? `<button class="mini-action" type="button" data-open-url="${escapeHtml(transport.loadingMapUrl)}">📍 Loading area ↗</button>` : ""}
                <button class="mini-action" type="button" data-preview-query="${escapeHtml(destination.googleQuery)}" data-preview-name="${escapeHtml(destination.name)}">🗺 Preview stop</button>
                <button class="mini-action" type="button" data-open-url="${escapeHtml(transport.legMapUrl)}">↗ Open this leg</button>
                <button class="mini-action" type="button" data-open-url="${escapeHtml(googleSearchUrl(destination.googleQuery))}">📌 View place</button>
              </div>
            </div>

            <div class="stop-activities">
              <strong><span aria-hidden="true">✨</span> Make the most of this stop</strong>
              <ul class="activity-list">
                ${destination.activities.map((activity) => `<li>${escapeHtml(activity)}</li>`).join("")}
              </ul>
            </div>
          </article>
        </div>
      </div>
    `;
  }

  function renderMapForDay(day) {
    const first = day.items[0]?.destination;
    if (first) {
      updateMapPreview(first.googleQuery, `Previewing Day ${day.index + 1}. Open the complete route below to see every stop from your selected starting point.`);
    } else {
      elements.googleMapFrame.removeAttribute("src");
      elements.mapOverlayNote.textContent = "No mapped stop is available for this day.";
    }

    const routeUrl = buildDayRouteUrl(day);
    const nextUrl = day.items[0]?.transport.legMapUrl || routeUrl;
    elements.mapActions.innerHTML = `
      <a class="button button-primary" href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer">Open complete Day ${day.index + 1} route ↗</a>
      ${nextUrl ? `<a class="button button-ghost" href="${escapeHtml(nextUrl)}" target="_blank" rel="noopener noreferrer">Navigate to first stop</a>` : ""}
    `;
  }

  function updateMapPreview(query, note) {
    elements.googleMapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    elements.mapOverlayNote.textContent = note;
  }

  function buildDayRouteUrl(day) {
    if (!day.items.length) return googleSearchUrl(state.itinerary.start.googleQuery || state.itinerary.start.name);
    const origin = locationForUrl(state.itinerary.start);
    const destinations = day.items.map((item) => locationForUrl(item.destination));
    const destination = destinations[destinations.length - 1];
    const waypoints = destinations.slice(0, -1).slice(0, 8);
    const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
    if (waypoints.length) params.set("waypoints", waypoints.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  function openActiveDayRoute() {
    if (!state.itinerary) return;
    const day = state.itinerary.days[state.activeDay];
    window.open(buildDayRouteUrl(day), "_blank", "noopener,noreferrer");
  }

  function googleDirectionsUrl(from, to, mode) {
    const params = new URLSearchParams({
      api: "1",
      origin: locationForUrl(from),
      destination: locationForUrl(to),
      travelmode: mode === "walk" ? "walking" : "driving"
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  function googleSearchUrl(query) {
    const params = new URLSearchParams({ api: "1", query });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }

  function locationForUrl(location) {
    if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) return `${location.lat},${location.lng}`;
    return location.googleQuery || location.name;
  }

  function transportIcon(mode) {
    return mode === "walk" ? "🚶" : mode === "jeepney" ? "🚐" : "🚕";
  }

  function transportLabel(mode) {
    return mode === "walk" ? "Walk" : mode === "jeepney" ? "Jeepney" : "Taxi";
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
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("Itinerary copied.");
    }
  }

  function itineraryToText(itinerary) {
    const lines = [
      "LAKBAY BAGUIO ITINERARY",
      `Starting point: ${itinerary.start.name}`,
      `Date: ${itinerary.date ? formatDate(itinerary.date) : "Not specified"}`,
      `Days: ${itinerary.numberOfDays}`,
      ""
    ];

    itinerary.days.forEach((day) => {
      lines.push(`DAY ${day.index + 1}`);
      day.notices.forEach((notice) => lines.push(`Note: ${notice}`));
      day.items.forEach((item, index) => {
        lines.push(`${index + 1}. ${minutesToTime(item.arrivalMinutes)} — ${item.destination.name}`);
        lines.push(`   ${transportLabel(item.transport.mode)} from ${item.from.name}, about ${formatDuration(item.transport.minutes)}.`);
        item.transport.instructions.forEach((instruction) => lines.push(`   - ${instruction}`));
        lines.push(`   Try: ${item.destination.activities.join("; ")}`);
      });
      lines.push("");
    });

    lines.push("All routes, fares, hours, and loading points are planning estimates. Verify locally.");
    return lines.join("\n");
  }

  function saveFormState() {
    try {
      const saved = {
        startLocation: elements.startLocation.value,
        tripDate: elements.tripDate.value,
        tripDays: elements.tripDays.value,
        startTime: elements.startTime.value,
        tripHours: elements.tripHours.value,
        travelers: elements.travelers.value,
        selected: [...state.selected],
        preference: $("input[name='preference']:checked")?.value || "balanced",
        modes: $$("input[name='mode']:checked").map((input) => input.value),
        autoPickTheme: elements.autoPickTheme.value
      };
      localStorage.setItem("lakbay-baguio-planner", JSON.stringify(saved));
    } catch {
      // Storage is optional.
    }
  }

  function restoreSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem("lakbay-baguio-planner") || "null");
      if (!saved) return;
      if (saved.startLocation && elements.startLocation.querySelector(`option[value='${cssEscape(saved.startLocation)}']`)) elements.startLocation.value = saved.startLocation;
      if (saved.tripDate) elements.tripDate.value = saved.tripDate;
      if (saved.tripDays) elements.tripDays.value = saved.tripDays;
      if (saved.startTime) elements.startTime.value = saved.startTime;
      if (saved.tripHours) elements.tripHours.value = saved.tripHours;
      if (saved.travelers) elements.travelers.value = saved.travelers;
      if (Array.isArray(saved.selected)) state.selected = new Set(saved.selected.filter((id) => data.destinations.some((destination) => destination.id === id)));
      if (saved.preference) {
        const preference = $(`input[name='preference'][value='${cssEscape(saved.preference)}']`);
        if (preference) preference.checked = true;
      }
      $$(".preference-card").forEach((card) => card.classList.toggle("active", Boolean($("input:checked", card))));
      if (Array.isArray(saved.modes)) {
        $$("input[name='mode']").forEach((input) => { input.checked = saved.modes.includes(input.value); });
      }
      if (saved.autoPickTheme) elements.autoPickTheme.value = saved.autoPickTheme;
    } catch {
      // Ignore invalid storage.
    }
  }

  function setupRevealObserver() {
    const reveals = $$(".reveal:not(.visible)");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((element) => element.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach((element) => observer.observe(element));
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
  }

  function haversine(a, b) {
    const earthRadius = 6371;
    const latitudeDifference = degreesToRadians(b.lat - a.lat);
    const longitudeDifference = degreesToRadians(b.lng - a.lng);
    const latitude1 = degreesToRadians(a.lat);
    const latitude2 = degreesToRadians(b.lat);
    const value = Math.sin(latitudeDifference / 2) ** 2
      + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDifference / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function degreesToRadians(value) { return value * Math.PI / 180; }
  function timeToMinutes(time) {
    const [hours, minutes] = String(time || "00:00").split(":").map(Number);
    return hours * 60 + minutes;
  }
  function minutesToTime(total) {
    const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
  }
  function formatDuration(minutes) {
    const rounded = Math.max(0, Math.round(minutes));
    return rounded >= 60 ? `${Math.floor(rounded / 60)}h${rounded % 60 ? ` ${rounded % 60}m` : ""}` : `${rounded} min`;
  }
  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  }
  function formatDayDate(value, offset) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  }
  function roundMoney(value) { return Math.round(value * 100) / 100; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function nonNegativeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }
  function cssEscape(value) {
    return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/['"\\]/g, "\\$&");
  }

  document.addEventListener("DOMContentLoaded", init);
}());
