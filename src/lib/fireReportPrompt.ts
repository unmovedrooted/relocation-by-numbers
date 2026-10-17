// Builds the prompt for the personalized FIRE report. It lives outside the route file because Next.js route modules may only
// export HTTP handlers, and so it can be tested directly.
//
// Coast and Barista FIRE are standalone plans, not variations of a standard retirement: each gets its own system prompt, its own
// facts and its own set of sections. Standard and Lean share the withdrawal-strategy report.
import { estimatedBirthYear, rmdStartAge } from "./rmdRules";

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
  baristaIncomeNow?: number;
  volatility?: "conservative" | "moderate" | "aggressive";
  inflationPct?: number;
  advanced?: boolean;
  yearlyInvestment?: number;
  contrib401k?: number;
  contribIra?: number;
  contribBrokerage?: number;
};

type Mode = NonNullable<ReportInputs["mode"]>;

const STYLE = `Write in plain, direct language. Make each section specific to the supplied numbers.
Format the response in markdown with ## section headers, **bold** key figures, and bullet points.
Keep the report under 600 words and end with a one-line planning disclaimer.`;

const SYSTEM_PROMPTS: Record<Mode, string> = {
  standard: `You are a FIRE planning specialist who writes personalized withdrawal strategy reports.\n${STYLE}`,
  lean: `You are a FIRE planning specialist who writes personalized withdrawal strategy reports for people retiring on a lean budget.\n${STYLE}`,
  coast: `You are a Coast FIRE planning specialist. Coast FIRE is a plan in which the person keeps contributing until a chosen age, then stops saving and lets the portfolio grow on its own to a retirement target while earned income pays current living costs. Write a Coast FIRE plan, not a withdrawal strategy for someone who has already retired.\n${STYLE}`,
  barista: `You are a Barista FIRE planning specialist. Barista FIRE is a plan in which part-time or flexible work covers part of living costs, so the portfolio only has to fund the remaining gap. Write a Barista FIRE plan, not a standard full-retirement withdrawal strategy.\n${STYLE}`,
};

export function systemPromptFor(mode: ReportInputs["mode"]): string {
  return SYSTEM_PROMPTS[mode ?? "standard"];
}

function money(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

function assumptionsLine(inputs: ReportInputs): string {
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
  return `- Assumptions: ${assumptions.join("; ")}`;
}

function portfolioBlock(inputs: ReportInputs): string {
  const total = inputs.bal401k + inputs.balIra + inputs.balBrokerage || inputs.currentPortfolio;
  return `**Portfolio:**
- 401(k), ${inputs.taxTreatment401k}: $${inputs.bal401k.toLocaleString()}
- IRA, ${inputs.taxTreatmentIra}: $${inputs.balIra.toLocaleString()}
- Taxable brokerage: $${inputs.balBrokerage.toLocaleString()}
- Total: $${total.toLocaleString()}; estimated traditional-account withdrawal tax ${inputs.withdrawalTaxRatePct}%`;
}

function commonFacts(inputs: ReportInputs): string {
  return `- Age ${inputs.age}, filing ${inputs.filingStatus}, state ${inputs.state.toUpperCase()}
- Gross income $${inputs.income.toLocaleString()}/yr; net $${Math.round(inputs.netAnnual).toLocaleString()}/yr
- Savings rate ${inputs.savingsRatePct}% of take-home pay plus retirement saving; monthly spending $${inputs.expensesMonthly.toLocaleString()}`;
}

const CLOSING = "Use only the supplied values and do not infer identifying information.";

function coastPrompt(inputs: ReportInputs): string {
  const swr = inputs.withdrawalRatePct;
  const retireAge = inputs.targetRetirementAge;
  const status = inputs.coastReady
    ? "Already coast-ready: today's balance is enough to stop contributing and still reach the retirement target"
    : inputs.yearsToCoast != null
      ? `Not yet coast-ready; at the current pace the balance gets there in ${inputs.yearsToCoast} years`
      : "Not coast-ready, and not projected to be before the retirement age at the current pace";
  const yearsToCoastAge = Math.max(0, (inputs.coastAge ?? inputs.age) - inputs.age);
  const yearsToRetire = retireAge != null ? Math.max(0, retireAge - inputs.age) : null;
  return `Generate a personalized Coast FIRE plan for this person:

**Coast plan:**
- Stop contributing at age ${inputs.coastAge ?? "unknown"} (${yearsToCoastAge} years from now); retire at ${retireAge ?? "unknown"}${yearsToRetire != null ? ` (${yearsToRetire} years from now)` : ""}
- Coast FIRE number: ${inputs.coastNumber != null ? `${money(inputs.coastNumber)} invested by the coast age` : "not available"}, assuming ${swr}% withdrawals at retirement and ${money(inputs.expensesMonthly * 12)}/yr of spending in today's dollars
- ${status}
- If contributions simply continue, full FIRE would be reached at age ${inputs.fireAge ?? "—"}; that is a comparison, not the plan
${commonFacts(inputs)}
${assumptionsLine(inputs)}

${portfolioBlock(inputs)}

Cover: how far the person is from the coast number and what it takes to get there by the coast age; the contribution plan until then;
what to do after contributions stop (allocation and rebalancing, keeping an emergency fund, paying living costs from earned income);
how the balance should be expected to behave from the coast age to retirement; healthcare and tax planning for the years before
Medicare and withdrawals; and the three largest risks to a Coast plan (market returns, inflation, and a gap in earned income).
This is a standalone Coast FIRE plan; do not turn it into a standard early-retirement withdrawal strategy.
${CLOSING}`;
}

function baristaPrompt(inputs: ReportInputs): string {
  const annualSpend = inputs.expensesMonthly * 12;
  const partTime = inputs.baristaPartTimeIncome ?? 0;
  const gap = Math.max(0, annualSpend - partTime);
  const number = gap / (inputs.withdrawalRatePct / 100);
  const alreadyThere = (inputs.yearsToFI ?? 1) <= 0;
  const yearsToMedicare = Math.max(0, 65 - (inputs.fireAge ?? inputs.age));
  return `Generate a personalized Barista FIRE plan for this person:

**Barista plan:**
- Spending ${money(annualSpend)}/yr; expected part-time income ${money(partTime)}/yr after tax once full-time work ends (it lowers the yearly gap, is assumed to grow with inflation, and is not counted as saving before then)${(inputs.baristaIncomeNow ?? 0) > 0 ? `; part-time income already earned now ${money(inputs.baristaIncomeNow ?? 0)}/yr after tax (it adds to saving until FIRE)` : ""}
- The portfolio only has to fund the gap of ${money(gap)}/yr, a Barista FIRE number of $${Math.round(number).toLocaleString()} at ${inputs.withdrawalRatePct}%
- ${alreadyThere ? `Already at Barista FIRE; age ${inputs.fireAge}` : `Projected Barista FIRE age ${inputs.fireAge}; ${inputs.yearsToFI} years away`}
${commonFacts(inputs)}
${assumptionsLine(inputs)}

${portfolioBlock(inputs)}

**Timeline:** ${yearsToMedicare} years from the Barista FIRE age to Medicare.

Cover: how the part-time income and the portfolio split the yearly spending; how reliable and how taxable the part-time income is;
the healthcare and benefits gap that part-time work usually creates (ACA coverage, subsidies and how income affects them);
how to draw on the portfolio to cover the gap (order of accounts, and using low-income years for Roth conversions);
when it makes sense to start the transition and what to build first; and the three largest risks to a Barista plan
(losing the part-time income, healthcare costs, and inflation outpacing the income).
This is a standalone Barista FIRE plan; do not turn it into a full-retirement withdrawal strategy.
${CLOSING}`;
}

function withdrawalPrompt(inputs: ReportInputs): string {
  const mode = inputs.mode ?? "standard";
  const annualSpend = inputs.expensesMonthly * 12;
  const fireNumber = annualSpend / (inputs.withdrawalRatePct / 100);
  const alreadyFI = (inputs.yearsToFI ?? 1) <= 0;
  const yearsToMedicare = Math.max(0, 65 - (inputs.fireAge ?? inputs.age));
  // RMDs start at 73 for birth years 1951 to 1959 and 75 for 1960 or later; the birth year is estimated from the current age.
  const rmdAge = rmdStartAge(estimatedBirthYear(inputs.age, new Date().getFullYear()));
  const yearsToRMD = Math.max(0, rmdAge - (inputs.fireAge ?? inputs.age));
  const label = mode === "lean" ? "Lean FIRE (a reduced spending budget)" : "Standard FIRE (spending covered entirely by the portfolio)";
  return `Generate a personalized withdrawal strategy report for this person:

**Situation:**
- Calculator: ${label}${inputs.preset ? `, ${inputs.preset} FIRE spending level` : ""}
${commonFacts(inputs)}
- FIRE number $${Math.round(fireNumber).toLocaleString()} at ${inputs.withdrawalRatePct}%
- ${alreadyFI ? `Already financially independent; FIRE age ${inputs.fireAge}` : `Projected FIRE age ${inputs.fireAge}; ${inputs.yearsToFI} years away`}
${assumptionsLine(inputs)}

${portfolioBlock(inputs)}

**Timeline:** ${yearsToMedicare} years to Medicare and ${yearsToRMD} years to RMDs (which start at age ${rmdAge}).
${inputs.targetRetirementAge ? `Target retirement age: ${inputs.targetRetirementAge}.` : ""}

Cover withdrawal order, Roth conversion opportunities, tax-bracket management,
the healthcare bridge, first-five-year sequence risk, and the three largest risks.
${CLOSING}`;
}

/** Coast and Barista build their own report; standard and lean share the withdrawal-strategy report. */
export function buildPrompt(inputs: ReportInputs): string {
  if (inputs.mode === "coast") return coastPrompt(inputs);
  if (inputs.mode === "barista") return baristaPrompt(inputs);
  return withdrawalPrompt(inputs);
}
