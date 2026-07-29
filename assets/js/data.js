/*
 * Lakbay Baguio planning dataset.
 * Coordinates, schedules, fares, and public-transport guidance are planning aids.
 * Travelers should confirm current hours, admission rules, and loading areas locally.
 */
(function () {
  "use strict";

  const routeGuides = {
    "City Center": {
      modeLabel: "City-center jeepney or walk",
      loadingArea: "Lower Session Road, Harrison Road, or the public-market transport area",
      loadingQuery: "Lower Session Road jeepney terminal Baguio",
      signboard: "Ask for the CBD route closest to your destination",
      returnHint: "Most city-center stops are walkable; otherwise ask for a jeepney returning to Plaza, Burnham, or the public market."
    },
    "East Baguio": {
      modeLabel: "Mines View / Pacdal jeepney",
      loadingArea: "City-center Mines View or Pacdal loading area; ask a dispatcher near the Plaza or lower Mabini area",
      loadingQuery: "Mines View jeepney terminal Baguio city center",
      signboard: "Mines View, Pacdal, or a route serving Leonard Wood Road",
      returnHint: "Use the designated city-bound loading area and confirm that the jeepney returns to Plaza or Burnham."
    },
    "South Baguio": {
      modeLabel: "Scout Barrio / Loakan / Kias jeepney",
      loadingArea: "A city-center terminal serving Scout Barrio, Loakan, Kias, or PMA",
      loadingQuery: "Scout Barrio jeepney terminal Baguio",
      signboard: "Scout Barrio, Loakan, Kias, Camp John Hay, or PMA as appropriate",
      returnHint: "Ask staff where the city-bound jeepney waits; Camp John Hay entrances can require additional walking."
    },
    "West Baguio": {
      modeLabel: "Quezon Hill / Tam-awan / Lourdes jeepney",
      loadingArea: "City-center or market-side terminal serving Quezon Hill, Tam-awan, Lourdes, or Dominican Hill",
      loadingQuery: "Quezon Hill jeepney terminal Baguio",
      signboard: "Confirm Tam-awan, Lourdes, Dominican Hill, or Quezon Hill before boarding",
      returnHint: "Return from the marked roadside loading point and ask for Plaza, Burnham, or the public market."
    },
    "North Baguio": {
      modeLabel: "La Trinidad / Bokawkan jeepney",
      loadingArea: "Magsaysay Avenue or the Baguio Center Mall transport area",
      loadingQuery: "La Trinidad jeepney terminal Baguio Center Mall",
      signboard: "La Trinidad, Bokawkan, or Bell Church",
      returnHint: "Use a Baguio-bound jeepney and confirm the Plaza or city-center drop-off."
    },
    "La Trinidad": {
      modeLabel: "La Trinidad jeepney",
      loadingArea: "Magsaysay Avenue or Baguio Center Mall area",
      loadingQuery: "La Trinidad jeepney terminal Baguio Center Mall",
      signboard: "La Trinidad; tell the dispatcher the exact attraction",
      returnHint: "Board a Baguio-bound jeepney from an official loading area and confirm the city-center stop."
    },
    "Tuba / Asin": {
      modeLabel: "Asin / Tuba jeepney or hired vehicle",
      loadingArea: "Confirm the current Asin or Tuba loading area with the Baguio public-market dispatcher",
      loadingQuery: "Asin Road jeepney terminal Baguio",
      signboard: "Asin, Nangalisan, or the exact barangay of the attraction",
      returnHint: "Return trips can be less frequent. Ask the driver about the final city-bound trip before alighting."
    },
    "Atok Side Trip": {
      modeLabel: "Atok-bound bus or hired vehicle",
      loadingArea: "Dangwa or Slaughterhouse-area terminals serving northern Benguet; verify the current operator",
      loadingQuery: "Atok bus terminal Baguio",
      signboard: "Atok or Sayangan; confirm the attraction and return schedule",
      returnHint: "This is a long side trip. Reserve transport and confirm the last Baguio-bound departure in advance."
    }
  };

  function place(id, name, area, lat, lng, duration, open, close, category, popular, description, activities, tags, extra) {
    return Object.assign({
      id,
      name,
      area,
      lat,
      lng,
      duration,
      open,
      close,
      category,
      popular,
      description,
      activities,
      tags,
      icon: category === "Park" ? "🌿" : category === "Viewpoint" ? "⛰️" : category === "Museum" ? "🏛️" : category === "Food & shopping" ? "🛍️" : category === "Culture" ? "🎨" : "📍",
      image: `assets/img/destinations/${id}.jpg`,
      googleQuery: `${name}, Baguio Philippines`,
      routeGuide: routeGuides[area] || routeGuides["City Center"],
      scope: ["La Trinidad", "Tuba / Asin", "Atok Side Trip"].includes(area) ? "Nearby Benguet side trip" : "Baguio City"
    }, extra || {});
  }

  const destinations = [
    place("burnham-park", "Burnham Park", "City Center", 16.41107, 120.59334, 75, "05:00", "22:00", "Park", true, "Baguio's central lake park and one of the easiest places to begin a relaxed city route.", ["Rent a paddle boat on Burnham Lake", "Try strawberry taho and local street snacks", "Bike or skate around the park", "Walk through the Rose Garden and Orchidarium"], ["family", "nature", "walkable", "popular"], { alight: "Ask to alight near Harrison Road, Lake Drive, or your preferred Burnham entrance." }),
    place("session-road", "Session Road", "City Center", 16.41356, 120.59774, 60, "06:00", "23:00", "Food & shopping", true, "The city's best-known commercial street, lined with cafés, restaurants, shops, and landmarks.", ["Try a local café or bakery", "Walk from lower to upper Session Road", "Browse local shops and pasalubong stores", "Visit the cathedral from the upper section"], ["food", "shopping", "walkable", "popular"]),
    place("baguio-cathedral", "Baguio Cathedral", "City Center", 16.41466, 120.59885, 35, "06:00", "19:00", "Culture", true, "A rose-colored hilltop landmark overlooking Session Road and the city center.", ["Take in the city view from the courtyard", "Use the historic cathedral stairs", "Keep voices low during services", "Pair the stop with Session Road"], ["heritage", "view", "walkable", "popular"]),
    place("baguio-city-market", "Baguio City Market", "City Center", 16.41574, 120.59406, 75, "05:00", "19:00", "Food & shopping", true, "A lively market for vegetables, strawberries, delicacies, woven goods, flowers, and souvenirs.", ["Buy fresh strawberries when in season", "Compare pasalubong prices", "Look for woven Cordilleran products", "Try local delicacies in the food sections"], ["food", "shopping", "souvenirs", "popular"]),
    place("baguio-night-market", "Baguio Night Market", "City Center", 16.4122, 120.5960, 90, "21:00", "02:00", "Food & shopping", true, "A late-night Harrison Road market known for ukay-ukay, affordable finds, and street food.", ["Browse ukay-ukay stalls", "Try warm street food in the cold evening", "Bring small bills and keep valuables secure", "Arrive after the road is officially closed for the market"], ["shopping", "food", "night", "popular"], { timeSlot: "night", googleQuery: "Baguio Night Market Harrison Road" }),
    place("ili-likha", "Ili-Likha Artists Village", "City Center", 16.41375, 120.59645, 75, "10:00", "20:00", "Culture", true, "A creative multi-level space combining local food, art, woodwork, and imaginative architecture.", ["Try food from the independent stalls", "Explore the layered art-filled interiors", "Check for workshops or performances", "Take photos without blocking narrow paths"], ["art", "culture", "food", "popular"], { alight: "Walk from Session Road or ask to alight near Assumption Road." }),
    place("baguio-museum", "Baguio Museum", "City Center", 16.40785, 120.59925, 60, "09:00", "17:00", "Museum", false, "A compact introduction to Cordilleran history, textiles, material culture, and traditional life.", ["Read the regional history displays", "Study Cordilleran textiles and objects", "Pair it with SM Baguio or Sunshine Park", "Check current gallery hours before visiting"], ["culture", "indoors", "history"]),
    place("museo-kordilyera", "Museo Kordilyera", "City Center", 16.4028, 120.5918, 75, "09:00", "17:00", "Museum", false, "A university museum focused on the peoples, arts, histories, and material culture of the Cordillera.", ["Explore rotating exhibitions", "Read the cultural context carefully", "Visit the UP Baguio campus grounds", "Check academic-calendar closures"], ["culture", "museum", "history"]),
    place("sunshine-park", "Sunshine Park", "City Center", 16.4086, 120.5980, 35, "06:00", "18:00", "Park", false, "A small green public space near Baguio Museum, the Convention Center, and SM Baguio.", ["Take a short rest between city stops", "Pair it with Baguio Museum", "Enjoy a quiet morning walk", "Use it as a meeting point near the terminal area"], ["park", "walkable", "quiet"]),
    place("baguio-orchidarium", "Baguio Orchidarium", "City Center", 16.4107, 120.5905, 45, "08:00", "17:00", "Park", false, "A plant and flower area beside Burnham Park with orchids, ornamentals, and garden stalls.", ["Browse orchids and potted plants", "Ask before photographing vendor displays", "Pair it with Burnham Park", "Visit in the morning for softer light"], ["plants", "garden", "walkable"]),
    place("laperal-white-house", "Laperal White House", "City Center", 16.4172, 120.6043, 50, "09:00", "17:00", "Culture", false, "A historic American-era house along Leonard Wood Road, known for its architecture and exhibitions.", ["Appreciate the exterior details", "Check whether the interior exhibit is open", "Pair it with Teachers Camp", "Respect restricted areas"], ["heritage", "architecture", "culture"]),
    place("teachers-camp", "Teachers Camp", "East Baguio", 16.4190, 120.6082, 50, "06:00", "18:00", "Culture", false, "A historic pine-filled institutional compound with heritage buildings and a quiet Baguio atmosphere.", ["Walk around publicly accessible areas", "Observe heritage architecture", "Pair it with Laperal White House", "Respect events and restricted facilities"], ["heritage", "pine", "quiet"]),
    place("botanical-garden", "Baguio Botanical Garden", "East Baguio", 16.42194, 120.61335, 90, "06:00", "18:00", "Park", true, "A landscaped cultural garden with greenery, art, Cordilleran features, and photo areas.", ["Explore the cultural installations", "Walk the garden paths slowly", "Look for seasonal floral displays", "Visit early to avoid large crowds"], ["nature", "culture", "photos", "popular"], { alight: "Ask the driver to drop you at the Botanical Garden main entrance on Leonard Wood Road." }),
    place("wright-park", "Wright Park", "East Baguio", 16.42011, 120.61917, 75, "06:00", "18:00", "Park", true, "A pine-lined promenade beside The Mansion, known for the Pool of Pines and horseback-riding area.", ["Walk the Pool of Pines promenade", "Ride a horse through an accredited handler", "Rent Cordilleran-inspired attire respectfully", "Walk to The Mansion gate"], ["nature", "family", "horse", "popular"], { alight: "Ask to alight near Wright Park or The Mansion. The two attractions are walkable from each other." }),
    place("the-mansion", "The Mansion", "East Baguio", 16.42068, 120.62001, 35, "06:00", "18:00", "Culture", true, "The official presidential summer residence, viewed from its iconic gate and landscaped approach.", ["Take a photo from the public gate area", "Read the historical marker", "Pair it with Wright Park", "Avoid blocking traffic at the entrance"], ["landmark", "photos", "popular"]),
    place("mines-view-park", "Mines View Park", "East Baguio", 16.42492, 120.62771, 75, "05:00", "20:00", "Viewpoint", true, "A classic viewpoint with souvenir stalls and mountain scenery toward the Cordillera ranges.", ["Visit the viewing deck", "Browse souvenir stalls", "Try local snacks and strawberry products", "Go early for lighter crowds and clearer views"], ["view", "souvenirs", "popular"], { alight: "Ride to the Mines View terminal and follow the pedestrian signs to the park entrance." }),
    place("good-shepherd", "Good Shepherd Convent", "East Baguio", 16.42529, 120.62924, 45, "08:00", "17:00", "Food & shopping", true, "A popular pasalubong stop near Mines View Park, known for ube jam and other local products.", ["Check product availability before lining up", "Buy only what you can safely carry", "Enjoy the view from the grounds", "Walk from Mines View when weather allows"], ["food", "pasalubong", "popular"]),
    place("arcas-yard", "Arca's Yard", "East Baguio", 16.4350, 120.6250, 90, "09:00", "19:00", "Food & shopping", false, "A cozy café and cultural space in the hills, known for views, books, local design, and relaxed meals.", ["Reserve a table on busy dates", "Try a warm drink with a mountain view", "Browse books and local displays", "Use a taxi for easier access"], ["food", "view", "quiet"], { routeGuide: routeGuides["East Baguio"], alight: "Ask for Tiptop or Ambuklao Road and confirm the safest drop-off for Arca's Yard." }),
    place("bamboo-eco-park", "Bamboo Eco Park", "East Baguio", 16.4315, 120.6168, 60, "07:00", "17:00", "Park", false, "A quieter bamboo-filled green space suited to gentle walks and nature photography.", ["Walk through the bamboo paths", "Use insect protection", "Visit in daylight", "Confirm current admission and access"], ["nature", "quiet", "hidden"]),
    place("camp-john-hay", "Camp John Hay", "South Baguio", 16.39784, 120.61137, 150, "06:00", "20:00", "Park", true, "A broad pine-covered estate with trails, heritage sites, cafés, and recreational areas.", ["Walk the Yellow Trail or an easier forest path", "Visit Bell House and the historical core", "Try a picnic or café stop", "Allow extra travel time between areas inside the estate"], ["nature", "food", "long visit", "popular"], { alight: "Tell the driver which Camp John Hay entrance you need. A taxi is often simpler for specific sites inside the estate." }),
    place("bell-house", "Bell House", "South Baguio", 16.4002, 120.6115, 45, "08:00", "17:00", "Culture", false, "A preserved American-era residence within Camp John Hay's historical core.", ["Tour the period rooms when open", "Walk around the landscaped grounds", "Pair it with the Cemetery of Negativism", "Check the historical-core entrance fee"], ["heritage", "history", "camp john hay"]),
    place("cemetery-of-negativism", "Cemetery of Negativism", "South Baguio", 16.3994, 120.6120, 25, "08:00", "17:00", "Culture", false, "A playful symbolic site inside Camp John Hay encouraging visitors to leave negative habits behind.", ["Read the humorous markers", "Pair it with Bell House", "Keep the visit short and reflective", "Stay on designated paths"], ["quirky", "heritage", "camp john hay"]),
    place("john-hay-historical-core", "John Hay Historical Core", "South Baguio", 16.4004, 120.6112, 90, "08:00", "17:00", "Culture", false, "A cluster of heritage attractions inside Camp John Hay, including Bell House and historical markers.", ["Buy the appropriate entrance ticket", "Follow the heritage walk", "Combine nearby sites in one visit", "Allow time for uphill paths"], ["heritage", "history", "camp john hay"]),
    place("philippine-military-academy", "Philippine Military Academy", "South Baguio", 16.3604, 120.6164, 120, "08:00", "17:00", "Culture", true, "A historic military academy with manicured grounds, monuments, and mountain scenery, subject to visitor rules.", ["Bring valid identification", "Follow current security and dress rules", "Visit approved public areas only", "Check access before traveling"], ["history", "landmark", "popular"], { alight: "Use a PMA or Kias route only after confirming visitor access and the correct gate." }),
    place("lions-head", "Lion's Head", "South Baguio", 16.3629, 120.6057, 30, "06:00", "18:00", "Viewpoint", true, "The iconic roadside lion sculpture along Kennon Road, best treated as a quick photo stop.", ["Take a quick roadside photo safely", "Stay within designated areas", "Avoid stepping into traffic", "Combine with a hired-vehicle route along Kennon Road"], ["landmark", "photos", "popular"], { routeGuide: routeGuides["South Baguio"], alight: "Public transport may not stop conveniently. A hired vehicle is safer for a controlled photo stop." }),
    place("maryknoll-ecological-sanctuary", "Maryknoll Ecological Sanctuary", "South Baguio", 16.3997, 120.5862, 75, "08:00", "17:00", "Park", false, "A peaceful ecological space with reflective paths, gardens, and environmental learning areas.", ["Follow the earth-themed trail", "Keep noise low", "Ask about guided activities", "Wear shoes suitable for damp paths"], ["nature", "quiet", "education"]),
    place("mirador-heritage-eco-park", "Mirador Heritage and Eco Park", "West Baguio", 16.40945, 120.57863, 105, "06:00", "18:00", "Park", true, "A hillside heritage park known for gardens, contemplative spaces, art, and sunset views.", ["Walk to the torii-inspired viewpoint", "Explore the gardens and heritage areas", "Time the visit for late afternoon", "Wear shoes suitable for slopes"], ["view", "nature", "photos", "popular"], { alight: "Ask for the closest Mirador or Lourdes drop-off and expect an uphill walk." }),
    place("lourdes-grotto", "Lourdes Grotto", "West Baguio", 16.40905, 120.57978, 50, "06:00", "18:00", "Culture", true, "A hillside pilgrimage site reached by a long stairway, with views over western Baguio.", ["Climb at a comfortable pace", "Use the roadway alternative when appropriate", "Keep the prayer area quiet", "Pair it with Mirador"], ["heritage", "stairs", "view", "popular"]),
    place("diplomat-hotel", "Old Diplomat Hotel", "West Baguio", 16.4038, 120.5787, 60, "07:00", "18:00", "Culture", true, "Ruins of a historic hilltop structure on Dominican Hill, known for architecture and city views.", ["Explore only open public areas", "Read about the building's history", "Enjoy the panoramic viewpoint", "Avoid unsafe or restricted sections"], ["heritage", "view", "popular"], { alight: "Ask for Dominican Hill and confirm the uphill access point." }),
    place("tam-awan-village", "Tam-awan Village", "West Baguio", 16.4290, 120.57785, 105, "08:00", "17:00", "Culture", true, "An artists' village with Cordilleran-inspired houses, galleries, workshops, and hillside paths.", ["Visit the galleries and traditional structures", "Check for portrait sketches or workshops", "Wear shoes for steep paths", "Respect cultural displays and artists"], ["art", "culture", "hillside", "popular"], { alight: "Confirm the Tam-awan route and ask to alight at the main entrance." }),
    place("igorot-stone-kingdom", "Igorot Stone Kingdom", "West Baguio", 16.4238, 120.5727, 105, "06:00", "18:00", "Culture", true, "A large stone-terrace attraction inspired by Cordilleran themes and mountain architecture.", ["Explore the stone terraces slowly", "Read the site's cultural explanations", "Watch for scheduled performances", "Use the designated photo areas"], ["culture", "architecture", "family", "popular"], { alight: "Ask for the Stone Kingdom route or a Tam-awan/Longlong-area jeepney and confirm the entrance drop-off." }),
    place("easter-weaving-room", "Easter Weaving Room", "West Baguio", 16.4192, 120.5849, 60, "08:00", "17:00", "Culture", false, "A long-running weaving center where visitors can see and buy Cordilleran-inspired textiles.", ["Observe weaving when demonstrations are available", "Ask before taking close-up photos", "Shop for locally made textiles", "Learn about patterns and materials"], ["weaving", "culture", "shopping"]),
    place("ifugao-woodcarvers-village", "Ifugao Woodcarvers Village", "West Baguio", 16.3892, 120.5616, 60, "08:00", "17:00", "Culture", false, "A stretch along Asin Road associated with woodcarving workshops and artisan products.", ["Browse handmade woodcraft", "Ask artisans about their process", "Buy directly when possible", "Arrange transport because shops are spread out"], ["craft", "shopping", "culture"], { routeGuide: routeGuides["Tuba / Asin"] }),
    place("bencab-museum", "BenCab Museum", "Tuba / Asin", 16.3814, 120.5503, 150, "09:00", "18:00", "Museum", true, "A major contemporary-art museum with Cordilleran collections, gardens, and views along Asin Road.", ["Allow time for all galleries", "Explore the garden and farm area", "Check the museum café schedule", "Arrange a taxi or hired vehicle for easier return"], ["art", "museum", "culture", "popular"], { googleQuery: "BenCab Museum Tuba Benguet", alight: "Public jeepneys may require walking and uncertain return waits. A taxi or hired vehicle is usually more convenient." }),
    place("asin-hot-springs", "Asin Hot Springs", "Tuba / Asin", 16.3650, 120.5355, 180, "07:00", "18:00", "Park", false, "A group of warm-spring resorts in the Asin area, suitable for a slower half-day side trip.", ["Choose a resort before departing", "Bring swimwear and a change of clothes", "Confirm entrance fees and pool rules", "Arrange return transport in advance"], ["water", "relax", "side trip"], { googleQuery: "Asin Hot Springs Tuba Benguet" }),
    place("hydro-falls", "Hydro Falls", "Tuba / Asin", 16.3540, 120.5430, 150, "07:00", "17:00", "Viewpoint", false, "A nature side trip in the Tuba area that may require local guidance and careful access planning.", ["Confirm current trail access", "Use a local guide when required", "Avoid visiting after heavy rain", "Carry water and proper footwear"], ["nature", "adventure", "side trip"], { googleQuery: "Hydro Falls Tuba Benguet" }),
    place("mt-camisong-forest-park", "Mt. Camisong Forest Park", "Tuba / Asin", 16.3480, 120.5720, 180, "06:00", "17:00", "Park", false, "A forested mountain attraction outside central Baguio, best planned as a dedicated side trip.", ["Confirm the current entrance and road conditions", "Wear trail-ready footwear", "Bring rain protection", "Arrange a hired vehicle or local guide"], ["nature", "forest", "side trip"], { googleQuery: "Mt Camisong Forest Park Benguet" }),
    place("dragon-treasure-castle", "Dragon Treasure Castle", "Tuba / Asin", 16.3440, 120.5730, 90, "08:00", "17:00", "Culture", false, "A castle-themed roadside attraction in the wider Baguio–Tuba area, suited to a planned photo stop.", ["Confirm opening status before leaving", "Explore designated photo areas", "Pair with another Tuba-side attraction", "Use hired transport for convenience"], ["photos", "family", "side trip"], { googleQuery: "Dragon Treasure Castle Benguet" }),
    place("bell-church", "Bell Church", "North Baguio", 16.43198, 120.59412, 50, "06:00", "17:00", "Culture", true, "A tranquil Chinese-Filipino temple complex near the Baguio–La Trinidad boundary.", ["Observe the temple architecture", "Keep voices low", "Follow photography rules", "Pair it with Valley of Colors"], ["culture", "architecture", "popular"], { alight: "Ride a La Trinidad jeepney and ask to alight at Bell Church." }),
    place("valley-of-colors", "Valley of Colors", "La Trinidad", 16.4466, 120.5899, 35, "06:00", "18:00", "Viewpoint", true, "A colorful hillside community visible along the road between Baguio and La Trinidad.", ["View the mural from a safe public area", "Avoid entering private residential spaces", "Pair it with Bell Church or Strawberry Farm", "Use daylight for better photos"], ["photos", "view", "popular"], { googleQuery: "Valley of Colors La Trinidad Benguet", alight: "Ask the driver for Valley of Colors or StoBoSa and alight only at a safe designated point." }),
    place("strawberry-farm", "La Trinidad Strawberry Farm", "La Trinidad", 16.4549, 120.5897, 105, "06:00", "18:00", "Park", true, "A well-known farm area for seasonal strawberry picking, produce, food products, and local stalls.", ["Pick strawberries when farms permit and fruit is in season", "Try strawberry ice cream or taho", "Shop for vegetables and local products", "Wear shoes that can handle soil or mud"], ["food", "farm", "family", "popular"], { googleQuery: "La Trinidad Strawberry Farm Benguet", alight: "Tell the La Trinidad dispatcher you are going to Strawberry Farm and ask for the nearest safe drop-off." }),
    place("mount-costa", "Mount Costa", "La Trinidad", 16.4850, 120.5800, 150, "08:00", "17:00", "Park", true, "A large garden attraction with themed landscapes and leisurely walking routes in La Trinidad.", ["Explore the themed gardens", "Bring sun and rain protection", "Allow at least two hours", "Arrange return transport before closing"], ["garden", "photos", "family", "popular"], { googleQuery: "Mount Costa La Trinidad Benguet" }),
    place("mt-kalugong", "Mt. Kalugong Cultural Village", "La Trinidad", 16.4705, 120.6075, 180, "06:00", "18:00", "Viewpoint", true, "A rocky cultural and nature destination with elevated views over La Trinidad.", ["Wear sturdy shoes for rock sections", "Enjoy the valley viewpoint", "Visit the café when open", "Check weather before climbing"], ["hike", "view", "culture", "popular"], { googleQuery: "Mt Kalugong Cultural Village La Trinidad" }),
    place("mt-yangbew", "Mt. Yangbew", "La Trinidad", 16.4975, 120.6065, 180, "05:00", "17:00", "Viewpoint", false, "An open grassland summit known for sunrise, mountain scenery, and a short but exposed hike.", ["Start early for sunrise", "Bring wind protection", "Stay on established paths", "Arrange transport to and from the jump-off"], ["hike", "sunrise", "nature"], { googleQuery: "Mt Yangbew La Trinidad Benguet" }),
    place("bahong-flower-farm", "Bahong Flower Farm", "La Trinidad", 16.4900, 120.6230, 120, "07:00", "17:00", "Park", false, "A flower-growing community in La Trinidad where access and viewing opportunities depend on current farm arrangements.", ["Confirm whether farms accept visitors", "Ask permission before entering fields", "Buy flowers from authorized sellers", "Use a local guide or arranged vehicle"], ["flowers", "farm", "hidden"], { googleQuery: "Bahong Flower Farm La Trinidad" }),
    place("haights-place", "Haight's Place", "La Trinidad", 16.4855, 120.6040, 90, "08:00", "17:00", "Park", false, "A lesser-known upland stop in the Benguet area; current access and exact visitor arrangements should be checked before travel.", ["Confirm the correct map pin", "Contact the venue before departure", "Pair with a nearby La Trinidad stop", "Use arranged transport"], ["hidden", "nature", "side trip"], { googleQuery: "Haight's Place Benguet" }),
    place("northern-blossom-flower-farm", "Northern Blossom Flower Farm", "Atok Side Trip", 16.7365, 120.8390, 180, "06:00", "16:30", "Park", true, "A famous Atok flower farm with mountain views, requiring a very early start and a long journey from Baguio.", ["Reserve or confirm entry before the trip", "Dress for colder Atok weather", "Start before dawn for better timing", "Plan transport as a dedicated day trip"], ["flowers", "view", "day trip", "popular"], { googleQuery: "Northern Blossom Flower Farm Atok Benguet" }),
    place("highest-point-halsema", "Halsema Highway Highest Point", "Atok Side Trip", 16.7070, 120.8380, 35, "06:00", "17:00", "Viewpoint", true, "A high-elevation roadside viewpoint along Halsema Highway, normally paired with an Atok itinerary.", ["Stop only at a safe designated area", "Wear warm clothing", "Check fog and rain conditions", "Pair it with Northern Blossom"], ["view", "road trip", "popular"], { googleQuery: "Highest Point Halsema Highway Atok Benguet" }),
    place("baguio-orchidarium", "Baguio Orchidarium", "City Center", 16.4107, 120.5905, 45, "08:00", "17:00", "Park", false, "A compact plant area beside Burnham Park with orchids and garden stalls.", ["Browse plants", "Pair with Burnham", "Visit in the morning", "Ask before photographing stalls"], ["plants", "walkable"])
  ];

  // Remove accidental duplicate IDs while preserving the first, richer entry.
  const uniqueDestinations = destinations.filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);

  window.LAKBAY_DATA = {
    startLocations: [
      { id: "victory-liner", name: "Victory Liner Baguio Terminal", lat: 16.40179, lng: 120.59903, area: "City Center", terminal: true, googleQuery: "Victory Liner Baguio Terminal" },
      { id: "gov-pack", name: "Gov. Pack Road Bus Terminal", lat: 16.40946, lng: 120.59978, area: "City Center", terminal: true, googleQuery: "Gov Pack Road Baguio bus terminal" },
      { id: "genesis-baguio", name: "Genesis Transport — Baguio Terminal", lat: 16.40905, lng: 120.60010, area: "City Center", terminal: true, googleQuery: "Genesis Transport Baguio Terminal Gov Pack Road" },
      { id: "joybus-baguio", name: "JoyBus — Baguio Terminal", lat: 16.40905, lng: 120.60010, area: "City Center", terminal: true, googleQuery: "JoyBus Baguio Terminal Gov Pack Road" },
      { id: "sm-baguio", name: "SM City Baguio", lat: 16.40817, lng: 120.59997, area: "City Center", googleQuery: "SM City Baguio" },
      { id: "burnham-start", name: "Burnham Park", lat: 16.41107, lng: 120.59334, area: "City Center", googleQuery: "Burnham Park Baguio" },
      { id: "session-start", name: "Session Road", lat: 16.41273, lng: 120.59864, area: "City Center", googleQuery: "Session Road Baguio" },
      { id: "hotel-custom", name: "My hotel / accommodation", lat: 16.4117, lng: 120.5980, area: "City Center", customName: true, googleQuery: "Baguio City" }
    ],
    baggageOptions: {
      "victory-liner": [
        { name: "Victory Liner terminal baggage counter", detail: "Traveler reports indicate a paid counter may be available and same-day ticket conditions can apply. Verify eligibility, hours, and fees directly at the terminal.", query: "Victory Liner Baguio Terminal" },
        { name: "SM City Baguio Tourist Lounge", detail: "A reported alternative near the city center. Availability, level, size limits, and rates can change, so confirm with the mall concierge.", query: "SM City Baguio Tourist Lounge" }
      ],
      "gov-pack": [
        { name: "Genesis / JoyBus terminal counter", detail: "Travelers have reported short-term baggage acceptance near Gov. Pack. Confirm the current policy and claim-ticket procedure at the counter.", query: "Genesis Transport Baguio Terminal Gov Pack Road" },
        { name: "SM City Baguio Tourist Lounge", detail: "A nearby reported luggage option. Confirm current operating hours and rates before relying on it.", query: "SM City Baguio Tourist Lounge" }
      ],
      "genesis-baguio": [
        { name: "Genesis terminal counter", detail: "Ask the terminal counter whether short-term luggage storage is currently available. Fees and operating rules are not guaranteed.", query: "Genesis Transport Baguio Terminal Gov Pack Road" },
        { name: "SM City Baguio Tourist Lounge", detail: "A nearby reported alternative. Confirm current availability and rates with the mall concierge.", query: "SM City Baguio Tourist Lounge" }
      ],
      "joybus-baguio": [
        { name: "JoyBus / Genesis terminal counter", detail: "Ask the counter about current baggage-hold rules before leaving the terminal. Keep valuables with you.", query: "JoyBus Baguio Terminal Gov Pack Road" },
        { name: "SM City Baguio Tourist Lounge", detail: "A nearby reported alternative. Verify the exact level, opening time, and rates on arrival.", query: "SM City Baguio Tourist Lounge" }
      ]
    },
    destinations: uniqueDestinations,
    categoryOrder: ["All", "Popular", "City Center", "Nature & Views", "Arts & Culture", "Food & Shopping", "Family", "Nearby Side Trips"],
    routeGuides
  };
}());
