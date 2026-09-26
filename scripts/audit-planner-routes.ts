import assert from "node:assert/strict";
import { PLANNER_DESTINATIONS, PLANNER_START_LOCATIONS } from "../lib/planner-data";
import {
  buildDayRouteUrls,
  googleDirectionsUrl,
  googleLocationUrl,
  terminalIdentityTextLines,
  type PlannedDay,
} from "../lib/planner-engine";
import type { StartLocation } from "../lib/planner-types";

const startLocations = PLANNER_START_LOCATIONS as readonly StartLocation[];
const origin = startLocations[0];
const coordinatePattern = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/;

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

console.log(
  `Route audit passed: ${PLANNER_DESTINATIONS.length} destinations and ${routeUrls.length} multi-stop route segments use exact coordinates.`,
);
