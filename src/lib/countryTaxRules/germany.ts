/**
 * Germany: income tax (Einkommensteuer), solidarity surcharge and employee social insurance for 2026, in euros.
 *
 * Tariff 2026, section 32a(1) EStG (https://www.gesetze-im-internet.de/estg/__32a.html, read 2026-10-14), taxable income x rounded
 * down to whole euros, y = (x - 12,348) / 10,000 and z = (x - 17,799) / 10,000:
 *   to 12,348: 0;  12,349 to 17,799: (914.51 y + 1,400) y;  17,800 to 69,878: (173.10 z + 2,397) z + 1,034.87;
 *   69,879 to 277,825: 0.42 x - 11,135.63;  from 277,826: 0.45 x - 19,470.38.  The result is rounded down. Spouses assessed jointly:
 *   twice the tax on half the joint income (section 32a(5)).
 * Solidarity surcharge 5.5% of income tax above the exemption limit of EUR 20,350 (EUR 40,700 jointly), with a phase-in of
 * 11.9% of the excess (section 4 SolzG): https://www.gesetze-im-internet.de/solzg_1995/BJNR097500993.html
 * Social insurance 2026 (BMAS Sozialversicherungsrechengroessen-Verordnung 2026; Bundesregierung): contribution ceilings EUR 101,400
 * for pension and unemployment insurance and EUR 69,750 for health and long-term care insurance. Employee shares: pension 9.3%,
 * unemployment 1.3%, health 7.3% plus half of the 2.9% average additional contribution (1.45%), long-term care 1.8%
 * (childless people over 22 pay 0.6 points more; not applied).
 *
 * Deductions used: the employee flat allowance EUR 1,230 and special-expense allowance EUR 36 (EUR 72 jointly), and the employee's
 * pension, health and care contributions as pension and basic insurance expenses; unemployment insurance is not deducted
 * because the 1,900 euro cap on other insurance expenses is used up by health insurance. These deductions and the pensioner contribution
 * rates (health 8.75%, care 3.6%) are standard rules not re-read this session.
 *
 * Not modeled: church tax (separate question), child allowances and Kindergeld, the share of a pension that is taxable (it depends
 * on the retirement year; 100% is used), the 13th salary, and the midi-job and low-income reductions.
 */
export const GERMANY_TAX_YEAR_LABEL = "2026";

export function germanyIncomeTaxSingle(taxable: number): number {
  const x = Math.floor(Math.max(0, taxable));
  if (x <= 12_348) return 0;
  if (x <= 17_799) {
    const y = (x - 12_348) / 10_000;
    return Math.floor((914.51 * y + 1_400) * y);
  }
  if (x <= 69_878) {
    const z = (x - 17_799) / 10_000;
    return Math.floor((173.10 * z + 2_397) * z + 1_034.87);
  }
  if (x <= 277_825) return Math.floor(0.42 * x - 11_135.63);
  return Math.floor(0.45 * x - 19_470.38);
}

export function germanyIncomeTax(taxable: number, married: boolean): number {
  return married ? 2 * germanyIncomeTaxSingle(Math.floor(taxable / 2)) : germanyIncomeTaxSingle(taxable);
}

export function germanySolidarity(tax: number, married: boolean): number {
  const limit = married ? 40_700 : 20_350;
  if (tax <= limit) return 0;
  return Math.min(0.055 * tax, 0.119 * (tax - limit));
}

export type GermanyScenario = "local" | "remote" | "retired";

export function germanyTax(income: number, opts: { scenario: GermanyScenario; married: boolean }): { incomeTax: number; solidarity: number; socialInsurance: number } {
  const gross = Math.max(0, income);
  const employee = opts.scenario === "local";
  const retired = opts.scenario === "retired";
  const pension = employee ? 0.093 * Math.min(gross, 101_400) : 0;
  const unemployment = employee ? 0.013 * Math.min(gross, 101_400) : 0;
  const health = employee ? 0.0875 * Math.min(gross, 69_750) : retired ? 0.0875 * Math.min(gross, 69_750) : 0;
  const care = employee ? 0.018 * Math.min(gross, 69_750) : retired ? 0.036 * Math.min(gross, 69_750) : 0;
  const allowances = (employee || opts.scenario === "remote" ? 1_230 : 0) + (opts.married ? 72 : 36);
  const taxable = Math.max(0, gross - allowances - pension - health - care);
  const incomeTax = germanyIncomeTax(taxable, opts.married);
  return { incomeTax, solidarity: germanySolidarity(incomeTax, opts.married), socialInsurance: pension + unemployment + health + care };
}
