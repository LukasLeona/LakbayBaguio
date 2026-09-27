import assert from "node:assert/strict";
import { PLANNER_DESTINATIONS, PLANNER_START_LOCATIONS } from "../lib/planner-data";
import { summarizeRouteTerrain } from "../lib/geoapify-routing";
import { routeEstimateKey } from "../lib/route-estimates";
import {
  buildDayRouteUrls,
  chooseTransport,
  DEFAULT_FARE_SETTINGS,
  googleDirectionsUrl,
  googleLocationUrl,
  haversineKm,
  JEEPNEY_ROAD_PATH_DISCLAIMER,
  terminalIdentityTextLines,
  type PlannedDay,
} from "../lib/planner-engine";
import type { StartLocation } from "../lib/planner-types";

const startLocations = PLANNER_START_LOCATIONS as readonly StartLocation[];
const origin = startLocations[0];
const coordinatePattern = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/;

assert.notEqual(
  routeEstimateKey({ lat: 16.411, lng: 120.591 }, { lat: 16.421, lng: 120.625 }, "walk"),
  routeEstimateKey({ lat: 16.421, lng: 120.625 }, { lat: 16.411, lng: 120.591 }, "walk"),
  "Route estimates must preserve direction because uphill and downhill times differ",
);
const steepTerrain = summarizeRouteTerrain([[0, 1_480], [250, 1_492], [550, 1_525]], 550);
assert.equal(steepTerrain?.level, "steep");
assert.equal(steepTerrain?.elevationGainMeters, 45);
assert.match(steepTerrain?.warning ?? "", /Steep uphill/);

const victoryBranches = startLocations.filter(
  ({ terminalIdentity }) => terminalIdentity?.operator === "Victory Liner",
);
assert.equal(victoryBranches.length, 2, "Both official Victory Liner Baguio branches must be selectable");
assert.deepEqual(
  victoryBranches.map(({ terminalIdentity }) => terminalIdentity?.branchLabel).sort(),
  ["GOVERNOR PACK", "MARCOVILLE"],
);
victoryBranches.forEach((branch) => {
  assert.ok(branch.terminalIdentity?.address, `${branch.name} needs its full official address`);
  assert.ok(branch.terminalIdentity?.warning, `${branch.name} needs a ticket-terminal warning`);
  assert.ok(branch.navigation, `${branch.name} needs an exact navigation target`);
  const sharedText = terminalIdentityTextLines(branch, "Starting terminal").join("\n");
  assert.ok(sharedText.includes(branch.terminalIdentity!.branchLabel));
  assert.ok(sharedText.includes(branch.terminalIdentity!.address));
  assert.ok(sharedText.includes(`${branch.lat.toFixed(5)}, ${branch.lng.toFixed(5)}`));
  assert.ok(sharedText.includes("Confirm that this branch matches"));
});

for (const destination of PLANNER_DESTINATIONS) {
  const target = destination.navigation ?? destination;
  const expectedCoordinate = `${target.lat},${target.lng}`;
  const directions = new URL(googleDirectionsUrl(origin, destination, "walk"));
  const place = new URL(googleLocationUrl(destination));

  assert.equal(
    directions.searchParams.get("destination"),
    expectedCoordinate,
    `${destination.name} directions must target its exact coordinate`,
  );
  assert.equal(
    place.searchParams.get("query"),
    expectedCoordinate,
    `${destination.name} place link must target its exact coordinate`,
  );

  if (destination.navigation?.googlePlaceId) {
    assert.equal(
      directions.searchParams.get("destination_place_id"),
      destination.navigation.googlePlaceId,
    );
    assert.equal(
      place.searchParams.get("query_place_id"),
      destination.navigation.googlePlaceId,
    );
  }
}

const auditDay = {
  items: PLANNER_DESTINATIONS.map((destination) => ({
    destination,
    stationary: false,
    transport: { mode: "walk" as const },
  })),
} as unknown as Pick<PlannedDay, "items">;
const routeUrls = buildDayRouteUrls(origin, auditDay);

for (const routeUrl of routeUrls) {
  const params = new URL(routeUrl).searchParams;
  const routeCoordinates = [
    params.get("origin"),
    ...((params.get("waypoints") ?? "").split("|").filter(Boolean)),
    params.get("destination"),
  ];
  routeCoordinates.forEach((coordinate) => {
    assert.ok(
      coordinate && coordinatePattern.test(coordinate),
      `Generated route contains an ambiguous target: ${coordinate ?? "missing"}`,
    );
  });
}

const minesView = PLANNER_DESTINATIONS.find(({ id }) => id === "mines-view-park");
const goodShepherd = PLANNER_DESTINATIONS.find(({ id }) => id === "good-shepherd");
assert.ok(minesView && goodShepherd, "Mines View corridor destinations must exist");

const corridorUrl = new URL(googleDirectionsUrl(minesView, goodShepherd, "walk"));
assert.equal(corridorUrl.searchParams.get("origin"), "16.4196515,120.6269696");
assert.equal(corridorUrl.searchParams.get("destination"), "16.4214729,120.6251922");
assert.equal(
  corridorUrl.searchParams.get("destination_place_id"),
  "ChIJ-w3haAClkTMRI0xFE1PUcXI",
);
assert.ok(
  !corridorUrl.toString().includes("Good+Shepherd+Convent"),
  "Mines View corridor must not fall back to an ambiguous place name",
);

const directJeepney = chooseTransport(
  origin,
  minesView,
  haversineKm(origin, minesView),
  {
    preference: "cheapest",
    pace: "comfortable",
    travelers: 2,
    modes: ["jeepney"],
    fareSettings: DEFAULT_FARE_SETTINGS,
  },
);
assert.equal(directJeepney.mode, "jeepney");
assert.equal(directJeepney.boardings, 1);
assert.deepEqual(
  directJeepney.stages?.map(({ kind }) => kind),
  ["access-walk", "wait", "ride", "final-walk"],
  "A direct jeepney commute must account for access, waiting, riding, and final walking",
);
assert.equal(
  directJeepney.baseMinutes,
  directJeepney.stages?.reduce((total, stage) => total + stage.minutes, 0),
);
assert.equal(directJeepney.minutes, directJeepney.baseMinutes + directJeepney.bufferMinutes);
assert.match(
  directJeepney.stages?.find(({ kind }) => kind === "access-walk")?.mapUrl ?? "",
  /travelmode=walking/,
  "Access directions must use walking mode",
);
assert.match(
  directJeepney.stages?.find(({ kind }) => kind === "final-walk")?.mapUrl ?? "",
  /travelmode=walking/,
  "Entrance directions must use walking mode",
);
assert.match(
  directJeepney.legMapUrl,
  /travelmode=driving/,
  "The separate road-path reference should use road geometry",
);
assert.equal(directJeepney.routeReference?.disclaimer, JEEPNEY_ROAD_PATH_DISCLAIMER);

const campJohnHay = PLANNER_DESTINATIONS.find(({ id }) => id === "camp-john-hay");
assert.ok(campJohnHay, "Camp John Hay must exist for the cross-corridor route audit");
const transferJeepney = chooseTransport(
  minesView,
  campJohnHay,
  haversineKm(minesView, campJohnHay),
  {
    preference: "cheapest",
    pace: "comfortable",
    travelers: 2,
    modes: ["jeepney"],
    fareSettings: DEFAULT_FARE_SETTINGS,
  },
);
assert.equal(transferJeepney.boardings, 2);
assert.equal(transferJeepney.stages?.filter(({ kind }) => kind === "ride").length, 2);
assert.ok(transferJeepney.stages?.some(({ kind }) => kind === "transfer-walk"));
assert.ok(transferJeepney.stages?.some(({ kind }) => kind === "transfer-wait"));
assert.equal(transferJeepney.totalFare, transferJeepney.farePerPerson * 2);

console.log(
  `Route audit passed: ${PLANNER_DESTINATIONS.length} destinations, ${routeUrls.length} route segments, and direct/transfer jeepney journeys are explicit.`,
);
