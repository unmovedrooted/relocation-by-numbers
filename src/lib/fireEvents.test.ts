import { describe, expect, it } from "vitest";
import { describeEvent, eventCashAt, eventTarget, usableEvents, type LifeEvent } from "./fireEvents";

const ev = (e: Partial<LifeEvent> & Pick<LifeEvent, "kind" | "startAge" | "amount">): LifeEvent => ({ id: "x", label: "", endAge: 0, ...e });

describe("eventCashAt", () => {
  const events = [
    ev({ kind: "one-time", startAge: 40, amount: 60_000 }),
    ev({ kind: "spending", startAge: 45, endAge: 48, amount: 1_500 }),
    ev({ kind: "income", startAge: 67, amount: 24_000 }),
  ];

  it("charges a one-time cost only in its year", () => {
    expect(eventCashAt(events, 39)).toBe(0);
    expect(eventCashAt(events, 40)).toBe(-60_000);
    expect(eventCashAt(events, 41)).toBe(0);
  });

  it("applies a temporary spending change through its end age", () => {
    expect(eventCashAt(events, 44)).toBe(0);
    expect(eventCashAt(events, 45)).toBe(-18_000);
    expect(eventCashAt(events, 48)).toBe(-18_000);
    expect(eventCashAt(events, 49)).toBe(0);
  });

  it("applies lasting income from its start age onward", () => {
    expect(eventCashAt(events, 66)).toBe(0);
    expect(eventCashAt(events, 67)).toBe(24_000);
    expect(eventCashAt(events, 95)).toBe(24_000);
  });

  it("nets events in the same year", () => {
    expect(eventCashAt([...events, ev({ kind: "income", startAge: 45, endAge: 46, amount: 10_000 })], 45)).toBe(-8_000);
  });
});

describe("eventTarget", () => {
  it("is zero without events", () => {
    expect(eventTarget([], 50)).toEqual({ perpetual: 0, bridge: 0 });
    expect(eventTarget(undefined, 50)).toEqual({ perpetual: 0, bridge: 0 });
  });

  it("lasting income lowers what the portfolio must cover, with a bridge for the years before it starts", () => {
    // Social Security of 24,000 a year from 67, FIRE at 60: the lasting need falls by 24,000, and ages 60 to 66 (7 years) are not yet covered.
    const t = eventTarget([ev({ kind: "income", startAge: 67, amount: 24_000 })], 60);
    expect(t.perpetual).toBe(-24_000);
    expect(t.bridge).toBe(7 * 24_000);
  });

  it("needs no bridge when the lasting income has already started", () => {
    expect(eventTarget([ev({ kind: "income", startAge: 67, amount: 24_000 })], 70)).toEqual({ perpetual: -24_000, bridge: 0 });
  });

  it("temporary spending after FIRE is a lump sum, and nothing once it has passed", () => {
    const college = [ev({ kind: "spending", startAge: 52, endAge: 55, amount: 2_000 })];
    // FIRE at 50: four years at 24,000.
    expect(eventTarget(college, 50)).toEqual({ perpetual: 0, bridge: 96_000 });
    // FIRE at 54: ages 54 and 55 remain.
    expect(eventTarget(college, 54)).toEqual({ perpetual: 0, bridge: 48_000 });
    expect(eventTarget(college, 56)).toEqual({ perpetual: 0, bridge: 0 });
  });

  it("a one-time cost counts only if it is still ahead", () => {
    const roof = [ev({ kind: "one-time", startAge: 58, amount: 30_000 })];
    expect(eventTarget(roof, 55).bridge).toBe(30_000);
    expect(eventTarget(roof, 59).bridge).toBe(0);
  });

  it("a lasting spending cut that starts later is offset by the years before it", () => {
    // Mortgage paid off at 60: spending falls 1,500 a month for good. FIRE at 55 still pays it for ages 55 to 59 (5 years).
    const t = eventTarget([ev({ kind: "spending", startAge: 60, amount: -1_500 })], 55);
    expect(t.perpetual).toBe(-18_000);
    expect(t.bridge).toBe(5 * 18_000);
  });

  it("combines events", () => {
    const t = eventTarget(
      [ev({ kind: "income", startAge: 67, amount: 24_000 }), ev({ kind: "spending", startAge: 52, endAge: 53, amount: 1_000 }), ev({ kind: "one-time", startAge: 51, amount: 10_000 })],
      50,
    );
    expect(t.perpetual).toBe(-24_000);
    // 17 years before Social Security (50 to 66) at 24,000, plus two years at 12,000, plus 10,000.
    expect(t.bridge).toBe(17 * 24_000 + 24_000 + 10_000);
  });
});

describe("usableEvents and descriptions", () => {
  it("ignores rows that are not filled in or end before they start", () => {
    const rows = [ev({ kind: "spending", startAge: 50, amount: 0 }), ev({ kind: "income", startAge: 0, amount: 5_000 }), ev({ kind: "spending", startAge: 50, endAge: 45, amount: 500 }), ev({ kind: "one-time", startAge: 40, amount: 1_000 })];
    expect(usableEvents(rows)).toHaveLength(1);
  });

  it("describes each kind", () => {
    expect(describeEvent(ev({ kind: "one-time", startAge: 40, amount: 60_000, label: "Down payment" }))).toBe("Down payment: $60,000 at age 40");
    expect(describeEvent(ev({ kind: "spending", startAge: 45, endAge: 48, amount: 1_500 }))).toBe("Spending change: +$1,500 a month of spending, ages 45 to 48");
    expect(describeEvent(ev({ kind: "income", startAge: 67, amount: 24_000, label: "Social Security" }))).toBe("Social Security: +$24,000 a year of take-home income, from age 67");
  });
});
