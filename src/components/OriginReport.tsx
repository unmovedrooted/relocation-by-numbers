import Link from "next/link";
import { GOVERNMENT_DATA_META } from "@/lib/governmentData";
import { BUY_ASSUMPTIONS, buildPairReport, ELECTRICITY_META, REPORT_SALARIES, type PairReport } from "@/lib/pairReport";
import { MIGRATION_META, migrationPair, topDestinations } from "@/lib/migration";
import { findCity } from "@/lib/cities";
import { STATE_NAMES } from "@/lib/stateNames";
import { card, GridTable, h2, level, note, num, orNA, pctOf, signed, strong, Tile, usd } from "@/components/reportParts";

type Built = { id: string; report: PairReport };

function build(originId: string, destIds: string[]): Built[] {
  return destIds.flatMap((id) => {
    const report = buildPairReport(originId, id);
    return report ? [{ id, report }] : [];
  });
}

const stateName = (code: string) => STATE_NAMES[code as keyof typeof STATE_NAMES] ?? code.toUpperCase();

/** Headline numbers for the origin city, shown near the top of an origin hub. */
export function OriginReportSummary({ originId, destIds }: { originId: string; destIds: string[] }) {
  const built = build(originId, destIds);
  const origin = findCity(originId);
  if (!origin || built.length === 0) return null;
  const first = built[0].report;
  const top = topDestinations(origin.state, 1)[0];
  const best = [...built].sort((a, b) => b.report.headline.takeHomeChange - a.report.headline.takeHomeChange)[0];
  return (
    <section aria-label={`${origin.name} at a glance`} className={card}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">At a glance, single filer on {usd(first.headline.salary)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={`Take-home in ${origin.name}`} value={usd(first.taxAtHeadline.from.net)} sub={`a year, after ${pctOf(first.taxAtHeadline.from.totalTax, first.headline.salary)} total tax`} />
        <Tile label="Typical rent" value={first.cost.rent[0] === null ? "n/a" : `${usd(first.cost.rent[0])}/mo`} sub="Census Bureau, recent movers" />
        <Tile label="Price level (U.S. = 100)" value={level(first.cost.priceLevel[0])} sub={`${origin.name} metro area (BEA)`} />
        <Tile
          label="Biggest take-home gain"
          value={`${signed(best.report.headline.takeHomeChange)}`}
          sub={`a year moving to ${best.report.toName} on the same salary`}
        />
      </div>
      {top && (
        <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
          Most common destination for people leaving {stateName(origin.state)} (IRS, {MIGRATION_META.years[MIGRATION_META.years.length - 1]}): {stateName(top.state)}, {num(top.households)} households.
        </p>
      )}
    </section>
  );
}

/** The detailed sections for an origin hub: taxes, equal salaries, cost of living, rent or buy, budget, migration, questions, sources. */
export default function OriginReport({ originId, destIds }: { originId: string; destIds: string[] }) {
  const built = build(originId, destIds);
  const origin = findCity(originId);
  if (!origin || built.length === 0) return null;
  const first = built[0].report;
  const salary = first.headline.salary;
  const originName = origin.name;
  const originState = stateName(origin.state);
  const meta = GOVERNMENT_DATA_META;
  const latestYear = MIGRATION_META.years[MIGRATION_META.years.length - 1];
  const names = built.map((b) => b.report.toName);

  const taxCols = [`Tax on ${usd(salary)}`, originName, ...names];
  const taxLine = (label: string, pick: (t: PairReport["taxAtHeadline"]["from"]) => number): string[] => [
    label, usd(pick(first.taxAtHeadline.from)), ...built.map((b) => usd(pick(b.report.taxAtHeadline.to))),
  ];
  const taxRows: string[][] = [
    taxLine("Federal income tax", (t) => t.federal),
    taxLine("Social Security and Medicare", (t) => t.fica),
    taxLine("State income tax", (t) => t.state),
    taxLine("City income tax", (t) => t.local),
    taxLine("State payroll programs", (t) => t.statePayroll),
    taxLine("Take-home pay", (t) => t.net),
    ["Share of pay paid in tax", pctOf(first.taxAtHeadline.from.totalTax, salary), ...built.map((b) => pctOf(b.report.taxAtHeadline.to.totalTax, salary))],
  ];

  const equalCols = [`${originName} salary`, ...names.map((n) => `Equal salary in ${n}`)];
  const equalRows: string[][] = REPORT_SALARIES.map((s, i) => [
    usd(s),
    ...built.map((b) => {
      const row = b.report.salaryRows[i];
      return `${orNA(row.equal)} (${signed(row.change)} take-home)`;
    }),
  ]);

  const costCols = ["Measure", originName, ...names];
  const costLine = (label: string, pick: (r: PairReport) => [number | null, number | null], fmt: (n: number | null) => string): string[] => [
    label, fmt(pick(first)[0]), ...built.map((b) => fmt(pick(b.report)[1])),
  ];
  const costRows: string[][] = [
    costLine("Overall price level (U.S. = 100)", (r) => r.cost.priceLevel, level),
    costLine("Housing price level", (r) => r.cost.housing, level),
    costLine("Typical rent (monthly)", (r) => r.cost.rent, (n) => orNA(n)),
    costLine("Typical home value", (r) => r.cost.homeValue, (n) => orNA(n)),
    costLine("Median property tax paid (yearly)", (r) => r.cost.propertyTaxPaid, (n) => orNA(n)),
    costLine("Residential electricity (cents per kWh)", (r) => r.cost.electricityCents, (n) => orNA(n, (v) => v.toFixed(2))),
  ];

  const buyRows: string[][] = [
    costLine(`Income to rent the typical home (${Math.round(BUY_ASSUMPTIONS.rentShareOfIncome * 100)}% rule)`, (r) => r.buy.incomeToRent, (n) => orNA(n)),
    costLine(`Monthly cost to own the typical home (${Math.round(BUY_ASSUMPTIONS.downPct * 100)}% down)`, (r) => r.buy.monthlyOwnCost, (n) => orNA(n)),
    costLine(`Income to buy the typical home (${Math.round(BUY_ASSUMPTIONS.buyShareOfIncome * 100)}% rule)`, (r) => r.buy.incomeToBuy, (n) => orNA(n)),
  ];

  const budgetRows: string[][] = [
    costLine("Taxes plus rent (yearly)", (r) => r.budget.rentTotal, (n) => orNA(n)),
    ["Change vs " + originName + " if you rent", "", ...built.map((b) => (b.report.budget.rentTotal[0] === null || b.report.budget.rentTotal[1] === null ? "n/a" : signed(b.report.budget.rentTotal[1] - b.report.budget.rentTotal[0])))],
    costLine("Taxes plus owning the home (yearly)", (r) => r.budget.ownTotal, (n) => orNA(n)),
    ["Change vs " + originName + " if you buy", "", ...built.map((b) => (b.report.budget.ownTotal[0] === null || b.report.budget.ownTotal[1] === null ? "n/a" : signed(b.report.budget.ownTotal[1] - b.report.budget.ownTotal[0])))],
  ];

  // IRS flows to the states of the destinations (a state appears once even if two destinations share it).
  const seenStates = new Set<string>();
  const flowRows: string[][] = [];
  for (const b of built) {
    const dest = findCity(b.id);
    if (!dest || seenStates.has(dest.state)) continue;
    seenStates.add(dest.state);
    const m = migrationPair(origin.state, dest.state);
    if (m) flowRows.push([stateName(dest.state), num(m.households), num(m.reverseHouseholds), `${m.netToDestination >= 0 ? "+" : ""}${num(m.netToDestination)}`, m.destinationRank ? `#${m.destinationRank}` : "n/a"]);
  }
  const where = topDestinations(origin.state, 8);

  const bestAfterRent = [...built]
    .filter((b) => b.report.budget.rentTotal[0] !== null && b.report.budget.rentTotal[1] !== null)
    .sort((a, b) => (a.report.budget.rentTotal[1]! - a.report.budget.rentTotal[0]!) - (b.report.budget.rentTotal[1]! - b.report.budget.rentTotal[0]!))[0];
  const topTwo = where.slice(0, 2).map((d) => stateName(d.state));

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How much salary do I need elsewhere to live like I do in ${originName}?`,
      a: `On ${usd(salary)} in ${originName}, the equal salary is ${built.map((b) => `${orNA(b.report.headline.equalSalary)} in ${b.report.toName}`).join(", ")}, after 2026 federal, state and local taxes and BEA regional price levels.`,
    },
    bestAfterRent
      ? {
          q: `Which destination costs the least in taxes and rent compared with ${originName}?`,
          a: `On ${usd(salary)}, ${bestAfterRent.report.toName} comes out lowest: taxes plus rent are ${usd(Math.abs(bestAfterRent.report.budget.rentTotal[1]! - bestAfterRent.report.budget.rentTotal[0]!))} a year ${bestAfterRent.report.budget.rentTotal[1]! <= bestAfterRent.report.budget.rentTotal[0]! ? "less" : "more"} than in ${originName}.`,
        }
      : { q: `Which destination costs the least in taxes and rent?`, a: "Rent data is not available for every city on this page." },
    {
      q: `Where do people leaving ${originState} move?`,
      a: where.length > 0 ? `IRS migration data for ${latestYear} show ${topTwo.join(" and ")} as the two most common destinations for people leaving ${originState}, followed by ${where.slice(2, 5).map((d) => stateName(d.state)).join(", ")}. These are state totals, not city totals.` : "No migration data is available.",
    },
    {
      q: `Will I pay less tax if I leave ${originName}?`,
      a: `${built.map((b) => `${b.report.toName}: ${usd(Math.abs(b.report.taxAtHeadline.to.totalTax - b.report.taxAtHeadline.from.totalTax))} a year ${b.report.taxAtHeadline.to.totalTax <= b.report.taxAtHeadline.from.totalTax ? "less" : "more"}`).join("; ")} in income and payroll taxes on ${usd(salary)} (single filer).`,
    },
  ];
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };
  const link = "underline underline-offset-2 hover:opacity-80";

  return (
    <>
      <section className={card} aria-labelledby="or-taxes">
        <h2 id="or-taxes" className={h2}>2026 taxes on {usd(salary)}: {originName} and where you might move</h2>
        <GridTable columns={taxCols} rows={taxRows} minWidth="38rem" />
        <p className={note}>Single filer, wages only, standard deduction, no 401(k) contribution. Federal figures follow IRS Rev. Proc. 2025-32; state and city rules are on the methodology page.</p>
      </section>

      <section className={card} aria-labelledby="or-equal">
        <h2 id="or-equal" className={h2}>Salary needed to match {originName} pay</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">The destination salary with the same after-tax buying power, and the change in take-home pay at the same salary.</p>
        <GridTable columns={equalCols} rows={equalRows} minWidth="40rem" />
        <p className={note}>After-tax pay divided by the local price level is the same at both salaries. Itemizing deductions can narrow the gap at higher incomes.</p>
      </section>

      <section className={card} aria-labelledby="or-col">
        <h2 id="or-col" className={h2}>Cost of living compared</h2>
        <GridTable columns={costCols} rows={costRows} minWidth="38rem" />
        <p className={note}>
          Price levels are BEA Regional Price Parities for each metro area ({meta.bea.vintage}). Rent, home value and property tax are U.S. Census Bureau figures ({meta.census.vintage}); electricity is the EIA residential price, {ELECTRICITY_META.period.toLowerCase()}.
        </p>
      </section>

      <section className={card} aria-labelledby="or-buy">
        <h2 id="or-buy" className={h2}>Renting and buying compared</h2>
        <GridTable columns={costCols} rows={buyRows} minWidth="38rem" />
        <p className={note}>
          Owning cost is the mortgage payment on the typical home with {Math.round(BUY_ASSUMPTIONS.downPct * 100)}% down, a {BUY_ASSUMPTIONS.years}-year loan at {BUY_ASSUMPTIONS.ratePct}% (the calculator&apos;s starting rate, not a quote),
          the city&apos;s typical property tax rate and ${BUY_ASSUMPTIONS.homeInsuranceMonthly} a month for insurance. HOA fees and maintenance are not included.
        </p>
      </section>

      <section className={card} aria-labelledby="or-budget">
        <h2 id="or-budget" className={h2}>Your yearly taxes and housing on {usd(salary)}</h2>
        <GridTable columns={costCols} rows={budgetRows} minWidth="38rem" />
        <p className={note}>
          Food, transportation, car and health insurance, child care, sales tax and one-time moving costs are not included. These are the costs the tax and housing data can compare, not total spending.
        </p>
      </section>

      {flowRows.length > 0 && (
        <section className={card} aria-labelledby="or-migration">
          <h2 id="or-migration" className={h2}>Who moves from {originState}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Households that filed a return in {originState} the year before and in another state in {latestYear}, from IRS migration data.
          </p>
          <GridTable columns={["Destination state", "Households from " + originState, "Households back", "Net to destination", `Rank from ${originState}`]} rows={flowRows} minWidth="34rem" />
          {where.length > 0 && (
            <>
              <h3 className={`mt-5 text-sm font-semibold ${strong}`}>Where people from {originState} actually move</h3>
              <ul className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                {where.map((d) => <li key={d.state}>{stateName(d.state)}: {num(d.households)} households</li>)}
              </ul>
            </>
          )}
          <p className={note}>Source: IRS Statistics of Income state-to-state migration files. The IRS publishes state totals, not city-to-city moves, and counts only people who filed a return in both years.</p>
        </section>
      )}

      <section className={card} aria-labelledby="or-next">
        <h2 id="or-next" className={h2}>Where to go next</h2>
        <ul className={`mt-3 space-y-2 text-sm leading-6 ${"text-slate-600 dark:text-slate-400"}`}>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/compare">Compare a move</Link>: see what a change of city does to rent, taxes and take-home pay.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/fire-calculator">See the FIRE impact</Link>: enter your numbers and use the Move tab to see the change in your timeline.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/complete-retirement-plan">Plan it in detail</Link>: model withdrawals, taxes and Social Security year by year (Beta).</li>
        </ul>
      </section>

      <section className={card} aria-labelledby="or-faq">
        <h2 id="or-faq" className={h2}>Frequently asked questions</h2>
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

      <section className={card} aria-labelledby="or-sources">
        <h2 id="or-sources" className={h2}>Sources and limits</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Written and maintained by Relocation By Numbers. Figures were generated on {meta.generatedOn} from the sources below; tax rules are for tax year 2026.{" "}
          <Link href="/methodology" className={link}>Full methodology</Link>
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li><a className={link} href="https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" target="_blank" rel="noopener noreferrer">IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction</a></li>
          <li><a className={link} href="https://www.irs.gov/publications/p15" target="_blank" rel="noopener noreferrer">IRS Publication 15 (2026): payroll tax rates</a></li>
          <li><a className={link} href={meta.census.source} target="_blank" rel="noopener noreferrer">U.S. Census Bureau, American Community Survey ({meta.census.vintage})</a></li>
          <li><a className={link} href={meta.bea.source} target="_blank" rel="noopener noreferrer">Bureau of Economic Analysis, Regional Price Parities ({meta.bea.vintage})</a></li>
          <li><a className={link} href={MIGRATION_META.url} target="_blank" rel="noopener noreferrer">IRS Statistics of Income, state-to-state migration data</a></li>
          <li><a className={link} href={ELECTRICITY_META.url} target="_blank" rel="noopener noreferrer">U.S. Energy Information Administration, Electric Power Monthly, Table 5.6.B</a></li>
          <li><Link className={link} href="/methodology#state-sources">State and city income tax rules, by state</Link></li>
        </ul>
        <h3 className={`mt-4 text-sm font-semibold ${strong}`}>Not included</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Itemized deductions, tax credits and dependents; the figures are for a single filer on wages.</li>
          <li>Neighborhood-level rent and home prices, which can differ widely from a city median.</li>
          <li>Moving costs, car costs, health insurance, child care, food and sales tax.</li>
        </ul>
      </section>
    </>
  );
}
