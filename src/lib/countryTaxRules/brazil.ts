/**
 * Brazil: monthly IRPF for 2026 and the employee INSS contribution.
 *
 * Progressive table (unchanged from 2025) and the new reducer of Law 15.270 of 26 November 2025: Receita Federal,
 * "Tributacao de 2026" https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 and
 * https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm
 *   - monthly income up to R$ 5,000: the reducer cancels the tax
 *   - R$ 5,000.01 to R$ 7,350: reducer = 978.62 - 0.133145 x monthly taxable income
 *   - above R$ 7,350: no reducer
 * Simplified discount R$ 607.20 a month (the Receita's own R$ 6,000 example is a test below).
 * INSS employee table from January 2026 (Portaria Interministerial MPS/MF 13 of 2026-01-09): 7.5% to R$ 1,621.00,
 * 9% to 2,902.84, 12% to 4,354.27, 14% to the ceiling of R$ 8,475.55. https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
 * Read 2026-10-13.
 *
 * The calculation is monthly (annual income divided by 12); the 13th salary, the minimum tax on very high incomes
 * (above R$ 600,000 a year) and the extra exemption for pensioners aged 65 and over are not modeled.
 */
export const BRAZIL_TAX_YEAR_LABEL = "2026";

const MONTHLY_TABLE = [
  { upTo: 2_428.80, rate: 0, deduction: 0 },
  { upTo: 2_826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3_751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4_664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Infinity, rate: 0.275, deduction: 908.73 },
] as const;

const INSS = [
  { upTo: 1_621.00, rate: 0.075 },
  { upTo: 2_902.84, rate: 0.09 },
  { upTo: 4_354.27, rate: 0.12 },
  { upTo: 8_475.55, rate: 0.14 },
] as const;

export const BRAZIL_SIMPLIFIED_DISCOUNT = 607.20;

export function brazilMonthlyInss(salary: number): number {
  let total = 0;
  let previous = 0;
  for (const b of INSS) {
    if (salary <= previous) break;
    total += (Math.min(salary, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return total;
}

/** Table tax on a monthly taxable base, before the reducer. */
export function brazilMonthlyTableTax(base: number): number {
  const row = MONTHLY_TABLE.find((r) => base <= r.upTo) ?? MONTHLY_TABLE[MONTHLY_TABLE.length - 1];
  return Math.max(0, base * row.rate - row.deduction);
}

/** The Law 15.270 reducer for a month, from the monthly taxable income. */
export function brazilMonthlyReducer(monthlyIncome: number): number {
  if (monthlyIncome <= 5_000) return Infinity; // cancels the tax entirely
  if (monthlyIncome >= 7_350) return 0;
  return Math.max(0, 978.62 - 0.133145 * monthlyIncome);
}

/** Annual income tax and employee INSS in reais, from annual gross income paid evenly over 12 months. */
export function brazilTax(annualIncome: number, opts: { employee: boolean }): { incomeTax: number; inss: number } {
  const monthly = Math.max(0, annualIncome) / 12;
  const inss = opts.employee ? brazilMonthlyInss(monthly) : 0;
  const base = Math.max(0, monthly - Math.max(inss, BRAZIL_SIMPLIFIED_DISCOUNT));
  const reducer = brazilMonthlyReducer(monthly);
  const incomeTax = Math.max(0, brazilMonthlyTableTax(base) - reducer);
  return { incomeTax: incomeTax * 12, inss: inss * 12 };
}
