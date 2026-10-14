/**
 * South Korea: income tax, local income tax and employee social insurance for 2026, in won.
 *
 * Employment income tax credit from the National Tax Service
 * (https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6596, read 2026-10-14): 55% of tax up to KRW 1.3 million, KRW 715,000
 * plus 30% of the excess above that; capped at KRW 740,000 up to pay of 33 million, then falling by 0.8% of the excess to a floor
 * of 660,000 at 70 million, then by half of the excess to 500,000 at 120 million and 200,000 beyond. Tax scale (income tax act
 * article 55, from tax summaries): 6% to KRW 14 million of taxable income, 15% to 50 million, 24% to 88 million, 35% to 150
 * million, 38% to 300 million, 40% to 500 million, 42% to 1 billion, 45% above. Local income tax is 10% of the determined tax.
 * Employment income deduction (article 47, from summaries): 70% of pay to KRW 5 million; 3.5 million + 40% of the excess to 15
 * million; 7.5 million + 15% to 45 million; 12 million + 5% to 100 million; 14.75 million + 2% above; at most KRW 20 million.
 * Basic deduction KRW 1.5 million; standard tax credit KRW 130,000 for employees (not re-read).
 * Employee social insurance for 2026 (from summaries of the insurers' rates): pension 4.75% of pay up to a monthly base of KRW
 * 6,370,000 (cap not re-read), health 3.595%, long-term care 13.14% of the health premium, employment 0.9%; all deducted from the base.
 * Pension income deduction for retirees (standard table, not re-read): 100% to KRW 3.5 million; 3.5 million + 40% to 7 million;
 * 4.9 million + 20% to 14 million; 6.3 million + 10% above, at most KRW 9 million.
 *
 * Retirees are shown without insurance premiums and remote workers paid abroad without Korean insurance. Not modeled: dependants,
 * card spending, insurance, medical, education and housing deductions, and any 2026 change to the pension insurance cap.
 */
export const SOUTH_KOREA_TAX_YEAR_LABEL = "2026";

function employmentDeduction(pay: number): number {
  const d = pay <= 5_000_000 ? 0.7 * pay
    : pay <= 15_000_000 ? 3_500_000 + 0.4 * (pay - 5_000_000)
    : pay <= 45_000_000 ? 7_500_000 + 0.15 * (pay - 15_000_000)
    : pay <= 100_000_000 ? 12_000_000 + 0.05 * (pay - 45_000_000)
    : 14_750_000 + 0.02 * (pay - 100_000_000);
  return Math.min(d, 20_000_000);
}

function pensionDeduction(pension: number): number {
  const d = pension <= 3_500_000 ? pension
    : pension <= 7_000_000 ? 3_500_000 + 0.4 * (pension - 3_500_000)
    : pension <= 14_000_000 ? 4_900_000 + 0.2 * (pension - 7_000_000)
    : 6_300_000 + 0.1 * (pension - 14_000_000);
  return Math.min(d, 9_000_000);
}

export function koreaScaleTax(taxable: number): number {
  const t = Math.max(0, taxable);
  return 0.06 * Math.min(t, 14_000_000) + 0.15 * Math.max(0, Math.min(t, 50_000_000) - 14_000_000)
    + 0.24 * Math.max(0, Math.min(t, 88_000_000) - 50_000_000) + 0.35 * Math.max(0, Math.min(t, 150_000_000) - 88_000_000)
    + 0.38 * Math.max(0, Math.min(t, 300_000_000) - 150_000_000) + 0.40 * Math.max(0, Math.min(t, 500_000_000) - 300_000_000)
    + 0.42 * Math.max(0, Math.min(t, 1_000_000_000) - 500_000_000) + 0.45 * Math.max(0, t - 1_000_000_000);
}

export function koreaEmploymentCredit(tax: number, pay: number): number {
  const base = tax <= 1_300_000 ? 0.55 * tax : 715_000 + 0.3 * (tax - 1_300_000);
  const limit = pay <= 33_000_000 ? 740_000
    : pay <= 70_000_000 ? Math.max(660_000, 740_000 - (pay - 33_000_000) * 0.008)
    : pay <= 120_000_000 ? Math.max(500_000, 660_000 - (pay - 70_000_000) / 2)
    : Math.max(200_000, 500_000 - (pay - 120_000_000) / 2);
  return Math.min(base, limit);
}

export function southKoreaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; localTax: number; insurance: number } {
  const g = Math.max(0, income);
  const retired = scenario === "retired";
  const health = scenario === "local" ? 0.03595 * g : 0;
  const insurance = scenario === "local"
    ? 0.0475 * Math.min(g, 6_370_000 * 12) + health + 0.1314 * health + 0.009 * g
    : 0;
  const net = retired ? g - pensionDeduction(g) : g - employmentDeduction(g);
  const taxable = Math.max(0, net - 1_500_000 - insurance);
  const scale = koreaScaleTax(taxable);
  const credits = retired ? 0 : koreaEmploymentCredit(scale, g) + 130_000;
  const determined = Math.max(0, scale - credits);
  return { incomeTax: determined, localTax: 0.1 * determined, insurance };
}
