import { describe, expect, it } from "vitest";
import { decodeScenario, encodeScenario, MAX_FRAGMENT_LENGTH } from "./shareState";
import { PREVIEW_DEFAULTS, buildPreviewInput } from "./preview";
import { initialAccountEditor } from "./previewAccounts";
import { initialContributionEditor } from "./previewContributions";
import { initialMedicareEditor } from "./previewMedicare";
import { initialConversionEditor } from "./previewConversions";

const scenario = () => ({
  values: { ...PREVIEW_DEFAULTS, spending: "61234", state: "ca", caContract: "confirmed" },
  accounts: initialAccountEditor(),
  saving: initialContributionEditor(),
  medicare: initialMedicareEditor(),
  conversions: initialConversionEditor(),
});

describe("retirement plan share links", () => {
  it("round-trips a full scenario exactly", () => {
    const original = scenario();
    const decoded = decodeScenario(encodeScenario(original))!;
    expect(decoded.values).toEqual(original.values);
    expect(decoded.accounts).toEqual(JSON.parse(JSON.stringify(original.accounts)));
    expect(decoded.saving).toEqual(JSON.parse(JSON.stringify(original.saving)));
    expect(decoded.medicare).toEqual(JSON.parse(JSON.stringify(original.medicare)));
    expect(decoded.conversions).toEqual(JSON.parse(JSON.stringify(original.conversions)));
  });

  it("restores inputs the planner accepts", () => {
    const decoded = decodeScenario(encodeScenario(scenario()))!;
    const input = buildPreviewInput(decoded.values, decoded.accounts as never, decoded.saving as never, decoded.medicare as never);
    expect(input.spendingAnnual).toBe(61234);
    expect(input.state).toBe("ca");
  });

  it("keeps non-ASCII text intact and uses only URL-safe characters", () => {
    const s = scenario();
    s.values["note"] = "café — ü \u{1F600}";
    const fragment = encodeScenario(s);
    expect(fragment).toMatch(/^#s=[A-Za-z0-9_-]+$/);
    expect(decodeScenario(fragment)!.values.note).toBe(s.values["note"]);
  });

  it.each([
    ["", "an empty fragment"],
    ["#", "a bare hash"],
    ["#s=", "an empty payload"],
    ["#s=!!!notbase64", "damaged base64"],
    ["#x=abc", "a different prefix"],
    ["#s=" + btoa("not json"), "text that is not JSON"],
    ["#s=" + btoa(JSON.stringify({ v: 2, values: {} })), "an unknown version"],
    ["#s=" + btoa(JSON.stringify({ v: 1, values: { a: 1 }, accounts: {}, saving: {}, medicare: {}, conversions: {} })), "a non-string value"],
    ["#s=" + btoa(JSON.stringify({ v: 1, values: {}, accounts: [], saving: {}, medicare: {}, conversions: {} })), "an editor state that is not an object"],
    ["#s=" + btoa(JSON.stringify({ v: 1, values: {}, saving: {}, medicare: {}, conversions: {} })), "a missing editor state"],
  ])("rejects %s (%s)", (fragment) => {
    expect(decodeScenario(fragment)).toBeNull();
  });

  it("rejects an oversized fragment", () => {
    expect(decodeScenario("#s=" + "A".repeat(MAX_FRAGMENT_LENGTH))).toBeNull();
  });
});
