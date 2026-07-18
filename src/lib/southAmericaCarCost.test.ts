import { describe, expect, it } from "vitest";
import { calculateSouthAmericaCarCost } from "./southAmericaCarCost";

describe("South America monthly car cost", () => {
  it("updates the result when the user changes the monthly car cost", () => {
    const convert = (value: number) => value * 0.2;
    expect(calculateSouthAmericaCarCost("yes", "350", "destination-local", convert)).toBe(70);
    expect(calculateSouthAmericaCarCost("yes", "600", "destination-local", convert)).toBe(120);
  });

  it("keeps version 2 USD car values in USD", () => {
    expect(calculateSouthAmericaCarCost("yes", "350", "usd", (value) => value / 3920)).toBe(350);
  });

  it("does not add a car cost when no car is needed", () => {
    expect(calculateSouthAmericaCarCost("no", "600", "usd", (value) => value)).toBe(0);
  });
});
