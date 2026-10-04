import { describe, expect, it } from "vitest";
import { CITIES } from "../cities";
import { CITY_FIELD_STATES, locationLabel } from "./locationLabel";

describe("resident location label", () => {
  it("is blank for states without a city or county selector", () => {
    for (const state of ["fl", "tx", "wa", "or", "ca"]) expect(locationLabel(state, "")).toBe("");
    expect(locationLabel("fl", "nyc-ny")).toBe("");
  });
  it("names the selected city, the New York remainder, or an unlisted location", () => {
    const nyc = CITIES.find(city => city.id === "nyc-ny");
    expect(nyc).toBeDefined();
    expect(locationLabel("ny", "nyc-ny")).toBe(nyc!.name);
    expect(locationLabel("ny", "ny-outside-nyc-yonkers")).toBe("Outside NYC and Yonkers");
    for (const state of CITY_FIELD_STATES) expect(locationLabel(state, "not-a-city")).toBe("Outside listed cities");
  });
});
