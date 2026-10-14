/**
 * Uruguay: personal income tax (IRPF) on employment income for 2026 and the employee's BPS contributions, in pesos.
 *
 * Banco de Prevision Social (BPS) Comunicado R 5/2026, values and IRPF scales for 2026
 * (https://www.bps.gub.uy/23860/2026---comunicado-r-5---valores-escalas-irpf-2026.html, read through search extracts 2026-10-14): the
 * base for benefits and contributions (BPC) is UYU 6,864 from January 2026, and the monthly scale is 0% to 7 BPC (UYU 48,048); 10% to
 * 10 BPC; 15% to 15 BPC; 24% to 30 BPC; 25% to 50 BPC; 27% to 75 BPC; 31% to 115 BPC; 36% above.
 * Employee contributions (from payroll summaries, not re-read): retirement 15% of pay, health (FONASA) 3% up to 2.5 BPC and 4.5% above for
 * a worker with no dependants, and the FRL fund 0.125%. They are deducted from the IRPF base and earn a tax credit of 14% of the
 * deducted amount at monthly pay up to 15 BPC and 8% above (a single summary; verify before relying on it).
 *
 * Uruguay taxes only Uruguay-source income, so remote workers paid from abroad and retirees on foreign pensions are shown as paying
 * nothing. Not modeled: dependants' deductions, the aguinaldo and vacation pay in the base, the 15% cap on contributions at a
 * monthly ceiling that one source mentions (UYU 288,836), and the tax holiday for new residents.
 * The old code compared peso income with USD-sized thresholds and gave retirees a flat 6%.
 */
export const URUGUAY_TAX_YEAR_LABEL = "2026";
const BPC = 6_864;
const BANDS = [
  { upTo: 7 * BPC, rate: 0 }, { upTo: 10 * BPC, rate: 0.10 }, { upTo: 15 * BPC, rate: 0.15 }, { upTo: 30 * BPC, rate: 0.24 },
  { upTo: 50 * BPC, rate: 0.25 }, { upTo: 75 * BPC, rate: 0.27 }, { upTo: 115 * BPC, rate: 0.31 }, { upTo: Infinity, rate: 0.36 },
] as const;

export function uruguayTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  if (scenario !== "local") return { incomeTax: 0, contributions: 0 };
  const monthly = Math.max(0, income) / 12;
  const fonasa = 0.03 * Math.min(monthly, 2.5 * BPC) + 0.045 * Math.max(0, monthly - 2.5 * BPC);
  const contributions = 0.15 * monthly + fonasa + 0.00125 * monthly;
  const base = monthly - contributions;
  let tax = 0;
  let previous = 0;
  for (const b of BANDS) {
    if (base <= previous) break;
    tax += (Math.min(base, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  const credit = (monthly <= 15 * BPC ? 0.14 : 0.08) * contributions;
  return { incomeTax: 12 * Math.max(0, tax - credit), contributions: 12 * contributions };
}
