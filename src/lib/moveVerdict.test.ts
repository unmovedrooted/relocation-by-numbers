import { describe, expect, it } from "vitest";
import { withUpfrontFunding, type MoveVerdict } from "./moveVerdict";

const ready: MoveVerdict = { label: "Financially ready", tone: "good", note: "Monthly room is healthy." };

describe("withUpfrontFunding", () => {
  it("leaves the verdict alone when savings cover the upfront costs", () => {
    expect(withUpfrontFunding(ready, 0)).toBe(ready);
    expect(withUpfrontFunding(ready, 5_000)).toBe(ready);
  });
  it("does not call the move ready when savings fall short", () => {
    const v = withUpfrontFunding(ready, -13_455);
    expect(v.label).toBe("Monthly budget works; upfront funding needed");
    expect(v.tone).toBe("caution");
    expect(v.note).toContain("Monthly room is healthy.");
  });
  it("keeps a risk verdict a risk and says both parts fall short", () => {
    const v = withUpfrontFunding({ label: "Not ready yet", tone: "risk", note: "Too little room." }, -1);
    expect(v.tone).toBe("risk");
    expect(v.label).toContain("both fall short");
  });
  it("passes through the add-income state", () => {
    const n: MoveVerdict = { label: "Add income", tone: "neutral", note: "" };
    expect(withUpfrontFunding(n, -1)).toBe(n);
  });
});
