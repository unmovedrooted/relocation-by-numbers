import type { AnnualCashFlowResult, CashAccount } from "./cashFlow";
import { calculateEmployerMatch, planEmployeeContribution, type PlanContributionInput } from "./contributionPlanning";

export type EmployerMatchPlan = Readonly<{
  ownerId: string;
  destinationAccountId: string;
  employeeAccountIds: readonly string[];
  /** Current-year verified terms; requestedEmployee is derived from the ledger. */
  terms: Omit<PlanContributionInput, "requestedEmployee">;
}>;

export function validateEmployerMatchPlans(plans: readonly EmployerMatchPlan[], accounts: readonly CashAccount[],
  contributions: readonly { accountId: string; amount: number }[], wages: readonly { ownerId: string; amount: number }[]) {
  if (plans.length > 2) throw new RangeError("At most one verified employer-plan group per owner is supported.");
  const owners = new Set<string>();
  for (const plan of plans) {
    const destination = accounts.find(account => account.id === plan.destinationAccountId);
    if (!destination || destination.kind !== "401k" || destination.ownerId !== plan.ownerId || owners.has(plan.ownerId)) {
      throw new RangeError("Employer match requires one group per owner and a same-owner traditional 401k destination.");
    }
    owners.add(plan.ownerId);
    if (!plan.employeeAccountIds.length || new Set(plan.employeeAccountIds).size !== plan.employeeAccountIds.length) throw new RangeError("Match sources must be present and unique.");
    for (const id of plan.employeeAccountIds) {
      const source = accounts.find(account => account.id === id);
      if (!source || source.ownerId !== plan.ownerId || !["401k", "roth-401k"].includes(source.kind)) throw new RangeError("Match sources must be same-owner employee plan accounts.");
    }
    const ownedPlanContributions = contributions.filter(item => accounts.some(account => account.id === item.accountId && account.ownerId === plan.ownerId && ["401k", "roth-401k"].includes(account.kind)));
    if (ownedPlanContributions.some(item => !plan.employeeAccountIds.includes(item.accountId))) throw new RangeError("Include all owner employee-plan contributions in the verified group; multiple employers are unsupported.");
    const requestedEmployee = ownedPlanContributions.reduce((sum, item) => sum + item.amount, 0);
    const checked = planEmployeeContribution({ ...plan.terms, requestedEmployee });
    if (requestedEmployee > checked.eligibleEmployee) throw new RangeError("Employee requests must satisfy the verified match-plan capacities before settlement.");
    const earned = wages.filter(item => item.ownerId === plan.ownerId).reduce((sum, item) => sum + item.amount, 0);
    if (plan.terms.eligibleCompensation > earned) throw new RangeError("Match compensation cannot exceed the owner's current-year wages.");
  }
}

/** Employer deposits occur AFTER settlement, BEFORE annual growth. They cannot
 * fund consumption, taxes or employee contributions in this same annual step.
 * Restricted to pretax plan deposits: no current income tax or basis increase.
 */
export function depositEmployerMatches(cash: AnnualCashFlowResult, accounts: readonly CashAccount[], plans: readonly EmployerMatchPlan[]) {
  const matches = plans.map(plan => {
    const requestedEmployee = cash.accounts.filter(account => plan.employeeAccountIds.includes(account.accountId))
      .reduce((sum, account) => sum + account.contributionDeposit, 0);
    const result = calculateEmployerMatch({ ...plan.terms, requestedEmployee }, requestedEmployee);
    return Object.freeze({ ownerId: plan.ownerId, destinationAccountId: plan.destinationAccountId, ...result });
  });
  const employerContributions = matches.reduce((sum, match) => sum + match.employerMatch, 0);
  if (!Number.isFinite(employerContributions) || employerContributions > 1e12) throw new RangeError("Employer deposits exceed supported bounds.");
  const deposits = cash.accounts.map(account => {
    const employerDeposit = matches.filter(match => match.destinationAccountId === account.accountId).reduce((sum, match) => sum + match.employerMatch, 0);
    const rate = accounts.find(item => item.id === account.accountId)!.annualReturn;
    const beforeGrowth = account.beforeGrowth + employerDeposit;
    const investmentChange = account.investmentChange + employerDeposit * rate;
    const ending = account.ending + employerDeposit * (1 + rate);
    if (!Number.isFinite(ending) || ending < 0 || ending > 1e12) throw new RangeError("Employer-funded ending balance exceeds supported bounds.");
    return Object.freeze({ ...account, employerDeposit, beforeGrowth, investmentChange, ending });
  });
  const growth = deposits.reduce((sum, account) => sum + account.investmentChange, 0);
  const portfolioResidual = deposits.reduce((sum, account) => sum + account.opening, 0)
    + cash.contributions + employerContributions - cash.requiredWithdrawals - cash.voluntaryWithdrawals
    + cash.surplus + growth - deposits.reduce((sum, account) => sum + account.ending, 0);
  return Object.freeze({ cash: Object.freeze({ ...cash, accounts: Object.freeze(deposits), portfolioResidual }),
    employerContributions, matches: Object.freeze(matches) });
}
