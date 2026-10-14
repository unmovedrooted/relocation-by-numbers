/**
 * Norway: income tax, bracket tax and national-insurance contribution (trygdeavgift) for 2026, in kroner.
 *
 * Skatteetaten, "Forskuddsutskrivingen 2026" (https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/,
 * read 2026-10-14): bracket tax (trinnskatt) on personal income of 1.7% above NOK 226,100, 4.0% above 318,300, 13.7% above 725,050,
 * 16.8% above 980,100 and 17.8% above 1,467,200; personal allowance NOK 114,540; standard deduction (minstefradrag) 46% of wages up
 * to NOK 95,700 and 40% of pensions up to NOK 75,400; national insurance 7.6% on wages and 5.1% on pensions, from a lower limit of
 * NOK 99,650 and never more than 25% of income above it; ordinary income tax 22%. Pensioner tax credit of NOK 37,100, reduced by
 * 16.7% of pension above NOK 284,950 and a further 6% of pension above NOK 436,050 (the last part of the page, past 100,000
 * characters, was not read).
 *
 * The pensioner credit offsets income tax and bracket tax, not national insurance. Not modeled: the municipal differences in the
 * north (lower rates in Finnmark and northern Troms), the housing and travel deductions, the pension-savings deduction, and the
 * wealth tax.
 */
export const NORWAY_TAX_YEAR_LABEL = "2026";

export function norwayTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; nationalInsurance: number } {
  const g = Math.max(0, income);
  const retired = scenario === "retired";
  const standard = retired ? Math.min(0.40 * g, 75_400) : Math.min(0.46 * g, 95_700);
  const ordinary = 0.22 * Math.max(0, g - standard - 114_540);
  const bracket = 0.017 * Math.max(0, Math.min(g, 318_300) - 226_100)
    + 0.04 * Math.max(0, Math.min(g, 725_050) - 318_300)
    + 0.137 * Math.max(0, Math.min(g, 980_100) - 725_050)
    + 0.168 * Math.max(0, Math.min(g, 1_467_200) - 980_100)
    + 0.178 * Math.max(0, g - 1_467_200);
  const credit = retired ? Math.max(0, 37_100 - 0.167 * Math.max(0, g - 284_950) - 0.06 * Math.max(0, g - 436_050)) : 0;
  const nationalInsurance = g > 99_650 ? Math.min((retired ? 0.051 : 0.076) * g, 0.25 * (g - 99_650)) : 0;
  return { incomeTax: Math.max(0, ordinary + bracket - credit), nationalInsurance };
}
