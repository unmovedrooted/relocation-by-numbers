import { iraEligibility, catchUpEligibility2026, type IraEligibilityInput, type CatchUpEligibilityInput } from "./contributionEligibility";
import { runHouseholdYear, type HouseholdYearInput, type YearContribution } from "./householdYear";
import { finiteDollars, taxProjectionFactors } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** IRA MAGI for the supported resident model, with explicit worksheet addbacks.
 * Conversion exclusion applies ONLY to Roth MAGI, not deduction MAGI.
 */
export function iraSpecificMagi(input: { agi: number; iraDeduction: number; taxableRothConversions: number;
  studentLoanInterestDeduction: number; foreignEarnedHousingExclusions: number; savingsBondInterestExclusion: number;
  employerAdoptionExclusion: number }) {
  finiteDollars(input.agi, "AGI", true);
  for (const key of ["iraDeduction", "taxableRothConversions", "studentLoanInterestDeduction", "foreignEarnedHousingExclusions", "savingsBondInterestExclusion", "employerAdoptionExclusion"] as const) finiteDollars(input[key], key);
  const deductionMagi = finiteDollars(input.agi + input.iraDeduction + input.studentLoanInterestDeduction
    + input.foreignEarnedHousingExclusions + input.savingsBondInterestExclusion + input.employerAdoptionExclusion, "IRA deduction MAGI", true);
  return Object.freeze({ deductionMagi, rothMagi: finiteDollars(deductionMagi - input.taxableRothConversions, "Roth MAGI", true) });
}

export type IraOwnerPolicy = Readonly<{ ownerId: string; coveredByWorkplacePlan: boolean; spouseCoveredByWorkplacePlan: boolean;
  traditionalAccountId?: string; rothAccountId?: string; deductionChoice: "deduct-eligible" | "nondeductible";
  allocation: "traditional-first" }>;
export type CatchUpRoute = Readonly<{ ownerId: string; sourceAccountId: string; rothDestinationAccountId: string;
  eligibility: Omit<CatchUpEligibilityInput, "year" | "ageAtYearEnd">; consentToRothRouting: boolean }>;

/** Narrow integrated path: wages/pensions only, no distributions, conversions,
 * investment income or spousal compensation while making IRA deposits. Explicit
 * rejection avoids circular IRA basis/MAGI/withdrawal and SS worksheet errors.
 */
function evaluateContributionFeedback(input: HouseholdYearInput, policies: readonly IraOwnerPolicy[], routes: readonly CatchUpRoute[], scale: number) {
  taxProjectionFactors(input.year, input.projection);
  if (routes.length && input.year !== 2026) throw new RangeError("Automatic workplace catch-up routing still supports 2026 only.");
  if (new Set(policies.map(item => item.ownerId)).size !== policies.length || new Set(routes.map(item => item.ownerId)).size !== routes.length) throw new RangeError("Use one IRA policy and catch-up route per owner.");
  let contributions: YearContribution[] = (input.contributions ?? []).map(item => ({ ...item }));
  for (const item of contributions) {
    const account = input.accounts.find(account => account.id === item.accountId);
    if (account && ["traditional-ira", "roth-ira"].includes(account.kind) && !policies.some(policy => policy.ownerId === account.ownerId)) throw new RangeError("Every contributing IRA owner needs an explicit eligibility policy.");
  }
  for (const route of routes) {
    const person = input.people.find(item => item.id === route.ownerId);
    const source = input.accounts.find(item => item.id === route.sourceAccountId);
    const destination = input.accounts.find(item => item.id === route.rothDestinationAccountId);
    if (!person || source?.kind !== "401k" || source.ownerId !== person.id || destination?.kind !== "roth-401k" || destination.ownerId !== person.id) throw new RangeError("Catch-up routing requires same-owner traditional and Roth 401(k) accounts.");
    const request = contributions.find(item => item.accountId === source.id);
    if (!request || contributions.some(item => item.accountId !== source.id && input.accounts.some(account => account.id === item.accountId && account.ownerId === person.id && ["401k", "roth-401k"].includes(account.kind)))) throw new RangeError("Catch-up route requires a single combined employee request in the source plan; destination must have no separate request.");
    const eligibility = catchUpEligibility2026({ ...route.eligibility, year: 2026, ageAtYearEnd: ageAtYearEnd(person.birthDate, 2026) });
    const wages = input.income.filter(item => item.ownerId === person.id && item.kind === "wages").reduce((sum,item)=>sum+item.amount,0);
    finiteDollars(request.amount, "Employee request");
    const allowed = Math.min(request.amount, eligibility.totalDeferralCeiling, wages);
    const rothAmount = eligibility.rothRequired ? Math.max(0, allowed - eligibility.regularDeferralLimit) : 0;
    if (rothAmount > 0 && !route.consentToRothRouting) throw new RangeError("Required Roth catch-up routing needs explicit consent; pretax tax treatment cannot be preserved.");
    contributions = contributions.map(item => item.accountId === source.id ? { ...item, amount: allowed - rothAmount } : item);
    if (rothAmount > 0) contributions.push({ accountId: destination.id, amount: rothAmount, taxTreatment: "after-tax", eligibility: "externally-validated" });
  }
  if (!policies.length) return { result: runHouseholdYear({ ...input, contributions }), contributions, residual: 0, consistent: true };
  if (input.conversions.length || input.income.some(item=>!["wages","pension"].includes(item.kind) && item.amount > 0)
    || input.accounts.some(account=>["taxable","espp"].includes(account.kind) || account.kind === "cash" && account.annualReturn !== 0)) {
    throw new RangeError("Automatic IRA MAGI integration currently requires wages/pensions, no conversions or investment income.");
  }
  const nonIraContributions = contributions.filter(item => !input.accounts.some(account => account.id === item.accountId && ["traditional-ira", "roth-ira"].includes(account.kind)));
  const baseline = runHouseholdYear({ ...input, contributions: nonIraContributions.map(item => ({ ...item, amount: item.amount * scale })), employerMatchPlans: [] });
  if (baseline.cash.requiredWithdrawals > 0 || baseline.cash.voluntaryWithdrawals > 0 || !baseline.cash.spendingFunded) throw new RangeError("Automatic IRA eligibility with account withdrawals/shortfalls requires a broader solver.");
  // Probe a common funding scale, matching the cash ledger's proportional
  // funding policy. IRA caps use the resulting funded pretax deferrals.
  const magi = iraSpecificMagi({ agi: baseline.tax.agi, iraDeduction: 0, taxableRothConversions: 0,
    studentLoanInterestDeduction: 0, foreignEarnedHousingExclusions: 0, savingsBondInterestExclusion: 0, employerAdoptionExclusion: 0 });
  for (const policy of policies) {
    const person = input.people.find(item=>item.id===policy.ownerId);
    if (!person || !["deduct-eligible","nondeductible"].includes(policy.deductionChoice) || policy.allocation !== "traditional-first") throw new RangeError("Unknown IRA owner or deduction choice; explicit traditional-first allocation is required.");
    const contributionFor = (id: string | undefined, kind: string) => {
      if (!id) return undefined;
      const account = input.accounts.find(item=>item.id===id);
      if (!account || account.kind !== kind || account.ownerId !== person.id) throw new RangeError("IRA policy must reference a same-owner account of the correct kind.");
      return contributions.find(item=>item.accountId===id);
    };
    const traditional = contributionFor(policy.traditionalAccountId,"traditional-ira");
    const roth = contributionFor(policy.rothAccountId,"roth-ira");
    if (contributions.some(item=>input.accounts.some(account=>account.id===item.accountId && account.ownerId===person.id && ["traditional-ira","roth-ira"].includes(account.kind)) && item!==traditional && item!==roth)) throw new RangeError("Use one traditional and one Roth contribution per owner in the integrated path.");
    const wages = input.income.filter(item=>item.ownerId===person.id && item.kind==="wages").reduce((sum,item)=>sum+item.amount,0);
    const pretaxFunded = nonIraContributions.filter(item=>item.taxTreatment==="pretax-401k" && input.accounts.find(account=>account.id===item.accountId)?.ownerId===person.id)
      .reduce((sum,item)=>sum+(baseline.cash.accounts.find(account=>account.accountId===item.accountId)?.contributionDeposit ?? 0),0);
    let args: IraEligibilityInput = { year:input.year,ageAtYearEnd:ageAtYearEnd(person.birthDate,input.year),filing:input.filing,
      taxableCompensation:Math.max(0,wages-pretaxFunded),...magi,coveredByWorkplacePlan:policy.coveredByWorkplacePlan,
      spouseCoveredByWorkplacePlan:policy.spouseCoveredByWorkplacePlan,traditionalContributed:0,rothContributed:0 };
    const eligible = iraEligibility(args, input.projection);
    if (traditional) {
      finiteDollars(traditional.amount,"Traditional contribution");
      const amount = Math.min(traditional.amount,eligible.combinedLimit);
      const range = eligible.deductionRange;
      const ceiling = !range || magi.deductionMagi <= range[0] ? eligible.annualLimit : magi.deductionMagi >= range[1] ? 0
        : Math.max(200,Math.ceil((eligible.annualLimit * (range[1]-magi.deductionMagi)/(range[1]-range[0]))/10)*10);
      const iraDeductionLimit = policy.deductionChoice === "deduct-eligible" ? Math.min(amount,ceiling) : 0;
      contributions = contributions.map(item=>item===traditional ? {...item,amount,iraDeductionLimit} : item);
      args = { ...args, traditionalContributed: amount };
    }
    if (roth) {
      finiteDollars(roth.amount,"Roth contribution");
      const amount = Math.min(roth.amount,iraEligibility(args, input.projection).rothRemaining);
      contributions = contributions.map(item=>item===roth ? {...item,amount} : item);
    }
  }
  const result = runHouseholdYear({ ...input, contributions });
  if (result.cash.requiredWithdrawals > 0 || result.cash.voluntaryWithdrawals > 0) throw new RangeError("IRA eligibility integration cannot fund spending through account withdrawals yet.");
  let residual = 0;
  let consistent = true;
  for (const item of nonIraContributions.filter(item => item.taxTreatment === "pretax-401k")) {
    const before = baseline.cash.accounts.find(account => account.accountId === item.accountId)!.contributionDeposit;
    const after = result.cash.accounts.find(account => account.accountId === item.accountId)!.contributionDeposit;
    residual += after - before;
    if (Math.abs(before - after) > 1e-7) consistent = false;
  }
  const finalMagi = iraSpecificMagi({ agi: result.tax.agi, iraDeduction: result.tax.iraDeduction, taxableRothConversions: 0,
    studentLoanInterestDeduction: 0, foreignEarnedHousingExclusions: 0, savingsBondInterestExclusion: 0, employerAdoptionExclusion: 0 });
  if (Math.abs(finalMagi.deductionMagi - magi.deductionMagi) > 1e-7 || Math.abs(finalMagi.rothMagi - magi.rothMagi) > 1e-7) {
    consistent = false;
  }
  // Do not accept a tolerance-sized MAGI difference across a statutory rounding
  // boundary. Recheck ACTUAL funded deposits and deductions at the final MAGI.
  for (const policy of policies) {
    const person = input.people.find(item => item.id === policy.ownerId)!;
    const wages = input.income.filter(item => item.ownerId === person.id && item.kind === "wages").reduce((sum,item)=>sum+item.amount,0);
    const pretax = contributions.filter(item => item.taxTreatment === "pretax-401k" && input.accounts.find(account=>account.id===item.accountId)?.ownerId===person.id)
      .reduce((sum,item)=>sum+(result.cash.accounts.find(account=>account.accountId===item.accountId)?.contributionDeposit ?? 0),0);
    const traditional = result.cash.accounts.find(account=>account.accountId===policy.traditionalAccountId)?.contributionDeposit ?? 0;
    const roth = result.cash.accounts.find(account=>account.accountId===policy.rothAccountId)?.contributionDeposit ?? 0;
    const eligibility = iraEligibility({year:input.year,ageAtYearEnd:ageAtYearEnd(person.birthDate,input.year),filing:input.filing,
      taxableCompensation:Math.max(0,wages-pretax),...finalMagi,coveredByWorkplacePlan:policy.coveredByWorkplacePlan,
      spouseCoveredByWorkplacePlan:policy.spouseCoveredByWorkplacePlan,traditionalContributed:traditional,rothContributed:0}, input.projection);
    if (traditional + roth > eligibility.combinedLimit + 1e-7 || roth > eligibility.rothRemaining + 1e-7) consistent = false;
    const range = eligibility.deductionRange;
    const ceiling = !range || finalMagi.deductionMagi <= range[0] ? eligibility.annualLimit : finalMagi.deductionMagi >= range[1] ? 0
      : Math.max(200,Math.ceil((eligibility.annualLimit * (range[1]-finalMagi.deductionMagi)/(range[1]-range[0]))/10)*10);
    const expectedDeduction = policy.deductionChoice === "deduct-eligible" ? Math.min(traditional,ceiling) : 0;
    const actualDeduction = Math.min(traditional, contributions.find(item=>item.accountId===policy.traditionalAccountId)?.iraDeductionLimit ?? 0);
    if (Math.abs(expectedDeduction-actualDeduction) > 1e-7) consistent = false;
  }
  return { result, contributions, residual, consistent };
}

/** Bounded fixed-point search for the shared employee-funding fraction. A
 * bracket is not a claim of continuity: phaseout/rounding jumps may lack a
 * consistent root. Only independently revalidated candidates are returned.
 */
export function runEligibleContributions2026(input: HouseholdYearInput, policies: readonly IraOwnerPolicy[], routes: readonly CatchUpRoute[] = []) {
  if (input.year !== 2026) throw new RangeError("This compatibility entry point supports 2026 only.");
  return runEligibleContributions(input, policies, routes);
}

export function runEligibleContributions(input: HouseholdYearInput, policies: readonly IraOwnerPolicy[], routes: readonly CatchUpRoute[] = []) {
  const finish = (candidate: ReturnType<typeof evaluateContributionFeedback>) => ({ ...candidate.result,
    eligibleContributions: Object.freeze(candidate.contributions.map(item => Object.freeze({ ...item }))) });
  const upper = evaluateContributionFeedback(input, policies, routes, 1);
  if (upper.consistent) return finish(upper);
  const lower = evaluateContributionFeedback(input, policies, routes, 0);
  if (lower.consistent) return finish(lower);
  if (lower.residual < 0 || upper.residual > 0) throw new RangeError("Contribution/MAGI feedback has no supported bracket.");
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 80; iteration++) {
    const middle = low + (high-low)/2;
    if (middle === low || middle === high) break;
    const candidate = evaluateContributionFeedback(input, policies, routes, middle);
    if (candidate.consistent) return finish(candidate);
    if (candidate.residual > 0) low = middle;
    else high = middle;
  }
  throw new RangeError("Contribution/MAGI feedback did not converge to verified eligibility; no projection was returned.");
}
