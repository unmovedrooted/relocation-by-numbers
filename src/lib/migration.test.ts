import { describe, expect, it } from "vitest";
import { migrationPair, topDestinations } from "./migration";
import { findCity } from "./cities";
import { ALLOWED_COMPARE_ROUTES } from "./seo-allowlists";

describe("IRS state-to-state migration", () => {
  it("matches the IRS 2022-23 file for California to Texas", () => {
    // IRS SOI stateoutflow2223.csv row 06,48: 44,417 returns, 82,481 exemptions, AGI 4,764,727 (thousands).
    const m = migrationPair("ca", "tx")!;
    expect(m.households).toBe(44_417);
    expect(m.people).toBe(82_481);
    expect(m.averageAgi).toBe(Math.round((4_764_727 * 1000) / 44_417));
    expect(m.trend).toEqual([36_103, 42_892, 52_816, 54_136, 44_417]);
    expect(m.reverseHouseholds).toBe(24_970);
    expect(m.netToDestination).toBe(44_417 - 24_970);
    expect(m.peakYear).toBe("2021-22");
  });
  it("ranks destinations and lists the most common ones", () => {
    expect(migrationPair("ca", "tx")!.destinationRank).toBe(1);
    const top = topDestinations("ca", 3);
    expect(top[0].state).toBe("tx");
    expect(top[0].households).toBeGreaterThan(top[2].households);
  });
  it("has data for every published pair and none for a state with itself", () => {
    for (const { from, to } of ALLOWED_COMPARE_ROUTES) {
      expect(migrationPair(findCity(from)!.state, findCity(to)!.state), `${from}/${to}`).not.toBeNull();
    }
    expect(migrationPair("tx", "tx")).toBeNull();
  });
});
