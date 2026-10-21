import Link from "next/link";
import { buildCityReport, type CityReport } from "@/lib/cityReport";
import { ALLOWED_FIRE_CITY_PAGES } from "@/lib/seo-allowlists";
import { MIGRATION_META } from "@/lib/migration";
import { PAIR_EXAMPLE_SALARY } from "@/lib/pairExample";
import { toneStyles, usd } from "@/components/reportParts";
import { REPORT_SALARIES } from "@/lib/pairReport";
import FireCitiesTable, { type FireCityRow } from "@/components/FireCitiesTable";

type Row = { id: string; r: CityReport; afterRent: number | null; monthlyNet: number; stateTax: number };

function rows(): Row[] {
  return ALLOWED_FIRE_CITY_PAGES.flatMap((id) => {
    const r = buildCityReport(id);
    if (!r) return [];
    const at = r.salaryRows.find((x) => x.salary === PAIR_EXAMPLE_SALARY) ?? r.salaryRows[0];
    return [{ id, r, afterRent: at.afterRent, monthlyNet: at.monthlyNet, stateTax: at.tax.state + at.tax.local }];
  }).sort((a, b) => (b.afterRent ?? -Infinity) - (a.afterRent ?? -Infinity));
}

/**
 * The ranking at the top of the Best Cities for FIRE hub: the ten FIRE cities at one salary, ordered by what is left after rent,
 * with the figures behind the order. Dark tone to match the page. Everything is computed from the same data as the city pages.
 */
export default function FireCitiesReport() {
  const t = toneStyles("dark");
  const list = rows();
  if (list.length === 0) return null;
  const ranked = list.filter((x) => x.afterRent !== null);
  const top = ranked[0];
  const noTax = list.filter((x) => x.stateTax === 0);
  const year = MIGRATION_META.years[MIGRATION_META.years.length - 1];

  // Every salary and both filing statuses are computed here, so the table can be re-ranked in the browser without recomputing.
  const tableCities: FireCityRow[] = list.map((x) => {
    const married = buildCityReport(x.id, "married");
    const pick = (rep: CityReport) => Object.fromEntries(rep.salaryRows.map((s) => [String(s.salary), { monthlyNet: s.monthlyNet, stateTax: s.tax.state + s.tax.local }]));
    return {
      id: x.id,
      name: x.r.name,
      stateCode: x.r.stateCode,
      rent: x.r.cost.rent,
      priceLevel: x.r.cost.priceLevel,
      netMigration: x.r.migration.net,
      byFiling: { single: pick(x.r), married: married ? pick(married) : pick(x.r) },
    };
  });

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Which of these cities leaves the most after rent?",
      a: top ? `On ${usd(PAIR_EXAMPLE_SALARY)} a year, a single filer in ${top.r.name} has about ${usd(top.afterRent!)} a month left after 2026 taxes and the typical rent, the most of the ${list.length} cities listed. This is before food, transportation, insurance and everything else, so it is a starting point for how much you could save, not the saving itself.` : "Rent data is not available for these cities.",
    },
    {
      q: "Is the cheapest city always the best for FIRE?",
      a: "No. A lower cost of living only helps if your income holds up and the place suits you. The table shows what the numbers say for one salary; the city pages show take-home pay at five salaries so you can see how the ranking changes with your income.",
    },
    {
      q: "Do no-income-tax states help with FIRE?",
      a: `${noTax.length > 0 ? `${noTax.map((x) => x.r.name).join(", ")} ${noTax.length === 1 ? "has" : "have"} no state or city income tax on wages, which raises take-home pay. ` : ""}Housing, property tax and insurance still matter, and some of these cities have higher property tax rates, so check the renting and buying figures on each city page.`,
    },
  ];
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  return (
    <>
      <section className={t.card} aria-labelledby="bc-table">
        <h2 id="bc-table" className={t.h2}>The {list.length} FIRE cities, ranked by what is left after rent</h2>
        <FireCitiesTable cities={tableCities} salaries={[...REPORT_SALARIES]} defaultSalary={PAIR_EXAMPLE_SALARY} />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x) => (
            <li key={x.id}>
              <Link href={`/best-cities-for-fire/${x.id}`} className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Is {x.r.name} good for FIRE? →
              </Link>
            </li>
          ))}
        </ul>
        <p className={t.note}>
          Price level is the BEA regional price parity for the metro area (U.S. = 100). State migration ({year}) is on each city page.
          Planning estimates, not tax advice. The ranking depends on the salary used; your own income and spending can reorder it.
        </p>
      </section>

      <section className={t.card} aria-labelledby="bc-next" data-next-step>
        <h2 id="bc-next" className={t.h2}>Where to go next</h2>
        <ul className={`mt-3 space-y-2 text-sm leading-6 ${t.body}`}>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/compare">Compare a move</Link>: see what a change of city does to rent, taxes and take-home pay.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/fire-calculator">See the FIRE impact</Link>: enter your numbers and use the Move tab to see the change in your timeline.</li>
          <li><Link className="font-semibold underline underline-offset-4 hover:no-underline" href="/complete-retirement-plan">Plan it in detail</Link>: model withdrawals, taxes and Social Security year by year (Beta).</li>
        </ul>
      </section>

      <section className={t.card} aria-labelledby="bc-faq">
        <h2 id="bc-faq" className={t.h2}>Best cities for FIRE: common questions</h2>
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
    </>
  );
}
