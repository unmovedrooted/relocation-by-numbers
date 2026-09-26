import { settleAnnualCashFlow, type CashAccount, type CashIncome, type RothTransfer, type TaxContext } from "./cashFlow";
import { additionalTaxBase, capitalLotSale, deferredAnnuitySurrender, deferredAnnuityWithdrawal,
  esppLotSale, qualifiedPlanWithdrawal, rothIraWithdrawal, rothPlanWithdrawal, savingsInterest,
  sumTaxCharacter, taxCharacter, traditionalIraOwnerYear, type CapitalLot, type RothConversionBasis, type TaxCharacter } from "./accountTax";
import { requiredDistribution, type EsppLot } from "./rules";
import { depositEmployerMatches, validateEmployerMatchPlans, type EmployerMatchPlan } from "./employerMatchLedger";
import { estimateHouseholdTax, finiteDollars, validatedDate, type CapitalLossCarryover,
  type HouseholdIncome, type HouseholdTaxInput, type TaxPerson, type RetirementIncomeItem } from "./householdTax";

type RmdPolicy = Readonly<{ priorDecemberBalance: number } & (
  { table: "uniform" } | { table: "joint-life"; divisor: number }
)>;
type PricedLot = Readonly<{ id: string; lot: CapitalLot; price: number }>;
export type YearAccount = CashAccount & (
  | { kind: "cash"; interestTreatment: "none" | "taxable" }
  | { kind: "taxable"; lots: readonly PricedLot[]; returnTreatment: "price-only"; transactionFees: 0 }
  | { kind: "espp"; lot: EsppLot; price: number; returnTreatment: "price-only"; transactionFees: 0 }
  | { kind: "traditional-ira"; rmd: RmdPolicy }
  | { kind: "401k"; rmd: RmdPolicy; deferRmdWhileWorking: boolean; afterTaxBasis: number; additionalTaxExceptionAmount: number }
  | { kind: "roth-ira" }
  | { kind: "roth-401k"; contributionBasis: number; firstContributionYear: number; hasInPlanRollover: boolean; additionalTaxExceptionAmount: number }
  | { kind: "annuity"; investmentInContract: number; surrenderCharge: 0; additionalTaxExceptionAmount: number;
      treatment: "post-1982-nonqualified-pre-annuity" }
);
type OwnerRothState = Readonly<{
  firstContributionYear: number | null;
  regularContributionBasis: number;
  conversions: readonly RothConversionBasis[];
}>;
export type YearPerson = TaxPerson & Readonly<{
  iraBasis: number;
  iraAdditionalTaxExceptionAmount: number;
  rothAdditionalTaxExceptionAmount: number;
  roth: OwnerRothState;
}>;
export type YearContribution = Readonly<{
  accountId: string;
  amount: number;
  taxTreatment: "pretax-401k" | "after-tax";
  /** Capacity/eligibility must be supplied by a separate validated schedule. */
  eligibility: "externally-validated";
  /** Externally verified deduction ceiling for this traditional IRA deposit.
   * Only funded dollars up to this ceiling are deductible; remainder is basis.
   */
  iraDeductionLimit?: number;
  /** Required for a new identified brokerage lot; price before annual growth. */
  purchaseLot?: Readonly<{ id: string; price: number }>;
}>;
export type HouseholdYearInput = Readonly<{
  year: number;
  distributionDate: string;
  filing: HouseholdTaxInput["filing"];
  state: HouseholdTaxInput["state"];
  stateTreatment: HouseholdTaxInput["stateTreatment"];
  cityId?: string;
  newYorkContract?: HouseholdTaxInput["newYorkContract"];
  marylandContract?: HouseholdTaxInput["marylandContract"];
  indianaContract?: HouseholdTaxInput["indianaContract"];
  dcContract?: HouseholdTaxInput["dcContract"];
  illinoisContract?: HouseholdTaxInput["illinoisContract"];
  newJerseyContract?: HouseholdTaxInput["newJerseyContract"];
  pennsylvaniaContract?: HouseholdTaxInput["pennsylvaniaContract"];
  coloradoContract?: HouseholdTaxInput["coloradoContract"];
  newMexicoContract?: HouseholdTaxInput["newMexicoContract"];
  minnesotaContract?: HouseholdTaxInput["minnesotaContract"];
  utahContract?: HouseholdTaxInput["utahContract"];
  connecticutContract?: HouseholdTaxInput["connecticutContract"];
  vermontContract?: HouseholdTaxInput["vermontContract"];
  montanaContract?: HouseholdTaxInput["montanaContract"];
  rhodeIslandContract?: HouseholdTaxInput["rhodeIslandContract"];
  californiaContract?: HouseholdTaxInput["californiaContract"];
  virginiaContract?: HouseholdTaxInput["virginiaContract"];
  arizonaContract?: HouseholdTaxInput["arizonaContract"];
  georgiaContract?: HouseholdTaxInput["georgiaContract"];
  northCarolinaContract?: HouseholdTaxInput["northCarolinaContract"];
  southCarolinaContract?: HouseholdTaxInput["southCarolinaContract"];
  ohioContract?: HouseholdTaxInput["ohioContract"];
  massachusettsContract?: HouseholdTaxInput["massachusettsContract"];
  iowaContract?: HouseholdTaxInput["iowaContract"];
  mississippiContract?: HouseholdTaxInput["mississippiContract"];
  missouriContract?: HouseholdTaxInput["missouriContract"];
  washingtonContract?: HouseholdTaxInput["washingtonContract"];
  alabamaContract?: HouseholdTaxInput["alabamaContract"];
  arkansasContract?: HouseholdTaxInput["arkansasContract"];
  delawareContract?: HouseholdTaxInput["delawareContract"];
  kansasContract?: HouseholdTaxInput["kansasContract"];
  kentuckyContract?: HouseholdTaxInput["kentuckyContract"];
  nebraskaContract?: HouseholdTaxInput["nebraskaContract"];
  westVirginiaContract?: HouseholdTaxInput["westVirginiaContract"];
  idahoContract?: HouseholdTaxInput["idahoContract"];
  louisianaContract?: HouseholdTaxInput["louisianaContract"];
  michiganContract?: HouseholdTaxInput["michiganContract"];
  oklahomaContract?: HouseholdTaxInput["oklahomaContract"];
  wisconsinContract?: HouseholdTaxInput["wisconsinContract"];
  hawaiiContract?: HouseholdTaxInput["hawaiiContract"];
  maineContract?: HouseholdTaxInput["maineContract"];
  northDakotaContract?: HouseholdTaxInput["northDakotaContract"];
  oregonContract?: HouseholdTaxInput["oregonContract"];
  people: readonly YearPerson[];
  accounts: readonly YearAccount[];
  income: readonly HouseholdIncome[];
  spending: number;
  conversions: readonly RothTransfer[];
  withdrawalOrder: readonly string[];
  surplusAccountId: string;
  lossCarryover: CapitalLossCarryover;
  projection?: HouseholdTaxInput["projection"];
  contributions?: readonly YearContribution[];
  employerMatchPlans?: readonly EmployerMatchPlan[];
}>;

function closeEnough(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 1e-6 + Math.abs(expected) * Number.EPSILON * 32) {
    throw new RangeError(`${label} does not reconcile with the account balance.`);
  }
}

/** One connected year for explicitly supported contracts. All transactions
 * occur before annual growth, on the declared distribution date for age/holding
 * tests. Explicit contributions are deposited after withdrawals, before growth.
 * Not a survivor, monthly-timing or full-lifecycle model.
 */
export function runHouseholdYear(input: HouseholdYearInput) {
  const distributionDate = validatedDate(input.distributionDate);
  if (distributionDate.getUTCFullYear() !== input.year) throw new RangeError("Distribution date must be in the modeled year.");
  const people = new Map(input.people.map(person => [person.id, person]));
  if (people.size !== input.people.length) throw new RangeError("Person IDs must be unique.");
  for (const person of input.people) {
    finiteDollars(person.iraBasis, "Owner IRA basis");
    finiteDollars(person.iraAdditionalTaxExceptionAmount, "IRA exception");
    finiteDollars(person.rothAdditionalTaxExceptionAmount, "Roth exception");
    finiteDollars(person.roth.regularContributionBasis, "Roth contribution basis");
  }
  const accountIds = new Set(input.accounts.map(account => account.id));
  if (accountIds.size !== input.accounts.length) throw new RangeError("Account IDs must be unique.");
  const conversionOut = (id: string) => input.conversions.filter(item => item.sourceId === id).reduce((sum, item) => sum + item.amount, 0);
  const contributions = input.contributions ?? [];
  if (contributions.length > 100 || new Set(contributions.map(item => item.accountId)).size !== contributions.length) throw new RangeError("Contributions must be unique per account (maximum 100).");
  for (const item of contributions) {
    finiteDollars(item.amount, "Contribution");
    const account = input.accounts.find(account => account.id === item.accountId);
    if (!account || item.eligibility !== "externally-validated") throw new RangeError("Contributions require a known account and externally validated eligibility.");
    if (item.taxTreatment !== "after-tax" && item.taxTreatment !== "pretax-401k") throw new RangeError("Unsupported contribution tax treatment.");
    if (account.kind === "espp") throw new RangeError("ESPP purchases require a separate dated grant/purchase schedule.");
    if (item.iraDeductionLimit !== undefined) {
      finiteDollars(item.iraDeductionLimit, "IRA deduction limit");
      if (account.kind !== "traditional-ira" || item.iraDeductionLimit > item.amount) throw new RangeError("IRA deduction limit must fit a traditional IRA contribution.");
    }
    if ((item.taxTreatment === "pretax-401k") !== (account.kind === "401k")) throw new RangeError("Only pretax employee contributions are supported for traditional 401k accounts.");
    if (account.kind === "taxable") {
      if (!item.purchaseLot?.id.trim() || !Number.isFinite(item.purchaseLot.price) || item.purchaseLot.price <= 0
        || account.lots.some(lot => lot.id === item.purchaseLot!.id)) throw new RangeError("Brokerage contribution requires a unique new lot and positive purchase price.");
    } else if (item.purchaseLot) throw new RangeError("Purchase lots apply only to brokerage contributions.");
  }
  for (const account of input.accounts) {
    if (!people.has(account.ownerId)) throw new RangeError("Account has an unknown owner.");
    switch (account.kind) {
      case "cash":
        if (account.interestTreatment !== "none" && account.interestTreatment !== "taxable") throw new RangeError("Explicit cash-interest treatment is required.");
        if (account.annualReturn < 0 || (account.interestTreatment === "none" && account.annualReturn !== 0)) throw new RangeError("Cash returns must match their interest treatment.");
        break;
      case "taxable": {
        if (account.returnTreatment !== "price-only" || account.transactionFees !== 0) throw new RangeError("This ledger adapter requires explicit price-only returns and zero trading fees.");
        const ids = new Set<string>();
        let value = 0;
        for (const item of account.lots) {
          if (!item.id?.trim() || ids.has(item.id)) throw new RangeError("Lot IDs must be unique and present within an account.");
          ids.add(item.id);
          capitalLotSale(item.lot, 0, item.price, input.distributionDate);
          value = finiteDollars(value + item.lot.shares * item.price, "Account lot value");
        }
        closeEnough(value, account.balance, "Lot value");
        break;
      }
      case "espp":
        if (account.returnTreatment !== "price-only" || account.transactionFees !== 0) throw new RangeError("ESPP adapter requires price-only returns and zero fees.");
        esppLotSale(account.lot, 0, account.price, input.distributionDate);
        closeEnough(account.lot.shares * account.price, account.balance, "ESPP market value");
        break;
      case "401k":
        finiteDollars(account.afterTaxBasis, "Plan basis");
        if (typeof account.deferRmdWhileWorking !== "boolean") throw new RangeError("Explicit employer-plan RMD status is required.");
        if (account.afterTaxBasis > 0 && conversionOut(account.id) > 0) throw new RangeError("After-tax employer-plan rollover allocation is not yet supported.");
        break;
      case "annuity":
        if (account.treatment !== "post-1982-nonqualified-pre-annuity") throw new RangeError("Unsupported annuity treatment.");
        if (account.surrenderCharge !== 0) throw new RangeError("Charged annuity surrender needs a fee-aware cash ledger.");
        if (account.investmentInContract > account.balance) throw new RangeError("Underwater annuity surrender requires verified loss treatment before funding search.");
        break;
      case "traditional-ira": case "roth-ira": case "roth-401k": break;
      default: throw new RangeError("Unsupported account kind.");
    }
  }
  const requiredWithdrawals = input.accounts.flatMap(account => {
    if (account.kind !== "traditional-ira" && account.kind !== "401k") return [];
    finiteDollars(account.rmd.priorDecemberBalance, "Prior December balance");
    if (account.rmd.table !== "uniform" && account.rmd.table !== "joint-life") throw new RangeError("An explicit RMD table is required.");
    if (account.kind === "401k" && account.deferRmdWhileWorking) return [];
    const amount = requiredDistribution({ birthDate: people.get(account.ownerId)!.birthDate,
      year: input.year, priorDecemberBalance: account.rmd.priorDecemberBalance, accountType: account.kind,
      youngerSpouseSoleBeneficiary: account.rmd.table === "joint-life",
      jointLifeDivisor: account.rmd.table === "joint-life" ? account.rmd.divisor : undefined });
    return [{ accountId: account.id, amount }];
  });
  const ledgerIncome: CashIncome[] = input.income.map(item => ({ ...item,
    kind: ["wages", "pension", "social-security", "other"].includes(item.kind)
      ? item.kind as CashIncome["kind"] : "other" }));

  const evaluate = (context: TaxContext) => {
    const withdrawn = new Map(context.withdrawals.map(item => [item.accountId, item.total]));
    const ending = new Map(context.endingBalances.map(item => [item.accountId, item.amount]));
    const beforeGrowth = new Map(context.balancesBeforeGrowth.map(item => [item.accountId, item.amount]));
    const deposited = new Map((context.contributions ?? []).map(item => [item.accountId, item.amount]));
    const characters: TaxCharacter[] = [];
    const retirementIncome: RetirementIncomeItem[] = [];
    const recordRetirement = (ownerId: string, source: RetirementIncomeItem["source"], amount: number) => {
      if (amount > 0) retirementIncome.push({ ownerId, source, date: input.distributionDate, amount });
    };
    const nextAccounts: YearAccount[] = [];
    for (const account of input.accounts) {
      const amount = withdrawn.get(account.id)!;
      const deposit = deposited.get(account.id) ?? 0;
      const person = people.get(account.ownerId)!;
      const early = { birthDate: person.birthDate, distributionDate: input.distributionDate, additionalTaxExceptionAmount: 0 };
      const next = { ...account, balance: ending.get(account.id)! };
      switch (account.kind) {
        case "cash":
          if (account.interestTreatment === "taxable") characters.push(savingsInterest(Math.max(0, ending.get(account.id)! - beforeGrowth.get(account.id)!)));
          nextAccounts.push(next as YearAccount);
          break;
        case "taxable": {
          let remaining = amount;
          const lots = account.lots.map(item => {
            const sellValue = Math.min(remaining, item.lot.shares * item.price);
            const shares = item.price > 0 ? Math.min(item.lot.shares, sellValue / item.price) : 0;
            const sale = capitalLotSale(item.lot, shares, item.price, input.distributionDate);
            characters.push(sale.character);
            remaining = Math.max(0, remaining - sale.proceeds);
            return Object.freeze({ ...item, lot: sale.remainingLot, price: finiteDollars(item.price * (1 + account.annualReturn), "Ending share price") });
          });
          if (deposit > 0) {
            const purchase = contributions.find(item => item.accountId === account.id)!.purchaseLot!;
            lots.push(Object.freeze({ id: purchase.id,
              lot: Object.freeze({ shares: deposit / purchase.price, adjustedBasis: deposit, acquiredDate: input.distributionDate }),
              price: finiteDollars(purchase.price * (1 + account.annualReturn), "Ending purchased share price") }));
          }
          closeEnough(remaining, 0, "Unallocated sale proceeds");
          closeEnough(lots.reduce((sum, item) => sum + item.lot.shares * item.price, 0), next.balance, "Ending lot value");
          nextAccounts.push({ ...account, balance: next.balance, lots });
          break;
        }
        case "espp": {
          const shares = account.price > 0 ? Math.min(account.lot.shares, amount / account.price) : 0;
          const sale = esppLotSale(account.lot, shares, account.price, input.distributionDate);
          closeEnough(sale.proceeds, amount, "ESPP proceeds");
          characters.push(sale.character);
          nextAccounts.push({ ...account, balance: next.balance, lot: sale.remainingLot,
            price: finiteDollars(account.price * (1 + account.annualReturn), "Ending ESPP share price") });
          break;
        }
        case "401k": {
          const converted = conversionOut(account.id);
          const result = qualifiedPlanWithdrawal({ ...early, balance: account.balance - converted,
            withdrawal: amount, afterTaxBasis: account.afterTaxBasis, additionalTaxExceptionAmount: account.additionalTaxExceptionAmount });
          characters.push(result.character, taxCharacter({ retirementOrdinary: converted }));
          recordRetirement(account.ownerId, "401k", result.character.retirementOrdinary);
          recordRetirement(account.ownerId, "plan-conversion", converted);
          nextAccounts.push({ ...account, balance: next.balance, afterTaxBasis: result.remainingBasis,
            rmd: { ...account.rmd, priorDecemberBalance: next.balance } });
          break;
        }
        case "roth-401k": {
          const result = rothPlanWithdrawal({ ...early, ...account, withdrawal: amount });
          characters.push(result.character);
          recordRetirement(account.ownerId, "roth-401k", result.character.retirementOrdinary);
          nextAccounts.push({ ...account, balance: next.balance, contributionBasis: result.remainingBasis + deposit });
          break;
        }
        case "annuity": {
          const terms = { ...early, ...account, withdrawal: amount };
          const result = amount > 0 && amount === account.balance
            ? deferredAnnuitySurrender(terms) : deferredAnnuityWithdrawal(terms);
          if ("requiresLossReview" in result && result.requiresLossReview) throw new RangeError("Annuity loss cannot be silently ignored.");
          characters.push(result.character);
          recordRetirement(account.ownerId, "annuity", result.character.retirementOrdinary);
          nextAccounts.push({ ...account, balance: next.balance, investmentInContract: result.remainingBasis + deposit });
          break;
        }
        case "traditional-ira": nextAccounts.push({ ...account, balance: next.balance, rmd: { ...account.rmd, priorDecemberBalance: next.balance } }); break;
        case "roth-ira": nextAccounts.push(next as YearAccount); break;
      }
    }
    const conversionTax: { ownerId: string; taxable: number; nontaxable: number }[] = [];
    const nextPeople = input.people.map(person => {
      const iras = input.accounts.filter(account => account.ownerId === person.id && account.kind === "traditional-ira");
      const ira = traditionalIraOwnerYear({ ownerId: person.id, basis: person.iraBasis + iras.reduce((sum, account) => {
        const funded = deposited.get(account.id) ?? 0;
        return sum + funded - Math.min(funded, contributions.find(item => item.accountId === account.id)?.iraDeductionLimit ?? 0);
      }, 0),
        accounts: iras.map(account => ({ accountId: account.id, endingValue: ending.get(account.id)!,
          distributions: withdrawn.get(account.id)!, conversions: conversionOut(account.id) })) });
      characters.push(ira.character, taxCharacter({ additionalTaxBase: additionalTaxBase(ira.taxableDistributions,
        { birthDate: person.birthDate, distributionDate: input.distributionDate, additionalTaxExceptionAmount: person.iraAdditionalTaxExceptionAmount }) }));
      recordRetirement(person.id, "traditional-ira", ira.taxableDistributions);
      recordRetirement(person.id, "ira-conversion", ira.taxableConversions);
      const roths = input.accounts.filter(account => account.ownerId === person.id && account.kind === "roth-ira");
      const convertedPlan = input.accounts.filter(account => account.ownerId === person.id && account.kind === "401k")
        .reduce((sum, account) => sum + conversionOut(account.id), 0);
      const taxableConversion = ira.taxableConversions + convertedPlan;
      const nontaxableConversion = ira.nontaxableConversions;
      // Cash comes from the original transfers, not a floating-point sum of
      // their pro-rata tax character (which can reconstruct one ULP lower).
      const converted = input.conversions.filter(item => input.accounts.some(account => account.id === item.sourceId && account.ownerId === person.id))
        .reduce((sum, item) => sum + item.amount, 0);
      closeEnough(taxableConversion + nontaxableConversion, converted, "Conversion tax character");
      if (converted > 0) conversionTax.push({ ownerId: person.id, taxable: taxableConversion, nontaxable: nontaxableConversion });
      const rothDeposit = roths.reduce((sum, account) => sum + (deposited.get(account.id) ?? 0), 0);
      const rothBalance = roths.reduce((sum, account) => sum + account.balance, 0) + converted + rothDeposit;
      const rothWithdrawal = roths.reduce((sum, account) => sum + withdrawn.get(account.id)!, 0);
      if (roths.length === 0 && (person.roth.regularContributionBasis > 0 || person.roth.conversions.some(item => item.taxablePrincipal + item.nontaxablePrincipal > 0))) {
        throw new RangeError("Roth basis requires an owner Roth IRA account, which may have a zero balance.");
      }
      let nextRoth = person.roth;
      if (roths.length > 0) {
        if (person.roth.firstContributionYear === null && (rothBalance - converted - rothDeposit > 0 || person.roth.regularContributionBasis > 0 || person.roth.conversions.length > 0)) {
          throw new RangeError("Existing Roth balances/basis need their original first contribution year.");
        }
        const firstYear = person.roth.firstContributionYear ?? (converted + rothDeposit > 0 ? input.year : null);
        const result = rothIraWithdrawal({ birthDate: person.birthDate, distributionDate: input.distributionDate,
          additionalTaxExceptionAmount: person.rothAdditionalTaxExceptionAmount, balance: rothBalance,
          withdrawal: rothWithdrawal, regularContributionBasis: person.roth.regularContributionBasis + rothDeposit,
          firstContributionYear: firstYear ?? input.year,
          conversions: [...person.roth.conversions, ...(converted > 0
            ? [{ year: input.year, taxablePrincipal: taxableConversion, nontaxablePrincipal: nontaxableConversion }] : [])] });
        characters.push(result.character);
        recordRetirement(person.id, "roth-ira", result.character.retirementOrdinary);
        nextRoth = { firstContributionYear: firstYear, regularContributionBasis: result.remainingContributionBasis,
          conversions: result.remainingConversions };
      }
      return Object.freeze({ ...person, iraBasis: ira.remainingBasis, roth: Object.freeze(nextRoth) });
    });
    const accountIncome = sumTaxCharacter(characters);
    closeEnough(retirementIncome.reduce((sum, item) => sum + item.amount, 0), accountIncome.retirementOrdinary, "Retirement income attribution");
    const pretax401k = contributions.filter(item => item.taxTreatment === "pretax-401k").map(item => ({
      ownerId: input.accounts.find(account => account.id === item.accountId)!.ownerId, amount: deposited.get(item.accountId) ?? 0 }));
    const deductibleIra = contributions.filter(item => (item.iraDeductionLimit ?? 0) > 0).map(item => ({
      ownerId: input.accounts.find(account => account.id === item.accountId)!.ownerId,
      amount: Math.min(deposited.get(item.accountId) ?? 0, item.iraDeductionLimit!),
    }));
    const tax = estimateHouseholdTax({ ...input, accountIncome, retirementIncome, pretax401k, deductibleIra });
    return { tax, accountIncome, retirementIncome, nextAccounts, nextPeople, conversionTax };
  };

  const matchPlans = input.employerMatchPlans ?? [];
  validateEmployerMatchPlans(matchPlans, input.accounts, contributions, input.income.filter(item => item.kind === "wages"));
  const employeeCash = settleAnnualCashFlow({ ...input, income: ledgerIncome, requiredWithdrawals,
    calculateTax: context => evaluate(context).tax.total });
  const matched = depositEmployerMatches(employeeCash, input.accounts, matchPlans);
  const cash = matchPlans.length ? matched.cash : employeeCash;
  // Recompute from the CHOSEN settlement, never the last exploratory callback.
  const finalContext: TaxContext = {
    year: input.year, openingAccounts: input.accounts, income: ledgerIncome, conversions: cash.conversions,
    contributions: cash.accounts.map(account => ({ accountId: account.accountId, amount: account.contributionDeposit })),
    withdrawals: cash.accounts.map(account => ({ accountId: account.accountId, required: account.requiredWithdrawal,
      voluntary: account.voluntaryWithdrawal, total: account.requiredWithdrawal + account.voluntaryWithdrawal })),
    balancesBeforeGrowth: cash.accounts.map(account => ({ accountId: account.accountId, amount: account.beforeGrowth })),
    endingBalances: cash.accounts.map(account => ({ accountId: account.accountId, amount: account.ending })),
  };
  const final = evaluate(finalContext);
  closeEnough(final.tax.total, cash.tax, "Final tax");
  return Object.freeze({ cash, employerContributions: matched.employerContributions, employerMatches: matched.matches,
    tax: final.tax, accountIncome: final.accountIncome,
    retirementIncome: Object.freeze(final.retirementIncome.map(item => Object.freeze(item))),
    conversionTax: Object.freeze(final.conversionTax.map(item => Object.freeze(item))),
    nextState: Object.freeze({ accounts: Object.freeze(final.nextAccounts.map(account => Object.freeze(account))),
      people: Object.freeze(final.nextPeople), lossCarryover: final.tax.nextLossCarryover }),
    warnings: Object.freeze([...final.tax.warnings,
      "Annual transactions precede growth; pensions are fully taxable. Only explicit traditional 401k employee deferrals reduce wage income tax; contribution eligibility/limits require separate validation.",
      "Stock/ESPP returns are price-only and sales use supplied lot order with zero fees. Dividend cash must be supplied separately; reinvestment is not generated.",
      "Annuities require post-1982 nonqualified pre-annuity contracts/groups, no surrender charges and no underwater loss. Other treatments fail explicitly.",
    ]),
  });
}
