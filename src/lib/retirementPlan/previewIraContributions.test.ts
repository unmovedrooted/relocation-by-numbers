import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { initialContributionEditor } from "./previewContributions";
import { initialIraContributionEditor, previewIraRows } from "./previewIraContributions";

function fixture() {
  const accounts = initialAccountEditor();
  const ira = initialIraContributionEditor();
  ira.amounts["one-ira"] = "6000.1250";
  ira.owners.one = { coverage: "no", deduction: "deduct-eligible", confirmed: true };
  const saving = { ...initialContributionEditor(), ira };
  const values = { ...PREVIEW_DEFAULTS, endYear: "2027", "one-salary": "100000", spending: "20000" };
  return { accounts, saving, values };
}
describe("IRA preview adapter", () => {
  it("keeps the default projection identical until IRA amounts are entered", () => {
    expect(calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor(), initialContributionEditor())).toEqual(calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor()));
  });
  it("preserves raw decimal strings while mapping annual requests and policies", () => {
    const { accounts, saving, values } = fixture(); const before = JSON.stringify({ accounts, saving, values });
    const input = buildPreviewInput(values, accounts, saving);
    expect(input.contributions[0]).toMatchObject({ accountId: "one-ira", annualAmount: 6000.125, annualGrowth: 0, taxTreatment: "after-tax" });
    expect(input.iraPoliciesByYear?.[2027][0]).toMatchObject({ coveredByWorkplacePlan: false, spouseCoveredByWorkplacePlan: false,
      deductionChoice: "deduct-eligible", allocation: "traditional-first" });
    const row = previewIraRows(calculatePreview(values, accounts, saving))[0];
    expect(row).toMatchObject({ requested: 6000.125, eligible: 6000.125, traditionalFunded: 6000.125, deduction: 6000.125,
      traditionalBasisAdded: 0, rothFunded: 0, rothBasisAdded: 0 });
    expect(JSON.stringify({ accounts, saving, values })).toBe(before);
  });
  it("separates a nondeductible election from contribution eligibility and basis", () => {
    const { accounts, saving, values } = fixture(); saving.ira.owners.one.deduction = "nondeductible";
    const row = previewIraRows(calculatePreview(values, accounts, saving))[0];
    expect(row.traditionalFunded).toBe(6000.125); expect(row.deduction).toBe(0); expect(row.traditionalBasisAdded).toBe(6000.125);
  });
  it("allocates traditional first then Roth without exceeding combined room", () => {
    const { accounts, saving, values } = fixture(); accounts.accounts.push(newAccountDraft("roth", "roth-ira"));
    saving.ira.amounts = { "one-ira": "6000", roth: "6000" };
    const row = previewIraRows(calculatePreview(values, accounts, saving))[0];
    expect(row).toMatchObject({ requested: 12000, eligible: 8600, traditionalFunded: 6000, rothFunded: 2600,
      deduction: 6000, traditionalBasisAdded: 0, rothBasisAdded: 2600 });
  });
  it("supports Roth-only eligibility without asking for a traditional deduction election", () => {
    const { accounts, saving, values } = fixture(); accounts.accounts = [newAccountDraft("roth", "roth-ira")];
    saving.ira.amounts = { roth: "9000" }; saving.ira.owners.one.deduction = "";
    const row = previewIraRows(calculatePreview({ ...values, "one-salary": "160500" }, accounts, saving))[0];
    expect(row.rothFunded).toBe(4300); expect(row.deduction).toBe(0); expect(row.rothBasisAdded).toBe(4300);
  });
  it("requires explicit coverage, deduction and confirmation for active IRA requests", () => {
    const { accounts, saving, values } = fixture();
    saving.ira.owners.one.coverage = "";
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/coverage/);
    saving.ira.owners.one.coverage = "no"; saving.ira.owners.one.confirmed = false;
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/confirm/);
    saving.ira.owners.one.confirmed = true; saving.ira.owners.one.deduction = "";
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/deduction/);
  });
  it("requires spouse coverage and stops interpreting it as active after retirement", () => {
    const { accounts, saving, values } = fixture();
    const joint = { ...values, household: "married", "two-retirement": "2027-01-01" };
    expect(() => buildPreviewInput(joint, accounts, saving)).toThrow(/Person 2/);
    saving.ira.owners.two.coverage = "yes";
    const input = buildPreviewInput(joint, accounts, saving);
    expect(input.iraPoliciesByYear?.[2026][0].spouseCoveredByWorkplacePlan).toBe(true);
    expect(input.iraPoliciesByYear?.[2027][0].spouseCoveredByWorkplacePlan).toBe(false);
    joint["two-retirement"] = "2027-07-01";
    expect(buildPreviewInput(joint, accounts, saving).iraPoliciesByYear?.[2027][0].spouseCoveredByWorkplacePlan).toBe(true);
  });
  it("keeps workplace amounts isolated when an account type changes", () => {
    const { accounts, saving, values } = fixture(); saving.ira.amounts = {};
    saving.amounts["one-ira"] = "6000";
    expect(buildPreviewInput(values, accounts, saving).contributions).toEqual([]);
    saving.ira.amounts["one-ira"] = "6000"; saving.amounts = {};
    accounts.accounts[0].kind = "401k";
    expect(buildPreviewInput(values, accounts, saving).contributions).toEqual([]);
  });
  it("ignores deleted accounts, inactive people and irrelevant owner choices", () => {
    const { accounts, saving, values } = fixture(); saving.ira.amounts.deleted = "NaN";
    saving.ira.owners.two.deduction = "";
    expect(buildPreviewInput(values, accounts, saving).contributions).toHaveLength(1);
    accounts.accounts[0].ownerId = "two";
    expect(buildPreviewInput(values, accounts, saving).contributions).toEqual([]);
    expect(() => buildPreviewInput({ ...values, household: "married" }, accounts, saving)).toThrow(/Person 2/);
  });
  it.each(["", "-1", "Infinity", "NaN", "1000000001"])("rejects invalid/cleared active input %j without replacing it with zero", raw => {
    const { accounts, saving, values } = fixture(); saving.ira.amounts["one-ira"] = raw;
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/annual IRA/);
  });
  it("blocks multiple active same-type IRA accounts instead of silently merging them", () => {
    const { accounts, saving, values } = fixture(); accounts.accounts.push(newAccountDraft("extra", "traditional-ira"));
    saving.ira.amounts.extra = "1000";
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/one traditional IRA/);
    saving.ira.amounts.extra = "0";
    expect(buildPreviewInput(values, accounts, saving).contributions).toHaveLength(1);
  });
  it("rejects contradictory workplace coverage while preserving regular matching", () => {
    const { accounts, saving, values } = fixture(); accounts.accounts.push(newAccountDraft("plan", "401k"));
    saving.amounts.plan = "6000";
    saving.owners.one = { verified: true, employeeLimit: "24500", additionsLimit: "72000", compensationCap: "360000",
      matchEnabled: true, matchRate: "50", matchThrough: "6", destination: "plan" };
    expect(() => buildPreviewInput(values, accounts, saving)).toThrow(/conflict/);
    saving.ira.owners.one.coverage = "yes";
    const result = calculatePreview(values, accounts, saving);
    expect(result.years[0].result.employerContributions).toBe(3000);
    expect(result.years[0].result.tax.pretaxDeferrals).toBe(6000);
    expect(previewIraRows(result)[0].deduction).toBe(0); // $94k IRA MAGI exceeds the covered single band.
  });
  it("preserves retirement proration and fails safely for unsupported contributing-year income", () => {
    const { accounts, saving, values } = fixture();
    const result = calculatePreview({ ...values, "one-retirement": "2026-07-01" }, accounts, saving);
    expect(previewIraRows(result)[0].requested).toBeCloseTo(6000.125 * 181 / 365, 8);
    expect(previewIraRows(result)[1].traditionalFunded).toBe(0);
    expect(() => calculatePreview({ ...values, "one-benefitStart": "2026-01-01" }, accounts, saving)).toThrow(/wages\/pensions/);
  });
  it("reset removes all IRA drafts and does not enable Medicare", () => {
    const state = initialContributionEditor();
    expect(state.ira?.amounts).toEqual({}); expect(state.ira?.owners.one).toEqual({ coverage: "", deduction: "", confirmed: false });
    expect(buildPreviewInput(PREVIEW_DEFAULTS, initialAccountEditor(), state).irmaa).toBeUndefined();
  });
});

describe("IRA UI wiring", () => {
  const component = readFileSync("src/components/RetirementIraContributionEditor.tsx", "utf8");
  const results = readFileSync("src/components/RetirementIraContributionResults.tsx", "utf8");
  it("uses raw-string shared fields with explicit IDs, constraints and help", () => {
    expect(component).toContain('id={`ira-saving-${account.id}-annual`}');
    expect(component).toContain('value={value.amounts[account.id] ?? "0"}');
    expect(component).toContain('[account.id]: raw');
    expect(component).toContain('required min={0} max={1e9} step="any"');
    for (const key of ["coverage", "deduction", "confirmed"]) {
      expect(component).toContain(`htmlFor={\`ira-saving-\${id}-${key}\`}`);
      expect(component).toContain(`id={\`ira-saving-\${id}-${key}\`}`);
    }
    expect(component).toContain('aria-describedby="plan-ira-supported"');
  });
  it("contains the results in a keyboard-focusable scroll region with explicit stale-state text", () => {
    expect(results).toContain('aria-label="Annual IRA results"'); expect(results).toContain('tabIndex={0}');
    expect(results).toContain('max-w-full overflow-x-auto'); expect(results).toContain('scope="col"');
    expect(results).toContain('run the projection to refresh IRA results');
    expect(results).toContain('not the ending basis balance');
  });
});
