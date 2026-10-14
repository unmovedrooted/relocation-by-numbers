/**
 * Ireland: income tax, Universal Social Charge and employee PRSI for 2026, in euros.
 *
 * Revenue, "Tax rates, bands and reliefs" (https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx),
 * read 2026-10-14: standard rate band EUR 44,000 for a single person and EUR 53,000 for a married couple with one income (20%,
 * then 40%); credits: single person EUR 2,000, married or civil partners EUR 4,000, employee (PAYE) EUR 2,000, age credit
 * EUR 245 single or EUR 490 married.
 * USC (https://www.revenue.ie/en/jobs-and-pensions/usc/standard-rates-thresholds.aspx, read 2026-10-14): 0.5% on the first
 * EUR 12,012, 2% on the next EUR 16,688, 3% on the next EUR 41,344, 8% above; no USC if income is EUR 13,000 or less.
 * Reduced USC (age 70+ or a full medical card, income up to EUR 60,000): 0.5% to EUR 12,012 then 2%; not applied here.
 * PRSI: employee Class A 4.2% rising to 4.35% from 1 October 2026, with no PRSI at EUR 352 a week or less. This comes from the
 * Law Society and payroll-firm summaries of the gov.ie rates (the gov.ie page itself returned 403), not a primary page. The
 * 4.35% rate is used. The sliding PRSI credit for weekly pay of EUR 352 to EUR 424 is not modeled.
 *
 * Retirees pay income tax and USC on pensions but no PRSI. The remote scenario (foreign employer) pays no Irish PRSI.
 * A married couple is modeled as one earner. Not modeled: second-earner band increase, the home carer, rent and medical
 * credits, pension relief, and the self-employed USC surcharge and PRSI.
 */
export const IRELAND_TAX_YEAR_LABEL = "2026";
export const IRELAND_PRSI_RATE = 0.0435;

const USC_BANDS = [
  { upTo: 12_012, rate: 0.005 }, { upTo: 28_700, rate: 0.02 }, { upTo: 70_044, rate: 0.03 }, { upTo: Infinity, rate: 0.08 },
] as const;

export function irelandUsc(income: number): number {
  if (income <= 13_000) return 0;
  let usc = 0;
  let previous = 0;
  for (const b of USC_BANDS) {
    if (income <= previous) break;
    usc += (Math.min(income, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return usc;
}

export function irelandTax(
  income: number, filing: "single" | "married", scenario: "local" | "remote" | "retired",
): { incomeTax: number; usc: number; prsi: number } {
  const gross = Math.max(0, income);
  const band = filing === "married" ? 53_000 : 44_000;
  const grossTax = 0.2 * Math.min(gross, band) + 0.4 * Math.max(0, gross - band);
  const credits = (filing === "married" ? 4_000 : 2_000)
    + (scenario === "retired" ? 0 : 2_000)
    + (scenario === "retired" ? (filing === "married" ? 490 : 245) : 0);
  const prsi = scenario === "local" && gross > 352 * 52 ? IRELAND_PRSI_RATE * gross : 0;
  return { incomeTax: Math.max(0, grossTax - credits), usc: irelandUsc(gross), prsi };
}
