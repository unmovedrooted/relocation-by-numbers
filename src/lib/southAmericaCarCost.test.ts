import { describe, expect, it } from "vitest";
import { calculateSouthAmericaCarCost } from "./southAmericaCarCost";

describe("South America monthly car cost", () => {
  it("updates the result when the user changes the monthly car cost", () => {
    const convert = (value: number) => value * 0.2;
    expect(calculateSouthAmericaCarCost("yes", "350", convert)).toBe(70);
    expect(calculateSouthAmericaCarCost("yes", "600", convert)).toBe(120);
  });

  it("does not add a car cost when no car is needed", () => {
    expect(calculateSouthAmericaCarCost("no", "600", (value) => value)).toBe(0);
  });
});
