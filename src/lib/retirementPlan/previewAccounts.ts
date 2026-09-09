import type { YearAccount, YearPerson } from "./householdYear";
import { capitalLotSale, esppLotSale, rothIraWithdrawal, rothPlanWithdrawal } from "./accountTax";
import { validatedDate } from "./householdTax";

export const ACCOUNT_TYPES = [
  ["traditional-ira", "Traditional IRA"], ["401k", "Traditional 401(k)"],
  ["roth-ira", "Roth IRA"], ["roth-401k", "Roth 401(k)"],
  ["taxable", "Brokerage / managed account"], ["cash", "Cash / HYSA"],
  ["espp", "ESPP · Section 423"], ["annuity", "Deferred annuity · restricted"],
] as const;
export type AccountKind = typeof ACCOUNT_TYPES[number][0];
export type LotDraft = { id: string; shares: string; price: string; basis: string; acquired: string };
export type ConversionDraft = { id: string; year: string; taxable: string; nontaxable: string };
export type AccountDraft = { id: string; name: string; ownerId: "one" | "two"; kind: AccountKind; fields: Record<string, string>; lots: LotDraft[] };
export type OwnerBasisDraft = { iraBasis: string; rothBasis: string; rothFirstYear: string; conversions: ConversionDraft[] };
export type AccountEditorState = { accounts: AccountDraft[]; owners: Record<"one" | "two", OwnerBasisDraft> };

export function newAccountDraft(id: string, kind: AccountKind, ownerId: "one" | "two" = "one"): AccountDraft {
  return { id, name: ACCOUNT_TYPES.find(item => item[0] === kind)![1], kind, ownerId,
    fields: { balance: "0", returns: kind === "cash" ? "0" : "5", priorBalance: "0", planBasis: "0", firstYear: "",
      rmdTable: "uniform", deferRmd: "no", inPlanRollover: "no", contractBasis: "0", charge: "0", annuityTreatment: "supported",
      shares: "0", price: "0", purchasePrice: "0", offeringValue: "0", purchaseValue: "0", optionPrice: "0", offeringDate: "", purchaseDate: "" },
    lots: [] };
}
export function initialAccountEditor(): AccountEditorState {
  const emptyOwner = (): OwnerBasisDraft => ({ iraBasis: "0", rothBasis: "0", rothFirstYear: "", conversions: [] });
  const ira = newAccountDraft("one-ira", "traditional-ira");
  ira.name = "Person 1 IRA";
  ira.fields.balance = "500000";
  ira.fields.priorBalance = "500000";
  return { accounts: [ira], owners: { one: emptyOwner(), two: emptyOwner() } };
}

function amount(raw: string, label: string, min = 0, max = 1e9) {
  if (typeof raw !== "string" || !raw.trim()) throw new RangeError(`${label}: enter a value (use 0 if none).`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${label}: enter a finite value from ${min} to ${max}.`);
  return value;
}
function year(raw: string, label: string, startYear: number, earliest = 1998) {
  const value = amount(raw, label, earliest, startYear);
  if (!Number.isInteger(value)) throw new RangeError(`${label}: enter a whole calendar year.`);
  return value;
}
function date(raw: string, label: string, startYear: number) {
  try { validatedDate(raw); } catch { throw new RangeError(`${label}: enter a valid calendar date.`); }
  // Opening positions must already exist when the first complete year begins.
  if (raw > `${startYear}-01-01`) throw new RangeError(`${label}: opening positions must exist by January 1 of the first year.`);
  return raw;
}

/** Translate form strings into existing engine contracts. No tax formulas here. */
export function assemblePreviewAccounts(editor: AccountEditorState, people: readonly YearPerson[], startYear: number, reserveBalance: number) {
  if (editor.accounts.length > 30) throw new RangeError("The local editor supports up to 30 account cards.");
  const ids = new Set<string>();
  for (const draft of editor.accounts) {
    if (!/^[a-zA-Z0-9-]+$/.test(draft.id) || ids.has(draft.id) || draft.id === "cash" || draft.id.startsWith("owner-placeholder-")) throw new RangeError("Account IDs must be unique.");
    ids.add(draft.id);
    if (draft.ownerId !== "one" && draft.ownerId !== "two") throw new RangeError("Unknown account owner.");
  }
  const activeOwners = new Set(people.map(person => person.id));
  const drafts = editor.accounts.filter(draft => activeOwners.has(draft.ownerId));
  const built: YearAccount[] = drafts.map(draft => {
    const label = draft.name.trim();
    if (!label || label.length > 80) throw new RangeError("Account names must contain 1–80 characters.");
    const get = (key: string, name: string, min = 0, max = 1e9) => amount(draft.fields[key], `${label} · ${name}`, min, max);
    const annualReturn = get("returns", "annual return", draft.kind === "cash" || draft.kind === "annuity" ? 0 : -100, 1000) / 100;
    const common = { id: draft.id, ownerId: draft.ownerId, annualReturn };
    const balance = () => get("balance", "balance");
    const owner = people.find(person => person.id === draft.ownerId)!;
    switch (draft.kind) {
      case "cash": return { ...common, kind: "cash", balance: balance(), interestTreatment: annualReturn === 0 ? "none" : "taxable" };
      case "traditional-ira": case "401k": {
        if (draft.fields.rmdTable !== "uniform") throw new RangeError(`${label}: joint-life/inherited RMD inputs are not supported by this editor.`);
        const rmd = { table: "uniform" as const, priorDecemberBalance: get("priorBalance", "prior December 31 balance") };
        if (draft.kind === "traditional-ira") return { ...common, kind: "traditional-ira", balance: balance(), rmd };
        if (!["yes", "no"].includes(draft.fields.deferRmd)) throw new RangeError(`${label}: choose a work-deferral status.`);
        return { ...common, kind: "401k", balance: balance(), rmd, afterTaxBasis: get("planBasis", "plan after-tax basis"),
          deferRmdWhileWorking: draft.fields.deferRmd === "yes", additionalTaxExceptionAmount: 0 };
      }
      case "roth-ira": return { ...common, kind: "roth-ira", balance: balance() };
      case "roth-401k": {
        if (draft.fields.inPlanRollover !== "no") throw new RangeError(`${label}: Roth in-plan rollover recapture tracking is not supported.`);
        const account: YearAccount = { ...common, kind: "roth-401k", balance: balance(), contributionBasis: get("planBasis", "contribution basis"),
          firstContributionYear: year(draft.fields.firstYear, `${label} · first contribution year`, startYear, 2006), hasInPlanRollover: false, additionalTaxExceptionAmount: 0 };
        rothPlanWithdrawal({ ...account, birthDate: owner.birthDate, distributionDate: `${startYear}-12-31`, withdrawal: 0 });
        return account;
      }
      case "taxable": {
        if (draft.lots.length > 50) throw new RangeError(`${label}: maximum 50 identified lots.`);
        const lotIds = new Set<string>();
        const lots = draft.lots.map((item, index) => {
          const lotLabel = `${label} · lot ${index + 1}`;
          if (!/^[a-zA-Z0-9-]+$/.test(item.id) || lotIds.has(item.id)) throw new RangeError(`${label}: duplicate or invalid lot IDs.`);
          lotIds.add(item.id);
          const price = amount(item.price, `${lotLabel} price`);
          const lot = { shares: amount(item.shares, `${lotLabel} shares`), adjustedBasis: amount(item.basis, `${lotLabel} total adjusted basis`),
            acquiredDate: date(item.acquired, `${lotLabel} acquisition date`, startYear) };
          capitalLotSale(lot, 0, price, `${startYear}-12-31`);
          return { id: item.id, lot, price };
        });
        const total = lots.reduce((sum, item) => sum + item.lot.shares * item.price, 0);
        amount(String(total), `${label} computed market value`);
        return { ...common, kind: "taxable", balance: total, lots, returnTreatment: "price-only", transactionFees: 0 };
      }
      case "espp": {
        const price = get("price", "current share price");
        const lot = { shares: get("shares", "shares"), purchasePrice: get("purchasePrice", "purchase price per share"),
          offeringFairMarketValue: get("offeringValue", "offering-date FMV per share"), purchaseFairMarketValue: get("purchaseValue", "purchase-date FMV per share"),
          offeringOptionPrice: get("optionPrice", "offering-date option price per share"),
          offeringDate: date(draft.fields.offeringDate, `${label} offering date`, startYear), purchaseDate: date(draft.fields.purchaseDate, `${label} purchase date`, startYear) };
        esppLotSale(lot, 0, price, `${startYear}-12-31`);
        const total = amount(String(lot.shares * price), `${label} computed market value`);
        return { ...common, kind: "espp", balance: total, lot, price, returnTreatment: "price-only", transactionFees: 0 };
      }
      case "annuity": {
        if (draft.fields.annuityTreatment !== "supported") throw new RangeError(`${label}: only post-1982 nonqualified pre-annuitization contracts are supported.`);
        if (get("charge", "surrender charge") !== 0) throw new RangeError(`${label}: surrender charges require an unsupported fee-aware model.`);
        const investmentInContract = get("contractBasis", "investment in contract");
        if (investmentInContract > balance()) throw new RangeError(`${label}: underwater annuity loss treatment is not supported.`);
        return { ...common, kind: "annuity", balance: balance(), investmentInContract, surrenderCharge: 0,
          additionalTaxExceptionAmount: 0, treatment: "post-1982-nonqualified-pre-annuity" };
      }
      default: throw new RangeError(`${label}: unsupported account type.`);
    }
  });
  const updatedPeople = people.map(person => {
    const basis = editor.owners[person.id as "one" | "two"];
    if (!basis) throw new RangeError("Owner tax-basis information is missing.");
    const owned = built.filter(account => account.ownerId === person.id);
    const iraBasis = amount(basis.iraBasis, `Person ${person.id === "one" ? 1 : 2} · total IRA basis`);
    if (iraBasis > 0 && !owned.some(account => account.kind === "traditional-ira")) throw new RangeError("Keep a traditional IRA account (which may have zero balance) for an owner's remaining IRA basis.");
    const rothBasis = amount(basis.rothBasis, "Owner Roth contribution basis");
    if (basis.conversions.length > 100) throw new RangeError("Maximum 100 Roth conversion history entries per owner.");
    if (new Set(basis.conversions.map(item => item.id)).size !== basis.conversions.length
      || basis.conversions.some(item => !/^[a-zA-Z0-9-]+$/.test(item.id))) throw new RangeError("Duplicate or invalid conversion entry IDs.");
    const conversions = basis.conversions.map(item => ({ year: year(item.year, "Roth conversion year", startYear),
      taxablePrincipal: amount(item.taxable, "Remaining taxable conversion principal"),
      nontaxablePrincipal: amount(item.nontaxable, "Remaining nontaxable conversion principal") }));
    const roths = owned.filter(account => account.kind === "roth-ira");
    if (!roths.length && (rothBasis > 0 || conversions.length > 0 || basis.rothFirstYear.trim())) throw new RangeError("Keep a Roth IRA account for an owner's Roth history, or clear that history explicitly.");
    const firstYear = basis.rothFirstYear.trim() ? year(basis.rothFirstYear, "Owner first Roth IRA contribution year", startYear) : null;
    const rothBalance = roths.reduce((sum, account) => sum + account.balance, 0);
    if ((rothBalance > 0 || rothBasis > 0 || conversions.length > 0) && firstYear === null) throw new RangeError("Enter the owner's first Roth IRA contribution year; it cannot be inferred from account balance.");
    if (roths.length) rothIraWithdrawal({ balance: rothBalance, regularContributionBasis: rothBasis, conversions,
      firstContributionYear: firstYear ?? startYear, birthDate: person.birthDate, distributionDate: `${startYear}-12-31`, withdrawal: 0, additionalTaxExceptionAmount: 0 });
    return { ...person, iraBasis, roth: { firstContributionYear: firstYear, regularContributionBasis: rothBasis, conversions } };
  });
  const accounts: YearAccount[] = [{ id: "cash", ownerId: "one", kind: "cash", balance: reserveBalance, annualReturn: 0, interestTreatment: "none" }, ...built];
  // Ledger requires an account for each income owner. Zero placeholders are not
  // invented assets and are excluded from the withdrawal order and editor list.
  for (const person of people) if (!accounts.some(account => account.ownerId === person.id)) accounts.push({
    id: `owner-placeholder-${person.id}`, ownerId: person.id, kind: "cash", balance: 0, annualReturn: 0, interestTreatment: "none" });
  return { accounts, people: updatedPeople, withdrawalOrder: ["cash", ...built.map(account => account.id)] };
}
