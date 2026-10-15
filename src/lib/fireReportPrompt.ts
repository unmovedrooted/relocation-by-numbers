// Builds the prompt for the personalized FIRE report. It lives outside the route file because Next.js route modules may only
// export HTTP handlers, and so it can be tested directly.

export type ReportInputs = {
  age: number;
  state: string;
  filingStatus: "single" | "married";
  fireAge: number | null;
  yearsToFI: number | null;
  expensesMonthly: number;
  withdrawalRatePct: number;
  withdrawalTaxRatePct: number;
  bal401k: number;
  balIra: number;
  balBrokerage: number;
  taxTreatment401k: "traditional" | "roth";
  taxTreatmentIra: "traditional" | "roth";
  netAnnual: number;
  currentPortfolio: number;
  savingsRatePct: number;
  income: number;
  targetRetirementAge?: number;
  mode?: "standard" | "lean" | "coast" | "barista";
  preset?: "chubby" | "fat";
  coastAge?: number;
  coastNumber?: number | null;
  coastReady?: boolean;
  yearsToCoast?: number | null;
  baristaPartTimeIncome?: number;
  volatility?: "conservative" | "moderate" | "aggressive";
  inflationPct?: number;
  advanced?: boolean;
  yearlyInvestment?: number;
  contrib401k?: number;
  contribIra?: number;
  contribBrokerage?: number;
};

const MODE_LABELS: Record<NonNullable<ReportInputs["mode"]>, string> = {
  standard: "Standard FIRE (spending covered entirely by the portfolio)",
  lean: "Lean FIRE (a reduced spending budget)",
  coast: "Coast FIRE (stop contributing at a set age and let the portfolio grow to a retirement target)",
  barista: "Barista FIRE (part-time income covers part of spending; the portfolio covers the gap)",
};

function money(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

/** The FIRE number depends on the calculator mode: Barista only needs to cover the gap left by part-time income. */
export function buildPrompt(inputs: ReportInputs): string {
  const mode = inputs.mode ?? "standard";
  const annualSpend = inputs.expensesMonthly * 12;
  const partTime = mode === "barista" ? inputs.baristaPartTimeIncome ?? 0 : 0;
  const fundedSpend = Math.max(0, annualSpend - partTime);
  const fireNumber = fundedSpend / (inputs.withdrawalRatePct / 100);
  const totalPortfolio = inputs.bal401k + inputs.balIra + inputs.balBrokerage || inputs.currentPortfolio;
  const alreadyFI = (inputs.yearsToFI ?? 1) <= 0;
  const yearsToMedicare = Math.max(0, 65 - (inputs.fireAge ?? inputs.age));
  const yearsToRMD = Math.max(0, 73 - (inputs.fireAge ?? inputs.age));

  const modeLines: string[] = [
    `- Calculator: ${MODE_LABELS[mode]}${inputs.preset ? `, ${inputs.preset} FIRE spending level` : ""}`,
  ];
  if (mode === "barista") {
    modeLines.push(
      `- Expected part-time income: ${money(partTime)}/yr after tax, counted as extra income from today and assumed to grow with inflation; the portfolio must cover ${money(fundedSpend)}/yr`,
    );
  }
  if (mode === "coast") {
    const parts = [`stop contributing at age ${inputs.coastAge ?? "unknown"}`, `retire at ${inputs.targetRetirementAge ?? "unknown"}`];
    if (inputs.coastNumber != null) parts.push(`needs ${money(inputs.coastNumber)} invested by the coast age`);
    modeLines.push(`- Coast plan: ${parts.join("; ")}`);
    modeLines.push(
      inputs.coastReady
        ? "- Already coast-ready: today's balance is enough to stop contributing"
        : inputs.yearsToCoast != null
          ? `- Not yet coast-ready; projected ${inputs.yearsToCoast} years to get there`
          : "- Not coast-ready and not projected to be before the retirement age",
    );
    modeLines.push("- The projected FIRE age below is for full FIRE if contributions continue, not the coast plan");
  }

  const assumptions: string[] = [];
  if (inputs.volatility) assumptions.push(`market-return preset: ${inputs.volatility}`);
  if (inputs.inflationPct != null) assumptions.push(`inflation ${inputs.inflationPct}%`);
  assumptions.push(
    inputs.advanced
      ? `yearly contributions: 401(k) ${money(inputs.contrib401k ?? 0)}, IRA ${money(inputs.contribIra ?? 0)}, taxable ${money(inputs.contribBrokerage ?? 0)}`
      : inputs.yearlyInvestment
        ? `yearly investment: ${money(inputs.yearlyInvestment)}`
        : "yearly investment: the leftover after spending",
  );

  return `Generate a personalized withdrawal strategy report for this person:

**Situation:**
${modeLines.join("\n")}
- Age ${inputs.age}, filing ${inputs.filingStatus}, state ${inputs.state.toUpperCase()}
- Gross income $${inputs.income.toLocaleString()}/yr; net $${Math.round(inputs.netAnnual).toLocaleString()}/yr
- Savings rate ${inputs.savingsRatePct}% of take-home pay plus retirement saving; monthly spending $${inputs.expensesMonthly.toLocaleString()}
- FIRE number $${Math.round(fireNumber).toLocaleString()} at ${inputs.withdrawalRatePct}%${mode === "barista" ? " (on the part-time-income gap)" : ""}
- ${alreadyFI ? `Already financially independent; FIRE age ${inputs.fireAge}` : `Projected FIRE age ${inputs.fireAge}; ${inputs.yearsToFI} years away`}
- Assumptions: ${assumptions.join("; ")}

**Portfolio:**
- 401(k), ${inputs.taxTreatment401k}: $${inputs.bal401k.toLocaleString()}
- IRA, ${inputs.taxTreatmentIra}: $${inputs.balIra.toLocaleString()}
- Taxable brokerage: $${inputs.balBrokerage.toLocaleString()}
- Total: $${totalPortfolio.toLocaleString()}; estimated traditional-account withdrawal tax ${inputs.withdrawalTaxRatePct}%

**Timeline:** ${yearsToMedicare} years to Medicare and ${yearsToRMD} years to RMDs.
${inputs.targetRetirementAge && mode !== "coast" ? `Target retirement age: ${inputs.targetRetirementAge}.` : ""}

Cover withdrawal order, Roth conversion opportunities, tax-bracket management,
the healthcare bridge, first-five-year sequence risk, and the three largest risks.
Tailor the report to the calculator mode above and do not treat a Coast or Barista plan as a standard FIRE plan.
Use only the supplied values and do not infer identifying information.`;
}
