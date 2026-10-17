import { describe, expect, it } from "vitest";
import { buildPairReport, equalSalary, priceLevel, REPORT_SALARIES } from "./pairReport";
import { ALLOWED_COMPARE_ROUTES } from "./seo-allowlists";
import { estimateNetBreakdown } from "./wageTax";
import { findCity } from "./cities";

describe("city-pair report numbers", () => {
  it("builds a complete report for every published pair", () => {
    for (const { from, to } of ALLOWED_COMPARE_ROUTES) {
      const r = buildPairReport(from, to);
      expect(r, `${from}/${to}`).not.toBeNull();
      expect(r!.headline.equalSalary, `${from}/${to} equal salary`).toBeGreaterThan(20_000);
      expect(r!.salaryRows).toHaveLength(REPORT_SALARIES.length);
      for (const row of r!.salaryRows) {
        expect(row.change).toBeCloseTo(row.toNet - row.fromNet, 6);
        expect(row.equal).not.toBeNull();
      }
      expect(r!.cost.priceLevel[0]).not.toBeNull();
      expect(r!.cost.rent[0]).not.toBeNull();
      expect(r!.buy.monthlyOwnCost[1]).not.toBeNull();
    }
  });

  it("the equal salary leaves the same after-tax buying power as the original salary", () => {
    const [from, to] = ["nyc-ny", "charlotte-nc"];
    const eq = equalSalary(from, to, 100_000)!;
    const net = (id: string, g: number) => estimateNetBreakdown({ grossAnnual: g, state: findCity(id)!.state, filing: "single", k401Pct: 0, cityId: id }).net;
    const power1 = net(from, 100_000) / priceLevel(from)!;
    const power2 = net(to, eq) / priceLevel(to)!;
    // equalSalary is rounded to $100, so the match is within that rounding.
    expect(Math.abs(power2 / power1 - 1)).toBeLessThan(0.002);
    expect(eq).toBeLessThan(100_000);
  });

  it("a cheaper, lower-tax destination raises take-home pay and purchasing power", () => {
    const r = buildPairReport("nyc-ny", "austin-tx")!;
    expect(r.headline.takeHomeChange).toBeGreaterThan(0);
    expect(r.headline.purchasingPowerPct!).toBeGreaterThan(0);
    expect(r.budget.rentTotal[1]!).toBeLessThan(r.budget.rentTotal[0]!);
  });

  it("owning costs add the mortgage payment, property tax and insurance", () => {
    const r = buildPairReport("la-ca", "austin-tx")!;
    const price = findCity("austin-tx")!.medianHomePrice!;
    expect(r.buy.monthlyOwnCost[1]!).toBeGreaterThan((price * 0.8 * 0.065) / 12 / 2);
    expect(r.buy.incomeToBuy[1]!).toBeGreaterThan(r.buy.incomeToRent[1]!);
  });
});
