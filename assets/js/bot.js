(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);

  const root = $("#kabsatBot");
  if (!root) return;

  const ui = {
    panel: $("#kabsatPanel"),
    launcher: $("#kabsatLauncher"),
    close: $("#kabsatClose"),
    mute: $("#kabsatMute"),
    unread: $("#kabsatUnread"),
    teaser: $("#kabsatTeaser"),
    teaserText: $("#kabsatTeaserText"),
    messages: $("#kabsatMessages"),
    replies: $("#kabsatReplies"),
    typing: $("#kabsatTyping"),
    form: $("#kabsatForm"),
    input: $("#kabsatInput")
  };

  const state = {
    open: false,
    greeted: false,
    muted: safeGet("lakbay-kabsat-muted") === "true",
    selectedCount: Number($("#selectionCount")?.textContent || 0),
    lastContextAt: 0,
    breathingTimer: null,
    teaserTimer: null,
    teaserHideTimer: null,
    teaserIndex: 0,
    teaserCycles: 0
  };

  const banks = {
    teasers: [
      "Naniniwala ka ba sa Baguio curse? 👀",
      "Pagod ka ba? Pahinga muna tayo. 🌲",
      "Baguio muna bago breakdown. 😭",
      "Tara, tulungan kitang gumawa ng itinerary.",
      "Strawberry taho muna bago life decisions?",
      "Malamig sa Baguio, pero warm ang advice ko. ☕",
      "Hindi kailangang gawing Amazing Race ang Baguio trip mo."
    ],
    comfort: [
      "Pag pagod ka sa mundo, pahinga muna. Hindi mo kailangang ayusin lahat today.",
      "Baguio may not fix everything, pero puwede ka nitong bigyan ng tahimik na space para makahinga.",
      "Hindi ka tamad. Baka pagod ka lang talaga. Take your time.",
      "Minsan, kailangan mo lang ng malamig na hangin, mainit na kape, at ilang oras na walang nagmamadali sa’yo.",
      "Hindi lahat ng healing dramatic. Minsan, tahimik na lakad lang sa ilalim ng pine trees.",
      "You do not need to go home as a completely different person. Resting is already enough.",
      "Breathe in. Malamig ang hangin. Wala ka munang kailangang patunayan.",
      "Baka hindi mo kailangan ng answers today. Baka kailangan mo lang ng pahinga."
    ],
    solo: [
      "Solo trip? Hindi ibig sabihin lonely. Baka self-date lang talaga ito. 🌲",
      "Walang masama kung sarili mo muna ang kasama mo.",
      "Take photos even when no one is watching. This trip is still worth remembering.",
      "Kumain ka sa lugar na gusto mo. Walang kaagaw sa food at walang kailangang hintayin. 😌",
      "You are allowed to enjoy your own company."
    ],
    couple: [
      "Couple trip tip: huwag gawing competition ang itinerary. Magpahinga kapag may pagod na.",
      "Baguio curse? Mas nakakatakot ang hindi marunong makipag-communicate. 😭",
      "Take photos, share food, and let each other choose at least one destination.",
      "Kapag naligaw, huwag sisihan. Part iyon ng travel story.",
      "Love language din minsan ang paghawak ng payong habang umuulan."
    ],
    friends: [
      "Hindi lahat kailangang gumising nang 5:00 AM para masabing successful ang barkada trip.",
      "Mag-decide na kayo kung saan kakain bago pa kayo lahat magutom at mainis. 😭",
      "Group travel survival tip: mag-set ng meeting point para walang nawawala.",
      "Take the photo now. Baka limang taon ulit bago kumpleto ang barkada."
    ],
    weather: [
      "Umuulan? Hindi sira ang trip. Baguio mood lang ’yan. ☔",
      "Bring an umbrella, but leave some room for spontaneous café stops.",
      "Kapag sobrang lamig, hot chocolate muna bago life decisions.",
      "Foggy today? Slow down, stay visible, and enjoy the atmosphere.",
      "Jacket check. Payong check. Emotional stability… optional. 😭"
    ],
    food: [
      "Strawberry taho muna bago problema.",
      "Hindi kumpleto ang Baguio trip kung puro lakad at walang kain.",
      "Good Taste serving sizes are not emotionally prepared for one person. 😭",
      "Mainit na kape plus malamig na panahon—simple pero effective.",
      "Hindi lahat ng itinerary kailangang productive. Puwede ring café hopping lang."
    ],
    trip: [
      "Huwag masyadong punuin ang day. Baguio is better when you leave room to breathe.",
      "Mas magandang apat na lugar na na-enjoy mo kaysa sampung lugar na dinaanan mo lang.",
      "Wear comfortable shoes. Maraming paakyat na akala mo malapit lang.",
      "Carry small bills for jeepney fares, and confirm the route with the driver or dispatcher.",
      "Save your hotel address and itinerary offline in case mahina ang signal.",
      "A relaxed route is still a successful route. Hindi kailangang habulin ang buong Baguio in one day."
    ],
    random: [
      "Baguio is not asking you to be productive. Minsan, sapat nang present ka.",
      "Your itinerary is a guide, not a deadline.",
      "Take the long breath, the warm drink, and the slow walk.",
      "May mga problemang hindi masosolve ng view—but the view can help you face them with a calmer mind.",
      "Pine trees, fog, and a little distance from routine can make room for clearer thoughts.",
      "Hindi mo kailangang i-post lahat. Some moments can stay yours."
    ]
  };

  const menuReplies = [
    { label: "Pagod ako", intent: "comfort" },
    { label: "Baguio curse 👀", intent: "curse" },
    { label: "Solo trip", intent: "solo" },
    { label: "Couple trip", intent: "couple" },
    { label: "Trip pep talk", intent: "trip" },
    { label: "Surprise me", intent: "random" }
  ];

  init();

  function init() {
    updateMuteButton();
    bindEvents();
    observePlanner();
    scheduleTeaser();
  }

  function bindEvents() {
    ui.launcher.addEventListener("click", () => state.open ? closePanel() : openPanel());
    ui.close.addEventListener("click", closePanel);
    ui.teaser.addEventListener("click", openPanel);
    ui.mute.addEventListener("click", toggleMute);
    ui.form.addEventListener("submit", handleTextInput);
    ui.replies.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-intent]");
      if (!button) return;
      addUserMessage(button.textContent.trim());
      renderReplies([]);
      handleIntent(button.dataset.intent);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.open) closePanel();
    });
  }

  function observePlanner() {
    const selectionCount = $("#selectionCount");
    if (selectionCount && "MutationObserver" in window) {
      new MutationObserver(() => {
        const next = Number(selectionCount.textContent || 0);
        if (next === state.selectedCount) return;
        state.selectedCount = next;
        reactToSelectionCount(next);
      }).observe(selectionCount, { childList: true, subtree: true, characterData: true });
    }

    document.addEventListener("change", (event) => {
      const input = event.target.closest?.("#destinationGrid input[type='checkbox']");
      if (!input || !input.checked) return;
      const destination = window.LAKBAY_DATA?.destinations?.find((item) => item.id === input.value);
      if (destination) window.setTimeout(() => reactToDestination(destination), 120);
    });

    const form = $("#plannerForm");
    if (form) {
      form.addEventListener("submit", () => {
        window.setTimeout(() => {
          const results = $("#results");
          if (results && !results.hidden) {
            contextMessage(
              "Plan generated! Guide lang ang oras. Baguio traffic, fog, and spontaneous café stops can change the day—and that is okay. 🌲",
              [
                { label: "Give me a reminder", intent: "trip" },
                { label: "Comfort me", intent: "comfort" }
              ]
            );
          }
        }, 900);
      });
    }
  }

  function scheduleTeaser(delay = 4200) {
    clearTeaserTimers();
    if (state.muted || state.open || state.teaserCycles >= 4) return;

    state.teaserTimer = window.setTimeout(() => {
      if (state.muted || state.open) return;
      if (document.hidden) {
        scheduleTeaser(5000);
        return;
      }
      showNextTeaser();
    }, delay);
  }

  function showNextTeaser() {
    const message = banks.teasers[state.teaserIndex % banks.teasers.length];
    state.teaserIndex += 1;
    state.teaserCycles += 1;

    ui.teaserText.textContent = message;
    ui.teaser.setAttribute("aria-label", `${message} Open Kabsat chat.`);
    ui.teaser.hidden = false;
    ui.unread.hidden = false;
    ui.teaser.classList.remove("show");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ui.teaser.classList.add("show"));
    });

    state.teaserHideTimer = window.setTimeout(() => {
      if (state.open) return;
      dismissTeaser();
      scheduleTeaser(5600);
    }, 8200);
  }

  function clearTeaserTimers() {
    if (state.teaserTimer) window.clearTimeout(state.teaserTimer);
    if (state.teaserHideTimer) window.clearTimeout(state.teaserHideTimer);
    state.teaserTimer = null;
    state.teaserHideTimer = null;
  }

  function openPanel() {
    clearTeaserTimers();
    state.open = true;
    ui.panel.hidden = false;
    ui.launcher.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    dismissTeaser();
    ui.unread.hidden = true;
    requestAnimationFrame(() => ui.panel.classList.add("show"));

    if (!state.greeted) {
      state.greeted = true;
      queueBotMessage("Hi, ako si Kabsat 🌲 Hindi ako therapist o live tour guide—friendly Baguio companion lang na may kaunting lambing, humor, at practical reminders.", 220);
      queueBotMessage("Anong klaseng kasama ang kailangan mo ngayon?", 900, menuReplies);
    } else {
      window.setTimeout(() => ui.input.focus(), 100);
    }
  }

  function closePanel() {
    stopBreathing();
    state.open = false;
    ui.panel.classList.remove("show");
    ui.launcher.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    window.setTimeout(() => {
      if (!state.open) ui.panel.hidden = true;
    }, 220);
    ui.launcher.focus();
    scheduleTeaser(18000);
  }

  function dismissTeaser() {
    if (state.teaserHideTimer) window.clearTimeout(state.teaserHideTimer);
    state.teaserHideTimer = null;
    ui.teaser.classList.remove("show");
    window.setTimeout(() => {
      if (!ui.teaser.classList.contains("show")) ui.teaser.hidden = true;
    }, 260);
  }

  function toggleMute() {
    state.muted = !state.muted;
    safeSet("lakbay-kabsat-muted", String(state.muted));
    clearTeaserTimers();
    updateMuteButton();
    dismissTeaser();
    queueBotMessage(
      state.muted
        ? "Automatic message bubbles muted. Nandito pa rin ako kapag ikaw ang nag-open. 🤍"
        : "Message bubbles are back—gentle hellos lang, promise.",
      180,
      menuReplies
    );
    if (!state.muted) scheduleTeaser(12000);
  }

  function updateMuteButton() {
    ui.mute.textContent = state.muted ? "🔕" : "🔔";
    const label = state.muted ? "Unmute automatic Kabsat messages" : "Mute automatic Kabsat messages";
    ui.mute.setAttribute("aria-label", label);
    ui.mute.title = label;
  }

  function handleTextInput(event) {
    event.preventDefault();
    const value = ui.input.value.trim();
    if (!value) return;
    ui.input.value = "";
    addUserMessage(value);
    renderReplies([]);

    const text = value.toLowerCase();
    if (containsAny(text, ["suicide", "kill myself", "magpakamatay", "ayoko na mabuhay", "end my life"])) {
      queueBotMessage("I’m really sorry you’re carrying something this heavy. Kabsat is only a scripted travel companion and cannot keep you safe. Please contact local emergency services now, or tell a trusted person who can stay with you in person. Huwag mong sarilinin ito ngayon.", 300);
      queueBotMessage("Move away from anything you could use to hurt yourself and stay near another person while you reach out for immediate help.", 1150, [{ label: "Back to gentle messages", intent: "comfort" }]);
      return;
    }

    if (containsAny(text, ["curse", "sumpa", "hiwalay", "breakup"])) return handleIntent("curse");
    if (containsAny(text, ["pagod", "stress", "sad", "lungkot", "healing", "heal", "hinga", "burnout"])) return handleIntent("comfort");
    if (containsAny(text, ["solo", "alone", "mag-isa", "mag isa"])) return handleIntent("solo");
    if (containsAny(text, ["couple", "jowa", "partner", "boyfriend", "girlfriend", "asawa"])) return handleIntent("couple");
    if (containsAny(text, ["friends", "barkada", "tropa"])) return handleIntent("friends");
    if (containsAny(text, ["ulan", "rain", "fog", "lamig", "weather"])) return handleIntent("weather");
    if (containsAny(text, ["food", "kain", "taho", "coffee", "kape", "restaurant"])) return handleIntent("food");
    if (containsAny(text, ["route", "trip", "itinerary", "jeep", "taxi", "lakad", "destination"])) return handleIntent("trip");
    if (containsAny(text, ["breathe", "breathing", "hinga tayo", "pause"])) return handleIntent("breathe");
    return handleIntent("random");
  }

  function handleIntent(intent) {
    if (intent === "menu") {
      queueBotMessage("Choose a mood or topic. Walang pressure—friendly pause lang tayo.", 240, menuReplies);
      return;
    }
    if (["curse-yes", "curse-no", "curse-explain"].includes(intent)) {
      continueCurse(intent);
      return;
    }
    if (intent === "curse") {
      queueBotMessage("Naniniwala ka ba sa Baguio curse? 👀", 350, [
        { label: "Oo, medyo", intent: "curse-yes" },
        { label: "Hindi naman", intent: "curse-no" },
        { label: "Ano ’yon?", intent: "curse-explain" }
      ]);
      return;
    }
    if (intent === "breathe") {
      startBreathing();
      return;
    }

    const bank = banks[intent] || banks.random;
    queueBotMessage(pick(bank), 420, followUps(intent));
  }

  function continueCurse(intent) {
    const first = intent === "curse-explain"
      ? "Sabi nila, kapag magkasamang pumunta sa Baguio ang mag-partner, maghihiwalay daw pagkatapos."
      : intent === "curse-yes"
        ? "Gets ko kung bakit nakaka-praning ang kuwento—lalo na kapag paulit-ulit mo itong naririnig."
        : "Same. Ako rin, hindi naniniwala na isang lugar ang may kontrol sa relasyon.";

    queueBotMessage(first, 260);
    queueBotMessage("Marami namang pumunta sa Baguio na nag-stay together—and marami ring naghiwalay kahit hindi nag-Baguio. 😅", 1050);
    queueBotMessage("At the end of the day, hindi lugar ang nagdedesisyon para sa relasyon. Choices, communication, at kung paano ninyo aalagaan ang isa’t isa pa rin.", 1850);
    queueBotMessage("Kaya mag-picture na kayo sa Burnham. Huwag lang mag-away kung sino ang magpe-pedal ng boat. 🚣", 2700, [
      { label: "Couple trip tip", intent: "couple" },
      { label: "Comfort me", intent: "comfort" },
      { label: "Another thought", intent: "random" }
    ]);
  }

  function startBreathing() {
    stopBreathing();
    queueBotMessage("Sige. Thirty-second Baguio pause tayo. Relax your shoulders and follow the circle. 🌲", 280);

    window.setTimeout(() => {
      if (!state.open) return;
      const card = document.createElement("div");
      card.className = "kabsat-breathe-card";
      card.innerHTML = `
        <div class="kabsat-breathe-circle"><span>Inhale</span></div>
        <strong>Slow Baguio breath</strong>
        <small>Inhale for 4 · hold for 2 · exhale for 6</small>
        <button type="button">Stop</button>
      `;
      ui.messages.appendChild(card);
      scrollMessages();

      const circle = $(".kabsat-breathe-circle", card);
      const label = $(".kabsat-breathe-circle span", card);
      const stop = $("button", card);
      const phases = [
        { text: "Inhale", duration: 4000, className: "inhale" },
        { text: "Hold", duration: 2000, className: "hold" },
        { text: "Exhale", duration: 6000, className: "exhale" }
      ];
      let phaseIndex = 0;
      let cycles = 0;

      const next = () => {
        if (!document.body.contains(card)) return;
        const phase = phases[phaseIndex];
        label.textContent = phase.text;
        circle.className = `kabsat-breathe-circle ${phase.className}`;
        state.breathingTimer = window.setTimeout(() => {
          phaseIndex = (phaseIndex + 1) % phases.length;
          if (phaseIndex === 0) cycles += 1;
          if (cycles >= 3) {
            card.remove();
            state.breathingTimer = null;
            queueBotMessage("Good. Hindi nawala ang lahat ng problema—but you gave your body a small quiet moment. That counts.", 250, menuReplies);
            return;
          }
          next();
        }, phase.duration);
      };

      stop.addEventListener("click", () => {
        stopBreathing();
        card.remove();
        queueBotMessage("Pause stopped. Kahit isang mabagal na hinga lang, okay na ’yon.", 220, menuReplies);
      });
      next();
    }, 700);
  }

  function stopBreathing() {
    if (state.breathingTimer) window.clearTimeout(state.breathingTimer);
    state.breathingTimer = null;
  }

  function followUps(intent) {
    const replies = [
      { label: "Another one", intent },
      { label: "Breathe with me", intent: "breathe" },
      { label: "Main menu", intent: "menu" }
    ];
    if (intent === "comfort") replies.unshift({ label: "Trip pep talk", intent: "trip" });
    if (intent === "trip") replies.unshift({ label: "Comfort me", intent: "comfort" });
    return replies.slice(0, 4);
  }

  function reactToSelectionCount(count) {
    if (!state.open || Date.now() - state.lastContextAt < 12000) return;
    if (count === 0) contextMessage("Blank canvas ulit. Choose places that match your energy—not just what everyone says you must visit.");
    else if (count === 2) contextMessage("Nice—may route na tayong mabubuo. You can add more, pero okay lang din ang simple day.");
    else if (count >= 10) contextMessage("Ang dami nating pinili. Gusto mo bang bawasan para hindi maging Amazing Race: Baguio Edition? 😭", [
      { label: "Give me a pacing tip", intent: "trip" },
      { label: "Kaya ko ’to", intent: "random" }
    ]);
  }

  function reactToDestination(destination) {
    if (!state.open || Date.now() - state.lastContextAt < 10000) return;
    const custom = {
      "burnham-park": "Burnham Park added! Paddle boat, bike ride, or strawberry taho—choose your kind of soft day.",
      "baguio-night-market": "Night Market added! Save your energy and bring small bills. Late-night stop ito, hindi pang-10:15 AM. 😭",
      "camp-john-hay": "Camp John Hay added. Leave space for a slow forest walk, warm drink, and zero rushing.",
      "mines-view-park": "Mines View added. Go earlier when possible, and keep a little patience for crowds and photo lines.",
      "strawberry-farm": "Strawberry Farm added! Seasonal ang picking, but local strawberry treats are always part of the fun."
    };
    contextMessage(custom[destination.id] || `${destination.name} added. Good choice—remember to enjoy the stop, not just collect the photo.`);
  }

  function contextMessage(text, replies) {
    if (!state.open) return;
    state.lastContextAt = Date.now();
    queueBotMessage(text, 320, replies || menuReplies.slice(0, 4), true);
  }

  function addUserMessage(text) {
    const row = document.createElement("div");
    row.className = "kabsat-message user";
    const bubble = document.createElement("div");
    bubble.className = "kabsat-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    ui.messages.appendChild(row);
    scrollMessages();
  }

  function queueBotMessage(text, delay, replies, context) {
    ui.typing.hidden = false;
    scrollMessages();
    window.setTimeout(() => {
      if (!state.open && state.greeted) return;
      ui.typing.hidden = true;
      const row = document.createElement("div");
      row.className = `kabsat-message bot${context ? " context" : ""}`;
      row.innerHTML = `<img src="assets/img/kabsat-avatar.svg" alt="" /><div class="kabsat-bubble"></div>`;
      $(".kabsat-bubble", row).textContent = text;
      ui.messages.appendChild(row);
      scrollMessages();
      if (replies) renderReplies(replies);
      else ui.input.focus();
    }, Number(delay || 400));
  }

  function renderReplies(replies) {
    ui.replies.innerHTML = "";
    replies.forEach((reply) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.intent = reply.intent;
      button.textContent = reply.label;
      ui.replies.appendChild(button);
    });
  }

  function scrollMessages() {
    requestAnimationFrame(() => {
      ui.messages.scrollTop = ui.messages.scrollHeight;
    });
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function containsAny(value, needles) {
    return needles.some((needle) => value.includes(needle));
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
  }
})();
