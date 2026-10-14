import { describe, expect, it } from "vitest";
import { grossForNet } from "./grossForNet";

// 10% to 50,000, then 40% above (tax at 60,000 = 5,000 + 4,000 = 9,000).
const tax = (g: number) => Math.min(g, 50_000) * 0.1 + Math.max(0, g - 50_000) * 0.4;
const rate = (g: number) => (g > 0 ? tax(g) / g : 0);

describe("grossForNet", () => {
  it("finds the gross that leaves the wanted net after progressive tax", () => {
    const gross = grossForNet(60_000, rate);
    expect(gross - tax(gross)).toBeCloseTo(60_000, 4);
    // Net 45,000 is reached at gross 50,000; 60,000 net needs 50,000 + (15,000 / 0.6) = 75,000.
    expect(gross).toBeCloseTo(75_000, 3);
  });
  it("differs from dividing by one minus the rate at the starting income", () => {
    // At a 40,000 income the rate is 10%, so the naive answer for 60,000 net is 66,667, which is too low.
    expect(grossForNet(60_000, rate)).toBeGreaterThan(60_000 / (1 - rate(40_000)));
  });
  it("matches the simple division under a flat tax", () => {
    expect(grossForNet(70_000, () => 0.3)).toBeCloseTo(100_000, 4);
  });
  it("returns 0 for no wanted net or a tax that takes everything", () => {
    expect(grossForNet(0, rate)).toBe(0);
    expect(grossForNet(1000, () => 1)).toBe(0);
  });
});
