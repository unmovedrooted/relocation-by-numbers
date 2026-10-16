/**
 * Switzerland: federal direct tax for 2026, plus a benchmark cantonal and municipal rate and the employee's AHV/ALV contributions, in francs.
 *
 * Federal tax scale from the Federal Tax Administration's Form 58c for 2026 (the PDF at
 * https://www.ur.ch/_docn/439286/Berechnung_dBSt_der_nat%C3%BCrlichen_Personen_2026.pdf, read 2026-10-14; the bands were reconstructed
 * from the table's rows and each reconstructed band reproduces the table's tax amounts at the sampled incomes):
 *   single: 0.77% from CHF 15,200; 0.88% from 33,200; 2.64% from 43,500; 2.97% from 58,000; 5.94% from 76,200; 6.60% from 82,100;
 *           8.80% from 108,900; 11.00% from 141,500; 13.20% from 185,100; and 11.5% of the whole income from about 793,300;
 *   married and single parents: 1% from 29,700; 2% from 53,400; 3% from 61,300; 4% from 79,100; 5% from 94,900; 6% from 108,700;
 *           7% from 120,600; 8% from 130,500; 9% from 138,400; 10% from 144,300; 11% from 148,300; 12% from 150,400; 13% from
 *           152,400; and 11.5% of the whole income from CHF 941,200.
 * The form's footnote reduces the tax by CHF 263 for each child (not modeled).
 *
 * AHV/IV/EO 5.3% of pay with no ceiling and ALV 1.1% up to CHF 148,200, from payroll summaries of the 2026 rates. They are deducted
 * from taxable income here, together with the professional-expense allowance (3% of pay, between CHF 2,000 and 4,000) and the
 * insurance-premium allowance (CHF 1,800 single, 3,700 married; the allowance figures are standard federal values, not re-read).
 * Cantonal and municipal tax is a flat 13% of taxable income, a Zurich-like benchmark. Actual rates run from about 8% (Zug) to
 * 22% (Geneva) of taxable income.
 *
 * Not modeled: pillar-2 pension contributions (savings, but deductible), pillar 3a, accident insurance, health-insurance premiums
 * (CHF 3,500 to 6,000 a year, a cost rather than a tax), church tax, wealth tax and the lump-sum taxation of foreigners.
 */
export const SWITZERLAND_TAX_YEAR_LABEL = "2026";
export const SWITZERLAND_CANTONAL_BENCHMARK = 0.13;

const SINGLE = [
  [15_200, 0.0077], [33_200, 0.0088], [43_500, 0.0264], [58_000, 0.0297], [76_200, 0.0594], [82_100, 0.066],
  [108_900, 0.088], [141_500, 0.11], [185_100, 0.132],
] as const;
const MARRIED = [
  [29_700, 0.01], [53_400, 0.02], [61_300, 0.03], [79_100, 0.04], [94_900, 0.05], [108_700, 0.06], [120_600, 0.07],
  [130_500, 0.08], [138_400, 0.09], [144_300, 0.10], [148_300, 0.11], [150_400, 0.12], [152_400, 0.13],
] as const;

/** Federal tax as the official table gives it: taxable income truncated to whole CHF 100, tax truncated to CHF 0.05 (ESTV Form 58c). */
export function switzerlandFederalTax(taxable: number, filing: "single" | "married"): number {
  const t = Math.floor(Math.max(0, taxable) / 100) * 100;
  return Math.floor(switzerlandFederalTaxExact(t, filing) * 20 + 1e-9) / 20;
}

function switzerlandFederalTaxExact(t: number, filing: "single" | "married"): number {
  if (filing === "single" ? t >= 793_300 : t > 941_200) return 0.115 * t;
  const table = filing === "single" ? SINGLE : MARRIED;
  let tax = 0;
  for (let i = 0; i < table.length; i++) {
    const [from, rate] = table[i];
    const to = i + 1 < table.length ? table[i + 1][0] : Infinity;
    if (t > from) tax += (Math.min(t, to) - from) * rate;
  }
  return tax;
}

export function switzerlandTax(income: number, filing: "single" | "married", scenario: "local" | "remote" | "retired"): { federal: number; cantonal: number; contributions: number } {
  const g = Math.max(0, income);
  const contributions = scenario === "local" ? 0.053 * g + 0.011 * Math.min(g, 148_200) : 0;
  const professional = scenario === "retired" ? 0 : Math.min(g, Math.max(2_000, Math.min(4_000, 0.03 * g)));
  const insurance = filing === "married" ? 3_700 : 1_800;
  const taxable = Math.max(0, g - contributions - professional - insurance);
  return { federal: switzerlandFederalTax(taxable, filing), cantonal: SWITZERLAND_CANTONAL_BENCHMARK * taxable, contributions };
}
