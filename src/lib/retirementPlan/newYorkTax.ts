import type { HouseholdTaxInput } from "./householdTax";
import { pensionEligibilityDate } from "./pensionEligibilityDate";

/** Restricted full-year, standard-deduction, PRE-CREDIT planning estimate.
 * Enacted schedules reviewed 2026-09-09: TAX 601(a)/(c)(1)(B)(vii)-(ix),
 * with matching recapture under (d-5), (d-6), (d-7).
 * https://www.nysenate.gov/legislation/laws/TAX/601
 * Deductions, pension eligibility and NYC schedules:
 * https://www.tax.ny.gov/forms/current-forms/it/it201i.htm
 * IRA conversion exclusion: https://www.tax.ny.gov/pdf/memos/income/m98_7i.pdf
 * Continuous marginal schedules replace filing-table income buckets; small
 * rounding differences are intentional. No credits, itemization or NY additions.
 * Uses enacted law, not a prediction of future legislation. NY parameters
 * remain nominal; federal/spending growth assumptions do not index NY rules.
 */
export function newYorkTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.newYorkContract !== "enacted-law-precredit") throw new RangeError("Confirm the restricted New York planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported New York projection year.");
  if (!["nyc-ny", "ny-outside-nyc-yonkers"].includes(input.cityId ?? "")) throw new RangeError("Choose NYC or explicitly outside NYC and Yonkers; Yonkers is unsupported.");
  const eligible = new Map(input.people.map(person => [person.id, 0]));
  let government = 0;
  function ageDate(ownerId: string) {
    const person = input.people.find(person => person.id === ownerId);
    if (!person) throw new RangeError("Unknown New York income owner.");
    return pensionEligibilityDate(person.birthDate);
  }
  for (const item of input.income) {
    if (!item.amount) continue;
    if (item.kind === "tax-exempt-interest" || item.kind === "other") throw new RangeError("New York requires source-specific treatment for tax-exempt interest or other income; unsupported.");
    if (item.kind !== "pension") continue;
    if (item.pensionType === "ny-government" || item.pensionType === "federal-government") {
      government += item.amount;
    } else if (item.pensionType === "private" || item.pensionType === "other-government") {
      const date = ageDate(item.ownerId);
      if (item.pensionAfter59Half !== undefined && (!Number.isFinite(item.pensionAfter59Half)
        || item.pensionAfter59Half < 0 || item.pensionAfter59Half > item.amount)) throw new RangeError("Invalid pension payment-date allocation.");
      const birthdayYear = date > `${input.year}-01-01` && date <= `${input.year}-12-31`;
      if (birthdayYear && item.pensionAfter59Half === undefined) throw new RangeError("New York pension income in the year you turn 59½ needs payment-date allocation.");
      const qualifying = date <= `${input.year}-01-01` ? item.amount : birthdayYear ? item.pensionAfter59Half! : 0;
      eligible.set(item.ownerId, eligible.get(item.ownerId)! + qualifying);
    } else throw new RangeError("Specify each nonzero pension's type for New York.");
  }
  let attributed = 0;
  for (const item of input.retirementIncome ?? []) {
    if (!Number.isFinite(item.amount) || item.amount < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
      || !item.date.startsWith(`${input.year}-`) || !Number.isFinite(Date.parse(`${item.date}T00:00:00Z`))
      || new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) !== item.date) throw new RangeError("Invalid New York retirement income detail.");
    const eligibleDate = ageDate(item.ownerId);
    attributed += item.amount;
    if (!item.amount) continue;
    if (!["traditional-ira", "ira-conversion", "annuity"].includes(item.source)) throw new RangeError("New York workplace-plan and nonqualified Roth distributions require additional eligibility detail; unsupported.");
    // Personally purchased nonqualified annuities are taxable, not excluded.
    if (item.source !== "annuity" && item.date >= eligibleDate) eligible.set(item.ownerId, eligible.get(item.ownerId)! + item.amount);
  }
  if (Math.abs(attributed - input.accountIncome.retirementOrdinary) > 1e-5) throw new RangeError("New York requires reconciled owner-level retirement income.");
  const pensionExclusion = [...eligible.values()].reduce((sum, amount) => sum + Math.min(20000, amount), 0);
  const nyAgi = federalAgi - taxableBenefits - government - pensionExclusion;
  const taxable = Math.max(0, nyAgi - (input.filing === "married" ? 16050 : 8000));
  const married = input.filing === "married";
  const limits = married ? [17150,23600,27900,161550,323200,2155350,5000000,25000000,Infinity]
    : [8500,11700,13900,80650,215400,1077550,5000000,25000000,Infinity];
  const reduced = input.year >= 2027;
  const sunset = input.year >= 2033;
  const rates = reduced ? [.038,.043,.0505,.053,.058,.0685,.0965,.103,.109]
    : [.039,.044,.0515,.054,.059,.0685,.0965,.103,.109];
  if (sunset) {
    limits.splice(6, 3, Infinity);
    rates.splice(6, 3, .0882);
  }
  function marginal(amount: number, ceilings: number[], percentages: number[]) {
    let total = 0, floor = 0;
    for (let i = 0; i < ceilings.length; i++) {
      total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * percentages[i];
      floor = ceilings[i];
    }
    return total;
  }
  const base = marginal(taxable, limits, rates);
  let recapture = 0;
  if (!sunset && nyAgi > 25000000) recapture = taxable * .109 - base;
  else if (nyAgi > 107650) {
    const rows = married ? [[27900,161550,0,333,107650],[161550,323200,333,807,161550],
      [323200,2155350,1140,3071,323200],[2155350,5000000,4211,60350,2155350],[5000000,25000000,64561,32500,5000000]]
      : [[80650,215400,0,567,107650],[215400,1077550,567,2047,215400],
        [1077550,5000000,2614,30172,1077550],[5000000,25000000,32786,32500,5000000]];
    if (reduced) {
      if (married) {
        rows[1][3] = 808;
        rows[2][2] = 1141; rows[2][3] = 3393;
        rows[3][2] = 4534; rows[4][2] = 64884;
        if (sunset) rows.splice(3, 2, [2155350,Infinity,4534,42461,2155350]);
      } else {
        rows[0][3] = 568;
        rows[1][2] = 568; rows[1][3] = 2261;
        rows[2][2] = 2829; rows[3][2] = 33001;
        if (sunset) rows.splice(2, 2, [1077550,Infinity,2829,21228,1077550]);
      }
    }
    const row = rows.find(([low, high]) => taxable > low && taxable <= high);
    const fraction = (threshold: number) => Math.max(0, Math.min(1, (nyAgi - threshold) / 50000));
    recapture = row ? row[2] + row[3] * fraction(row[4])
      : Math.max(0, taxable * rates[married ? 3 : 4] - base) * fraction(107650);
  }
  const localTax = input.cityId === "nyc-ny" ? marginal(taxable,
    married ? [21600,45000,90000,Infinity] : [12000,25000,50000,Infinity], [.03078,.03762,.03819,.03876]) : 0;
  return { stateTax: base + recapture, localTax, nyAgi, pensionExclusion, governmentExclusion: government,
    warning: `New York/NYC pre-credit estimate: enacted ${sunset ? "2033 onward" : reduced ? "2027–2032" : "2026"} marginal schedules and recapture (law reviewed 2026-09-09), $8,000/$16,050 standard deduction and owner-specific pension exclusions. NY parameters are not inflation-indexed in this model. Future legislation is not predicted. Filing-table rounding, credits, itemization, NY additions/subtractions beyond SS and eligible pensions, Yonkers and cross-border income are excluded. Assumes own IRA funds contributed before retirement, qualifying periodic private pensions, fully exempt government pensions, and fully NY-taxable investment income. Not a tax return.` };
}
