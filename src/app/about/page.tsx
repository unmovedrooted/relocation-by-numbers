import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 sm:text-4xl">
          About Relocation By Numbers
        </h1>

        <p className="text-slate-700 text-base leading-7 mb-4">
          Relocation By Numbers was created to help people make smarter move decisions
          with clearer financial context. Instead of relying on scattered calculators,
          generic cost-of-living lists, or headline salary comparisons, the goal is to
          show how a move may actually affect your monthly budget, take-home pay, and
          long-term financial path.
        </p>

        <p className="text-slate-700 text-base leading-7">
          The site focuses on one practical question: <span className="font-semibold text-slate-900">
            how far does your money really go if you move?
          </span>
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Relocation planning</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compare how taxes, housing costs, and affordability may change when moving
            between states or cities.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Salary context</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Look past gross income and estimate what salary may feel equivalent after a
            move once taxes and housing costs are considered together.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">FIRE and long-term planning</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Explore how relocation may affect financial independence timelines, spending
            pressure, and long-term planning assumptions.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
    Why this site exists
  </h2>

  <div className="mt-4 space-y-4 text-slate-700 text-base leading-7">
    <p>
      When researching relocation and financial independence, the information
      needed to make a real decision was often split across multiple tools.
      One site showed cost of living. Another estimated taxes. Another handled
      retirement or FIRE math. Very few tools connected the pieces in a way that
      reflected how a move can change everyday affordability.
    </p>

    <p>
      I built this after seeing how hard it was to compare relocation decisions
      across taxes, housing, and long-term planning in one place. Relocation By
      Numbers was built to bring those pieces together in one place. The idea is
      not to replace detailed personal budgeting or professional advice. The idea
      is to give people a stronger planning starting point before they move,
      negotiate salary, compare offers, or rethink where they want to live.
    </p>
  </div>
</section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          What makes Relocation By Numbers different
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">More than headline salary</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A higher salary does not always mean a better financial move. The site is
              built around take-home pay, housing pressure, and monthly flexibility,
              not just gross income.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Relocation-first framing</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Many calculators treat location as a side note. This site treats location
              as the main variable because taxes, housing, and recurring costs can change
              the outcome of a move fast.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Planning tools in one place</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Instead of jumping between separate tools, users can compare relocation,
              salary, cost of living, and FIRE-related tradeoffs in one connected system.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Transparent assumptions</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The site is built for planning estimates, with methodology and assumptions
              intended to be clear enough for users to understand what the tools are
              modeling and where the limits are.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Who this site is for
        </h2>

        <div className="mt-4 space-y-3 text-slate-700 text-base leading-7">
          <p>Relocation By Numbers is built for people who are trying to make a move decision with clearer financial context, including:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm leading-6 text-slate-600">
            <li>people comparing two cities or states before relocating</li>
            <li>remote workers deciding whether a move improves affordability</li>
            <li>households evaluating whether lower taxes actually improve the budget</li>
            <li>future renters or buyers pressure-testing housing costs</li>
            <li>people exploring how location may affect a FIRE timeline</li>
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Important note
        </h2>

        <div className="mt-4 space-y-4 text-slate-700 text-base leading-7">
          <p>
            Relocation By Numbers provides planning estimates, not financial, tax, legal,
            or investment advice. Actual costs can vary based on neighborhood, household
            size, housing choices, deductions, insurance, and many other factors.
          </p>

          <p>
            The tools are most useful for understanding direction and tradeoffs before
            making a decision. For more detail on assumptions and modeling, see the{" "}
            <Link
              href="/methodology"
              className="font-medium text-slate-900 underline underline-offset-4 hover:no-underline"
            >
              methodology page
            </Link>.
          </p>
        </div>
      </section>
    </main>
  );
}