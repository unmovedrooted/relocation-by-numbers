import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "../../lib/states";
import { STATE_RULE_NOTES, taxRulesVerifiedLabel, PAYROLL_PROGRAMS_NOTE, TAX_YEAR } from "../../lib/taxRuleNotes";
import { CALCULATOR_INFO, LOCAL_TAX_SOURCES, STATE_TAX_SOURCES } from "../../lib/calculatorSources";
import { STATE_PAYROLL_PROGRAMS } from "../../lib/statePayrollPrograms";
import type { StateCode } from "../../lib/states";
import { GOVERNMENT_DATA_META } from "../../lib/governmentData";
import { FX_SOURCE } from "../../lib/internationalFx";

export const metadata: Metadata = {
  title: "Methodology & Data Sources",
  description:
    "Understand relocation budgets, housing and living-cost data, moving expenses, affordability, and the tax and retirement assumptions behind our planning estimates.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <header className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
            Methodology
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Our Relocation Calculators Work
          </h1>

          <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
            Understand how a move could change your monthly budget, how much cash you
            need upfront, and what financial cushion remains. Here is where our numbers
            come from, how we use them, and what the results can and cannot tell you.
          </p>

          <p className="max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            The tools on this site are designed for planning and comparison. They are
            intended to help users understand direction and tradeoffs, not replace tax
            filing software, lender underwriting, legal advice, or personalized financial advice.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            U.S. tax assumptions: {TAX_YEAR}. Individual data vintages and review dates are listed below.
          </p>
        </header>

        <nav aria-label="Methodology sections" className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">On this page</h2>
          <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["overview", "How relocation results work"],
              ["understanding-estimates", "Inputs, estimates and uncertainty"],
              ["housing", "Housing and affordability"],
              ["cost-of-living", "Cost of living"],
              ["moving-costs", "Moving costs and cash readiness"],
              ["international", "International relocation"],
              ["data-sources", "Data vintages and fallbacks"],
              ["tax-estimates", "Simplified taxes"],
              ["tax-year-and-sources", "Tax coverage and limits"],
              ["state-sources", "State and local sources"],
              ["fire", "FIRE methodology"],
              ["retirement", "Retirement models"],
              ["exclusions-by-tool", "Calculator-specific limitations"],
              ["updates", "Documentation updates"],
            ].map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">{label}</a></li>
            ))}
          </ul>
        </nav>

        <section id="purpose" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What these tools are designed to do
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              These calculators are built to compare how a move could change take-home pay,
              monthly housing pressure, cost of living, relocation readiness, and long-term
              FIRE timelines across different cities, states, and international destinations.
            </p>

            <p>
              The goal is to help answer practical planning questions such as:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>How might my monthly budget change if I move?</li>
              <li>How much salary would feel equivalent in another location?</li>
              <li>Would a lower-cost move improve my monthly flexibility?</li>
              <li>How might relocation change my FIRE timeline?</li>
              <li>How much cash do I likely need before an international move?</li>
            </ul>
          </div>
        </section>

        <section id="overview" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            How we calculate your relocation results
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">1. Your information</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                The model starts with user inputs such as salary, filing status,
                household assumptions, savings, and housing choices where relevant.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">2. Location data</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Housing defaults, regional price levels and destination assumptions
                provide starting estimates. Replace them with your own costs where editable.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">3. Moving costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                One-time expenses, deposits and other cash requirements are separated
                from the recurring monthly budget. Defaults are not moving-company quotes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">4. Estimated take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Simplified taxes help estimate what income remains to pay for the move
                and everyday life. Coverage depends on the tool and jurisdiction.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:col-span-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">5. Your results</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Compare monthly financial impact, upfront cash needs and longer-term
                tradeoffs. A comfortable monthly budget alone does not mean you can fund the move.
              </p>
            </div>
          </div>
        </section>

        <section id="understanding-estimates" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Understand the numbers and their uncertainty
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Not every number on the site is the same kind of input. In general, the
              models distinguish the information supplied from the rules applied to it:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-slate-900 dark:text-slate-100">Your inputs:</span> amounts you provide, such as rent or a mover&apos;s quote. Their usefulness depends on accuracy and what the quote includes.</li>
              <li><span className="font-medium text-slate-900 dark:text-slate-100">Public data:</span> published housing statistics and regional price indexes. These describe an area, not a specific available home or your household.</li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Rule-based inputs:</span> examples include
                tax brackets, filing status logic, and structured formula-based calculations.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Planning estimates:</span> examples include
                housing assumptions, monthly essentials, and affordability comparisons built from location data.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Comparison heuristics:</span> examples include
                weighted affordability logic, comfort signals, and scenario-planning shortcuts used to keep the tools practical.
              </li>
            </ul>

            <p>
              That distinction matters because some outputs are closer to structured formula results,
              while others are best treated as directional planning estimates rather than exact figures.
              A loan payment calculated from entered loan terms has a different uncertainty from
              a grocery budget scaled by a regional index. Neither guarantees the final bill.
            </p>
          </div>
        </section>

        <section id="housing" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Housing and affordability estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Housing estimates are one of the largest parts of the model because housing
              is often the biggest recurring expense in a move. Depending on the calculator,
              users may compare renting or buying and estimate how much of their take-home
              pay may go toward housing.
            </p>

            <p>
              Buy-mode estimates may include mortgage principal and interest, property taxes,
              homeowners insurance, HOA costs, and PMI when down payment assumptions suggest
              PMI may apply. Rent-mode estimates may include monthly rent and renter-related
              housing costs where relevant.
            </p>

            <p>
              City rent, home-price and property-tax defaults come from the U.S. Census Bureau American Community
              Survey 2020-2024 (5-year estimates). Rent is what households that moved in during 2023 or later
              pay, converted to the contract-rent basis (tables B25113, B25058 and B25064); home price is the
              owner-reported value of homes bought in 2023 or later (B25109). Where that group is too small to be
              reliable (margin of error above 25% of the estimate), the all-renter or all-owner median is used
              instead, and the city page says which. The property-tax rate is median real estate taxes paid
              divided by median home value (B25103 and B25077); a city without its own figure uses its state&apos;s.
            </p>

            <p>
              These housing calculations are designed for planning comparison only and do not
              represent a mortgage approval, underwriting decision, or final lender quote.
            </p>
          </div>
        </section>

        <section id="cost-of-living" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Cost of living assumptions
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Cost-of-living comparisons use location-specific assumptions for categories
              such as housing, groceries, utilities, transportation, healthcare, and
              other recurring living expenses when those inputs are available in the model.
            </p>

            <p>
              City price levels come from the Bureau of Economic Analysis Regional Price Parities for 2024, which
              compare a metro area (or the state, for cities outside a metro area) with the national average of
              1.00. Housing uses the housing index and utilities the utilities index. BEA does not publish
              separate indexes for groceries, transportation or healthcare, so groceries and transportation use
              the goods index and healthcare uses the other-services index.
            </p>

            <p>
              The national dollar budgets those indexes scale (groceries, utilities, transportation, healthcare,
              childcare and miscellaneous), plus insurance, closing costs and state sales tax, are planning
              assumptions rather than government figures.
            </p>

            <p>
              On the U.S. relocation homepage, the current-city monthly starting budget is
              $600 groceries, $250 utilities, $300 transportation, $300 dining and $200
              miscellaneous. Destination groceries, utilities and transportation use the
              destination-to-origin ratio of the relevant price indexes; without both cities&apos;
              index data, the starting amounts are used. Editable destination amounts replace
              these estimates. This is not a measured household spending average.
            </p>

            <p>
              The homepage&apos;s separate cost-of-living index weights housing 35%, groceries 15%,
              utilities 10%, transportation 15%, healthcare 10% and an unadjusted remainder 15%.
              That index is not the monthly expense total: the cash budget adds its individual
              expense amounts. International and regional tools use their own city/country
              presets and editable costs, not this U.S. index-weight formula.
            </p>

            <p>
              These estimates should be treated as directional planning inputs. Actual
              living costs vary by neighborhood, household size, commute, lifestyle,
              insurance choices, and personal spending habits.
            </p>
          </div>
        </section>

        <section id="moving-costs" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Moving and setup expenses
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">U.S. relocation homepage</h3>
            <p>
              Blank moving fields use $1,500 for movers or a truck, $500 for travel and
              $2,000 for furniture/setup. These are fixed planning allowances: they do not
              calculate distance, shipment weight, household size or a mover&apos;s price.
              Replace them with quotes; an explicitly entered zero is different from a blank.
            </p>
            <p>
              Lease-break costs default to zero. Fees default to zero when renting, or 3%
              of the home price when buying. The rental deposit defaults to two months of
              entered rent. Housing overlap is entered months multiplied by destination monthly
              housing cost. Buying also adds the entered down payment to cash required.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Spent moving costs = movers + travel + setup + lease-break costs + fees + housing overlap.</li>
              <li>Cash needed upfront = spent moving costs + refundable deposit + down payment, where applicable.</li>
              <li>Monthly change = destination take-home pay minus destination housing/living costs, less the equivalent current-location remainder.</li>
              <li>First-year impact = 12 × monthly change − spent moving costs. Refundable deposits and down payments are cash requirements, not spent costs in this comparison.</li>
              <li>Months to earn back costs = spent costs ÷ positive monthly improvement, rounded up. With no positive improvement, there is no payback unless spent costs are zero.</li>
            </ul>
            <p>
              The shared U.S. move-comparison engine varies estimated housing by 10%, living
              costs by 15% and one-time amounts by 25% for its low/high cases. User-entered
              amounts stay fixed. These spreads are sensitivity assumptions, not confidence
              intervals or quoted price ranges.
            </p>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">International and regional tools</h3>
            <p>
              These have separate destination presets and cost fields, not the homepage&apos;s
              $1,500/$500/$2,000 allowances. Upfront items can include deposits, prepaid rent,
              visa fees, flights, shipping, temporary stays, administration, furniture and
              an emergency reserve. Read the itemized result and replace presets with actual
              costs. A cash reserve is money set aside, not a fee paid to a third party.
            </p>
            <p>
              For example, Europe adds rental deposit and first/last rent (or a purchase down
              payment), visa, flight, shipping, temporary stay, admin, conditional furniture
              and an emergency buffer. Furnished housing excludes furniture setup. Additional
              runway divides savings left after all upfront requirements by monthly costs;
              the cash-cushion verdict includes the emergency reserve in available savings.
              A cushion below three months can downgrade an otherwise comfortable monthly
              verdict. This is a planning signal, not a guarantee or lending standard.
            </p>
          </div>
        </section>

        <section id="international" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            International relocation estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              International tools add another layer beyond domestic relocation because
              visa path, residency status, one-time setup costs, and country-specific
              tax treatment often matter as much as monthly living costs.
            </p>

            <p>
              Depending on the destination and tool, international relocation estimates
              may include destination-city rent and essentials, one-time moving costs,
              visa or permit fee assumptions, healthcare-related costs, and country-level
              tax treatment for planning purposes.
            </p>

            <p>
              These tools do not fully model every immigration path, residency rule,
              employer sponsorship structure, treaty rule, or local legal edge case.
              They are intended to help users compare scenarios before pursuing official
              visa or tax guidance.
            </p>
          </div>
        </section>

        <section id="data-sources" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Data sources, vintages and fallbacks
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>Data year, import date and review date are different. Reorganizing this page does not refresh the underlying figures.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" role="region" aria-label="Data sources and fallback table" tabIndex={0}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Source vintage, recorded update and fallback by data category</caption>
                <thead className="bg-slate-50 dark:bg-slate-950"><tr>
                  <th scope="col" className="p-3">Data and use</th><th scope="col" className="p-3">Source / data year</th><th scope="col" className="p-3">Recorded update</th><th scope="col" className="p-3">Fallback or limitation</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr><th scope="row" className="p-3 font-medium">U.S. city housing defaults</th><td className="p-3"><a href={GOVERNMENT_DATA_META.census.source} className="underline">Census ACS</a>: {GOVERNMENT_DATA_META.census.vintage}</td><td className="p-3">Imported {GOVERNMENT_DATA_META.generatedOn}</td><td className="p-3">All-renter/all-owner medians when recent-mover samples are unreliable; state property-tax rate when the city rate is missing.</td></tr>
                  <tr><th scope="row" className="p-3 font-medium">U.S. price-level indexes</th><td className="p-3"><a href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area" className="underline">BEA</a>: {GOVERNMENT_DATA_META.bea.vintage}</td><td className="p-3">Imported {GOVERNMENT_DATA_META.generatedOn}</td><td className="p-3">State index where metro data is unavailable; indexes scale planning budgets rather than supplying household dollar spending.</td></tr>
                  <tr><th scope="row" className="p-3">Moving and living budgets</th><td className="p-3">Internal planning assumptions; not a survey vintage</td><td className="p-3">No independent source-review date recorded</td><td className="p-3">Tool-specific defaults; replace editable estimates with your own quotes and budget.</td></tr>
                  <tr><th scope="row" className="p-3">International rents and essentials</th><td className="p-3">Mixed official statistics, market estimates and planning defaults; source years vary by city</td><td className="p-3">Source notes record rent checks in October 2026, including October 14 market estimates</td><td className="p-3">City/country presets are not all official averages. Groceries, utilities, transport, healthcare and setup are planning estimates.</td></tr>
                  <tr><th scope="row" className="p-3">International exchange rates</th><td className="p-3"><a href={FX_SOURCE.url} className="underline">{FX_SOURCE.name}</a>, {FX_SOURCE.asOf}</td><td className="p-3">Quarter-end snapshot, not a live feed</td><td className="p-3">Some rates have separately documented exceptions. Actual bank rates, spreads and transfer fees may differ.</td></tr>
                  <tr><th scope="row" className="p-3">U.S. wage-tax rules</th><td className="p-3">Tax year {TAX_YEAR}; IRS, state and local sources below</td><td className="p-3">Checked {taxRulesVerifiedLabel()}</td><td className="p-3"><a href="#tax-year-and-sources" className="underline">Held, derived and unconfirmed state figures</a> remain explicitly listed.</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Relocation by Numbers uses a combination of public tax parameters, housing and
              cost assumptions, internally maintained location data, and comparison logic built
              for planning usefulness across the site.
            </p>

            <p>
              Depending on the calculator, inputs may come from structured tax assumptions,
              city or state cost defaults, rent and housing parameters, relocation cost estimates,
              and internal modeling designed to compare locations on a consistent basis.
            </p>

            <p>
              Because taxes, housing markets, living costs, and international rules change over time,
              assumptions may be revised as models improve or newer data becomes available.
            </p>
          </div>
        </section>

        <section id="tax-estimates" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Simplified taxes and take-home pay
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Relocation by Numbers estimates after-tax income using a simplified
              planning model that may include federal income tax, FICA payroll taxes,
              filing status, optional retirement contributions, and state-level or
              country-level income tax assumptions where applicable.
            </p>

            <p>
              Tax handling varies by jurisdiction. Some states or countries have no
              income tax, some use flat-rate logic, and others use simplified bracket-based
              estimates. These calculations are designed to support comparison, not to
              produce a filing-ready tax result.
            </p>

            <p>
              Tax calculations do not attempt to fully model every real-world variable.
              Depending on the tool, they may not fully account for itemized deductions,
              credits, local taxes, self-employment rules, investment income treatment,
              treaty treatment, residency edge cases, or unusual filing situations.
            </p>
          </div>
        </section>

        <section id="tax-year-and-sources" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            U.S. tax year, sources and known limits
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              The U.S. calculators use {TAX_YEAR} tax rules taken from government sources (the IRS, state tax agencies and legislatures, and city or county governments), last checked {taxRulesVerifiedLabel()}. They estimate
              the tax owed for the year on wages for a resident with the standard deduction. They do not estimate
              paycheck withholding, which follows different employer formulas.
            </p>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Sources</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Federal brackets and standard deduction: IRS Rev. Proc. 2025-32.</li>
                <li>Social Security wage base and payroll rates: IRS Publication 15 (2026); Additional Medicare thresholds: IRS Form 8959 instructions.</li>
                <li>401(k), IRA and catch-up limits: IRS Notice 2025-67. HSA limits and high-deductible plan limits: IRS Rev. Proc. 2025-19 and Publication 969.</li>
                <li>State income tax: each state tax agency, state legislature or state code, as listed in the verification notes (rates, brackets, deductions, exemptions and credits).</li>
                <li>Local income tax: the city, county or state agency that administers it (for example NYC through the New York State Department of Taxation and Finance; Maryland counties through the Comptroller of Maryland).</li>
              </ul>
            </div>

            <div id="state-payroll" className="scroll-mt-24">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">State payroll programs included</h3>
              <p className="mt-2">{PAYROLL_PROGRAMS_NOTE}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                {STATE_PAYROLL_PROGRAMS.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{STATES.find((st) => st.code === p.state)?.name}: {p.name}</span>{" "}
                    {String(parseFloat((p.rate * 100).toFixed(4)))}%
                    {p.wageCap !== undefined ? ` of the first $${p.wageCap.toLocaleString("en-US")}` : " of all wages"}
                    {p.maxAnnual !== undefined ? `, at most $${p.maxAnnual.toLocaleString("en-US", { maximumFractionDigits: 2 })} a year` : ""}
                    {p.employerMayPay ? " (employer may pay)" : ""}
                    {p.status === "not-independently-confirmed" ? " (not independently confirmed)" : ""}.{" "}
                    <a href={p.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{p.source.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Local income taxes modeled</h3>
              <p className="mt-2">
                New York City, Philadelphia, Pittsburgh, Allentown, Columbus, Cleveland, Cincinnati, Detroit,
                Grand Rapids, Birmingham, Kansas City (Missouri), St. Louis, Baltimore, Frederick County and Montgomery
                County (Maryland), Indianapolis, Fort Wayne and Evansville (Indiana county taxes), and Portland (Oregon
                Metro and Multnomah County taxes). These assume you live and work in the same place. Taxes on nonresident
                commuters and credits for tax paid to another city are not included.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Not included</h3>
              <p className="mt-2">
                Not included: itemized deductions, tax credits for dependents and
                education, the Roth-only rule for high earners&apos; 401(k) catch-up contributions, and capital gains or
                other non-wage income in the paycheck, relocation and comparison tools. Washington&apos;s income tax on
                high earners, enacted in 2026, applies to income from 2028 and is not part of {TAX_YEAR} results.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">State figures that are held, derived or not yet confirmed</h3>
              <p className="mt-2">
                These states use at least one figure that the state has not published for {TAX_YEAR}, or that we could not
                confirm. Each is replaced when the state publishes it.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.entries(STATE_RULE_NOTES).map(([code, item]) => (
                  <li key={code}>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {STATES.find((st) => st.code === code)?.name ?? code}:
                    </span>{" "}
                    {item.note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="state-sources" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            State and local tax sources
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            The documents each state&apos;s rules were read from, checked {taxRulesVerifiedLabel()}. States with held or
            derived figures are listed above.
          </p>
          <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400 sm:grid-cols-2">
            {STATES.map((st) => (
              <li key={st.code}>
                <span className="font-medium text-slate-800 dark:text-slate-200">{st.name}: </span>
                {STATE_TAX_SOURCES[st.code as StateCode].map((src, i) => (
                  <span key={src.url}>
                    {i > 0 ? "; " : ""}
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{src.label}</a>
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <h3 className="mt-5 font-semibold text-slate-900 dark:text-slate-100">Local income taxes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {LOCAL_TAX_SOURCES.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{src.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <section id="fire" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            FIRE calculations
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              FIRE estimates are based on a planning framework that may include annual
              spending, withdrawal rate, after-tax income, savings assumptions, investment
              growth assumptions, inflation assumptions, and current portfolio values.
            </p>

            <p>
              The FIRE number is generally estimated from annual spending divided by the
              selected withdrawal rate. The timeline to financial independence depends on
              contributions, current assets, growth assumptions, inflation assumptions,
              and location-adjusted spending.
            </p>

            <p>
              Location matters because taxes and spending can both change when you move.
              A lower-tax state or lower-cost city may reduce the income needed to support
              your target lifestyle and may shorten the path to financial independence.
              A higher-cost move may do the opposite.
            </p>

            <p>
              The FIRE variants share this same math with different spending assumptions:
              Lean FIRE (a smaller budget), Chubby FIRE (roughly $100k&ndash;$150k a year,
              about $2.5M&ndash;$3.75M at a 4% rate), and Fat FIRE (roughly $200k+ a year,
              about $5M+). The dollar targets are simply annual spending divided by the
              withdrawal rate; the &ldquo;Lean / Chubby / Fat&rdquo; labels are community
              conventions rather than official thresholds.
            </p>
            <p>
              Coast FIRE asks how much must already be invested to grow toward the future
              retirement target without further contributions after coasting. Barista FIRE
              reduces the spending gap by assumed part-time income; when an end age is
              entered, the model also accounts for funding full spending after that income ends.
              These are different scenarios, not promises of a safe withdrawal outcome.
            </p>
            <p>
              Shared FIRE limitations: simplified wage-tax estimates, limited filing statuses
              and no filing-ready return. Returns, inflation, contributions and future spending
              are assumptions. Full exclusions for each variant are retained in the
              <a href="#exclusions-by-tool" className="ml-1 underline underline-offset-2">calculator-specific limitations</a> below.
            </p>
          </div>
        </section>

        <section id="retirement" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Retirement planning calculators
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              The Retirement, Retirement Withdrawal, Roth Conversion, and HSA calculators
              work in today&rsquo;s dollars: contributions and withdrawals grow with inflation
              and the portfolio compounds at an inflation-adjusted &ldquo;real&rdquo; return,
              so results reflect present-day buying power. Taxes on traditional retirement
              withdrawals and Roth conversions use the same federal and state engine as the
              rest of the site, treated as ordinary income (no FICA); Illinois, Pennsylvania,
              Mississippi, and the nine no-income-tax states are handled as exempting
              qualified retirement income. HSA figures use the 2026 IRS limits, with
              California and New Jersey modeled as not conforming to the federal HSA exemption.
            </p>

            <p>
              <span className="font-medium text-slate-900 dark:text-slate-100">Market volatility (Monte Carlo):</span>{" "}
              the Retirement and Retirement Withdrawal calculators offer an optional
              &ldquo;market ups &amp; downs&rdquo; view that runs 5,000 simulated market
              histories, drawing each year&rsquo;s return from a lognormal distribution
              centered on your expected return at a chosen volatility (Conservative, Balanced,
              Aggressive, or custom). It reports a range of outcomes and, for withdrawals, a
              success rate that captures sequence-of-returns risk. The simulation uses a fixed
              random seed, so the same inputs always reproduce the same result. It is a model
              of risk, not a prediction, and does not use historical return sequences.
            </p>
          </div>
        </section>

        <section id="exclusions-by-tool" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What each tool leaves out
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            These are the same limits shown on each calculator page. Open a tool to read
            its full exclusions; shared wording is retained so no tool-specific warning is lost.
          </p>
          <div className="mt-3 space-y-4">
            {Object.entries(CALCULATOR_INFO).map(([path, info]) => (
              <details key={path} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-slate-100">
                  {info.name}
                </summary>
                <Link href={path} className="mt-3 inline-block text-sm underline underline-offset-2">Open {info.name}</Link>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {info.exclusions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <section id="updates" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Documentation updates
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <li><time dateTime="2026-11-11">November 11, 2026</time>: reorganized this page around relocation, documented moving-cost defaults and added navigation and source/fallback notes. No calculation rules or datasets changed.</li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">This log starts with the documentation restructure. It is not a claim that every source was independently reverified on that date.</p>
        </section>

        <section id="disclaimer" className="scroll-mt-24 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Important disclaimer
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
            Relocation by Numbers provides planning estimates only. Nothing on this site should
            be considered tax, legal, mortgage, investment, or financial advice. Always verify
            major financial or relocation decisions with qualified professionals and current source documents.
          </p>
        </section>

        <section id="explore-tools" className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Explore the tools
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Homepage
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Explore
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Compare Cities
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/international-relocation"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              International Relocation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
