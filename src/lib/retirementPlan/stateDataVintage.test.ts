import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { STATE_PARAMETERS_HELD_FROM_2025, stateDataVintage } from "./stateDataVintage";
import { VERIFIED_RETIREMENT_STATES } from "./verifiedLocation";

describe("state data vintage", () => {
  it("labels states that hold 2025 parameters as mixed instead of stamping 2026", () => {
    expect(stateDataVintage("vt")).toMatchObject({ year: 2025, basis: "mixed-2025-2026" });
    expect(stateDataVintage("vt").note).toMatch(/2025/);
    expect(stateDataVintage("ne")).toEqual({ year: 2026, basis: "published-2026", note: null });
    expect(stateDataVintage("ok")).toEqual({ year: 2026, basis: "published-2026", note: null });
    expect(stateDataVintage("fl")).toEqual({ year: 2026, basis: "published-2026", note: null });
    expect(stateDataVintage("or")).toEqual({ year: 2026, basis: "published-2026", note: null });
  });

  it("lists only verified states", () => {
    for (const code of Object.keys(STATE_PARAMETERS_HELD_FROM_2025)) expect(VERIFIED_RETIREMENT_STATES).toContain(code);
  });

  it("exposes the vintage and a warning on a mixed-data state's annual result, and none for a published-2026 state", () => {
    const base = { year: 2026, filing: "single", stateTreatment: "verified-resident-location",
      people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 50000 }], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 } };
    const vt = estimateHouseholdTax({ ...base, state: "vt", vermontContract: "verified-law-precredit" } as HouseholdTaxInput);
    expect(vt.stateDataYear).toBe(2025);
    expect(vt.stateDataBasis).toBe("mixed-2025-2026");
    expect(vt.warnings.join(" ")).toMatch(/State parameter vintage: mixed 2025\/2026 data/);
    const fl = estimateHouseholdTax({ ...base, state: "fl" } as HouseholdTaxInput);
    expect(fl.stateDataYear).toBe(2026);
    expect(fl.stateDataBasis).toBe("published-2026");
    expect(fl.warnings.join(" ")).not.toMatch(/State parameter vintage/);
  });
});
