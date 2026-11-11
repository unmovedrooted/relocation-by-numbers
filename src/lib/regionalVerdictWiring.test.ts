import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withUpfrontFunding } from "./moveVerdict";

describe("regional cash-cushion wiring", () => {
  const source = (name: string) => readFileSync(new URL(`../components/${name}RelocationCalculator.tsx`, import.meta.url), "utf8");
  it("Asia includes its USD reserve and does not leave a reassuring fallback for a short cushion", () => {
    const s = source("Asia");
    expect(s).toContain("cashAfterUpfront + nz(emergencyCashBuffer)");
    expect(s).toContain("results.cushionMonths < SHORT_RUNWAY_MONTHS");
    expect(s).toContain("Monthly budget works; cash runway is short");
  });
  it("South America converts the reserve with the same currency contract as upfront costs", () => {
    const s = source("SouthAmerica");
    expect(s).toContain('cashAfterUpfront + destinationInputToUsd(nz(emergencyCashBuffer), "emergency")');
    expect(s).toContain("monthlyFlexibility >= 500 && cushionMonths < SHORT_RUNWAY_MONTHS");
  });
  it("Caribbean applies the shared verdict and warns only when its U.S. overlay is active", () => {
    const s = source("Caribbean");
    expect(s).toContain("remainingSavingsAfterMove + safetyNet");
    expect(s).toContain("results.cashAfterUpfront, results.cushionMonths");
    expect(s).toContain("usTaxWarning: usAbroad !== null");
    expect(s).toContain("{results.usTaxWarning && (");
    expect(s).toContain("leaves out U.S. state income tax and income tax treaties");
  });
  it.each([0, 2.999, 3, 6])("shared verdict respects the three-month boundary: %s", (months) => {
    const monthly = { label: "Comfortable", tone: "good" as const, note: "Monthly budget works." };
    const result = withUpfrontFunding(monthly, 0, months);
    expect(result.tone).toBe(months < 3 ? "caution" : "good");
  });
});
