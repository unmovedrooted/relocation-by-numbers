// lib/fireSim.ts
export type GrowthPhase = {
  name: string;
  years: number;          // how many years this phase lasts
  returnPct: number;      // nominal annual return, e.g. 7
};

export type FireInputs = {
  currentAge: number;

  // income + spending
  annualIncome: number;
  monthlyExpenses: number;

  // convenience inputs (auto-fill brokerage)
  currentSavingsInvestments: number; // <-- if provided, fills brokerage balance
  yearlyInvestment: number;          // <-- if provided, fills brokerage yearly contribution

  // account balances
  balance401k: number;
  balanceIra: number;
  balanceBrokerage: number;

  // yearly contributions (dollars)
  contrib401k: number;
  contribIra: number;
  contribBrokerage: number;

  // assumptions
  inflationPct: number;       // expenses growth, e.g. 2.5
  salaryGrowthPct: number;    // income growth, e.g. 3
  withdrawalRatePct: number;  // e.g. 4

  // phases
  phases: GrowthPhase[];

  // simulation
  maxYears: number;

  // optional targeting
  targetFireAge?: number;

  // taxes hook (optional)
  // Return net annual after tax; if you don't have this yet, just return gross.
  netAnnualFn?: (grossAnnual: number) => number;
};

export type FireYearRow = {
  yearIndex: number; // 0 = current year
  age: number;

  grossIncome: number;
  netIncome: number;

  annualExpenses: number;
  savings: number; // netIncome - expenses (floor at 0)
  contributionTotal: number;

  startBalance: number;
  endBalance: number;

  fireNumber: number; // expenses / withdrawalRate
  phaseName: string;
  returnPct: number;
};

export type FireResult = {
  fireNumberAtStart: number;
  yearsToFI: number | null;
  projectedFiAge: number | null;
  projectedFiYearIndex: number | null;

  ageAtFI: number | null;
  targetTrackingYearsAhead: number | null; // positive = ahead, negative = behind

  timeline: FireYearRow[];
};

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;

const pctToDec = (pct: number) => clamp(pct, -100, 10_000) / 100;

function sum3(a: number, b: number, c: number) {
  return (Number.isFinite(a) ? a : 0) + (Number.isFinite(b) ? b : 0) + (Number.isFinite(c) ? c : 0);
}

export function applyConvenienceAutofill(inputs: FireInputs): FireInputs {
  // If the user provides the convenience fields, we map them to brokerage by default
  // (keeps 401k/IRA explicit and avoids "double counting").
  const filled: FireInputs = { ...inputs };

  if (inputs.currentSavingsInvestments > 0) {
    filled.balanceBrokerage = inputs.currentSavingsInvestments;
  }
  if (inputs.yearlyInvestment > 0) {
    filled.contribBrokerage = inputs.yearlyInvestment;
  }

  return filled;
}

function phaseForYear(phases: GrowthPhase[], yearIndex: number) {
  // If phases don't cover maxYears, last phase repeats
  let remaining = yearIndex;
  for (const p of phases) {
    if (remaining < p.years) return p;
    remaining -= p.years;
  }
  return phases.length ? phases[phases.length - 1] : { name: "Default", years: 10_000, returnPct: 7 };
}

export function simulateFire(raw: FireInputs): FireResult {
  const inputs = applyConvenienceAutofill(raw);

  const withdrawalRateDec = Math.max(0.0001, pctToDec(inputs.withdrawalRatePct));
  const inflationDec = pctToDec(inputs.inflationPct);
  const salaryGrowthDec = pctToDec(inputs.salaryGrowthPct);

  const netFn = inputs.netAnnualFn ?? ((gross) => gross);

  // starting portfolio total (simple version: combine all accounts)
  let balance = sum3(inputs.balance401k, inputs.balanceIra, inputs.balanceBrokerage);

  // contributions (simple version: combine; you can later model account-specific rules)
  let annualContrib = sum3(inputs.contrib401k, inputs.contribIra, inputs.contribBrokerage);

  let grossIncome = Math.max(0, inputs.annualIncome);
  let annualExpenses = Math.max(0, inputs.monthlyExpenses * 12);

  const fireNumberAtStart = annualExpenses / withdrawalRateDec;

  const timeline: FireYearRow[] = [];
  let yearsToFI: number | null = null;

  for (let y = 0; y < inputs.maxYears; y++) {
    const age = inputs.currentAge + y;

    const phase = phaseForYear(inputs.phases, y);
    const r = pctToDec(phase.returnPct);

    const netIncome = Math.max(0, netFn(grossIncome));

    // savings capacity (net - expenses), but contributions are user-entered
    // We DO NOT force contributions to equal savings (people invest via pre-tax, etc.).
    // However, we can clamp contributions so they don't exceed netIncome if you want.
    const savings = Math.max(0, netIncome - annualExpenses);

    const startBalance = balance;

    // growth then contributions (order doesn’t matter much in annual model; this is fine)
    const grown = startBalance * (1 + r);
    const endBalance = grown + Math.max(0, annualContrib);

    const fireNumber = annualExpenses / withdrawalRateDec;

    timeline.push({
      yearIndex: y,
      age,
      grossIncome,
      netIncome,
      annualExpenses,
      savings,
      contributionTotal: Math.max(0, annualContrib),
      startBalance,
      endBalance,
      fireNumber,
      phaseName: phase.name,
      returnPct: phase.returnPct,
    });

    balance = endBalance;

    // FI check: portfolio >= current FIRE number
    if (yearsToFI === null && balance >= fireNumber) {
      yearsToFI = y + 1; // reaches by end of this year
      break;
    }

    // next year: inflate expenses + grow salary
    annualExpenses = annualExpenses * (1 + inflationDec);
    grossIncome = grossIncome * (1 + salaryGrowthDec);

    // OPTIONAL: if you want yearly contributions to scale with income,
    // replace this with percentage-based logic. Right now it's fixed dollars.
  }

  const projectedFiAge = yearsToFI === null ? null : inputs.currentAge + yearsToFI;
  const projectedFiYearIndex = yearsToFI === null ? null : yearsToFI; // "years from now"
  const ageAtFI = projectedFiAge;

  const targetTrackingYearsAhead =
    inputs.targetFireAge == null || ageAtFI == null ? null : inputs.targetFireAge - ageAtFI;

  return {
    fireNumberAtStart,
    yearsToFI,
    projectedFiAge,
    projectedFiYearIndex,
    ageAtFI,
    targetTrackingYearsAhead,
    timeline,
  };
}