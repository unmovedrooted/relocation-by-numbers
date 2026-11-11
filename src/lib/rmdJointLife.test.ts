import { describe, expect, it } from "vitest";
import { TABLE_II_MAX_OWNER_AGE, TABLE_II_MIN_OWNER_AGE, TABLE_II_MIN_SPOUSE_AGE, jointLifeDivisor } from "./rmdJointLife";
import { UNIFORM } from "./retirementPlan/rules";

describe("jointLifeDivisor (IRS Publication 590-B Table II)", () => {
  it("returns published values for owner and spouse ages", () => {
    expect(jointLifeDivisor(73, 62)).toBe(27.2);
    expect(jointLifeDivisor(73, 50)).toBe(36.8);
    expect(jointLifeDivisor(75, 60)).toBe(28.3);
    expect(jointLifeDivisor(80, 65)).toBe(23.8);
    expect(jointLifeDivisor(90, 70)).toBe(19.1);
    expect(jointLifeDivisor(72, 20)).toBe(65.1);
    expect(jointLifeDivisor(100, 80)).toBe(11.5);
  });

  it("does not apply unless the spouse is at least 11 years younger, or outside the table", () => {
    expect(jointLifeDivisor(73, 63)).toBeNull(); // 10 years: depends on birth dates
    expect(jointLifeDivisor(73, 70)).toBeNull();
    expect(jointLifeDivisor(71, 50)).toBeNull();
    expect(jointLifeDivisor(101, 80)).toBeNull();
    expect(jointLifeDivisor(75, 19)).toBeNull();
  });

  it("is never lower than the Uniform Lifetime Table period for the same owner age, and falls as the spouse gets older", () => {
    for (let owner = TABLE_II_MIN_OWNER_AGE; owner <= TABLE_II_MAX_OWNER_AGE; owner++) {
      let prev = Infinity;
      for (let spouse = TABLE_II_MIN_SPOUSE_AGE; spouse <= owner - 11; spouse++) {
        const v = jointLifeDivisor(owner, spouse);
        expect(v, `${owner}/${spouse}`).not.toBeNull();
        expect(v!, `${owner}/${spouse} vs uniform`).toBeGreaterThanOrEqual(UNIFORM[owner]);
        expect(v!, `${owner}/${spouse} falls with spouse age`).toBeLessThanOrEqual(prev + 1e-9);
        prev = v!;
      }
    }
  });
});
