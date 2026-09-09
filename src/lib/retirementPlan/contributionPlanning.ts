/** Pure annual employer-plan arithmetic, not an eligibility determination.
 * Dollars are nominal; rates are decimals. No limits or plan terms are guessed.
 * This layer is intentionally not connected to the annual ledger yet.
 */
export type MatchTier = Readonly<{
  /** Cumulative upper employee-deferral fraction of eligible compensation. */
  throughCompensationFraction: number;
  employerPerEmployeeDollar: number;
}>;

export type PlanContributionInput = Readonly<{
  eligibleCompensation: number;
  compensationCap: number;
  requestedEmployee: number;
  /** Remaining regular and catch-up capacity, independently validated for owner/year. */
  regularEmployeeCapacity: number;
  catchUpCapacity: number;
  /** Includes this plan's OTHER employee/employer additions; excludes catch-up. */
  otherAnnualAdditions: number;
  annualAdditionsLimit: number;
  tiers: readonly MatchTier[];
  assumptions: Readonly<{
    eligibility: "externally-validated";
    matching: "annual-true-up";
    vesting: "fully-vested";
    employerTaxTreatment: "traditional-pretax";
  }>;
}>;

function dollars(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1e12) {
    throw new RangeError(`${name} must be finite nominal dollars from 0 to 1 trillion.`);
  }
  return value;
}

/** Determine eligible employee request BEFORE the household funding search.
 * Caller must aggregate an owner's other plans when supplying remaining capacity.
 */
export function planEmployeeContribution(input: PlanContributionInput) {
  for (const name of ["eligibleCompensation", "compensationCap", "requestedEmployee", "regularEmployeeCapacity",
    "catchUpCapacity", "otherAnnualAdditions", "annualAdditionsLimit"] as const) dollars(input[name], name);
  const a = input.assumptions;
  if (!a || a.eligibility !== "externally-validated" || a.matching !== "annual-true-up"
    || a.vesting !== "fully-vested" || a.employerTaxTreatment !== "traditional-pretax") {
    throw new RangeError("Explicit verified eligibility, annual true-up, full vesting and traditional employer contributions are required.");
  }
  if (!Array.isArray(input.tiers) || input.tiers.length > 10) throw new RangeError("Supply at most ten match tiers.");
  let previous = 0;
  for (const tier of input.tiers) {
    if (!Number.isFinite(tier.throughCompensationFraction) || tier.throughCompensationFraction <= previous
      || tier.throughCompensationFraction > 1 || !Number.isFinite(tier.employerPerEmployeeDollar)
      || tier.employerPerEmployeeDollar < 0 || tier.employerPerEmployeeDollar > 10) {
      throw new RangeError("Match tiers need increasing cumulative fractions in (0,1] and rates from 0 to 10.");
    }
    previous = tier.throughCompensationFraction;
  }
  const compensation = Math.min(input.eligibleCompensation, input.compensationCap);
  const additionsLimit = Math.min(input.annualAdditionsLimit, input.eligibleCompensation);
  if (input.otherAnnualAdditions > additionsLimit) throw new RangeError("Other annual additions already exceed the supplied limit.");
  const regularCapacity = Math.min(input.regularEmployeeCapacity, additionsLimit - input.otherAnnualAdditions);
  const eligibleEmployee = Math.min(input.requestedEmployee, compensation, regularCapacity + input.catchUpCapacity);
  return Object.freeze({ compensation, additionsLimit, regularCapacity, eligibleEmployee,
    reducedByEligibility: input.requestedEmployee - eligibleEmployee });
}

/** Calculate match AFTER the cash ledger determines actual funded deferrals.
 * Never match an unfunded request. Never send this employer amount through the
 * household employee-contribution funding/tax-deduction path.
 */
export function calculateEmployerMatch(input: PlanContributionInput, fundedEmployee: number) {
  const plan = planEmployeeContribution(input);
  dollars(fundedEmployee, "Funded employee contribution");
  if (fundedEmployee > plan.eligibleEmployee) throw new RangeError("Funded employee contribution exceeds the eligible request.");
  const regularEmployee = Math.min(fundedEmployee, plan.regularCapacity);
  const catchUpEmployee = fundedEmployee - regularEmployee;
  let previous = 0;
  const tiers = input.tiers.map(tier => {
    const lower = previous * plan.compensation;
    const upper = tier.throughCompensationFraction * plan.compensation;
    const matchedEmployee = Math.max(0, Math.min(fundedEmployee, upper) - lower);
    previous = tier.throughCompensationFraction;
    return Object.freeze({ matchedEmployee, employerAmount: matchedEmployee * tier.employerPerEmployeeDollar });
  });
  const formulaMatch = dollars(tiers.reduce((sum, tier) => sum + tier.employerAmount, 0), "Formula match");
  const remainingAdditions = Math.max(0, plan.additionsLimit - input.otherAnnualAdditions - regularEmployee);
  const employerMatch = Math.min(formulaMatch, remainingAdditions);
  return Object.freeze({ ...plan, fundedEmployee, regularEmployee, catchUpEmployee,
    formulaMatch, employerMatch, reducedByAdditionsLimit: formulaMatch - employerMatch,
    annualAdditions: input.otherAnnualAdditions + regularEmployee + employerMatch,
    newPlanDeposits: fundedEmployee + employerMatch, tiers: Object.freeze(tiers) });
}
