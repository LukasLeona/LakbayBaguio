import type { FareSettings, JeepneyVehicleClass } from "@/lib/planner-types";

export type JeepneyFareRule = {
  label: string;
  minimum: number;
  baseKilometers: number;
  perKilometer: number;
};

export type FarePolicyVersion = {
  id: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  effectiveLabel: string;
  reviewedOn: string;
  reviewedLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  verificationNote: string;
  localAdvisory?: { label: string; url: string; note: string };
  jeepney: {
    traditional: JeepneyFareRule;
    modern: JeepneyFareRule;
  };
};

const TRADITIONAL_2023_SOURCE =
  "https://www.ltfrb.gov.ph/wp-content/uploads/2024/11/Fare-Guide_Traditional-PUJ-Provisional-Fare-Increase_08Oct2023.pdf";
const SEPTEMBER_2026_SOURCE =
  "https://www.gmanetwork.com/news/money/economy/1003715/dotr-approves-ltfrb-fare-hike-recommendation-for-puvs/story/";

export const FARE_POLICY_VERSIONS: readonly FarePolicyVersion[] = [
  {
    id: "puj-2023-10-08",
    effectiveFrom: "2023-10-08",
    effectiveUntil: "2026-09-27",
    effectiveLabel: "Effective through September 27, 2026",
    reviewedOn: "2026-09-27",
    reviewedLabel: "September 27, 2026",
    sourceLabel: "LTFRB Traditional PUJ Fare Guide",
    sourceUrl: TRADITIONAL_2023_SOURCE,
    verificationNote: "Confirm the posted fare matrix inside the vehicle before paying.",
    jeepney: {
      traditional: { label: "Traditional PUJ", minimum: 13, baseKilometers: 4, perKilometer: 1.8 },
      modern: { label: "Modern PUJ", minimum: 15, baseKilometers: 4, perKilometer: 2.2 },
    },
  },
  {
    id: "puj-2026-09-28",
    effectiveFrom: "2026-09-28",
    effectiveLabel: "Effective September 28, 2026",
    reviewedOn: "2026-09-27",
    reviewedLabel: "September 27, 2026",
    sourceLabel: "DOTr/LTFRB fare adjustment announcement",
    sourceUrl: SEPTEMBER_2026_SOURCE,
    verificationNote: "Use the posted LTFRB fare matrix inside the vehicle. Student, senior, and PWD discounts remain subject to the applicable rules and proof of eligibility.",
    localAdvisory: {
      label: "Baguio–Benguet temporary voluntary fare report",
      url: "https://baguio.bomboradyo.com/dagdag-na-p2-sa-pamasahe-ng-traditional-at-modernized-jeepney-sa-baguio-city-at-benguet-naaprubahan-na/",
      note: "This separate local report describes a voluntary adjustment, so it is shown for verification and is not silently added to the computed mandatory fare.",
    },
    jeepney: {
      traditional: { label: "Traditional PUJ", minimum: 14, baseKilometers: 4, perKilometer: 2 },
      modern: { label: "Modern PUJ", minimum: 17, baseKilometers: 4, perKilometer: 2.4 },
    },
  },
];

const TAXI_POLICY = {
  label: "Baguio regular taxi",
  flagDown: 50,
  perKilometer: 13.5,
  perMinute: 2,
  effectiveLabel: "₱50 flag-down permanently authorized March 8, 2024",
  sourceLabel: "LTFRB Regular Taxi Fare Rates",
  sourceUrl: "https://www.ltfrb.gov.ph/wp-content/uploads/2024/11/TAXI-Fare-Rates.pdf",
  orderLabel: "LTFRB Taxi Fare Order — Case No. 2022-7433",
  orderUrl: "https://ltfrb.gov.ph/wp-content/uploads/2024/10/CN-2022-7433-Taxi-Fare-Increase-03-18-2024.pdf",
} as const;

function manilaDateValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function policyDate(value?: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : manilaDateValue();
}

export function resolveFarePolicy(tripDate?: string): FarePolicyVersion {
  const date = policyDate(tripDate);
  return [...FARE_POLICY_VERSIONS]
    .reverse()
    .find((version) => date >= version.effectiveFrom && (!version.effectiveUntil || date <= version.effectiveUntil))
    ?? FARE_POLICY_VERSIONS[0];
}

export function fareSettingsForClass(
  policy: FarePolicyVersion,
  vehicleClass: Exclude<JeepneyVehicleClass, "unsure">,
): FareSettings {
  const jeepney = policy.jeepney[vehicleClass];
  return {
    jeepMinimum: jeepney.minimum,
    jeepBaseKm: jeepney.baseKilometers,
    jeepPerKm: jeepney.perKilometer,
    taxiFlag: TAXI_POLICY.flagDown,
    taxiPerKm: TAXI_POLICY.perKilometer,
    taxiPerMinute: TAXI_POLICY.perMinute,
  };
}

export function resolveFareProfile(
  tripDate?: string,
  vehicleClass: JeepneyVehicleClass = "unsure",
) {
  const policy = resolveFarePolicy(tripDate);
  const traditional = fareSettingsForClass(policy, "traditional");
  const modern = fareSettingsForClass(policy, "modern");
  return {
    policy,
    vehicleClass,
    minimumSettings: vehicleClass === "modern" ? modern : traditional,
    maximumSettings: vehicleClass === "traditional" ? traditional : modern,
    planningSettings: vehicleClass === "traditional" ? traditional : modern,
  };
}

const currentPolicy = resolveFarePolicy();

/** Compatibility metadata used by existing fare presentation. */
export const LTFRB_FARE_POLICY = {
  authority: "Land Transportation Franchising and Regulatory Board (LTFRB)",
  reviewedOn: currentPolicy.reviewedOn,
  reviewedLabel: currentPolicy.reviewedLabel,
  jeepney: {
    label: currentPolicy.jeepney.traditional.label,
    minimum: currentPolicy.jeepney.traditional.minimum,
    baseKilometers: currentPolicy.jeepney.traditional.baseKilometers,
    perKilometer: currentPolicy.jeepney.traditional.perKilometer,
    effectiveLabel: currentPolicy.effectiveLabel,
    sourceLabel: currentPolicy.sourceLabel,
    sourceUrl: currentPolicy.sourceUrl,
  },
  taxi: TAXI_POLICY,
  versions: FARE_POLICY_VERSIONS,
} as const;

export const OFFICIAL_FARE_SETTINGS = Object.freeze(
  resolveFareProfile(undefined, "traditional").planningSettings,
);
