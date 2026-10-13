import { describe, expect, it } from "vitest";
import { buildFireLink, parseFireLink, type FireMoveLink } from "./fireLink";

const move: FireMoveLink = {
  income: 120000, state: "ny", filing: "single", k401Pct: 8, expenses: 5200,
  movedIncome: 130000, movedState: "nc", movedCityId: "raleigh-nc", movedExpenses: 3900, movedCost: 7000,
};

const params = (link: string) => new URL(link, "https://example.com").searchParams;

describe("fireLink", () => {
  it("round-trips a move", () => {
    const link = buildFireLink(move);
    expect(link.startsWith("/fire-calculator?")).toBe(true);
    expect(parseFireLink(params(link))).toEqual(move);
  });

  it("writes the figures as plain whole numbers", () => {
    const p = params(buildFireLink({ ...move, income: 120000.4, movedCost: 6999.6 }));
    expect(p.get("income")).toBe("120000");
    expect(p.get("movedCost")).toBe("7000");
    expect(p.get("movedCity")).toBe("raleigh-nc");
  });

  it("ignores links that are not flagged as a move", () => {
    const p = params(buildFireLink(move));
    p.delete("move");
    expect(parseFireLink(p)).toBeNull();
  });

  it.each([
    ["income", "-5"],
    ["income", "abc"],
    ["income", "0"],
    ["expenses", ""],
    ["movedCost", "1e12"],
    ["k401", "75"],
    ["state", "zz"],
    ["filing", "head"],
    ["movedCity", "dallas-tx"],
    ["movedCity", "nope"],
  ])("rejects a bad %s of %s", (key, value) => {
    const p = params(buildFireLink(move));
    p.set(key, value);
    expect(parseFireLink(p)).toBeNull();
  });

  it("rejects a link with a missing figure", () => {
    const p = params(buildFireLink(move));
    p.delete("movedExpenses");
    expect(parseFireLink(p)).toBeNull();
  });
});
