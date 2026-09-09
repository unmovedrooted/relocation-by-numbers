import { describe, expect, it } from "vitest";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { initialContributionEditor } from "./previewContributions";

function fixture() {
  const accounts = initialAccountEditor();
  accounts.accounts = [newAccountDraft("plan", "401k")];
  const saving = initialContributionEditor();
  saving.amounts.plan = "6000.1250";
  saving.owners.one = { verified: true, employeeLimit: "24500", additionsLimit: "72000", compensationCap: "360000",
    matchEnabled: true, matchRate: "50", matchThrough: "6", destination: "plan" };
  const values: Record<string, string> = { ...PREVIEW_DEFAULTS, endYear: "2027", "one-salary": "100000", "one-retirement": "2027-01-01", inflation: "0" };
  return { accounts, saving, values };
}
describe("preview contribution controls contract", () => {
  it("preserves the exact default projection with zero contributions", () => {
    expect(calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor(), initialContributionEditor())).toEqual(calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor()));
  });
  it("maps decimal employee inputs and match percentages without mutating strings", () => {
    const { accounts, saving, values } = fixture(); const before = JSON.stringify(saving);
    const input = buildPreviewInput(values, accounts, saving);
    expect(input.contributions[0]).toMatchObject({ annualAmount: 6000.125, annualGrowth: 0, taxTreatment: "pretax-401k" });
    const r = calculatePreview(values, accounts, saving);
    expect(r.years[0].result.cash.contributions).toBe(6000.125);
    expect(r.years[0].result.employerContributions).toBe(3000);
    expect(r.years[1].result.cash.contributions).toBe(0);
    expect(r.years[1].result.employerContributions).toBe(0);
    expect(JSON.stringify(saving)).toBe(before);
  });
  it("prorates retirement-year compensation once and preserves fixed nominal limits", () => {
    const { accounts, saving, values } = fixture();
    values["one-retirement"] = "2026-07-01";
    values.spending = "0";
    const r = calculatePreview(values, accounts, saving);
    expect(r.years[0].result.cash.contributions).toBeCloseTo(6000.125 * 181 / 365, 7);
    expect(r.years[0].result.employerContributions).toBeCloseTo(3000 * 181 / 365, 7);
  });
  it("caps saving proportionally across traditional and Roth plans and sends match to pretax", () => {
    const { accounts, saving, values } = fixture();
    const roth = newAccountDraft("roth", "roth-401k"); roth.fields.firstYear = "2020"; accounts.accounts.push(roth);
    saving.amounts = { plan: "20000", roth: "20000" };
    const r = calculatePreview(values, accounts, saving);
    expect(r.years[0].contributions.map(item => item.eligible)).toEqual([12250, 12250]);
    expect(r.years[0].result.employerContributions).toBe(3000);
    expect(r.years[0].result.nextState.accounts.find(item => item.id === "roth")).toMatchObject({ contributionBasis: 12250 });
  });
  it("reflects each editable saving, limit and match value in the assembled contract", () => {
    const { accounts, saving, values } = fixture();
    saving.amounts.plan = "10000"; saving.owners.one.employeeLimit = "8000";
    saving.owners.one.additionsLimit = "8500"; saving.owners.one.compensationCap = "90000";
    saving.owners.one.matchRate = "100"; saving.owners.one.matchThrough = "2";
    const r = calculatePreview(values, accounts, saving);
    expect(r.years[0].result.cash.contributions).toBe(8000);
    expect(r.years[0].result.employerMatches[0]).toMatchObject({ formulaMatch: 1800, employerMatch: 500 });
  });
  it("ignores removed, non-plan and inactive-owner drafts", () => {
    const { accounts, saving, values } = fixture();
    accounts.accounts[0].ownerId = "two";
    saving.amounts.deleted = "NaN";
    expect(buildPreviewInput(values, accounts, saving).contributions).toEqual([]);
    accounts.accounts[0] = newAccountDraft("plan", "traditional-ira");
    expect(buildPreviewInput(values, accounts, saving).contributions).toEqual([]);
  });
  it("requires new-owner verification after reassignment and retains inactive values", () => {
    const { accounts, saving, values } = fixture(); accounts.accounts[0].ownerId = "two";
    expect(() => buildPreviewInput({ ...values, household: "married" }, accounts, saving)).toThrow(/Person 2/);
    expect(saving.amounts.plan).toBe("6000.1250");
  });
  it.each(["", "-1", "NaN", "Infinity"])("rejects invalid active numeric strings %s", raw => {
    const { accounts, saving, values } = fixture(); saving.amounts.plan = raw;
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/annual employee/);
  });
  it("requires verification and valid matching destination, but ignores disabled match drafts", () => {
    const { accounts, saving, values } = fixture(); saving.owners.one.verified = false;
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/confirm/);
    saving.owners.one.verified = true; saving.owners.one.destination = "missing";
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/same-owner/);
    saving.owners.one.matchEnabled = false; saving.owners.one.matchRate = "";
    expect(calculatePreview(values, accounts, saving).years[0].result.employerContributions).toBe(0);
  });
  it("reset drafts have no saving and no guessed contribution limits", () => {
    const reset = initialContributionEditor();
    expect(reset.amounts).toEqual({}); expect(reset.owners.one.employeeLimit).toBe("");
    expect(reset.owners.one.verified).toBe(false); expect(reset.owners.one.matchEnabled).toBe(false);
  });
});
