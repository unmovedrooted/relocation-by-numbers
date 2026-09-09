import type { TimelineInput } from "./timeline";
import type { MedicareEnrollment, IrmaaTaxRecord } from "./irmaa";

export type MedicareOwnerDraft = { partB: boolean; partD: boolean; partBStart: string; partDStart: string };
export type MedicareEditorState = { enabled: boolean; confirmed: boolean; surchargeGrowth: string;
  owners: Record<"one" | "two", MedicareOwnerDraft>;
  history: Record<string, { magi: string; filing: "" | "single" | "married" }> };
export function initialMedicareEditor(): MedicareEditorState {
  const owner = (): MedicareOwnerDraft => ({ partB: false, partD: false, partBStart: "", partDStart: "" });
  return { enabled: false, confirmed: false, surchargeGrowth: "", owners: { one: owner(), two: owner() }, history: {} };
}
/** The first covered month is inclusive; coverage continues through the horizon. */
export function medicareMonths(year: number, start: string) {
  if (!Number.isInteger(year) || year < 2026 || year > 2126) throw new RangeError("Medicare projection year must be 2026–2126.");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(start) || Number(start.slice(0, 4)) < 1900 || Number(start.slice(0, 4)) > 2126) throw new RangeError("Enter a valid Medicare start month (YYYY-MM), 1900–2126.");
  const startYear = Number(start.slice(0, 4));
  return year < startYear ? 0 : year > startYear ? 12 : 13 - Number(start.slice(5));
}
/** Only pre-projection income needed by an enrolled year is requested in the UI. */
export function requiredMedicareHistory(startYear: number, endYear: number, married: boolean, editor: MedicareEditorState) {
  if (!editor.enabled || !Number.isInteger(startYear) || !Number.isInteger(endYear)) return [];
  const owners = married ? [editor.owners.one, editor.owners.two] : [editor.owners.one];
  const required: number[] = [];
  for (let year = startYear; year <= Math.min(startYear + 1, endYear); year++) {
    if (owners.some(owner => (["partB", "partD"] as const).some(part => {
      if (!owner[part]) return false;
      try { return medicareMonths(year, owner[`${part}Start`]) > 0; } catch { return false; }
    }))) required.push(year - 2);
  }
  return required;
}
export function addPreviewMedicare(input: TimelineInput, editor: MedicareEditorState): TimelineInput {
  if (!editor.enabled) return input;
  if (!editor.confirmed) throw new RangeError("Confirm the Medicare budget, coverage and historical-return assumptions.");
  const rawGrowth = editor.surchargeGrowth;
  if (!rawGrowth.trim() || !Number.isFinite(Number(rawGrowth)) || Number(rawGrowth) < 0 || Number(rawGrowth) > 20) throw new RangeError("Enter Medicare surcharge growth from 0 to 20 percent; use 0 for no growth.");
  const enrollmentByYear: Record<number, MedicareEnrollment[]> = {};
  let anyPart = false;
  for (const person of input.people) {
    const owner = editor.owners[person.id as "one" | "two"];
    for (const part of ["partB", "partD"] as const) {
      if (!owner[part]) continue;
      anyPart = true;
      medicareMonths(input.startYear, owner[`${part}Start`]);
      if (owner[`${part}Start`] < person.birthDate.slice(0, 7)) throw new RangeError("Medicare coverage cannot begin before the person's birth month.");
    }
    for (let year = input.startYear; year <= input.endYear; year++) {
      const partBMonths = owner.partB ? medicareMonths(year, owner.partBStart) : 0;
      const partDMonths = owner.partD ? medicareMonths(year, owner.partDStart) : 0;
      if (partBMonths + partDMonths > 0) (enrollmentByYear[year] ??= []).push({ ownerId: person.id, partBMonths, partDMonths });
    }
  }
  if (!anyPart) throw new RangeError("Choose Part B and/or Part D coverage for at least one person, or disable IRMAA.");
  const historicalIncome: IrmaaTaxRecord[] = requiredMedicareHistory(input.startYear, input.endYear, input.filing === "married", editor).map(taxYear => {
    const record = editor.history[taxYear];
    if (!record || !record.magi.trim() || !Number.isFinite(Number(record.magi)) || Math.abs(Number(record.magi)) > 1e12) throw new RangeError(`Enter ${taxYear} historical IRMAA MAGI; missing income is never treated as zero.`);
    if (!["single", "married"].includes(record.filing)) throw new RangeError(`Choose the ${taxYear} tax-return filing status.`);
    if (input.filing === "married" && record.filing !== "married") throw new RangeError("Joint preview scenarios require a shared joint historical return; separate prior returns are not supported.");
    return { taxYear, filing: record.filing as "single" | "married", magi: Number(record.magi) };
  });
  return { ...input, irmaa: { budgetTreatment: "surcharges-outside-spending", annualSurchargeGrowth: Number(rawGrowth) / 100, historicalIncome, enrollmentByYear } };
}
