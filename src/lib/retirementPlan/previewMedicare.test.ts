import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { initialMedicareEditor, medicareMonths, requiredMedicareHistory } from "./previewMedicare";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor } from "./previewAccounts";
import { initialContributionEditor } from "./previewContributions";

function fixture() {
  const medicare = initialMedicareEditor();
  medicare.enabled = true; medicare.confirmed = true; medicare.surchargeGrowth = "0.0000";
  medicare.owners.one = { partB: true, partD: true, partBStart: "2026-07", partDStart: "2026-10" };
  medicare.history = { 2024: { magi: "110000.1250", filing: "single" }, 2025: { magi: "0", filing: "single" } };
  const values = { ...PREVIEW_DEFAULTS, endYear: "2028", inflation: "0" };
  return { medicare, values };
}
describe("Medicare preview controls contract", () => {
  it("leaves all existing default results unchanged while disabled", () => {
    expect(calculatePreview(PREVIEW_DEFAULTS, undefined, undefined, initialMedicareEditor())).toEqual(calculatePreview(PREVIEW_DEFAULTS));
  });
  it.each([["2025-12", 12], ["2026-01", 12], ["2026-07", 6], ["2026-12", 1], ["2027-01", 0]])("counts covered months from %s inclusively", (start, months) => {
    expect(medicareMonths(2026, start)).toBe(months);
  });
  it.each(["", "2026-00", "2026-13", "2026-1", "2026-01-01", "1899-01", "2127-01"])("rejects malformed enrollment %j", start => {
    expect(() => medicareMonths(2026, start)).toThrow(/valid Medicare/);
  });
  it("maps raw values, monthly enrollment and income history without mutating drafts", () => {
    const { medicare, values } = fixture(); const before = JSON.stringify(medicare);
    const input = buildPreviewInput(values, undefined, undefined, medicare);
    expect(input.irmaa?.annualSurchargeGrowth).toBe(0);
    expect(input.irmaa?.historicalIncome[0]).toEqual({ taxYear: 2024, filing: "single", magi: 110000.125 });
    expect(input.irmaa?.enrollmentByYear[2026]).toEqual([{ ownerId: "one", partBMonths: 6, partDMonths: 3 }]);
    expect(input.irmaa?.enrollmentByYear[2027][0]).toMatchObject({ partBMonths: 12, partDMonths: 12 });
    expect(JSON.stringify(medicare)).toBe(before);
  });
  it("rejects invalid projection years", () => {
    for (const year of [NaN, 2026.5, 2025, 2127]) expect(() => medicareMonths(year, "2026-01")).toThrow(/projection year/);
  });
  it("adds surcharges once to spending without adding base premiums or changing income-tax formulas", () => {
    const { medicare, values } = fixture();
    const result = calculatePreview(values, undefined, undefined, medicare);
    const baseline = calculatePreview(values);
    expect(result.years[0].irmaaSurcharges).toBeCloseTo(81.2 * 6 + 14.5 * 3, 8);
    expect(result.years[0].spending).toBeCloseTo(50000 + 530.7, 8);
    expect(result.years[0].result.tax.total).toBe(baseline.years[0].result.tax.total);
    expect(result.years[1].irmaaSurcharges).toBe(0);
    expect(result.years[2].irmaa[0].magi).toBe(result.years[0].irmaaMagi);
    expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 1e-6)).toBe(true);
  });
  it("requests only historical years actually needed and follows a changed horizon", () => {
    const { medicare } = fixture();
    expect(requiredMedicareHistory(2026, 2028, false, medicare)).toEqual([2024, 2025]);
    expect(requiredMedicareHistory(2026, 2026, false, medicare)).toEqual([2024]);
    medicare.owners.one.partBStart = "2027-01"; medicare.owners.one.partD = false;
    expect(requiredMedicareHistory(2026, 2028, false, medicare)).toEqual([2025]);
    medicare.owners.one.partBStart = "2028-01";
    expect(requiredMedicareHistory(2026, 2028, false, medicare)).toEqual([]);
    expect(requiredMedicareHistory(2028, 2030, false, medicare)).toEqual([2026, 2027]);
  });
  it("uses projected history for later enrollment, ignoring irrelevant historical drafts", () => {
    const { medicare, values } = fixture();
    medicare.owners.one = { partB: true, partD: false, partBStart: "2028-01", partDStart: "bad" };
    medicare.history = { 2024: { magi: "bad", filing: "" } };
    const result = calculatePreview(values, undefined, undefined, medicare);
    expect(result.years[0].irmaa).toEqual([]); expect(result.years[2].irmaa[0].incomeYear).toBe(2026);
  });
  it("requires confirmation, explicit growth, coverage and needed history", () => {
    const { medicare, values } = fixture(); medicare.confirmed = false;
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/Confirm/);
    medicare.confirmed = true; medicare.surchargeGrowth = "";
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/growth/);
    medicare.surchargeGrowth = "0"; medicare.history[2024].magi = "";
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/2024/);
    medicare.history[2024].magi = "0"; medicare.history[2024].filing = "";
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/filing/);
    medicare.owners.one.partB = false; medicare.owners.one.partD = false;
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/at least one/);
  });
  it("accepts actual zero/negative MAGI while rejecting nonfinite amounts and growth", () => {
    const { medicare, values } = fixture(); medicare.history[2024].magi = "-1000.2500";
    expect(calculatePreview(values, undefined, undefined, medicare).years[0].irmaaSurcharges).toBe(0);
    for (const raw of ["NaN", "Infinity", "1000000000001"]) {
      medicare.history[2024].magi = raw;
      expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/MAGI/);
    }
    for (const raw of ["-1", "21", "NaN", "Infinity"]) {
      medicare.surchargeGrowth = raw;
      expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/growth/);
    }
  });
  it("does not infer coverage from age or validate hidden spouse data", () => {
    const { medicare, values } = fixture(); medicare.owners.two = { partB: true, partD: true, partBStart: "invalid", partDStart: "invalid" };
    expect(buildPreviewInput(values, undefined, undefined, medicare).irmaa?.enrollmentByYear[2026]).toHaveLength(1);
    expect(() => buildPreviewInput({ ...values, household: "married" }, undefined, undefined, medicare)).toThrow(/start month/);
    medicare.owners.one.partBStart = "1960-01";
    expect(() => buildPreviewInput(values, undefined, undefined, medicare)).toThrow(/birth month/);
  });
  it("requires shared joint historical returns and charges enrolled spouses independently", () => {
    const { medicare, values } = fixture(); const joint = { ...values, household: "married" };
    medicare.owners.two = { partB: true, partD: false, partBStart: "2026-01", partDStart: "" };
    expect(() => buildPreviewInput(joint, undefined, undefined, medicare)).toThrow(/shared joint/);
    medicare.history = { 2024: { magi: "250000", filing: "married" }, 2025: { magi: "0", filing: "married" } };
    const row = calculatePreview(joint, undefined, undefined, medicare).years[0];
    expect(row.irmaa).toHaveLength(2);
    expect(row.irmaaSurcharges).toBeCloseTo(530.7 + 81.2 * 12, 8);
  });
  it("composes with the IRA adapter while preserving deductions and cash reconciliation", () => {
    const { medicare, values } = fixture(); const saving = initialContributionEditor();
    saving.ira!.amounts["one-ira"] = "1000";
    saving.ira!.owners.one = { coverage: "no", deduction: "deduct-eligible", confirmed: true };
    const result = calculatePreview(values, initialAccountEditor(), saving, medicare);
    expect(result.years[0].result.tax.iraDeduction).toBe(1000);
    expect(result.years[0].irmaaSurcharges).toBeCloseTo(530.7, 8);
    expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 1e-6)).toBe(true);
  });
  it("disabled and reset drafts restore the exact baseline without using retained history", () => {
    const { medicare, values } = fixture(); medicare.enabled = false; medicare.surchargeGrowth = "bad";
    expect(calculatePreview(values, undefined, undefined, medicare)).toEqual(calculatePreview(values));
    expect(initialMedicareEditor()).toMatchObject({ enabled: false, confirmed: false, surchargeGrowth: "", history: {} });
  });
});
describe("Medicare UI contracts", () => {
  const editor = readFileSync("src/components/RetirementMedicareEditor.tsx", "utf8");
  const results = readFileSync("src/components/RetirementMedicareResults.tsx", "utf8");
  it("uses associated labels, stable IDs and raw numeric fields", () => {
    for (const id of ["medicare-enabled", "medicare-confirmed"]) {
      expect(editor).toContain(`id="${id}"`); expect(editor).toContain(`htmlFor="${id}"`);
    }
    expect(editor).toContain('id="medicare-surcharge-growth"');
    expect(editor).toContain('id={`medicare-magi-${year}`}');
    expect(editor).toContain('htmlFor={`medicare-${id}-${part}-start`}');
    expect(editor).toContain('onChange={magi => change({ magi })}');
    expect(editor).toContain('required min={-1e12} max={1e12} step="any"');
  });
  it("separates surcharges from base costs in an accessible contained table", () => {
    expect(results).toContain('aria-label="Annual Medicare surcharge results"'); expect(results).toContain('tabIndex={0}');
    expect(results).toContain('max-w-full overflow-x-auto'); expect(results).toContain('scope="col"');
    expect(results).toContain('already included'); expect(results).toContain('refresh Medicare results');
  });
});
