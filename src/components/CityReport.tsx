import Link from "next/link";
import FeedbackBox from "@/components/FeedbackBox";
import { GOVERNMENT_DATA_META } from "@/lib/governmentData";
import { BUY_ASSUMPTIONS, ELECTRICITY_META } from "@/lib/pairReport";
import { buildCityReport } from "@/lib/cityReport";
import { MIGRATION_META } from "@/lib/migration";
import { STATE_NAMES } from "@/lib/stateNames";
import { diff, GridTable, level, num, orNA, pctOf, Tile, toneStyles, usd, type Tone } from "@/components/reportParts";

export type CityFocus = "cost" | "salary" | "fire";

const stateName = (code: string) => STATE_NAMES[code as keyof typeof STATE_NAMES] ?? code.toUpperCase();

/**
 * Data-backed sections for a single-city page: 2026 taxes at several salaries, prices against the U.S., rent or buy, state migration,
 * questions with markup, sources and the feedback box. `tone` matches the page's theme; `focus` changes the headings and questions.
 */
export default function CityReport({ cityId, tone = "themed", focus, path }: { cityId: string; tone?: Tone; focus: CityFocus; path?: string }) {
  const r = buildCityReport(cityId);
  if (!r) return null;
  const t = toneStyles(tone);
  const meta = GOVERNMENT_DATA_META;
  const latestYear = MIGRATION_META.years[MIGRATION_META.years.length - 1];
  const state = stateName(r.stateCode);
  const c = r.cost;
  const n = r.national;
  const tax = r.taxAtHeadline;
  const noTax = tax.state === 0 && tax.local === 0;
  const pctVsUs = c.priceLevel === null ? null : (c.priceLevel / n.priceLevel - 1) * 100;
  const rentVsUs = c.rent !== null && n.rent ? (c.rent / n.rent - 1) * 100 : null;
  const word = (v: number) => (v >= 0 ? "higher" : "lower");

  const headings = {
    cost: { taxes: `2026 taxes on ${usd(r.salary)} in ${r.name}`, col: `Cost of living in ${r.name} compared with the U.S.`, rows: `Take-home pay in ${r.name} at every salary` },
    salary: { taxes: `What ${usd(r.salary)} keeps in ${r.name} after 2026 taxes`, col: `${r.name} prices compared with the U.S.`, rows: `Salary, take-home and rent in ${r.name}` },
    fire: { taxes: `2026 taxes on ${usd(r.salary)} in ${r.name}`, col: `What ${r.name} costs compared with the U.S.`, rows: `What is left to save in ${r.name} at every salary` },
  }[focus];

  const taxRows: string[][] = [
    ["Federal income tax", usd(tax.federal)],
    ["Social Security and Medicare", usd(tax.fica)],
    [`${state} income tax`, usd(tax.state)],
    ["City income tax", usd(tax.local)],
    ["State payroll programs", usd(tax.statePayroll)],
    ["Take-home pay", usd(tax.net)],
    ["Share of pay paid in tax", pctOf(tax.totalTax, r.salary)],
  ];

  const salaryCols = ["Salary", "Take-home a year", "Take-home a month", "After typical rent a month", "Rent share of take-home"];
  const salaryRows: string[][] = r.salaryRows.map((row) => [
    usd(row.salary),
    usd(row.tax.net),
    usd(row.monthlyNet),
    row.afterRent === null ? "n/a" : usd(row.afterRent),
    c.rent === null ? "n/a" : pctOf(c.rent, row.monthlyNet),
  ]);

  const costRows: string[][] = [
    ["Overall price level (U.S. = 100)", level(c.priceLevel), level(n.priceLevel), diff(n.priceLevel, c.priceLevel, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Housing price level", level(c.housing), level(n.priceLevel), diff(n.priceLevel, c.housing, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Utilities price level", level(c.utilities), level(n.priceLevel), diff(n.priceLevel, c.utilities, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Goods price level", level(c.goods), level(n.priceLevel), diff(n.priceLevel, c.goods, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`)],
    ["Typical rent (monthly)", orNA(c.rent), orNA(n.rent), diff(n.rent, c.rent)],
    ["Typical home value", orNA(c.homeValue), orNA(n.homeValue), diff(n.homeValue, c.homeValue)],
    ["Median property tax paid (yearly)", orNA(c.propertyTaxPaid), orNA(n.propertyTaxPaid), diff(n.propertyTaxPaid, c.propertyTaxPaid)],
    ["Residential electricity (cents per kWh)", orNA(c.electricityCents, (v) => v.toFixed(2)), orNA(n.electricityCents, (v) => v.toFixed(2)), diff(n.electricityCents, c.electricityCents, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`)],
  ];

  const buyRows: string[][] = [
    [`Income to rent the typical home (${Math.round(BUY_ASSUMPTIONS.rentShareOfIncome * 100)}% rule)`, orNA(r.housing.incomeToRent)],
    [`Monthly cost to own the typical home (${Math.round(BUY_ASSUMPTIONS.downPct * 100)}% down)`, orNA(r.housing.monthlyOwnCost)],
    [`Income to buy the typical home (${Math.round(BUY_ASSUMPTIONS.buyShareOfIncome * 100)}% rule)`, orNA(r.housing.incomeToBuy)],
  ];

  const m = r.migration;
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How much do I keep of a ${usd(r.salary)} salary in ${r.name}?`,
      a: `A single filer on ${usd(r.salary)} keeps about ${usd(tax.net)} a year (${usd(tax.net / 12)} a month) in ${r.name} after 2026 federal${noTax ? " and payroll tax. " + state + " has no state or city income tax on wages" : ", state, local and payroll tax"}. That is ${pctOf(tax.totalTax, r.salary)} of pay paid in tax.`,
    },
    {
      q: `Is ${r.name} expensive?`,
      a: pctVsUs === null
        ? `Price-level data is not available for ${r.name}.`
        : `Overall prices in the ${r.name} area are ${Math.abs(pctVsUs).toFixed(1)}% ${word(pctVsUs)} than the U.S. average (BEA Regional Price Parities).${c.rent !== null && n.rent ? ` Typical rent is ${usd(c.rent)} a month${rentVsUs === null ? "" : `, ${Math.abs(rentVsUs).toFixed(0)}% ${word(rentVsUs)} than the national figure of ${usd(n.rent)}`}.` : ""}`,
    },
    {
      q: `How much income do I need to rent or buy in ${r.name}?`,
      a: r.housing.incomeToRent === null || r.housing.incomeToBuy === null
        ? `Housing data is not available for ${r.name}.`
        : `To keep rent at ${Math.round(BUY_ASSUMPTIONS.rentShareOfIncome * 100)}% of income, about ${usd(r.housing.incomeToRent)} a year covers the typical rent of ${usd(c.rent ?? 0)}. Owning the typical home with ${Math.round(BUY_ASSUMPTIONS.downPct * 100)}% down costs about ${usd(r.housing.monthlyOwnCost ?? 0)} a month, which takes about ${usd(r.housing.incomeToBuy)} a year at ${Math.round(BUY_ASSUMPTIONS.buyShareOfIncome * 100)}% of income.`,
    },
    {
      q: `Are people moving to ${state}?`,
      a: `IRS migration data for ${latestYear} show ${num(m.inflow)} households moving into ${state} from other states and ${num(m.outflow)} moving out, a net ${m.net >= 0 ? "gain" : "loss"} of ${num(Math.abs(m.net))} households. These are state totals, not city totals.`,
    },
  ];
  if (focus === "fire") {
    faqs.push({
      q: `How much can I save in ${r.name} on ${usd(r.salary)}?`,
      a: `After taxes and the typical rent of ${usd(c.rent ?? 0)}, a single filer on ${usd(r.salary)} has about ${r.salaryRows.find((x) => x.salary === r.salary)?.afterRent === null ? "n/a" : usd(r.salaryRows.find((x) => x.salary === r.salary)?.afterRent ?? 0)} a month left before food, transport, health care and everything else. How much of that you can save depends on those costs.`,
    });
  }
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  return (
    <>
      <section aria-label={`${r.name} at a glance`} className={t.card}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "dark" ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>{r.name} at a glance, single filer on {usd(r.salary)}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile tone={tone} label="Take-home pay" value={usd(tax.net)} sub={`a year, after ${pctOf(tax.totalTax, r.salary)} total tax`} />
          <Tile tone={tone} label="Typical rent" value={c.rent === null ? "n/a" : `${usd(c.rent)}/mo`} sub={rentVsUs === null ? "Census Bureau, recent movers" : `${Math.abs(rentVsUs).toFixed(0)}% ${word(rentVsUs)} than the U.S. median`} />
          <Tile tone={tone} label="Price level (U.S. = 100)" value={level(c.priceLevel)} sub={`${r.name} metro area (BEA)`} />
          <Tile tone={tone} label="Income to rent comfortably" value={orNA(r.housing.incomeToRent)} sub={`keeps rent at ${Math.round(BUY_ASSUMPTIONS.rentShareOfIncome * 100)}% of income`} />
        </div>
      </section>

      <section className={t.card} aria-labelledby="cr-taxes">
        <h2 id="cr-taxes" className={t.h2}>{headings.taxes}</h2>
        <GridTable tone={tone} columns={[`Tax on ${usd(r.salary)}`, r.name]} rows={taxRows} minWidth="20rem" />
        <p className={t.note}>Single filer, wages only, standard deduction, no 401(k) contribution. Federal figures follow IRS Rev. Proc. 2025-32; state and city rules are on the methodology page.</p>
      </section>

      <section className={t.card} aria-labelledby="cr-salaries">
        <h2 id="cr-salaries" className={t.h2}>{headings.rows}</h2>
        <GridTable tone={tone} columns={salaryCols} rows={salaryRows} minWidth="38rem" />
        <p className={t.note}>Take-home is after 2026 federal, state, local and payroll tax. Rent is the typical Census figure for recent movers. Food, transportation, insurance and other costs are not subtracted.</p>
      </section>

      <section className={t.card} aria-labelledby="cr-col">
        <h2 id="cr-col" className={t.h2}>{headings.col}</h2>
        <GridTable tone={tone} columns={["Measure", r.name, "U.S.", "Difference"]} rows={costRows} minWidth="34rem" />
        <p className={t.note}>
          Price levels are BEA Regional Price Parities for the metro area ({meta.bea.vintage}); housing, utilities and goods levels are shown against the U.S. average of 100. Rent, home value and property tax are U.S. Census Bureau figures ({meta.census.vintage});
          electricity is the {state} residential price, {ELECTRICITY_META.period.toLowerCase()}.
        </p>
      </section>

      <section className={t.card} aria-labelledby="cr-buy">
        <h2 id="cr-buy" className={t.h2}>Renting and buying in {r.name}</h2>
        <GridTable tone={tone} columns={["Measure", r.name]} rows={buyRows} minWidth="22rem" />
        <p className={t.note}>
          Owning cost is the mortgage payment on the typical home with {Math.round(BUY_ASSUMPTIONS.downPct * 100)}% down, a {BUY_ASSUMPTIONS.years}-year loan at {BUY_ASSUMPTIONS.ratePct}% (the calculator&apos;s starting rate, not a quote), the city&apos;s typical property tax rate
          and ${BUY_ASSUMPTIONS.homeInsuranceMonthly} a month for insurance. HOA fees and maintenance are not included.
        </p>
      </section>

      <section className={t.card} aria-labelledby="cr-migration">
        <h2 id="cr-migration" className={t.h2}>Who moves to and from {state}</h2>
        <p className={`mt-2 text-sm leading-7 ${t.body}`}>
          In the latest IRS migration data ({latestYear}), <strong className={t.strong}>{num(m.inflow)} households</strong> filed in {state} after filing in another state the year before, and {num(m.outflow)} did the reverse:
          a net {m.net >= 0 ? "gain" : "loss"} of {num(Math.abs(m.net))} households.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className={`text-sm font-semibold ${t.strong}`}>Where people moving to {state} come from</h3>
            <ul className={`mt-2 space-y-1 text-sm ${t.body}`}>
              {m.origins.map((d) => <li key={d.state}>{stateName(d.state)}: {num(d.households)} households</li>)}
            </ul>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${t.strong}`}>Where people leaving {state} go</h3>
            <ul className={`mt-2 space-y-1 text-sm ${t.body}`}>
              {m.destinations.map((d) => <li key={d.state}>{stateName(d.state)}: {num(d.households)} households</li>)}
            </ul>
          </div>
        </div>
        <p className={t.note}>Source: IRS Statistics of Income state-to-state migration files. The IRS publishes state totals, not city totals, and counts only people who filed a return in both years.</p>
      </section>

      <section className={t.card} aria-labelledby="cr-next">
        <h2 id="cr-next" className={t.h2}>Where to go next</h2>
        <ul className={`mt-3 space-y-2 text-sm leading-6 ${t.body}`}>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/compare">Compare a move</Link>: see what a change of city does to rent, taxes and take-home pay.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/fire-calculator">See the FIRE impact</Link>: enter your numbers and use the Move tab to see the change in your timeline.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/complete-retirement-plan">Plan it in detail</Link>: model withdrawals, taxes and Social Security year by year (Beta).</li>
        </ul>
      </section>

      <section className={t.card} aria-labelledby="cr-faq">
        <h2 id="cr-faq" className={t.h2}>{r.name} questions</h2>
        <dl className={`mt-4 space-y-5 text-sm ${t.body}`}>
          {faqs.map((x) => (
            <div key={x.q}>
              <dt className={`font-semibold ${t.strong}`}>{x.q}</dt>
              <dd className="mt-1 leading-7">{x.a}</dd>
            </div>
          ))}
        </dl>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      </section>

      <section className={t.card} aria-labelledby="cr-sources">
        <h2 id="cr-sources" className={t.h2}>Sources and limits</h2>
        <p className={`mt-2 text-sm leading-6 ${t.body}`}>
          Written and maintained by Relocation By Numbers. Figures were generated on {meta.generatedOn} from the sources below; tax rules are for tax year 2026.{" "}
          <Link href="/methodology" className={t.link}>Full methodology</Link>
        </p>
        <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${t.body}`}>
          <li><a className={t.link} href="https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" target="_blank" rel="noopener noreferrer">IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction</a></li>
          <li><a className={t.link} href="https://www.irs.gov/publications/p15" target="_blank" rel="noopener noreferrer">IRS Publication 15 (2026): payroll tax rates</a></li>
          <li><a className={t.link} href={meta.census.source} target="_blank" rel="noopener noreferrer">U.S. Census Bureau, American Community Survey ({meta.census.vintage})</a></li>
          <li><a className={t.link} href={meta.bea.source} target="_blank" rel="noopener noreferrer">Bureau of Economic Analysis, Regional Price Parities ({meta.bea.vintage})</a></li>
          <li><a className={t.link} href={MIGRATION_META.url} target="_blank" rel="noopener noreferrer">IRS Statistics of Income, state-to-state migration data</a></li>
          <li><a className={t.link} href={ELECTRICITY_META.url} target="_blank" rel="noopener noreferrer">U.S. Energy Information Administration, Electric Power Monthly, Table 5.6.B</a></li>
          <li><Link className={t.link} href="/methodology#state-sources">State and city income tax rules, by state</Link></li>
        </ul>
        <h3 className={`mt-4 text-sm font-semibold ${t.strong}`}>Not included</h3>
        <ul className={`mt-1 list-disc space-y-1 pl-5 text-sm ${t.body}`}>
          <li>Itemized deductions, tax credits and dependents; the figures are for a single filer on wages.</li>
          <li>Neighborhood-level rent and home prices, which can differ widely from a city median.</li>
          <li>Moving costs, car costs, health insurance, child care, food and sales tax.</li>
        </ul>
      </section>

      <FeedbackBox path={path ?? (focus === "cost" ? `/cost-of-living/${r.id}` : focus === "salary" ? `/salary-needed-in/${r.id}` : `/best-cities-for-fire/${r.id}`)} name={`${r.name} page`} tone={tone === "dark" ? "dark" : "light"} />
    </>
  );
}
