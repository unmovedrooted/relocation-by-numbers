import { rothIraWithdrawal, rothPlanWithdrawal } from "./accountTax";
import type { runRetirementTimeline } from "./timeline";
type Projection = ReturnType<typeof runRetirementTimeline>;

/** Scenario haircut, not a liquidation tax calculation. Never mutates the projection. */
export function terminalValuation(result: Projection, ratePercent: string) {
  const rate = Number(ratePercent);
  if (!ratePercent.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) throw new RangeError("Enter an explicit future withdrawal tax rate from 0 to 100%.");
  const year = result.years.at(-1)!.year;
  const { accounts, people } = result.nextState;
  let gross = 0, untaxed = 0;
  for (const person of people) {
    const iras = accounts.filter(a => a.ownerId === person.id && a.kind === "traditional-ira");
    const iraBalance = iras.reduce((sum,a)=>sum+a.balance,0);
    untaxed += Math.max(0, iraBalance - person.iraBasis);
    const roths = accounts.filter(a=>a.ownerId===person.id && a.kind==="roth-ira");
    const rothBalance = roths.reduce((sum,a)=>sum+a.balance,0);
    if (rothBalance > 0) {
      if (person.roth.firstContributionYear === null || !rothIraWithdrawal({birthDate:person.birthDate,distributionDate:`${year}-12-31`,additionalTaxExceptionAmount:0,
        balance:rothBalance,withdrawal:0,regularContributionBasis:person.roth.regularContributionBasis,conversions:person.roth.conversions,firstContributionYear:person.roth.firstContributionYear}).qualified) {
        throw new RangeError("Tax-adjusted comparison unavailable: terminal Roth IRA is not qualified under the supported age and five-tax-year rules.");
      }
    }
  }
  for (const account of accounts) {
    if (!Number.isFinite(account.balance) || account.balance < 0) throw new RangeError("Invalid terminal balance.");
    gross += account.balance;
    if (["taxable","espp","annuity"].includes(account.kind)) throw new RangeError("Tax-adjusted comparison does not yet support brokerage, ESPP or annuity accounts. Manual projections remain available.");
    if (account.kind === "401k") untaxed += Math.max(0,account.balance-account.afterTaxBasis);
    if (account.kind === "roth-401k" && account.balance > 0) {
      const person=people.find(p=>p.id===account.ownerId)!;
      if (!rothPlanWithdrawal({...account,birthDate:person.birthDate,distributionDate:`${year}-12-31`,withdrawal:0}).qualified) throw new RangeError("Tax-adjusted comparison unavailable: terminal Roth 401(k) is not qualified.");
    }
  }
  const assumedTax=untaxed*rate/100;
  return {gross,untaxed,assumedTax,adjusted:gross-assumedTax,rate};
}
