import { describe, expect, it } from "vitest";
import { initialAccountEditor, newAccountDraft, type AccountDraft, type AccountKind } from "./previewAccounts";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";

const short = { ...PREVIEW_DEFAULTS, endYear: "2026", spending: "0" };
function valid(kind: AccountKind): AccountDraft {
  const draft = newAccountDraft("asset", kind);
  draft.fields = { ...draft.fields, balance: "10000", returns: "0", priorBalance: "12000", planBasis: "2000", firstYear: "2010",
    contractBasis: "6000", shares: "100", price: "30", purchasePrice: "20", offeringValue: "22", purchaseValue: "23", optionPrice: "20",
    offeringDate: "2020-01-01", purchaseDate: "2021-07-01" };
  draft.lots = [{ id: "lot-one", shares: "100", price: "30", basis: "2000", acquired: "2020-01-01" }];
  return draft;
}
function setup(kind: AccountKind) {
  const editor = initialAccountEditor();
  editor.accounts = [valid(kind)];
  if (kind === "roth-ira") editor.owners.one = { iraBasis: "0", rothBasis: "2000", rothFirstYear: "2010", conversions: [] };
  return editor;
}

describe("Preview account editor contracts", () => {
  it("preserves the original example exactly when the editor is first introduced", () => {
    expect(calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor())).toEqual(calculatePreview(PREVIEW_DEFAULTS));
  });
  it.each(["cash", "traditional-ira", "401k", "roth-ira", "roth-401k", "taxable", "espp", "annuity"] as const)("connects %s to the existing engine and reconciles actual balances", kind => {
    const editor = setup(kind);
    const result = calculatePreview(short, editor);
    expect(result.nextState.accounts.find(account => account.id === "asset")!.kind).toBe(kind);
    expect(result.years[0].reconciliationResidual).toBeCloseTo(0, 7);
    expect(result.nextState.accounts.every(account => Number.isFinite(account.balance) && account.balance >= 0)).toBe(true);
  });
  it("uses per-account returns and balances, ignoring obsolete scalar account controls", () => {
    const editor = setup("traditional-ira");
    editor.accounts[0].fields.balance = "10000.123400";
    editor.accounts[0].fields.returns = "3.12500";
    const input = buildPreviewInput({ ...short, returns: "", "one-ira": "" }, editor);
    expect(input.accounts[1]).toMatchObject({ balance: 10000.1234, annualReturn: 0.03125, rmd: { priorDecemberBalance: 12000 } });
    expect(editor.accounts[0].fields.balance).toBe("10000.123400");
  });
  it("derives brokerage value from each lot without inventing account-average basis", () => {
    const editor = setup("taxable");
    editor.accounts[0].fields.balance = "not used";
    editor.accounts[0].lots.push({ id: "lot-two", shares: "2.5", price: "40", basis: "80.1250", acquired: "2025-12-01" });
    const account = buildPreviewInput(short, editor).accounts[1];
    expect(account).toMatchObject({ balance: 3100, lots: [
      { id: "lot-one", lot: { adjustedBasis: 2000, shares: 100 } }, { id: "lot-two", lot: { adjustedBasis: 80.125, shares: 2.5 } }] });
  });
  it("preserves Section 423 data and obtains the existing compensation/gain split", () => {
    const editor = setup("espp");
    const result = calculatePreview({ ...short, cash: "0", spending: "100000", "one-salary": "0" }, editor);
    expect(result.years[0].result.accountIncome.esppCompensation).toBe(200);
    expect(result.years[0].result.accountIncome.longTermGain).toBe(800);
    expect(result.years[0].result.cash.voluntaryWithdrawals).toBe(3000);
  });
  it("stores IRA basis once per owner across multiple traditional IRAs", () => {
    const editor = setup("traditional-ira");
    editor.accounts.push({ ...valid("traditional-ira"), id: "second-ira" });
    editor.owners.one.iraBasis = "4000";
    const input = buildPreviewInput(short, editor);
    expect(input.people[0].iraBasis).toBe(4000);
    expect(input.accounts.slice(1).some(account => "iraBasis" in account)).toBe(false);
    const result = calculatePreview({ ...short, cash: "0", spending: "100000", "one-salary": "0" }, editor);
    expect(result.years[0].result.accountIncome.retirementOrdinary).toBe(16000);
    expect(result.nextState.people[0].iraBasis).toBe(0);
  });
  it("keeps Roth IRA owner basis/history separate from plan pro-rata basis", () => {
    const editor = setup("roth-ira");
    editor.accounts.push({ ...valid("roth-401k"), id: "roth-plan" });
    editor.owners.one.conversions = [{ id: "conversion-one", year: "2020", taxable: "3000.250", nontaxable: "1000" }];
    const input = buildPreviewInput(short, editor);
    expect(input.people[0].roth).toEqual({ firstContributionYear: 2010, regularContributionBasis: 2000,
      conversions: [{ year: 2020, taxablePrincipal: 3000.25, nontaxablePrincipal: 1000 }] });
    expect(input.accounts[2]).toMatchObject({ kind: "roth-401k", contributionBasis: 2000, firstContributionYear: 2010 });
  });
  it("keeps excluded spouse accounts and basis intact without using them in a single plan", () => {
    const editor = initialAccountEditor();
    editor.accounts.push({ ...valid("traditional-ira"), ownerId: "two" });
    editor.owners.two.iraBasis = "2000";
    const original = JSON.stringify(editor);
    const single = buildPreviewInput(short, editor);
    expect(single.accounts.some(account => account.ownerId === "two")).toBe(false);
    const married = buildPreviewInput({ ...short, household: "married" }, editor);
    expect(married.accounts.find(account => account.id === "asset")!.ownerId).toBe("two");
    expect(married.people[1].iraBasis).toBe(2000);
    expect(JSON.stringify(editor)).toBe(original);
  });
  it("supports removing all cards and keeps a zero placeholder for an income-only spouse", () => {
    const editor = initialAccountEditor(); editor.accounts = [];
    const result = calculatePreview({ ...short, household: "married" }, editor);
    expect(result.nextState.accounts).toHaveLength(2);
    expect(result.nextState.accounts.find(account => account.id === "owner-placeholder-two")!.balance).toBe(0);
  });
  it("uses card order for withdrawals while keeping settlement cash first", () => {
    const editor = initialAccountEditor();
    editor.accounts = [valid("cash"), { ...valid("traditional-ira"), id: "ira-two" }];
    expect(buildPreviewInput(short, editor).withdrawalOrder).toEqual(["cash", "asset", "ira-two"]);
    editor.accounts.reverse();
    expect(buildPreviewInput(short, editor).withdrawalOrder).toEqual(["cash", "ira-two", "asset"]);
  });
  it("does not silently transfer owner basis when an account is reassigned", () => {
    const editor = setup("traditional-ira"); editor.owners.one.iraBasis = "1000"; editor.accounts[0].ownerId = "two";
    expect(() => buildPreviewInput({ ...short, household: "married" }, editor)).toThrow(/remaining IRA basis/);
  });
  it("rejects duplicate account and lot IDs and invalid opening acquisition dates", () => {
    const editor = setup("taxable");
    editor.accounts.push(editor.accounts[0]);
    expect(() => buildPreviewInput(short, editor)).toThrow(/unique/);
    editor.accounts.pop(); editor.accounts[0].lots.push(editor.accounts[0].lots[0]);
    expect(() => buildPreviewInput(short, editor)).toThrow(/lot IDs/);
    editor.accounts[0].lots.pop(); editor.accounts[0].lots[0].acquired = "2027-01-01";
    expect(() => buildPreviewInput(short, editor)).toThrow(/opening positions/);
  });
  it.each(["", "NaN", "Infinity", "-1"])("rejects invalid active balances: %s", raw => {
    const editor = setup("traditional-ira"); editor.accounts[0].fields.balance = raw;
    expect(() => buildPreviewInput(short, editor)).toThrow();
  });
  it("rejects unsupported joint-life, plan rollover and annuity contracts rather than silently estimating", () => {
    const ira = setup("traditional-ira"); ira.accounts[0].fields.rmdTable = "other";
    expect(() => buildPreviewInput(short, ira)).toThrow(/RMD/);
    const roth = setup("roth-401k"); roth.accounts[0].fields.inPlanRollover = "yes";
    expect(() => buildPreviewInput(short, roth)).toThrow(/rollover/);
    const annuity = setup("annuity"); annuity.accounts[0].fields.charge = "100";
    expect(() => buildPreviewInput(short, annuity)).toThrow(/surrender/);
    annuity.accounts[0].fields.charge = "0"; annuity.accounts[0].fields.contractBasis = "20000";
    expect(() => buildPreviewInput(short, annuity)).toThrow(/underwater/);
    annuity.accounts[0].fields.contractBasis = "0"; annuity.accounts[0].fields.annuityTreatment = "other";
    expect(() => buildPreviewInput(short, annuity)).toThrow(/nonqualified/);
  });
  it("requires actual owner Roth clocks and validates conversion history", () => {
    const editor = setup("roth-ira"); editor.owners.one.rothFirstYear = "";
    expect(() => buildPreviewInput(short, editor)).toThrow(/first Roth/);
    editor.owners.one.rothFirstYear = "2010";
    editor.owners.one.conversions = [{ id: "conv", year: "2009", taxable: "1000", nontaxable: "0" }];
    expect(() => buildPreviewInput(short, editor)).toThrow(/precede/);
    editor.owners.one.conversions[0].year = "2027";
    expect(() => buildPreviewInput(short, editor)).toThrow();
  });
});
