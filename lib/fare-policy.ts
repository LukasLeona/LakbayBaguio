import type { FareSettings } from "@/lib/planner-types";

/**
 * Versioned fare inputs used by every itinerary calculation.
 *
 * LTFRB currently publishes fare guides as human-readable orders/PDFs rather
 * than a stable public API. Keeping the reviewed values and their sources in
 * one record prevents browser scraping and makes a future fare change a
 * single-file update.
 */
export const LTFRB_FARE_POLICY = {
  authority: "Land Transportation Franchising and Regulatory Board (LTFRB)",
  reviewedOn: "2026-09-22",
  reviewedLabel: "September 22, 2026",
  jeepney: {
    label: "Traditional PUJ",
    minimum: 13,
    baseKilometers: 4,
    perKilometer: 1.8,
    effectiveLabel: "Effective October 8, 2023",
    sourceLabel: "LTFRB Traditional PUJ Fare Guide",
    sourceUrl:
      "https://www.ltfrb.gov.ph/wp-content/uploads/2024/11/Fare-Guide_Traditional-PUJ-Provisional-Fare-Increase_08Oct2023.pdf",
  },
  taxi: {
    label: "Baguio regular taxi",
    flagDown: 50,
    perKilometer: 13.5,
    perMinute: 2,
    effectiveLabel: "₱50 flag-down permanently authorized March 8, 2024",
    sourceLabel: "LTFRB Regular Taxi Fare Rates",
    sourceUrl:
      "https://www.ltfrb.gov.ph/wp-content/uploads/2024/11/TAXI-Fare-Rates.pdf",
    orderLabel: "LTFRB Taxi Fare Order — Case No. 2022-7433",
    orderUrl:
      "https://ltfrb.gov.ph/wp-content/uploads/2024/10/CN-2022-7433-Taxi-Fare-Increase-03-18-2024.pdf",
  },
} as const;

export const OFFICIAL_FARE_SETTINGS = Object.freeze({
  jeepMinimum: LTFRB_FARE_POLICY.jeepney.minimum,
  jeepBaseKm: LTFRB_FARE_POLICY.jeepney.baseKilometers,
  jeepPerKm: LTFRB_FARE_POLICY.jeepney.perKilometer,
  taxiFlag: LTFRB_FARE_POLICY.taxi.flagDown,
  taxiPerKm: LTFRB_FARE_POLICY.taxi.perKilometer,
  taxiPerMinute: LTFRB_FARE_POLICY.taxi.perMinute,
} satisfies FareSettings);
