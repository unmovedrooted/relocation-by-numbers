import { describe, expect, it } from "vitest";
import { buildMortgageLink, parseMortgageLink } from "./mortgageLink";

const sample = {
  state: "tx",
  homePrice: 607_200,
  downPct: 20,
  ratePct: 6.5,
  termYears: 30,
  propertyTaxPct: 1.44,
  insuranceMonthly: 150,
  hoaMonthly: 0,
  grossIncome: 150_000,
  monthlyRent: 1_670,
  place: "Austin, TX",
};

describe("mortgage handoff link", () => {
  it("round-trips a relocation result", () => {
    const link = buildMortgageLink(sample);
    expect(link.startsWith("/mortgage-calculator?src=move&")).toBe(true);
    expect(parseMortgageLink(new URLSearchParams(link.split("?")[1]))).toEqual(sample);
  });

  it("is not a handoff without the marker", () => {
    expect(parseMortgageLink(new URLSearchParams("price=500000&down=20"))).toBeNull();
  });

  it("drops values that are missing, not numbers or out of range", () => {
    const parsed = parseMortgageLink(new URLSearchParams("src=move&price=abc&down=140&rate=-1&term=27&tax=55&income=0&rent=1200&state=TEXAS"))!;
    expect(parsed).toEqual({ monthlyRent: 1200 });
  });

  it("leaves out fields the relocation result does not have", () => {
    const link = buildMortgageLink({ state: "nc", homePrice: 454_300, grossIncome: Number.NaN });
    const qs = new URLSearchParams(link.split("?")[1]);
    expect([...qs.keys()].sort()).toEqual(["price", "src", "state"]);
  });

  it("strips markup from the place label", () => {
    const parsed = parseMortgageLink(new URLSearchParams({ src: "move", place: "<img src=x onerror=alert(1)>Austin" }))!;
    expect(parsed.place).toBe("img srcx onerroralert1Austin");
  });
});
