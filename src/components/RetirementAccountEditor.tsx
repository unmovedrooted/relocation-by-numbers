"use client";

import { useRef, useState } from "react";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import { ACCOUNT_TYPES, newAccountDraft, type AccountDraft, type AccountEditorState, type AccountKind } from "@/lib/retirementPlan/previewAccounts";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800";
type Props = { value: AccountEditorState; onChange: (value: AccountEditorState) => void; married: boolean; startYear: number };

export default function RetirementAccountEditor({ value, onChange, married, startYear }: Props) {
  const [newKind, setNewKind] = useState<AccountKind>("traditional-ira");
  const sequence = useRef(1);
  const nextId = (prefix: string) => {
    const used = new Set([...value.accounts.flatMap(account => [account.id, ...account.lots.map(lot => lot.id)]), ...Object.values(value.owners).flatMap(owner => owner.conversions.map(item => item.id))]);
    let id: string;
    do { id = `${prefix}-${sequence.current++}`; } while (used.has(id));
    return id;
  };
  const update = (id: string, change: Partial<AccountDraft>) => onChange({ ...value, accounts: value.accounts.map(account => account.id === id ? { ...account, ...change } : account) });
  const field = (account: AccountDraft, key: string, label: string, options: { min?: number; max?: number; step?: string; help?: string } = {}) =>
    <NumberField id={`account-${account.id}-${key}`} label={label} value={account.fields[key]} onChange={raw => update(account.id, { fields: { ...account.fields, [key]: raw } })}
      required min={options.min ?? 0} max={options.max ?? 1e9} step={options.step ?? "any"} className={control} wrapperClassName="min-w-0"
      info={options.help ? <InfoTip text={options.help} /> : undefined} />;
  const text = (id: string, label: string, raw: string, change: (raw: string) => void, type: "text" | "date" = "text", required = true) => <div className="min-w-0">
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
    <input id={id} type={type} value={raw} required={required} maxLength={type === "text" ? 80 : undefined} className={control} onChange={event => change(event.target.value)} />
  </div>;
  const select = (id: string, label: string, raw: string, change: (raw: string) => void, options: readonly (readonly [string, string])[]) => <div className="min-w-0">
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
    <select id={id} value={raw} onChange={event => change(event.target.value)} className={control}>{options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
  </div>;
  const choice = (account: AccountDraft, key: string, label: string, options: readonly (readonly [string, string])[]) => select(
    `account-${account.id}-${key}`, label, account.fields[key], raw => update(account.id, { fields: { ...account.fields, [key]: raw } }), options);
  const reorder = (index: number, direction: number) => {
    const accounts = [...value.accounts];
    [accounts[index], accounts[index + direction]] = [accounts[index + direction], accounts[index]];
    onChange({ ...value, accounts });
  };
  const owners = married ? ["one", "two"] as const : ["one"] as const;
  const inactive = value.accounts.filter(account => account.ownerId === "two" && !married).length;

  return <section className="min-w-0 space-y-4" aria-labelledby="account-editor-heading">
    <div><h2 id="account-editor-heading" className="text-xl font-semibold">Accounts &amp; withdrawal order</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The household cash reserve above is always used first. Active account cards are then used in the order shown, after required distributions. All monetary fields are USD. Account changes clear the previous projection.</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Opening balance means money already in the account. New yearly deposits belong in Contributions below. For a percentage return, enter 6 for 6%, not 600. This is an entry example, not a suggested return.</p>
    </div>
    <div className="flex min-w-0 flex-wrap items-end gap-3">
      {select("account-new-type", "New account type", newKind, raw => setNewKind(raw as AccountKind), ACCOUNT_TYPES)}
      <button type="button" className={button} disabled={value.accounts.length >= 30} onClick={() => onChange({ ...value, accounts: [...value.accounts, newAccountDraft(nextId("account"), newKind)] })}>Add account</button>
    </div>
    {inactive > 0 && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">{inactive} Person 2 account(s) retained but excluded from this single-person projection. Switch to two people or reassign the accounts to include them.</p>}
    {value.accounts.length === 0 && <p className="text-sm text-slate-500">No account cards. Only the household cash reserve will be modeled.</p>}
    {value.accounts.map((account, index) => {
      const excluded = account.ownerId === "two" && !married;
      return <fieldset key={account.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <legend className="sr-only">{index + 1}. {account.name || "Unnamed account"}{excluded ? " · excluded" : ""}</legend>
        <h3 className="mb-3 max-w-full break-words font-semibold">{index + 1}. {account.name || "Unnamed account"}{excluded ? " · excluded" : ""}</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className={button} disabled={index === 0} aria-label={`Move ${account.name} earlier`} onClick={() => reorder(index, -1)}>Move up</button>
          <button type="button" className={button} disabled={index === value.accounts.length - 1} aria-label={`Move ${account.name} later`} onClick={() => reorder(index, 1)}>Move down</button>
          <button type="button" className={button} aria-label={`Remove account ${account.name}`} onClick={() => onChange({ ...value, accounts: value.accounts.filter(item => item.id !== account.id) })}>Remove account</button>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {text(`account-${account.id}-name`, "Account nickname (not an account number)", account.name, name => update(account.id, { name }), "text", !excluded)}
          {select(`account-${account.id}-owner`, "Account owner", account.ownerId, ownerId => update(account.id, { ownerId: ownerId as "one" | "two" }), [["one", "Person 1"], ["two", married ? "Person 2" : "Person 2 (excluded)"]])}
          {select(`account-${account.id}-kind`, "Account type", account.kind, kind => update(account.id, { kind: kind as AccountKind }), ACCOUNT_TYPES)}
        </div>
        {/* Inactive-owner fields are retained but cannot block single-person form validation. */}
        <fieldset disabled={excluded} className="mt-4 min-w-0 space-y-4">
          <legend className="sr-only">{account.name} details</legend>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {account.kind !== "taxable" && account.kind !== "espp" && field(account, "balance", "Opening account balance (USD)")}
            {field(account, "returns", account.kind === "cash" ? "Annual credited interest (%)" : account.kind === "taxable" || account.kind === "espp" ? "Annual price-only return (%)" : "Nominal annual return (%)", {
              min: account.kind === "cash" || account.kind === "annuity" ? 0 : -100, max: 1000,
              help: account.kind === "taxable" || account.kind === "espp" ? "Excludes dividends and trading fees. Do not enter total return." : account.kind === "annuity" ? "Negative-return / underwater annuity paths are not supported in this preview." : undefined })}
            {(account.kind === "traditional-ira" || account.kind === "401k") && <>
              {field(account, "priorBalance", "Prior December 31 balance (USD)", { help: "Used for the first modeled RMD; enter the actual prior-year value." })}
              {choice(account, "rmdTable", "Owner-lifetime RMD table", [["uniform", "Uniform Lifetime"], ["other", "Joint-life / inherited (unsupported)"]])}
            </>}
            {account.kind === "401k" && <>
              {field(account, "planBasis", "Remaining after-tax plan basis (USD)", { help: "For this plan only. Not your IRA basis or pre-tax contributions." })}
              {choice(account, "deferRmd", "Verified current-employer RMD deferral", [["no", "No"], ["yes", "Yes — eligibility verified"]])}
            </>}
            {account.kind === "roth-401k" && <>
              {field(account, "planBasis", "Remaining Roth plan contribution basis (USD)")}
              {field(account, "firstYear", "First designated Roth plan contribution year", { min: 2006, max: startYear, step: "1" })}
              {choice(account, "inPlanRollover", "Any in-plan Roth rollover history?", [["no", "No"], ["yes", "Yes (unsupported)"]])}
            </>}
            {account.kind === "annuity" && <>
              {field(account, "contractBasis", "Remaining investment in contract (USD)")}
              {field(account, "charge", "Surrender charge (USD)", { help: "Must be zero; fee-aware surrender handling is not implemented." })}
              {choice(account, "annuityTreatment", "Contract treatment", [["supported", "Post-1982 nonqualified, not annuitized"], ["other", "Other / unsure (unsupported)"]])}
            </>}
            {account.kind === "espp" && <>
              {field(account, "shares", "Remaining shares")}{field(account, "price", "Current share price (USD/share)")}
              {field(account, "purchasePrice", "Purchase price (USD/share)")}{field(account, "offeringValue", "Offering-date FMV (USD/share)")}
              {field(account, "purchaseValue", "Purchase-date FMV (USD/share)")}{field(account, "optionPrice", "Offering-date option price (USD/share)")}
              {text(`account-${account.id}-offeringDate`, "Offering date", account.fields.offeringDate, raw => update(account.id, { fields: { ...account.fields, offeringDate: raw } }), "date")}
              {text(`account-${account.id}-purchaseDate`, "Purchase date", account.fields.purchaseDate, raw => update(account.id, { fields: { ...account.fields, purchaseDate: raw } }), "date")}
            </>}
          </div>
          {account.kind === "traditional-ira" && <p className="text-sm text-slate-500 dark:text-slate-400">Enter nondeductible IRA basis once in the owner tax-basis section below, aggregated across that owner’s traditional IRAs.</p>}
          {account.kind === "roth-ira" && <p className="text-sm text-slate-500 dark:text-slate-400">Set the owner’s original Roth IRA year, contribution basis and conversion history below. Those values are shared across the owner’s Roth IRAs—not repeated here.</p>}
          {account.kind === "espp" && <p className="text-sm text-slate-500 dark:text-slate-400">One existing Section 423 lot per card; add another ESPP card for another lot. Market value is shares × current price. No future purchases, nonqualified plans, fees or automatic discount assumptions.</p>}
          {account.kind === "taxable" && <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Market value is calculated from the lots below. Lots are sold in the order shown. Supply actual adjusted basis for ordinary purchased shares—not an account-average placeholder. Wash sales, inherited/gift basis, dividends and fees are not modeled.</p>
            {account.lots.map((lot, lotIndex) => <fieldset key={lot.id} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <legend className="sr-only">Lot {lotIndex + 1}</legend>
              <h4 className="mb-3 text-sm font-medium">Lot {lotIndex + 1}</h4>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {([ ["shares", "Remaining shares"], ["price", "Current price (USD/share)"], ["basis", "Total adjusted basis (USD)"] ] as const).map(([key, label]) => <NumberField key={key}
                  id={`account-${account.id}-${lot.id}-${key}`} label={label} value={lot[key]} onChange={raw => update(account.id, { lots: account.lots.map(item => item.id === lot.id ? { ...item, [key]: raw } : item) })}
                  required min={0} max={1e9} step="any" className={control} wrapperClassName="min-w-0" />)}
                {text(`account-${account.id}-${lot.id}-acquired`, "Acquired date", lot.acquired, raw => update(account.id, { lots: account.lots.map(item => item.id === lot.id ? { ...item, acquired: raw } : item) }), "date")}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={button} disabled={lotIndex === 0} aria-label={`Move lot ${lotIndex + 1} earlier in ${account.name}`} onClick={() => {
                  const lots = [...account.lots]; [lots[lotIndex - 1], lots[lotIndex]] = [lots[lotIndex], lots[lotIndex - 1]]; update(account.id, { lots });
                }}>Move lot up</button>
                <button type="button" className={button} aria-label={`Remove lot ${lotIndex + 1} from ${account.name}`} onClick={() => update(account.id, { lots: account.lots.filter(item => item.id !== lot.id) })}>Remove lot</button>
              </div>
            </fieldset>)}
            <button type="button" className={button} disabled={account.lots.length >= 50} onClick={() => update(account.id, { lots: [...account.lots, { id: nextId("lot"), shares: "0", price: "0", basis: "0", acquired: "" }] })}>Add lot</button>
          </div>}
        </fieldset>
      </fieldset>;
    })}
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      {owners.map((ownerId, index) => {
        const basis = value.owners[ownerId];
        const change = (patch: Partial<typeof basis>) => onChange({ ...value, owners: { ...value.owners, [ownerId]: { ...basis, ...patch } } });
        const hasRoth = value.accounts.some(account => account.ownerId === ownerId && account.kind === "roth-ira");
        return <fieldset key={ownerId} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <legend className="sr-only">Person {index + 1} · owner tax basis</legend>
          <h3 className="font-semibold">Person {index + 1} · owner tax basis</h3>
          <NumberField id={`owner-${ownerId}-iraBasis`} label="Total remaining nondeductible IRA basis (USD)"
            info={<InfoTip text="Once per owner across all traditional/SEP/SIMPLE IRAs. Special SIMPLE rules are not modeled; zero if none." />}
            value={basis.iraBasis} onChange={raw => change({ iraBasis: raw })} required min={0} max={1e9} step="any" className={control} />
          {(hasRoth || basis.rothFirstYear || basis.rothBasis !== "0" || basis.conversions.length > 0) && <>
            <NumberField id={`owner-${ownerId}-rothFirstYear`} label="First-ever Roth IRA contribution year"
              info={<InfoTip text="Original owner-wide year, not the date of the latest account transfer. Required for any existing Roth value or history." />}
              value={basis.rothFirstYear} onChange={raw => change({ rothFirstYear: raw })} min={1998} max={startYear} step="1" className={control} />
            <NumberField id={`owner-${ownerId}-rothBasis`} label="Remaining regular Roth IRA contribution basis (USD)"
              info={<InfoTip text="Excludes conversion principal and investment earnings. Once per owner, not per account." />}
              value={basis.rothBasis} onChange={raw => change({ rothBasis: raw })} required min={0} max={1e9} step="any" className={control} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Existing conversion history below is remaining principal, not a new conversion request. Keep taxable and nontaxable portions separate.</p>
            {basis.conversions.map((conversion, index) => <fieldset key={conversion.id} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <legend className="sr-only">Conversion history {index + 1}</legend>
              <h4 className="mb-3 text-sm">Conversion history {index + 1}</h4>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                {([ ["year", "Conversion year"], ["taxable", "Remaining taxable principal (USD)"], ["nontaxable", "Remaining nontaxable principal (USD)"] ] as const).map(([key, label]) => <NumberField key={key}
                  id={`owner-${ownerId}-${conversion.id}-${key}`} label={label} value={conversion[key]} onChange={raw => change({ conversions: basis.conversions.map(item => item.id === conversion.id ? { ...item, [key]: raw } : item) })}
                  required min={key === "year" ? 1998 : 0} max={key === "year" ? startYear : 1e9} step={key === "year" ? "1" : "any"} className={control} wrapperClassName="min-w-0" />)}
              </div>
              <button type="button" className={`${button} mt-3`} aria-label={`Remove Person ${ownerId === "one" ? 1 : 2} conversion ${conversion.id}`} onClick={() => change({ conversions: basis.conversions.filter(item => item.id !== conversion.id) })}>Remove history entry</button>
            </fieldset>)}
            <button type="button" className={button} disabled={basis.conversions.length >= 100} onClick={() => change({ conversions: [...basis.conversions, { id: nextId("conversion"), year: "", taxable: "0", nontaxable: "0" }] })}>Add conversion history</button>
          </>}
        </fieldset>;
      })}
    </div>
  </section>;
}
