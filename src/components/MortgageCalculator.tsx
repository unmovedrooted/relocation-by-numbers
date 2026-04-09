"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdSlot from "./AdSlot";

// ---------------------------------------------------------------------------
// TYPES & CONSTANTS
// ---------------------------------------------------------------------------

type Tab = "us" | "international";
type LoanTerm = 10 | 15 | 20 | 25 | 30;
type FilingStatus = "single" | "married";

const INTERNATIONAL_COUNTRIES = [
  { code: "PT", name: "Portugal", rate: 3.5, downMin: 30, foreignNotes: "Non-residents typically need 30%+ down. Banks require NIF and proof of income. Golden Visa property route available." },
  { code: "ES", name: "Spain", rate: 3.8, downMin: 30, foreignNotes: "Non-residents need 30–40% down. NIE number required. Mortgage terms often shorter for foreigners." },
  { code: "DE", name: "Germany", rate: 3.9, downMin: 20, foreignNotes: "Germany is relatively open to foreign buyers. 20–30% down typical. Strong rental market makes buying less urgent." },
  { code: "FR", name: "France", rate: 4.0, downMin: 25, foreignNotes: "French banks lend to non-residents but require 25–30% down. Notaire fees add ~7–8% to purchase cost." },
  { code: "IT", name: "Italy", rate: 4.2, downMin: 30, foreignNotes: "Italian banks are conservative with foreign buyers. 30–40% down common. €1 home deals exist in depopulating towns." },
  { code: "NL", name: "Netherlands", rate: 3.9, downMin: 10, foreignNotes: "EU residents can access Dutch mortgages on similar terms. Non-EU buyers face more scrutiny." },
  { code: "GR", name: "Greece", rate: 4.5, downMin: 30, foreignNotes: "Foreign buyers need 30–40% down. Golden Visa via €250k+ investment. Property taxes are relatively low." },
  { code: "HR", name: "Croatia", rate: 4.0, downMin: 30, foreignNotes: "EU citizens can buy freely. Non-EU buyers need reciprocity agreement. Growing expat market." },
  { code: "MT", name: "Malta", rate: 3.5, downMin: 10, foreignNotes: "English-speaking, EU member. Non-residents can buy in designated areas. AIP permit required for some zones." },
  { code: "CY", name: "Cyprus", rate: 4.0, downMin: 30, foreignNotes: "Non-EU buyers need permission. Non-dom tax regime popular with expats. Limassol is a major expat hub." },
  { code: "MX", name: "Mexico", rate: 9.5, downMin: 30, foreignNotes: "Foreigners buy via fideicomiso (bank trust) in restricted zones. Mexican mortgages have high rates — many foreigners pay cash." },
  { code: "PA", name: "Panama", rate: 6.5, downMin: 20, foreignNotes: "Foreigners have same property rights as citizens. Pensionado discounts apply. USD-denominated economy reduces FX risk." },
  { code: "CR", name: "Costa Rica", rate: 8.0, downMin: 30, foreignNotes: "Local bank mortgages available to foreigners but complex. Many expats use developer financing or cash." },
  { code: "CO", name: "Colombia", rate: 12.0, downMin: 30, foreignNotes: "High local rates — many foreign buyers pay cash or use home-country financing. No restrictions on foreign ownership." },
  { code: "TH", name: "Thailand", rate: 6.5, downMin: 30, foreignNotes: "Foreigners cannot own land — only condos (up to 49% of building). Thai bank mortgages not available to most foreigners." },
  { code: "JP", name: "Japan", rate: 1.5, downMin: 10, foreignNotes: "Japan has some of the world's lowest mortgage rates. Foreigners can buy freely but getting a mortgage requires Japanese residency." },
  { code: "SG", name: "Singapore", rate: 3.5, downMin: 25, foreignNotes: "Foreigners pay Additional Buyer's Stamp Duty (ABSD) of 60%. Most foreigners buy condos rather than landed property." },
  { code: "AU", name: "Australia", rate: 6.2, downMin: 20, foreignNotes: "Foreign buyers need FIRB approval. Typically limited to new builds. Stamp duty surcharges apply in most states." },
  { code: "NZ", name: "New Zealand", rate: 6.5, downMin: 20, foreignNotes: "Most overseas buyers are banned from purchasing existing homes since 2018. New builds generally permitted." },
  { code: "AE", name: "UAE (Dubai)", rate: 4.5, downMin: 25, foreignNotes: "Foreigners can buy in designated freehold areas. No income tax. Mortgages available for non-residents but at higher rates." },
  { code: "VN", name: "Vietnam", rate: 8.0, downMin: 30, foreignNotes: "Foreigners limited to 50-year renewable leases — no freehold ownership. Condo ownership capped at 30% of building." },
  { code: "MY", name: "Malaysia", rate: 4.5, downMin: 30, foreignNotes: "MM2H visa holders get better buying access. Minimum purchase price for foreigners: RM 1M+ in most states." },
  { code: "ID", name: "Indonesia", rate: 9.0, downMin: 30, foreignNotes: "Foreigners cannot own freehold land. Long-term lease (Hak Pakai) available. Bali has large expat leasehold market." },
  { code: "BR", name: "Brazil", rate: 10.5, downMin: 30, foreignNotes: "No restrictions on foreign ownership. High local rates — most foreigners use savings or foreign financing." },
  { code: "AR", name: "Argentina", rate: 15.0, downMin: 30, foreignNotes: "Significant currency risk. Many transactions done in USD cash. Legal reforms ongoing — verify current rules." },
  { code: "CL", name: "Chile", rate: 5.5, downMin: 20, foreignNotes: "Most stable South American mortgage market. Foreigners can access local financing with RUT and proof of income." },
];

function money(n: number, digits = 0, currency = "USD") {
  if (!Number.isFinite(n) || isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency", currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function pct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

function getQS() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}
function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

const inputCls = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-violet-500/15";
const selectCls = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-violet-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600";

function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const pos = align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" aria-label="More info" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">i</button>
      <span className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${pos}`}>{text}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// MORTGAGE MATH
// ---------------------------------------------------------------------------

function calcMonthlyPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcTotalInterest(principal: number, annualRate: number, termYears: number): number {
  const monthly = calcMonthlyPI(principal, annualRate, termYears);
  return monthly * termYears * 12 - principal;
}

function buildAmortization(principal: number, annualRate: number, termYears: number, extraMonthly = 0) {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return [];
  const r = annualRate / 100 / 12;
  const basePayment = calcMonthlyPI(principal, annualRate, termYears);
  const payment = basePayment + extraMonthly;
  let balance = principal;
  const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let m = 1; m <= termYears * 12; m++) {
    const interestCharge = balance * r;
    const principalCharge = Math.min(payment - interestCharge, balance);
    balance = Math.max(0, balance - principalCharge);
    rows.push({ month: m, payment: principalCharge + interestCharge, principal: principalCharge, interest: interestCharge, balance });
    if (balance <= 0) break;
  }
  return rows;
}

function calcBreakEven(
  downPayment: number,
  monthlyPI: number,
  monthlyRent: number,
  monthlyTax: number,
  monthlyInsurance: number,
  monthlyHOA: number,
  homePrice: number,
  annualAppreciation: number,
  annualRentGrowth: number,
  investmentReturn: number,
): number {
  // Month at which cumulative cost of buying ≤ cumulative cost of renting
  let buyCumulative = downPayment; // opportunity cost of down payment is tracked separately
  let rentCumulative = 0;
  const monthlyOwn = monthlyPI + monthlyTax + monthlyInsurance + monthlyHOA;
  let rent = monthlyRent;
  let homeValue = homePrice;
  let investedDown = downPayment;

  for (let m = 1; m <= 360; m++) {
    buyCumulative += monthlyOwn;
    rentCumulative += rent;
    investedDown *= (1 + investmentReturn / 100 / 12);
    homeValue *= (1 + annualAppreciation / 100 / 12);
    rent *= (1 + annualRentGrowth / 100 / 12);

    // Net buy cost = cumulative payments - equity gained + opportunity cost of down payment
    const equity = homeValue - homePrice; // simplified appreciation gain
    const netBuyCost = buyCumulative - equity + (investedDown - downPayment);
    if (netBuyCost <= rentCumulative) return m;
  }
  return -1; // never breaks even within 30 years
}

// ---------------------------------------------------------------------------
// AMORTIZATION TABLE (year-by-year summary)
// ---------------------------------------------------------------------------
function AmortizationTable({ rows }: { rows: ReturnType<typeof buildAmortization> }) {
  const [expanded, setExpanded] = useState(false);
  if (!rows.length) return null;

  // Summarize by year
  const years: { year: number; interest: number; principal: number; balance: number }[] = [];
  for (let y = 1; y <= Math.ceil(rows.length / 12); y++) {
    const slice = rows.slice((y - 1) * 12, y * 12);
    years.push({
      year: y,
      interest: slice.reduce((s, r) => s + r.interest, 0),
      principal: slice.reduce((s, r) => s + r.principal, 0),
      balance: slice[slice.length - 1]?.balance ?? 0,
    });
  }

  const display = expanded ? years : years.slice(0, 5);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-right">Principal</th>
              <th className="px-4 py-2 text-right">Interest</th>
              <th className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {display.map((y, i) => (
              <tr key={y.year} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <td className="px-4 py-2 font-medium text-slate-700">Year {y.year}</td>
                <td className="px-4 py-2 text-right text-slate-900">{money(y.principal)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{money(y.interest)}</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">{money(y.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {years.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-semibold text-violet-700 hover:underline"
        >
          {expanded ? "Show less" : `Show all ${years.length} years`}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// US TAB
// ---------------------------------------------------------------------------
function USTab() {
  const [homePrice, setHomePrice] = useState("500000");
  const [downPct, setDownPct] = useState("20");
  const [rate, setRate] = useState("6.75");
  const [term, setTerm] = useState<LoanTerm>(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState("1.1");
  const [insurance, setInsurance] = useState("150");
  const [hoa, setHoa] = useState("0");
  const [pmi, setPmi] = useState("0");
  const [extraMonthly, setExtraMonthly] = useState("0");
  const [grossIncome, setGrossIncome] = useState("120000");
  const [otherDebts, setOtherDebts] = useState("500");
  const [monthlyRent, setMonthlyRent] = useState("2500");
  const [appreciation, setAppreciation] = useState("3.5");
  const [rentGrowth, setRentGrowth] = useState("3.0");
  const [investReturn, setInvestReturn] = useState("7.0");

  const nz = (v: string) => Math.max(0, Number(v) || 0);

  const hp = nz(homePrice);
  const dp = hp * (nz(downPct) / 100);
  const loan = hp - dp;
  const monthlyPI = calcMonthlyPI(loan, nz(rate), term);
  const monthlyTax = (hp * (nz(propertyTaxRate) / 100)) / 12;
  const monthlyIns = nz(insurance);
  const monthlyHOA = nz(hoa);
  const monthlyPMI = nz(downPct) < 20 ? nz(pmi) : 0;
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI;
  const totalInterest = calcTotalInterest(loan, nz(rate), term);
  const totalCost = loan + totalInterest;

  const grossMonthly = nz(grossIncome) / 12;
  const frontEndDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backEndDTI = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  const getDTIColor = (d: number) =>
    d <= 28 ? "text-emerald-600" : d <= 36 ? "text-amber-600" : "text-rose-600";
  const getDTILabel = (d: number) =>
    d <= 28 ? "Within guideline" : d <= 36 ? "Elevated" : "Above guideline";

  const amortRows = useMemo(() =>
    buildAmortization(loan, nz(rate), term, nz(extraMonthly)),
    [loan, rate, term, extraMonthly]
  );

  const breakEvenMonth = useMemo(() =>
    calcBreakEven(dp, monthlyPI, nz(monthlyRent), monthlyTax, monthlyIns, monthlyHOA, hp, nz(appreciation), nz(rentGrowth), nz(investReturn)),
    [dp, monthlyPI, monthlyRent, monthlyTax, monthlyIns, monthlyHOA, hp, appreciation, rentGrowth, investReturn]
  );

  const breakEvenYears = breakEvenMonth > 0 ? (breakEvenMonth / 12).toFixed(1) : null;

  const extraSavings = nz(extraMonthly) > 0
    ? totalInterest - (amortRows.reduce((s, r) => s + r.interest, 0))
    : 0;
  const monthsSaved = nz(extraMonthly) > 0
    ? term * 12 - amortRows.length
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* INPUTS */}
      <div className="space-y-3">

        {/* Home details */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Home &amp; Loan Details</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <div className={labelHeadCls}>Home price</div>
              <input className={inputCls} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} placeholder="500000" />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Down payment (%)<InfoTip text="Percentage of home price paid upfront. Below 20% typically requires PMI." /></div>
              <input className={inputCls} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} placeholder="20" />
            </label>
            <div className="text-sm">
              <div className={labelHeadCls}>Down payment ($)</div>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-700 font-semibold">{money(dp)}</div>
            </div>
            <label className="text-sm">
              <div className={labelHeadCls}>Interest rate (%)</div>
              <input className={inputCls} type="number" step="0.05" value={rate} onChange={e => setRate(e.target.value)} placeholder="6.75" />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Loan term (years)</div>
              <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value) as LoanTerm)}>
                {([10, 15, 20, 25, 30] as LoanTerm[]).map(t => <option key={t} value={t}>{t} years</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Monthly costs */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Monthly Costs</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <div className={labelHeadCls}>Property tax rate (%/yr)<InfoTip align="right" text="US average is ~1.1%. Check your state/county rate." /></div>
              <input className={inputCls} type="number" step="0.1" value={propertyTaxRate} onChange={e => setPropertyTaxRate(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Homeowners insurance ($/mo)</div>
              <input className={inputCls} type="number" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>HOA fees ($/mo)</div>
              <input className={inputCls} type="number" value={hoa} onChange={e => setHoa(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>PMI ($/mo)<InfoTip align="right" text="Required if down payment is below 20%. Typically 0.5–1.5% of loan/yr." /></div>
              <input className={inputCls} type="number" value={pmi} onChange={e => setPmi(e.target.value)} placeholder={nz(downPct) < 20 ? "Est. required" : "N/A if ≥20% down"} />
            </label>
            <label className="text-sm sm:col-span-2">
              <div className={labelHeadCls}>Extra monthly payment<InfoTip align="right" text="Additional principal payment per month. Reduces total interest and pays off loan faster." /></div>
              <input className={inputCls} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" />
            </label>
          </div>
        </div>

        {/* Affordability inputs */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Affordability &amp; Rent vs Buy</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <div className={labelHeadCls}>Gross annual income</div>
              <input className={inputCls} type="number" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Other monthly debts<InfoTip align="right" text="Car loans, student loans, credit cards — used to calculate back-end DTI." /></div>
              <input className={inputCls} type="number" value={otherDebts} onChange={e => setOtherDebts(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Current monthly rent</div>
              <input className={inputCls} type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Home appreciation (%/yr)</div>
              <input className={inputCls} type="number" step="0.1" value={appreciation} onChange={e => setAppreciation(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Rent growth (%/yr)</div>
              <input className={inputCls} type="number" step="0.1" value={rentGrowth} onChange={e => setRentGrowth(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Investment return (%/yr)<InfoTip align="right" text="What your down payment could earn if invested instead. Used in rent vs buy opportunity cost." /></div>
              <input className={inputCls} type="number" step="0.1" value={investReturn} onChange={e => setInvestReturn(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="space-y-3">

        {/* Payment breakdown */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Monthly Payment Breakdown</div>
          <div className="space-y-2 text-sm">
            {[
              { label: "Principal & Interest", value: monthlyPI, bold: false },
              { label: "Property Tax", value: monthlyTax, bold: false },
              { label: "Insurance", value: monthlyIns, bold: false },
              { label: "HOA", value: monthlyHOA, bold: false },
              ...(monthlyPMI > 0 ? [{ label: "PMI", value: monthlyPMI, bold: false }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className={row.bold ? "font-bold text-slate-900" : "font-semibold text-slate-900"}>{money(row.value, 2)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-900">Total monthly payment</span>
              <span className="text-xl font-bold text-violet-700">{money(totalMonthly, 2)}</span>
            </div>
          </div>
        </div>

        {/* Loan summary */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Loan Summary</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className={labelHeadCls}>Loan amount</div>
              <div className="text-lg font-bold text-slate-900">{money(loan)}</div>
            </div>
            <div>
              <div className={labelHeadCls}>Total interest</div>
              <div className="text-lg font-bold text-slate-900">{money(totalInterest)}</div>
            </div>
            <div>
              <div className={labelHeadCls}>Total cost of loan</div>
              <div className="text-lg font-bold text-slate-900">{money(totalCost)}</div>
            </div>
            <div>
              <div className={labelHeadCls}>Interest / price ratio</div>
              <div className="text-lg font-bold text-slate-900">{hp > 0 ? pct((totalInterest / hp) * 100) : "—"}</div>
            </div>
          </div>
          {nz(extraMonthly) > 0 && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs text-slate-700">
              With {money(nz(extraMonthly), 0)}/mo extra: save <span className="font-semibold text-emerald-600">{money(extraSavings)}</span> in interest and pay off <span className="font-semibold text-emerald-600">{monthsSaved} months early</span>.
            </div>
          )}
        </div>

        {/* Affordability */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Affordability Check</div>
          <div className="space-y-3">
            {[
              { label: "Front-end DTI", value: frontEndDTI, guide: "≤28% guideline", tip: "Housing costs as % of gross monthly income. Lenders typically want ≤28%." },
              { label: "Back-end DTI", value: backEndDTI, guide: "≤36% guideline", tip: "All debts as % of gross monthly income. Lenders typically want ≤36–43%." },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}<InfoTip align="right" text={row.tip} /></span>
                  <span className={`font-bold ${getDTIColor(row.value)}`}>{pct(row.value)} — {getDTILabel(row.value)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${row.value <= 28 ? "bg-emerald-500" : row.value <= 36 ? "bg-amber-400" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(row.value / 50 * 100, 100)}%` }} />
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{row.guide}</div>
              </div>
            ))}
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Max home price at 28% front-end DTI: <span className="font-semibold text-slate-900">
                {grossMonthly > 0 ? money(((grossMonthly * 0.28 - monthlyTax - monthlyIns - monthlyHOA) > 0
                  ? (() => {
                    const maxPI = grossMonthly * 0.28 - monthlyTax - monthlyIns - monthlyHOA;
                    const r = nz(rate) / 100 / 12;
                    const n = term * 12;
                    const maxLoan = maxPI * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
                    return maxLoan / (1 - nz(downPct) / 100);
                  })()
                  : 0)) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Rent vs Buy */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Rent vs Buy Break-Even</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {breakEvenYears ? `${breakEvenYears} years` : "30+ years"}
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {breakEvenYears
              ? `At current assumptions, buying becomes cheaper than renting after approximately ${breakEvenYears} years.`
              : "Buying does not break even within 30 years at current assumptions. Renting may be more cost-effective."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>Monthly rent: <span className="font-semibold">{money(nz(monthlyRent), 0)}</span></div>
            <div>Monthly own: <span className="font-semibold">{money(totalMonthly, 0)}</span></div>
            <div>Rent growth: <span className="font-semibold">{pct(nz(rentGrowth))}/yr</span></div>
            <div>Appreciation: <span className="font-semibold">{pct(nz(appreciation))}/yr</span></div>
          </div>
          <div className="mt-2 text-xs text-slate-500">Break-even accounts for opportunity cost of down payment invested at {pct(nz(investReturn))}/yr.</div>
        </div>

        {/* Amortization */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Amortization Schedule</div>
          <AmortizationTable rows={amortRows} />
        </div>

        <AdSlot />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// INTERNATIONAL TAB
// ---------------------------------------------------------------------------
function InternationalTab() {
  const [countryCode, setCountryCode] = useState("PT");
  const [homePrice, setHomePrice] = useState("350000");
  const [downPct, setDownPct] = useState("30");
  const [rateOverride, setRateOverride] = useState("");
  const [term, setTerm] = useState<LoanTerm>(20);
  const [closingCostPct, setClosingCostPct] = useState("7");
  const [annualTaxAmt, setAnnualTaxAmt] = useState("1200");
  const [insurance, setInsurance] = useState("100");
  const [extraMonthly, setExtraMonthly] = useState("0");
  const [grossIncome, setGrossIncome] = useState("120000");
  const [otherDebts, setOtherDebts] = useState("500");
  const [monthlyRent, setMonthlyRent] = useState("1500");
  const [appreciation, setAppreciation] = useState("3.0");
  const [rentGrowth, setRentGrowth] = useState("2.5");
  const [investReturn, setInvestReturn] = useState("7.0");
  const [currency, setCurrency] = useState("USD");

  const country = INTERNATIONAL_COUNTRIES.find(c => c.code === countryCode) ?? INTERNATIONAL_COUNTRIES[0];
  const effectiveRate = rateOverride ? Number(rateOverride) : country.rate;

  const nz = (v: string) => Math.max(0, Number(v) || 0);

  const hp = nz(homePrice);
  const dp = hp * (nz(downPct) / 100);
  const loan = hp - dp;
  const closingCosts = hp * (nz(closingCostPct) / 100);
  const totalUpfront = dp + closingCosts;

  const monthlyPI = calcMonthlyPI(loan, effectiveRate, term);
  const monthlyTax = nz(annualTaxAmt) / 12;
  const monthlyIns = nz(insurance);
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns;
  const totalInterest = calcTotalInterest(loan, effectiveRate, term);

  const grossMonthly = nz(grossIncome) / 12;
  const frontEndDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backEndDTI = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  const getDTIColor = (d: number) =>
    d <= 28 ? "text-emerald-600" : d <= 36 ? "text-amber-600" : "text-rose-600";
  const getDTILabel = (d: number) =>
    d <= 28 ? "Within guideline" : d <= 36 ? "Elevated" : "Above guideline";

  const amortRows = useMemo(() =>
    buildAmortization(loan, effectiveRate, term, nz(extraMonthly)),
    [loan, effectiveRate, term, extraMonthly]
  );

  const breakEvenMonth = useMemo(() =>
    calcBreakEven(dp, monthlyPI, nz(monthlyRent), monthlyTax, monthlyIns, 0, hp, nz(appreciation), nz(rentGrowth), nz(investReturn)),
    [dp, monthlyPI, monthlyRent, monthlyTax, monthlyIns, hp, appreciation, rentGrowth, investReturn]
  );

  const breakEvenYears = breakEvenMonth > 0 ? (breakEvenMonth / 12).toFixed(1) : null;

  // Sync rate and down pct when country changes
  useEffect(() => {
    setDownPct(String(country.downMin));
    setRateOverride("");
  }, [countryCode, country.downMin]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* INPUTS */}
      <div className="space-y-3">

        {/* Foreign buyer notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">Foreign Buyer Considerations</div>
          <p className="text-sm leading-6 text-slate-700">{country.foreignNotes}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Min. down: {country.downMin}%
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Typical rate: {country.rate}%
            </span>
          </div>
        </div>

        {/* Country & home */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Country &amp; Home Details</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <div className={labelHeadCls}>Target country</div>
              <select className={selectCls} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                {INTERNATIONAL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <div className={labelHeadCls}>Home price (USD equivalent)</div>
              <input className={inputCls} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Down payment (%)<InfoTip text={`Minimum for foreign buyers in ${country.name} is typically ${country.downMin}%.`} /></div>
              <input className={inputCls} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} />
            </label>
            <div className="text-sm">
              <div className={labelHeadCls}>Down payment ($)</div>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-700 font-semibold">{money(dp)}</div>
            </div>
            <label className="text-sm">
              <div className={labelHeadCls}>
                Interest rate (%)
                <InfoTip align="right" text={`${country.name} typical rate for foreign buyers: ~${country.rate}%. Override if you have a specific quote.`} />
              </div>
              <input className={inputCls} type="number" step="0.1" value={rateOverride || country.rate} onChange={e => setRateOverride(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Loan term (years)</div>
              <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value) as LoanTerm)}>
                {([10, 15, 20, 25, 30] as LoanTerm[]).map(t => <option key={t} value={t}>{t} years</option>)}
              </select>
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>
                Closing costs (%)<InfoTip align="right" text="Transfer taxes, notary fees, agent fees. Varies widely by country — Portugal ~7%, France ~8%, Spain ~10–12%." />
              </div>
              <input className={inputCls} type="number" step="0.5" value={closingCostPct} onChange={e => setClosingCostPct(e.target.value)} />
            </label>
            <div className="text-sm">
              <div className={labelHeadCls}>Closing costs ($)</div>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-700 font-semibold">{money(closingCosts)}</div>
            </div>
          </div>
        </div>

        {/* Monthly costs */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Monthly Costs</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <div className={labelHeadCls}>Annual property tax ($)</div>
              <input className={inputCls} type="number" value={annualTaxAmt} onChange={e => setAnnualTaxAmt(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Monthly insurance ($)</div>
              <input className={inputCls} type="number" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </label>
            <label className="text-sm sm:col-span-2">
              <div className={labelHeadCls}>Extra monthly payment</div>
              <input className={inputCls} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" />
            </label>
          </div>
        </div>

        {/* Affordability inputs */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Affordability &amp; Rent vs Buy</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <div className={labelHeadCls}>Gross annual income (USD)</div>
              <input className={inputCls} type="number" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Other monthly debts ($)</div>
              <input className={inputCls} type="number" value={otherDebts} onChange={e => setOtherDebts(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Local monthly rent ($)</div>
              <input className={inputCls} type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Home appreciation (%/yr)</div>
              <input className={inputCls} type="number" step="0.1" value={appreciation} onChange={e => setAppreciation(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Rent growth (%/yr)</div>
              <input className={inputCls} type="number" step="0.1" value={rentGrowth} onChange={e => setRentGrowth(e.target.value)} />
            </label>
            <label className="text-sm">
              <div className={labelHeadCls}>Investment return (%/yr)</div>
              <input className={inputCls} type="number" step="0.1" value={investReturn} onChange={e => setInvestReturn(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="space-y-3">

        {/* Upfront costs */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Total Upfront Cash Needed</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{money(totalUpfront)}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>Down payment: <span className="font-semibold">{money(dp)}</span></div>
            <div>Closing costs: <span className="font-semibold">{money(closingCosts)}</span></div>
          </div>
          <div className="mt-2 text-xs text-slate-500">Does not include moving costs, currency conversion fees, or reserve requirements.</div>
        </div>

        {/* Payment breakdown */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Monthly Payment Breakdown</div>
          <div className="space-y-2 text-sm">
            {[
              { label: "Principal & Interest", value: monthlyPI },
              { label: "Property Tax", value: monthlyTax },
              { label: "Insurance", value: monthlyIns },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-semibold text-slate-900">{money(row.value, 2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="font-semibold text-slate-900">Total monthly payment</span>
              <span className="text-xl font-bold text-violet-700">{money(totalMonthly, 2)}</span>
            </div>
          </div>
        </div>

        {/* Loan summary */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Loan Summary</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className={labelHeadCls}>Loan amount</div><div className="text-lg font-bold">{money(loan)}</div></div>
            <div><div className={labelHeadCls}>Total interest</div><div className="text-lg font-bold">{money(totalInterest)}</div></div>
            <div><div className={labelHeadCls}>Total cost</div><div className="text-lg font-bold">{money(loan + totalInterest)}</div></div>
            <div><div className={labelHeadCls}>Effective rate</div><div className="text-lg font-bold">{pct(effectiveRate)}</div></div>
          </div>
        </div>

        {/* Affordability */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Affordability Check</div>
          <div className="space-y-3">
            {[
              { label: "Front-end DTI", value: frontEndDTI, guide: "≤28% guideline" },
              { label: "Back-end DTI", value: backEndDTI, guide: "≤36% guideline" },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className={`font-bold ${getDTIColor(row.value)}`}>{pct(row.value)} — {getDTILabel(row.value)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${row.value <= 28 ? "bg-emerald-500" : row.value <= 36 ? "bg-amber-400" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(row.value / 50 * 100, 100)}%` }} />
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{row.guide}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rent vs Buy */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Rent vs Buy Break-Even</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {breakEvenYears ? `${breakEvenYears} years` : "30+ years"}
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {breakEvenYears
              ? `Buying in ${country.name} becomes cheaper than renting after approximately ${breakEvenYears} years at current assumptions.`
              : `Buying in ${country.name} does not break even within 30 years at current assumptions. Consider renting longer.`}
          </p>
          <div className="mt-2 text-xs text-slate-500">Accounts for opportunity cost of down payment and closing costs invested at {pct(nz(investReturn))}/yr.</div>
        </div>

        {/* Can I afford to buy abroad? */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Post-Relocation: Can I Afford to Buy?</div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Total upfront needed</span>
              <span className="font-semibold text-slate-900">{money(totalUpfront)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly housing cost</span>
              <span className="font-semibold text-slate-900">{money(totalMonthly, 0)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>vs. renting locally</span>
              <span className={`font-semibold ${totalMonthly > nz(monthlyRent) ? "text-rose-600" : "text-emerald-600"}`}>
                {totalMonthly > nz(monthlyRent) ? "+" : ""}{money(totalMonthly - nz(monthlyRent), 0)}/mo vs rent
              </span>
            </div>
            <div className="flex justify-between">
              <span>Front-end DTI</span>
              <span className={`font-semibold ${getDTIColor(frontEndDTI)}`}>{pct(frontEndDTI)}</span>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
            💡 Many expats rent for 1–2 years after relocating before buying — this lets you understand the local market, build banking relationships, and avoid rushed decisions.
          </div>
        </div>

        {/* Amortization */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
          <div className="mb-3 text-sm font-semibold">Amortization Schedule</div>
          <AmortizationTable rows={amortRows} />
        </div>

        <AdSlot />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
export default function MortgageCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>("us");
  const hasMounted = useRef(false);

  useEffect(() => {
    const qs = getQS();
    const vTab = qs.get("tab") as Tab | null;
    if (vTab === "us" || vTab === "international") setActiveTab(vTab);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("tab", activeTab);
    setQS(qs);
  }, [activeTab]);

  return (
    <div className="text-slate-900">
      {/* Tab switcher */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveTab("us")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${activeTab === "us" ? "bg-slate-900 text-white" : "text-slate-700 hover:text-slate-900"}`}
          >
            🇺🇸 US Mortgage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("international")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${activeTab === "international" ? "bg-slate-900 text-white" : "text-slate-700 hover:text-slate-900"}`}
          >
            🌍 Buying Abroad
          </button>
        </div>
        <div className="text-xs text-slate-500">
          {activeTab === "us" ? "US home purchase planning" : "Post-relocation international home buying"}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "us" ? <USTab /> : <InternationalTab />}
      </div>
    </div>
  );
}
