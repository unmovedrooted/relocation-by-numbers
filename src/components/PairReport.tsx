import Link from "next/link";
import FeedbackBox from "@/components/FeedbackBox";
import { GOVERNMENT_DATA_META } from "@/lib/governmentData";
import { BUY_ASSUMPTIONS, buildPairReport, type PairReport as Report } from "@/lib/pairReport";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const orNA = (n: number | null, f: (v: number) => string = usd) => (n === null ? "n/a" : f(n));
const level = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));
const diff = (a: number | null, b: number | null, f: (v: number) => string = signed) => (a === null || b === null ? "n/a" : f(b - a));
const pctOf = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%");

const card = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]";
const h2 = "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100";
const th = "pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const note = "mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400";
const strong = "text-slate-900 dark:text-slate-100";

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{sub}</div>
    </div>
  );
}

function CompareTable({ report, rows }: { report: Report; rows: Array<[string, string, string, string]> }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="text-left">
            <th className={th}>Measure</th>
            <th className={`${th} text-right`}>{report.fromName}</th>
            <th className={`${th} text-right`}>{report.toName}</th>
            <th className={`${th} text-right`}>Change</th>
          </tr>
        </thead>
        <tbody className="text-slate-700 dark:text-slate-300">
          {rows.map(([label, a, b, change]) => (
            <tr key={label} className="border-t border-slate-200 dark:border-slate-800">
              <td className="py-2 pr-3">{label}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{a}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{b}</td>
              <td className="py-2 text-right font-medium tabular-nums">{change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The four headline numbers, shown near the top of a city-pair page. */
export function PairReportSummary({ fromId, toId }: { fromId: string; toId: string }) {
  const r = buildPairReport(fromId, toId);
  if (!r) return null;
  const h = r.headline;
  return (
    <section aria-label={`${r.fromName} to ${r.toName} at a glance`} className={card}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">At a glance, single filer on {usd(h.salary)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label={`Equal salary in ${r.toName}`}
          value={orNA(h.equalSalary)}
          sub={h.equalSalary === null ? "Price data unavailable" : `matches ${usd(h.salary)} in ${r.fromName}, after 2026 taxes and local prices`}
        />
        <Tile
          label="Take-home change per year"
          value={signed(h.takeHomeChange)}
          sub={`same ${usd(h.salary)} salary, after federal, state and local tax`}
        />
        <Tile
          label="Purchasing power"
          value={h.purchasingPowerPct === null ? "n/a" : `${h.purchasingPowerPct >= 0 ? "+" : ""}${h.purchasingPowerPct.toFixed(1)}%`}
          sub={h.priceDifferencePct === null ? "Price data unavailable" : `prices ${Math.abs(h.priceDifferencePct).toFixed(1)}% ${h.priceDifferencePct >= 0 ? "lower" : "higher"} (BEA)`}
        />
        <Tile
          label="Typical rent change"
          value={r.cost.rent[0] === null || r.cost.rent[1] === null ? "n/a" : `${signed(r.cost.rent[1] - r.cost.rent[0])}/mo`}
          sub={`${orNA(r.cost.rent[0])} to ${orNA(r.cost.rent[1])} a month (Census)`}
        />
      </div>
    </section>
  );
}

/** The detailed sections: taxes, cost of living, rent or buy, yearly budget, questions and sources. */
export default function PairReport({ fromId, toId, path }: { fromId: string; toId: string; path: string }) {
  const r = buildPairReport(fromId, toId);
  if (!r) return null;
  const { from: f, to: t } = r.taxAtHeadline;
  const h = r.headline;
  const c = r.cost;
  const taxLess = t.totalTax <= f.totalTax;
  const cheaper = h.priceDifferencePct === null ? null : h.priceDifferencePct >= 0;

  const taxRows: Array<[string, string, string, string]> = [
    ["Federal income tax", usd(f.federal), usd(t.federal), signed(t.federal - f.federal)],
    ["Social Security and Medicare", usd(f.fica), usd(t.fica), signed(t.fica - f.fica)],
    ["State income tax", usd(f.state), usd(t.state), signed(t.state - f.state)],
    ["City income tax", usd(f.local), usd(t.local), signed(t.local - f.local)],
    ["State payroll programs", usd(f.statePayroll), usd(t.statePayroll), signed(t.statePayroll - f.statePayroll)],
    ["Take-home pay", usd(f.net), usd(t.net), signed(t.net - f.net)],
    ["Share of pay paid in tax", pctOf(f.totalTax, h.salary), pctOf(t.totalTax, h.salary), ""],
  ];

  const costRows: Array<[string, string, string, string]> = [
    ["Overall price level (U.S. = 100)", level(c.priceLevel[0]), level(c.priceLevel[1]), diff(c.priceLevel[0], c.priceLevel[1], (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Housing price level", level(c.housing[0]), level(c.housing[1]), diff(c.housing[0], c.housing[1], (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Utilities price level", level(c.utilities[0]), level(c.utilities[1]), diff(c.utilities[0], c.utilities[1], (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Goods price level", level(c.goods[0]), level(c.goods[1]), diff(c.goods[0], c.goods[1], (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Typical rent (monthly)", orNA(c.rent[0]), orNA(c.rent[1]), diff(c.rent[0], c.rent[1])],
    ["Typical home value", orNA(c.homeValue[0]), orNA(c.homeValue[1]), diff(c.homeValue[0], c.homeValue[1])],
    ["Median property tax paid (yearly)", orNA(c.propertyTaxPaid[0]), orNA(c.propertyTaxPaid[1]), diff(c.propertyTaxPaid[0], c.propertyTaxPaid[1])],
    ["Effective property tax rate", orNA(c.propertyTaxRatePct[0], (v) => `${v.toFixed(2)}%`), orNA(c.propertyTaxRatePct[1], (v) => `${v.toFixed(2)}%`), ""],
  ];

  const b = r.buy;
  const buyRows: Array<[string, string, string, string]> = [
    [`Income to rent the typical home (${BUY_ASSUMPTIONS.rentShareOfIncome * 100}% rule)`, orNA(b.incomeToRent[0]), orNA(b.incomeToRent[1]), diff(b.incomeToRent[0], b.incomeToRent[1])],
    [`Monthly cost to own the typical home (${BUY_ASSUMPTIONS.downPct * 100}% down)`, orNA(b.monthlyOwnCost[0]), orNA(b.monthlyOwnCost[1]), diff(b.monthlyOwnCost[0], b.monthlyOwnCost[1])],
    [`Income to buy the typical home (${BUY_ASSUMPTIONS.buyShareOfIncome * 100}% rule)`, orNA(b.incomeToBuy[0]), orNA(b.incomeToBuy[1]), diff(b.incomeToBuy[0], b.incomeToBuy[1])],
  ];

  const bd = r.budget;
  const budgetRows: Array<[string, string, string, string]> = [
    ["Income and payroll taxes", usd(f.totalTax), usd(t.totalTax), signed(t.totalTax - f.totalTax)],
    ["If you rent: yearly rent", orNA(bd.rentYear[0]), orNA(bd.rentYear[1]), diff(bd.rentYear[0], bd.rentYear[1])],
    ["Taxes plus rent", orNA(bd.rentTotal[0]), orNA(bd.rentTotal[1]), diff(bd.rentTotal[0], bd.rentTotal[1])],
    ["If you buy: mortgage, property tax and insurance", orNA(bd.ownYear[0]), orNA(bd.ownYear[1]), diff(bd.ownYear[0], bd.ownYear[1])],
    ["Taxes plus owning the home", orNA(bd.ownTotal[0]), orNA(bd.ownTotal[1]), diff(bd.ownTotal[0], bd.ownTotal[1])],
  ];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How much salary do I need in ${r.toName} to live like I do in ${r.fromName}?`,
      a: h.equalSalary === null
        ? `The price data needed for this estimate is not available for ${r.toName}.`
        : `A ${usd(h.salary)} salary in ${r.fromName} has about the same buying power as ${usd(h.equalSalary)} in ${r.toName} once 2026 federal, state and local taxes and BEA regional price levels are counted.`,
    },
    {
      q: `Will I pay less tax in ${r.toName} than in ${r.fromName}?`,
      a: `${taxLess ? "Yes" : "No"}: on ${usd(h.salary)} a single filer pays ${usd(Math.abs(t.totalTax - f.totalTax))} a year ${taxLess ? "less" : "more"} in income and payroll taxes in ${r.toName} (${pctOf(t.totalTax, h.salary)} of pay, against ${pctOf(f.totalTax, h.salary)} in ${r.fromName}). Property tax and sales tax are shown separately.`,
    },
    {
      q: `Is ${r.toName} cheaper than ${r.fromName}?`,
      a: cheaper === null
        ? `Price-level data is not available for both cities.`
        : `Overall prices in the ${r.toName} area are ${Math.abs(h.priceDifferencePct!).toFixed(1)}% ${cheaper ? "lower" : "higher"} than in the ${r.fromName} area (BEA Regional Price Parities). ${c.rent[0] !== null && c.rent[1] !== null ? `Typical rent is ${usd(c.rent[1])} a month in ${r.toName} against ${usd(c.rent[0])} in ${r.fromName}.` : ""}`.trim(),
    },
    {
      q: `How much income do I need to rent or buy in ${r.toName}?`,
      a: b.incomeToRent[1] === null || b.incomeToBuy[1] === null
        ? `Housing data is not available for ${r.toName}.`
        : `To keep rent at ${BUY_ASSUMPTIONS.rentShareOfIncome * 100}% of income, about ${usd(b.incomeToRent[1])} a year covers the typical rent of ${usd(c.rent[1] ?? 0)}. Owning the typical home with ${BUY_ASSUMPTIONS.downPct * 100}% down costs about ${usd(b.monthlyOwnCost[1] ?? 0)} a month, which takes about ${usd(b.incomeToBuy[1])} a year at ${BUY_ASSUMPTIONS.buyShareOfIncome * 100}% of income.`,
    },
  ];

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  const meta = GOVERNMENT_DATA_META;

  return (
    <>
      <section className={card} aria-labelledby="pr-taxes">
        <h2 id="pr-taxes" className={h2}>2026 taxes on {usd(h.salary)}: {r.fromName} and {r.toName}</h2>
        <CompareTable report={r} rows={taxRows} />
        <p className={note}>Single filer, wages only, standard deduction, no 401(k) contribution. Federal figures follow IRS Rev. Proc. 2025-32; state and city rules are listed on the methodology page.</p>
      </section>

      <section className={card} aria-labelledby="pr-salaries">
        <h2 id="pr-salaries" className={h2}>{r.fromName} vs {r.toName} take-home pay at every salary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          The salary needed in {r.toName} to match each {r.fromName} salary, and take-home pay in both cities.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left">
                <th className={th}>Salary</th>
                <th className={`${th} text-right`}>Equal salary in {r.toName}</th>
                <th className={`${th} text-right`}>Take-home change</th>
                <th className={`${th} text-right`}>Take-home in {r.fromName}</th>
                <th className={`${th} text-right`}>Take-home in {r.toName}</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {r.salaryRows.map((row) => (
                <tr key={row.salary} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium">{usd(row.salary)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{orNA(row.equal)}</td>
                  <td className="py-2 pr-3 text-right font-medium tabular-nums">{signed(row.change)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{usd(row.fromNet)}</td>
                  <td className="py-2 text-right tabular-nums">{usd(row.toNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={note}>
          &quot;Equal salary&quot; keeps the same after-tax buying power: after-tax pay divided by the local price level is the same in both cities. At higher incomes, itemizing
          deductions (such as state and local taxes) can lower federal tax and narrow the gap shown.
        </p>
      </section>

      <section className={card} aria-labelledby="pr-col">
        <h2 id="pr-col" className={h2}>Cost of living: {r.fromName} vs {r.toName}</h2>
        <CompareTable report={r} rows={costRows} />
        <p className={note}>
          Price levels are BEA Regional Price Parities for each city&apos;s metro area ({meta.bea.vintage}). Rent, home value and property tax are U.S. Census Bureau figures ({meta.census.vintage}).
          Typical rent and home value use recent movers where the sample is reliable, so they reflect what a new renter or buyer pays now.
        </p>
      </section>

      <section className={card} aria-labelledby="pr-buy">
        <h2 id="pr-buy" className={h2}>Renting and buying: {r.fromName} vs {r.toName}</h2>
        <CompareTable report={r} rows={buyRows} />
        <p className={note}>
          Owning cost is the mortgage payment on the typical home with {BUY_ASSUMPTIONS.downPct * 100}% down, a {BUY_ASSUMPTIONS.years}-year loan at {BUY_ASSUMPTIONS.ratePct}% (the calculator&apos;s starting rate, not a quote),
          plus the city&apos;s typical property tax rate and ${BUY_ASSUMPTIONS.homeInsuranceMonthly} a month for insurance. HOA fees and maintenance are not included. The calculator below lets you change the rate, down payment and prices.
        </p>
      </section>

      <section className={card} aria-labelledby="pr-budget">
        <h2 id="pr-budget" className={h2}>Your yearly budget: {r.fromName} vs {r.toName}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          On {usd(h.salary)} the taxes and housing you can compare directly come to{" "}
          <strong className={strong}>{orNA(bd.rentTotal[0])}</strong> a year in {r.fromName} and{" "}
          <strong className={strong}>{orNA(bd.rentTotal[1])}</strong> in {r.toName} if you rent
          {bd.rentTotal[0] !== null && bd.rentTotal[1] !== null ? `: ${usd(Math.abs(bd.rentTotal[1] - bd.rentTotal[0]))} ${bd.rentTotal[1] <= bd.rentTotal[0] ? "less" : "more"} after the move` : ""}.
        </p>
        <CompareTable report={r} rows={budgetRows} />
        <p className={note}>
          Not included: food, transportation, car and health insurance, child care, utilities beyond those in gross rent, sales tax and one-time moving costs. These are the costs
          the tax and housing data can compare, not total spending. Use the calculator below for moving costs and the full monthly budget.
        </p>
      </section>

      <section className={card} aria-labelledby="pr-faq">
        <h2 id="pr-faq" className={h2}>Frequently asked questions</h2>
        <dl className="mt-4 space-y-5 text-sm text-slate-600 dark:text-slate-400">
          {faqs.map((x) => (
            <div key={x.q}>
              <dt className={`font-semibold ${strong}`}>{x.q}</dt>
              <dd className="mt-1 leading-7">{x.a}</dd>
            </div>
          ))}
        </dl>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      </section>

      <section className={card} aria-labelledby="pr-sources">
        <h2 id="pr-sources" className={h2}>Sources and limits</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Written and maintained by Relocation By Numbers. Figures were generated on {meta.generatedOn} from the sources below, and the tax rules are those for tax year 2026.{" "}
          <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">Full methodology</Link>
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li><a className="underline underline-offset-2 hover:opacity-80" href="https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" target="_blank" rel="noopener noreferrer">IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction</a></li>
          <li><a className="underline underline-offset-2 hover:opacity-80" href="https://www.irs.gov/publications/p15" target="_blank" rel="noopener noreferrer">IRS Publication 15 (2026): Social Security wage base and payroll tax rates</a></li>
          <li><a className="underline underline-offset-2 hover:opacity-80" href={meta.census.source} target="_blank" rel="noopener noreferrer">U.S. Census Bureau, American Community Survey ({meta.census.vintage}): rent, home value and property tax</a></li>
          <li><a className="underline underline-offset-2 hover:opacity-80" href={meta.bea.source} target="_blank" rel="noopener noreferrer">Bureau of Economic Analysis, Regional Price Parities ({meta.bea.vintage})</a></li>
          <li><Link className="underline underline-offset-2 hover:opacity-80" href="/methodology#state-sources">State and city income tax rules, by state</Link></li>
        </ul>
        <h3 className={`mt-4 text-sm font-semibold ${strong}`}>Not included</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Itemized deductions, tax credits and dependents; the figures are for a single filer on wages.</li>
          <li>Neighborhood-level rent and home prices, which can differ widely from a city median.</li>
          <li>Moving costs, car costs, health insurance, child care, food and sales tax.</li>
        </ul>
      </section>

      <FeedbackBox path={path} name={`${r.fromName} to ${r.toName} comparison`} />
    </>
  );
}
