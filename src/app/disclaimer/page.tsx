import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Disclaimer
        </h1>

        <p className="text-base leading-7 text-slate-700">
          Relocation By Numbers provides planning tools and educational information
          for relocation, cost of living, salary comparison, housing, and FIRE
          planning. The site is designed to help users compare scenarios and think
          through tradeoffs. It is not a source of personalized financial, tax,
          legal, mortgage, immigration, or investment advice.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Planning estimates only
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
          <p>
            Calculator results are planning estimates based on the information you
            enter and simplified assumptions about taxes, investment returns,
            inflation, salary growth, housing costs, and living expenses. Actual
            results will vary and may differ materially from the outputs shown.
          </p>

          <p>
            These tools are intended for directional comparison. They are most
            useful for questions like whether one city may be more affordable than
            another, how a move may affect a monthly budget, or how lower expenses
            may change a FIRE timeline. They are not designed to predict exact
            personal outcomes.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Tax, mortgage, and legal limitations
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
          <p>
            Tax estimates use simplified federal, state, or country-specific models
            for comparison purposes. They are not intended to represent exact tax
            filing outcomes and may not reflect your full personal situation,
            deductions, credits, local taxes, payroll contributions, treaty rules,
            immigration status, or other important variables.
          </p>

          <p>
            Housing and mortgage-related estimates are also simplified planning
            calculations. They do not represent lender quotes, mortgage approvals,
            underwriting decisions, insurance offers, or final closing costs.
          </p>

          <p>
            Nothing on this site should be interpreted as legal guidance, including
            information related to immigration, residency, visas, or cross-border
            relocation. Those rules can change and may depend heavily on personal
            facts and jurisdiction-specific requirements.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          FIRE and investment planning limitations
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
          <p>
            FIRE calculators on this site use simplified planning assumptions about
            spending, withdrawal rates, investment growth, and inflation. They do
            not guarantee investment outcomes and do not fully model every risk,
            including market volatility, sequence-of-returns risk, tax law changes,
            or future spending changes.
          </p>

          <p>
            Investment-related content on this site is for general educational
            planning only and should not be treated as personalized investment advice
            or a recommendation to buy, sell, or allocate assets in any particular way.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Your responsibility
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
          <p>
            Before making financial, tax, investment, housing, mortgage, legal, or
            relocation decisions, you should consult qualified professionals as
            appropriate for your situation.
          </p>

          <p>
            By using this website, you acknowledge that calculator outputs are
            estimates designed for planning and comparison only, and that you are
            responsible for any decisions made based on the information provided.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          More information
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-700">
          For more detail on how Relocation By Numbers builds its estimates and
          comparison tools, see the{" "}
          <Link
            href="/methodology"
            className="font-medium text-slate-900 underline underline-offset-4 hover:no-underline"
          >
            methodology page
          </Link>.
        </p>
      </section>
    </main>
  );
}