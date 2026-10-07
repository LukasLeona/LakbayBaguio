import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sitemap from "../app/sitemap";
import { placeEditorial } from "../lib/place-guide-content";
import { SITE_URL } from "../lib/seo";

const reportedPublicPaths = [
  "/explore",
  "/guides",
  "/places/baguio-cathedral",
  "/places/bencab-museum",
  "/places/camp-john-hay",
  "/places/chaya",
  "/places/mines-view-park",
  "/places/museo-kordilyera",
  "/places/wright-park",
  "/resources",
] as const;

const intentionallyPrivatePaths = [
  "/chat",
  "/suggestions",
  "/wall",
  "/plan/itinerary",
] as const;

const newlyPublicSupportPaths = ["/help", "/partner", "/privacy"] as const;

const entries = sitemap();
const urls = entries.map((entry) => entry.url);
const urlSet = new Set(urls);

assert.equal(urlSet.size, urls.length, "The sitemap contains duplicate canonical URLs.");
assert.ok(urls.every((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL), "Every sitemap URL must use the HTTPS apex domain.");
assert.ok(urls.every((url) => !url.includes("www.baguiobuddy.com")), "The sitemap must not publish redirecting www URLs.");

for (const path of [...reportedPublicPaths, ...newlyPublicSupportPaths]) {
  assert.ok(urlSet.has(`${SITE_URL}${path}`), `Missing public URL from sitemap: ${path}`);
}

for (const path of intentionallyPrivatePaths) {
  assert.ok(!urlSet.has(`${SITE_URL}${path}`), `Private/noindex URL must not be in sitemap: ${path}`);
}

for (const path of reportedPublicPaths.filter((path) => path.startsWith("/places/"))) {
  const slug = path.split("/").at(-1)!;
  const editorial = placeEditorial[slug];
  assert.ok(editorial, `Missing unique editorial content for ${slug}`);
  assert.ok(editorial.intro.length >= 120, `Editorial introduction is too thin for ${slug}`);
  assert.equal(editorial.visitPlan.length, 3, `Expected three visit-planning steps for ${slug}`);
}

const nextConfigSource = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
assert.match(nextConfigSource, /value:\s*"www\.baguiobuddy\.com"/, "Missing www host redirect.");
assert.match(nextConfigSource, /destination:\s*"https:\/\/baguiobuddy\.com\/:path\*"/, "Redirect destination must use the HTTPS apex domain.");

console.log(`Search index audit passed: ${reportedPublicPaths.length} reported public URLs, ${newlyPublicSupportPaths.length} public support URLs, and ${intentionallyPrivatePaths.length} intentional noindex paths checked.`);
