import Link from "next/link";

const comparisons = [
  { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
  { href: "/compare/nyc-ny/austin-tx", label: "NYC vs Austin" },
  { href: "/compare/nyc-ny/la-ca", label: "NYC vs Los Angeles" },
  { href: "/compare/la-ca/nyc-ny", label: "Los Angeles vs NYC" },
  { href: "/compare/la-ca/austin-tx", label: "Los Angeles vs Austin" },
  { href: "/compare/la-ca/charlotte-nc", label: "Los Angeles vs Charlotte" },
  { href: "/compare/austin-tx/nyc-ny", label: "Austin vs NYC" },
  { href: "/compare/austin-tx/la-ca", label: "Austin vs Los Angeles" },
  { href: "/compare/austin-tx/seattle-wa", label: "Austin vs Seattle" },
  { href: "/compare/seattle-wa/nyc-ny", label: "Seattle vs NYC" },
  { href: "/compare/seattle-wa/austin-tx", label: "Seattle vs Austin" },
  { href: "/compare/seattle-wa/boston-ma", label: "Seattle vs Boston" },
  { href: "/compare/boston-ma/nyc-ny", label: "Boston vs NYC" },
  { href: "/compare/boston-ma/seattle-wa", label: "Boston vs Seattle" },
  { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
  { href: "/compare/charlotte-nc/nyc-ny", label: "Charlotte vs NYC" },
  { href: "/compare/charlotte-nc/austin-tx", label: "Charlotte vs Austin" },
  { href: "/compare/charlotte-nc/miami-fl", label: "Charlotte vs Miami" },
];

export const metadata = {
  title: "Relocation Compare Hub | Relocation by Numbers",
  description:
    "Browse popular city-to-city relocation comparisons and compare take-home pay, housing costs, and affordability.",
};

export default function CompareHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Popular Relocation Comparisons
          </h1>

          <p className="mx-auto max-w-3xl text-slate-600">
            Explore city-to-city moves and compare take-home pay, housing costs, and real affordability.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Want to test your own scenario?
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Use the main calculator to compare your own salary, taxes, rent, buy costs, and monthly flexibility.
          </p>

          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open calculator
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}