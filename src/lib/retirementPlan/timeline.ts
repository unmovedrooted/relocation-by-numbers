import { runHouseholdYear, type HouseholdYearInput, type YearAccount, type YearContribution, type YearPerson } from "./householdYear";
import { finiteDollars, taxProjectionFactors, validatedDate, type HouseholdIncome, type TaxProjectionPolicy } from "./householdTax";
import { ageAtYearEnd } from "./rules";
import { pensionEligibilityDate } from "./pensionEligibilityDate";
import type { RothTransfer } from "./cashFlow";
import type { EmployerMatchPlan } from "./employerMatchLedger";
import { runEligibleContributions, type IraOwnerPolicy } from "./eligibleContributions2026";
import { calculateIrmaa, irmaaMagi, type IrmaaTimelinePolicy, type IrmaaTaxRecord } from "./irmaa";

type DatedAmount = Readonly<{
  id: string;
  /** Full-year amount in START-YEAR dollars, even if the stream starts later. */
  annualAmount: number;
  annualGrowth: number;
  startDate: string;
  /** Exclusive; null means through the horizon (wages still stop at retirement). */
  endDate: string | null;
}>;
export type TimelineIncome = DatedAmount & Pick<HouseholdIncome, "ownerId" | "kind" | "pensionType">;
export type TimelineContribution = DatedAmount & Omit<YearContribution, "amount" | "purchaseLot"> & Readonly<{
  /** Brokerage purchase prices are explicit, not guessed from unrelated lots. */
  purchasePrices?: Readonly<Record<number, number>>;
}>;
export type ContributionCapacity = Readonly<{
  year: number;
  ownerId: string;
  /** Explicit externally validated capacities, including any catch-up/phaseout.
   * Projected years require conservative scenario capacities, not guessed law.
   */
  planEmployee: number;
  iraCombined: number;
  rothIra: number;
}>;
export type TimelineInput = Readonly<{
  startYear: number;
  endYear: number;
  spendingAnnual: number;
  inflation: number;
  taxProjection: TaxProjectionPolicy;
  filing: HouseholdYearInput["filing"];
  state: HouseholdYearInput["state"];
  stateTreatment: HouseholdYearInput["stateTreatment"];
  cityId?: string;
  newYorkContract?: HouseholdYearInput["newYorkContract"];
  marylandContract?: HouseholdYearInput["marylandContract"];
  indianaContract?: HouseholdYearInput["indianaContract"];
  dcContract?: HouseholdYearInput["dcContract"];
  illinoisContract?: HouseholdYearInput["illinoisContract"];
  newJerseyContract?: HouseholdYearInput["newJerseyContract"];
  pennsylvaniaContract?: HouseholdYearInput["pennsylvaniaContract"];
  coloradoContract?: HouseholdYearInput["coloradoContract"];
  newMexicoContract?: HouseholdYearInput["newMexicoContract"];
  minnesotaContract?: HouseholdYearInput["minnesotaContract"];
  utahContract?: HouseholdYearInput["utahContract"];
  people: readonly YearPerson[];
  retirementDates: Readonly<Record<string, string>>;
  accounts: readonly YearAccount[];
  /** Optional complete nominal return path. Every year/account must be supplied. */
  annualReturnsByYear?: Readonly<Record<number, Readonly<Record<string, number>>>>;
  income: readonly TimelineIncome[];
  contributions: readonly TimelineContribution[];
  contributionCapacities: readonly ContributionCapacity[];
  withdrawalOrder: readonly string[];
  surplusAccountId: string;
  lossCarryover: HouseholdYearInput["lossCarryover"];
  /** Fixed candidate schedule for internal policy evaluation, not an optimizer. */
  conversionsByYear?: Readonly<Record<number, readonly RothTransfer[]>>;
  /** Explicit verified annual terms; omitted years have no employer match. */
  employerMatchesByYear?: Readonly<Record<number, readonly EmployerMatchPlan[]>>;
  /** Opt-in annual IRA coverage/account policies; absence keeps legacy capacities.
   * Active modeled IRA deposits use computed eligibility instead of manual IRA caps.
   */
  iraPoliciesByYear?: Readonly<Record<number, readonly IraOwnerPolicy[]>>;
  irmaa?: IrmaaTimelinePolicy;
  /** Never reuse one spouse-age-dependent divisor across future years. */
  jointLifeDivisors?: Readonly<Record<string, Readonly<Record<number, number>>>>;
  timing: "calendar-day-proration-annual-growth";
}>;

function growth(value: number, label: string) {
  if (!Number.isFinite(value) || value < -0.2 || value > 0.2) throw new RangeError(`${label} must be a decimal from -0.2 to 0.2.`);
}

/** Calendar-day proration; UTC arithmetic avoids daylight-saving errors. */
export function activeYearFraction(year: number, startDate: string, endDate: string | null) {
  if (!Number.isInteger(year) || year < 2026 || year > 2126) throw new RangeError("Unsupported schedule year.");
  const start = validatedDate(startDate).getTime();
  const end = endDate === null ? Infinity : validatedDate(endDate).getTime();
  if (end < start) throw new RangeError("Schedule end precedes its start.");
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year + 1, 0, 1);
  return Math.max(0, Math.min(end, yearEnd) - Math.max(start, yearStart)) / (yearEnd - yearStart);
}

function earlier(first: string | null, second: string) {
  return first === null || second < first ? second : first;
}

export function runRetirementTimeline(input: TimelineInput) {
  if (!Number.isInteger(input.startYear) || !Number.isInteger(input.endYear) || input.startYear < 2026
    || input.endYear > 2126 || input.endYear < input.startYear || input.endYear - input.startYear > 100) throw new RangeError("Timeline needs an ordered 2026–2126 horizon of at most 101 years.");
  if (input.timing !== "calendar-day-proration-annual-growth") throw new RangeError("Explicit annual timing is required.");
  if (!input.taxProjection) throw new RangeError("An explicit future-tax projection policy is required.");
  taxProjectionFactors(input.endYear, input.taxProjection);
  finiteDollars(input.spendingAnnual, "Annual spending");
  growth(input.inflation, "Inflation");
  if (input.people.length < 1 || input.people.length > 2 || input.accounts.length > 100
    || input.income.length > 100 || input.contributions.length > 100) throw new RangeError("Too many people/accounts/schedules.");
  const owners = new Set(input.people.map(person => person.id));
  if (owners.size !== input.people.length) throw new RangeError("Duplicate person IDs.");
  for (const person of input.people) {
    validatedDate(person.birthDate);
    const retirement = input.retirementDates[person.id];
    validatedDate(retirement);
    if (retirement < person.birthDate) throw new RangeError("Retirement cannot precede birth.");
    if (person.iraAdditionalTaxExceptionAmount !== 0 || person.rothAdditionalTaxExceptionAmount !== 0) throw new RangeError("Annual exception allowances cannot be carried automatically; a dated exception schedule is required.");
  }
  for (const ownerId of Object.keys(input.retirementDates)) {
    if (!owners.has(ownerId)) throw new RangeError("Unknown retirement-date owner.");
  }
  const accountsById = new Map(input.accounts.map(account => [account.id, account]));
  if (accountsById.size !== input.accounts.length) throw new RangeError("Duplicate account IDs.");
  if (input.annualReturnsByYear !== undefined) {
    const path = input.annualReturnsByYear;
    if (Object.keys(path).length !== input.endYear - input.startYear + 1) throw new RangeError("Return path must cover every year exactly.");
    for (let year = input.startYear; year <= input.endYear; year++) {
      const values = path[year];
      if (!values || Object.keys(values).length !== accountsById.size
        || [...accountsById.keys()].some(id => !Object.hasOwn(values, id))) throw new RangeError("Return path must cover every account exactly.");
      for (const value of Object.values(values)) {
        if (!Number.isFinite(value) || value < -1 || value > 10) throw new RangeError("Return path values must be decimals between -1 and 10.");
      }
    }
  }
  for (const account of input.accounts) {
    if (!owners.has(account.ownerId)) throw new RangeError("Unknown account owner.");
    if ("additionalTaxExceptionAmount" in account && account.additionalTaxExceptionAmount !== 0) throw new RangeError("Account exception allowances need a dated schedule.");
  }
  const scheduleIds = new Set<string>();
  for (const schedule of [...input.income, ...input.contributions]) {
    if (!schedule.id?.trim() || scheduleIds.has(schedule.id)) throw new RangeError("Schedule IDs must be unique and present.");
    scheduleIds.add(schedule.id);
    finiteDollars(schedule.annualAmount, "Scheduled amount");
    growth(schedule.annualGrowth, "Schedule growth");
    activeYearFraction(input.startYear, schedule.startDate, schedule.endDate);
    const owner = "ownerId" in schedule ? schedule.ownerId : accountsById.get(schedule.accountId)?.ownerId;
    if (!owner || !owners.has(owner)) throw new RangeError("Unknown schedule owner/account.");
    if (schedule.startDate < input.people.find(person => person.id === owner)!.birthDate) throw new RangeError("Schedule cannot precede birth.");
  }
  if (new Set(input.contributions.map(item => item.accountId)).size !== input.contributions.length) throw new RangeError("Use one contribution schedule per account.");
  for (const schedule of input.contributions) {
    if (schedule.iraDeductionLimit !== undefined) throw new RangeError("IRA deduction eligibility must be recalculated per year; a fixed timeline deduction limit is unsupported.");
    const account = accountsById.get(schedule.accountId)!;
    if (schedule.eligibility !== "externally-validated"
      || !["pretax-401k", "after-tax"].includes(schedule.taxTreatment)) throw new RangeError("Contribution eligibility and tax treatment must be explicit.");
    if (account.kind === "espp") throw new RangeError("ESPP contributions require a grant/purchase schedule.");
    if ((account.kind === "401k") !== (schedule.taxTreatment === "pretax-401k")) throw new RangeError("Traditional 401k contributions must be pretax; all other supported deposits are after-tax.");
    if (account.kind !== "taxable" && schedule.purchasePrices) throw new RangeError("Purchase prices apply only to brokerage contributions.");
  }
  const capacities = new Map<string, ContributionCapacity>();
  for (const capacity of input.contributionCapacities) {
    if (!Number.isInteger(capacity.year) || capacity.year < input.startYear || capacity.year > input.endYear || !owners.has(capacity.ownerId)) throw new RangeError("Capacity has an unknown year/owner.");
    const key = `${capacity.year}:${capacity.ownerId}`;
    if (capacities.has(key)) throw new RangeError("Duplicate owner/year contribution capacity.");
    for (const value of [capacity.planEmployee, capacity.iraCombined, capacity.rothIra]) finiteDollars(value, "Contribution capacity");
    capacities.set(key, capacity);
  }
  for (const year of Object.keys(input.conversionsByYear ?? {}).map(Number)) {
    if (!Number.isInteger(year) || year < input.startYear || year > input.endYear) throw new RangeError("Conversion schedule lies outside the horizon.");
  }
  let people = input.people;
  for (const year of Object.keys(input.employerMatchesByYear ?? {}).map(Number)) {
    if (!Number.isInteger(year) || year < input.startYear || year > input.endYear) throw new RangeError("Employer match schedule lies outside the horizon.");
  }
  let accounts = input.accounts;
  let lossCarryover = input.lossCarryover;
  for (const [key, policies] of Object.entries(input.iraPoliciesByYear ?? {})) {
    const year = Number(key);
    if (!Number.isInteger(year) || year < input.startYear || year > input.endYear
      || new Set(policies.map(item => item.ownerId)).size !== policies.length
      || policies.some(item => !owners.has(item.ownerId))) throw new RangeError("Invalid annual IRA policy year/owner.");
  }
  const irmaaHistory = new Map<number, IrmaaTaxRecord>();
  if (input.irmaa) {
    if (input.irmaa.budgetTreatment !== "surcharges-outside-spending") throw new RangeError("Explicit IRMAA budget treatment is required to avoid double counting.");
    if (!Number.isFinite(input.irmaa.annualSurchargeGrowth) || input.irmaa.annualSurchargeGrowth < 0 || input.irmaa.annualSurchargeGrowth > .2) throw new RangeError("Invalid IRMAA premium projection rate.");
    for (const record of input.irmaa.historicalIncome) {
      if (!Number.isInteger(record.taxYear) || record.taxYear < input.startYear - 2 || record.taxYear >= input.startYear
        || irmaaHistory.has(record.taxYear) || !["single", "married"].includes(record.filing)) throw new RangeError("Historical IRMAA income needs unique pre-projection tax years and supported filing status.");
      finiteDollars(record.magi, "Historical IRMAA MAGI", true);
      irmaaHistory.set(record.taxYear, { ...record });
    }
    for (const [key, enrolled] of Object.entries(input.irmaa.enrollmentByYear)) {
      const year = Number(key);
      if (!Number.isInteger(year) || year < input.startYear || year > input.endYear
        || new Set(enrolled.map(item => item.ownerId)).size !== enrolled.length) throw new RangeError("Invalid Medicare enrollment year or duplicate owner.");
      for (const item of enrolled) {
        if (!owners.has(item.ownerId) || ![item.partBMonths, item.partDMonths].every(months => Number.isInteger(months) && months >= 0 && months <= 12)) throw new RangeError("Medicare enrollment requires a known owner and 0–12 whole months for each part.");
      }
    }
  }
  const years = [];
  for (let year = input.startYear; year <= input.endYear; year++) {
    const factor = (1 + input.inflation) ** (year - input.startYear);
    const baseSpending = finiteDollars(input.spendingAnnual * factor, "Projected spending");
    const irmaa = (input.irmaa?.enrollmentByYear[year] ?? []).filter(item => item.partBMonths + item.partDMonths > 0).map(item => {
      const record = irmaaHistory.get(year - 2);
      if (!record) throw new RangeError(`Missing ${year - 2} MAGI for ${year} IRMAA; income is never guessed.`);
      return Object.freeze({ ownerId: item.ownerId, ...calculateIrmaa({ premiumYear: year, income: record,
        partBMonths: item.partBMonths, partDMonths: item.partDMonths, projection: input.taxProjection,
        annualSurchargeGrowth: input.irmaa!.annualSurchargeGrowth }) });
    });
    const irmaaSurcharges = finiteDollars(irmaa.reduce((sum, item) => sum + item.total, 0), "Household IRMAA");
    const spending = finiteDollars(baseSpending + irmaaSurcharges, "Spending plus IRMAA");
    const annualAmount = (schedule: DatedAmount, endDate: string | null) => {
      // A retirement before a future schedule means no activity, not reversed dates.
      if (endDate !== null && endDate <= schedule.startDate) return 0;
      return finiteDollars(schedule.annualAmount * (1 + schedule.annualGrowth) ** (year - input.startYear)
        * activeYearFraction(year, schedule.startDate, endDate), "Projected schedule amount");
    };
    const income = input.income.map(schedule => ({ ownerId: schedule.ownerId, kind: schedule.kind,
      pensionType: schedule.pensionType,
      ...(input.state === "ny" && schedule.kind === "pension" ? {
        pensionAfter59Half: annualAmount({ ...schedule, startDate: [schedule.startDate,
          pensionEligibilityDate(input.people.find(person => person.id === schedule.ownerId)!.birthDate)].sort().at(-1)! }, schedule.endDate),
      } : {}),
      amount: annualAmount(schedule, schedule.kind === "wages" ? earlier(schedule.endDate, input.retirementDates[schedule.ownerId]) : schedule.endDate) }));
    const desired = input.contributions.map(schedule => {
      const account = accountsById.get(schedule.accountId)!;
      return { schedule, account, requested: annualAmount(schedule, earlier(schedule.endDate, input.retirementDates[account.ownerId])), allowed: 0 };
    });
    for (const item of desired) item.allowed = item.requested;
    const annualIraPolicies = input.iraPoliciesByYear?.[year] ?? [];
    const capGroup = (group: typeof desired, limit: number) => {
      const total = finiteDollars(group.reduce((sum, item) => sum + item.allowed, 0), "Grouped contributions");
      if (total > limit) for (const item of group) item.allowed *= limit / total;
    };
    for (const person of people) {
      const owned = desired.filter(item => item.account.ownerId === person.id);
      const plans = owned.filter(item => item.account.kind === "401k" || item.account.kind === "roth-401k");
      const iras = owned.filter(item => item.account.kind === "traditional-ira" || item.account.kind === "roth-ira");
      if (![...plans, ...iras].some(item => item.requested > 0)) continue;
      const capacity = capacities.get(`${year}:${person.id}`);
      const automaticIra = annualIraPolicies.some(policy => policy.ownerId === person.id);
      if (!capacity && (plans.some(item => item.requested > 0) || !automaticIra)) throw new RangeError(`Missing explicit contribution capacity for ${person.id} in ${year}.`);
      const wages = income.filter(item => item.ownerId === person.id && item.kind === "wages").reduce((sum, item) => sum + item.amount, 0);
      capGroup(plans, Math.min(capacity?.planEmployee ?? 0, wages));
      if (automaticIra) continue; // Actual funded pretax deferrals/MAGI determine IRA room below.
      capGroup(iras.filter(item => item.account.kind === "roth-ira"), capacity!.rothIra);
      const pretax = plans.filter(item => item.schedule.taxTreatment === "pretax-401k").reduce((sum, item) => sum + item.allowed, 0);
      // Conservative own taxable-compensation limit; no inferred spousal IRA eligibility.
      capGroup(iras, Math.min(capacity!.iraCombined, Math.max(0, wages - pretax)));
    }
    const contributions: YearContribution[] = desired.map(({ schedule, account, allowed }) => {
      const price = schedule.purchasePrices?.[year];
      return { accountId: schedule.accountId, amount: allowed, taxTreatment: schedule.taxTreatment, eligibility: schedule.eligibility,
        ...(account.kind === "taxable" && allowed > 0 ? { purchaseLot: { id: `contribution:${schedule.id}:${year}`, price: price! } } : {}) };
    }).filter(item => item.amount > 0);
    const accountsWithReturns = input.annualReturnsByYear
      ? accounts.map(account => ({ ...account, annualReturn: input.annualReturnsByYear![year][account.id] })) : accounts;
    const yearAccounts = accountsWithReturns.map(account => {
      if (account.kind !== "traditional-ira" && account.kind !== "401k") return account;
      const rmd = account.rmd.table === "joint-life"
        ? { ...account.rmd, divisor: input.jointLifeDivisors?.[account.id]?.[year] ?? NaN } : account.rmd;
      if (rmd.table === "joint-life" && (!Number.isFinite(rmd.divisor) || rmd.divisor <= 0)) throw new RangeError(`A current-year joint-life divisor is required for ${account.id} in ${year}.`);
      return account.kind === "401k"
        ? { ...account, rmd, deferRmdWhileWorking: account.deferRmdWhileWorking && input.retirementDates[account.ownerId] > `${year}-12-31` }
        : { ...account, rmd };
    });
    const yearInput: HouseholdYearInput = { year, distributionDate: `${year}-12-31`, filing: input.filing, state: input.state,
      stateTreatment: input.stateTreatment, cityId: input.cityId, newYorkContract: input.newYorkContract, marylandContract: input.marylandContract, indianaContract: input.indianaContract, dcContract: input.dcContract, illinoisContract: input.illinoisContract, newJerseyContract: input.newJerseyContract, pennsylvaniaContract: input.pennsylvaniaContract, coloradoContract: input.coloradoContract, newMexicoContract: input.newMexicoContract, minnesotaContract: input.minnesotaContract, utahContract: input.utahContract, projection: input.taxProjection, people, accounts: yearAccounts, income,
      spending, contributions, conversions: input.conversionsByYear?.[year] ?? [], withdrawalOrder: input.withdrawalOrder,
      surplusAccountId: input.surplusAccountId, lossCarryover, employerMatchPlans: input.employerMatchesByYear?.[year] };
    const activeIraPolicies = annualIraPolicies.filter(policy => desired.some(item => item.account.ownerId === policy.ownerId
      && ["traditional-ira", "roth-ira"].includes(item.account.kind) && item.allowed > 0));
    const integrated = activeIraPolicies.length ? runEligibleContributions(yearInput, activeIraPolicies) : null;
    const result = integrated ?? runHouseholdYear(yearInput);
    if (integrated) for (const item of desired) {
      item.allowed = integrated.eligibleContributions.find(contribution => contribution.accountId === item.account.id)?.amount ?? 0;
    }
    const currentIrmaaMagi = irmaaMagi(result.tax.agi, income.filter(item => item.kind === "tax-exempt-interest").reduce((sum, item) => sum + item.amount, 0));
    irmaaHistory.set(year, { taxYear: year, filing: input.filing, magi: currentIrmaaMagi });
    const openingPortfolio = finiteDollars(accounts.reduce((sum, account) => sum + account.balance, 0), "Opening portfolio");
    const endingPortfolio = finiteDollars(result.nextState.accounts.reduce((sum, account) => sum + account.balance, 0), "Ending portfolio");
    const investmentChange = result.cash.accounts.reduce((sum, account) => sum + account.investmentChange, 0);
    const reconciliationResidual = openingPortfolio + result.cash.income + result.employerContributions + result.cash.shortfall - spending - result.tax.total + investmentChange - endingPortfolio;
    if (Math.abs(reconciliationResidual) > 1e-5 + 128 * Number.EPSILON * Math.max(openingPortfolio, endingPortfolio)) throw new RangeError("Timeline wealth does not reconcile.");
    years.push(Object.freeze({ year, inflationFactor: factor, spending, baseSpending, irmaaSurcharges,
      irmaa: Object.freeze(irmaa), irmaaMagi: currentIrmaaMagi, income: Object.freeze(income.map(item => Object.freeze(item))),
      people: Object.freeze(people.map(person => Object.freeze({ id: person.id, ageAtYearEnd: ageAtYearEnd(person.birthDate, year),
        retiredAtYearEnd: input.retirementDates[person.id] <= `${year}-12-31` }))),
      contributions: Object.freeze(desired.map(item => Object.freeze({ accountId: item.account.id, requested: item.requested, eligible: item.allowed,
        funded: result.cash.accounts.find(account => account.accountId === item.account.id)!.contributionDeposit }))),
      openingPortfolio, endingPortfolio, endingPortfolioInStartYearDollars: endingPortfolio / factor, reconciliationResidual, result }));
    accounts = result.nextState.accounts;
    people = result.nextState.people;
    lossCarryover = result.nextState.lossCarryover;
  }
  const failed = years.find(row => !row.result.cash.spendingFunded);
  return Object.freeze({ years: Object.freeze(years), allYearsFunded: !failed, firstUnfundedYear: failed?.year ?? null,
    allRmdsSatisfied: years.every(row => row.result.cash.requiredWithdrawalsSatisfied),
    nextState: years[years.length - 1].result.nextState,
    warnings: Object.freeze([...new Set(years.flatMap(row => row.result.warnings)),
      "Income/contribution timing uses calendar-day proration; distributions and new lots use December 31 holding/age tests, followed by full annual growth. This is not monthly transaction timing.",
      "Workplace capacities and employer-match terms are externally verified. Opt-in annual IRA policies compute projected eligibility only for supported wages/pensions without investment income, conversions, withdrawals or spousal compensation; other IRA capacities remain external assumptions.",
      input.irmaa ? "IRMAA adds only B/D surcharges to spending, per explicit enrolled months, using two-year-old AGI plus tax-exempt interest. Base premiums remain in the budget; appeals, three-year fallback, late penalties and special coverage are not modeled. Future surcharges/thresholds are scenarios, not published Medicare bills." : "IRMAA is not included unless explicit enrollment and income-history assumptions are supplied.",
      "Spending/taxes take priority: contribution requests are capped then proportionally reduced to available external income. No retirement withdrawals fund contributions.",
      "Unfunded spending is reported, not borrowed. Later income cannot erase a prior failure. No survivor transitions or strategy optimization are performed.",
    ]),
  });
}
