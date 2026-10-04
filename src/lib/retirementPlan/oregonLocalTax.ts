import type { FilingStatus } from "../tax";

export type OregonLocalContract = Readonly<{
  metro: "resident" | "outside-no-source";
  multnomah: "resident" | "outside-no-source";
  adjustments: "none-confirmed";
}>;

export function validateOregonLocalContract(value: OregonLocalContract | undefined) {
  if (!value || !["resident", "outside-no-source"].includes(value.metro)
    || !["resident", "outside-no-source"].includes(value.multnomah)
    || value.adjustments !== "none-confirmed") {
    throw new RangeError("Confirm both Oregon local jurisdictions and the no-special-adjustments assumptions. Unknown, part-year and nonresident sourced-income cases are unsupported.");
  }
  return value;
}

/** Full-year residents, no special local modifications or other-jurisdiction credits.
 * Sources reviewed 2026-10-04:
 * https://www.portland.gov/revenue/personal-tax (2026/2027 SHS thresholds)
 * https://multco.us/info/multnomah-county-preschool-all-personal-income-tax
 * https://www.portland.gov/revenue/2025met40-instructions (Oregon taxable-income base)
 * Future SHS thresholds are held at published 2027 values through 2030, not forecast.
 * SHS sunsets after 2030; no extension assumed:
 * https://www.oregonmetro.gov/what-metro-does/housing-and-homelessness/supportive-housing-services/funding
 * Retains cents for planning; not a rounded tax-return worksheet.
 */
export function oregonLocalTax(year: number, filing: FilingStatus, taxableIncome: number, contract: OregonLocalContract | undefined) {
  const selected = validateOregonLocalContract(contract);
  if (!Number.isInteger(year) || year < 2026 || year > 2126) throw new RangeError("Unsupported Oregon local tax year.");
  if (filing !== "single" && filing !== "married") throw new RangeError("Unsupported Oregon local filing status.");
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0) throw new RangeError("Invalid Oregon local taxable income.");
  const joint = filing === "married";
  const shsThreshold = year === 2026 ? (joint ? 205000 : 128000) : (joint ? 211000 : 132000);
  const shs = selected.metro === "resident" && year <= 2030 ? Math.max(0, taxableIncome - shsThreshold) * .01 : 0;
  const pfa = selected.multnomah === "resident"
    ? Math.max(0, taxableIncome - (joint ? 200000 : 125000)) * (year >= 2028 ? .023 : .015)
      + Math.max(0, taxableIncome - (joint ? 400000 : 250000)) * .015
    : 0;
  return { shs, pfa, localTax: shs + pfa };
}
