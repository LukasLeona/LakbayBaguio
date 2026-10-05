import { BAGUIO_GUIDE_LOOPS } from "../lib/baguio-guide-data";
import { PLANNER_DESTINATIONS } from "../lib/planner-data";

const catalogIds = BAGUIO_GUIDE_LOOPS.flatMap((loop) => loop.destinationIds);
const plannerIds = PLANNER_DESTINATIONS.map((destination) => destination.id);
const uniqueCatalogIds = new Set(catalogIds);
const uniqueLoopIds = new Set(BAGUIO_GUIDE_LOOPS.map((loop) => loop.id));

const duplicates = catalogIds.filter((id, index) => catalogIds.indexOf(id) !== index);
const missing = plannerIds.filter((id) => !uniqueCatalogIds.has(id));
const unknown = catalogIds.filter((id) => !plannerIds.includes(id));

const problems: string[] = [];
if (uniqueLoopIds.size !== BAGUIO_GUIDE_LOOPS.length) problems.push("Route-loop IDs must be unique.");
if (duplicates.length) problems.push(`Destinations assigned more than once: ${[...new Set(duplicates)].join(", ")}`);
if (missing.length) problems.push(`Planner destinations missing from the guide: ${missing.join(", ")}`);
if (unknown.length) problems.push(`Unknown guide destinations: ${[...new Set(unknown)].join(", ")}`);
for (const loop of BAGUIO_GUIDE_LOOPS) {
  if (!loop.destinationIds.length) problems.push(`Route loop ${loop.id} has no destinations.`);
}

if (problems.length) {
  console.error("Baguio guide catalog audit failed:\n- " + problems.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Baguio guide catalog audit passed: ${BAGUIO_GUIDE_LOOPS.length} loops and ${catalogIds.length} destinations.`);
}

