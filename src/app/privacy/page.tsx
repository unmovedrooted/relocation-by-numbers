import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Privacy Policy
        </h1>

        <p className="text-base leading-7 text-slate-700 dark:text-slate-300">
          Relocation By Numbers respects your privacy. This page explains what
          information may be collected when you use the site, what is not stored,
          and how calculator inputs are generally handled.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Calculator inputs
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            The calculator tools on Relocation By Numbers are designed primarily
            to run in your browser. In general, calculator inputs are used to
            generate planning estimates on the page and are not stored as personal
            financial records on our servers.
          </p>

          <p>
            This means information you enter into calculators such as income,
            expenses, housing costs, savings assumptions, and relocation scenarios
            is typically processed locally in your browser session for calculation
            and display purposes.
          </p>

          <p>
            Relocation By Numbers does not intentionally collect or store sensitive
            personal financial profiles through normal calculator use.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          AI-generated FIRE reports
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            The optional personalized FIRE report is different from the calculators
            that run only in your browser. The report is generated only after you
            select the generate button.
          </p>
          <p>
            At that time, the site sends the financial assumptions needed to produce
            the report to our AI provider. These may include age, state, filing status,
            income, spending, savings rate, projected FIRE age, withdrawal assumptions,
            and balances by account type. The information is used to create the report
            you requested.
          </p>
          <p>
            Do not use the report feature if you do not want those selected values
            transmitted to the AI provider. Avoid entering names, account numbers,
            addresses, or other identifying information; the report does not require them.
            The provider handles transmitted data under its own terms and data practices.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Analytics and usage data
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            Like most websites, Relocation By Numbers may use analytics tools to
            understand general site traffic and improve the user experience. This
            can include information such as page views, device type, browser type,
            approximate location, referring pages, and general on-site behavior.
          </p>

          <p>
            This type of data is generally used in aggregate to understand how the
            site is performing and which tools or pages are most useful. It is not
            intended to build detailed personal financial profiles from calculator use.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Cookies and similar technologies
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            The site may use cookies or similar technologies for analytics,
            site functionality, performance measurement, and advertising support.
          </p>

          <p>
            Cookies may help remember settings, understand traffic patterns,
            measure page performance, and support third-party services used on
            the site.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Advertising and third-party services
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            Relocation By Numbers may display advertisements and may use third-party
            services for analytics, advertising, or site functionality. These third
            parties may use cookies or similar technologies subject to their own
            privacy policies and data practices.
          </p>

          <p>
            If ads are shown on the site, advertising providers may collect limited
            technical or usage data needed to deliver, measure, or personalize ads
            in accordance with their own policies and applicable platform settings.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Shared links and URLs
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            Some tools on the site may support shareable links or URL-based scenarios.
            When that happens, values used to recreate a scenario may appear in the URL.
          </p>

          <p>
            You should avoid sharing links that contain private financial assumptions
            unless you are comfortable with that information being visible to whoever
            receives the link.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Data security and limitations
        </h2>

        <div className="mt-4 space-y-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          <p>
            Reasonable efforts are made to keep the site secure, but no website or
            online service can guarantee absolute security.
          </p>

          <p>
            Because calculators are intended for planning use, you should avoid entering
            highly sensitive personal information that is not necessary for scenario testing.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Changes to this policy
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          This privacy policy may be updated from time to time as the site, tools,
          analytics, or advertising setup evolves.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Related pages
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          You may also want to review the{" "}
          <Link
            href="/disclaimer"
            className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 hover:no-underline"
          >
            disclaimer
          </Link>{" "}
          and{" "}
          <Link
            href="/methodology"
            className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 hover:no-underline"
          >
            methodology
          </Link>{" "}
          pages.
        </p>
      </section>
    </main>
  );
}
