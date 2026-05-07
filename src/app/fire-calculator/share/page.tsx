import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { buildFireShareImageUrl, getFireShareData } from "@/lib/fireShare";

type SharePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getOriginFromHeaders() {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    "www.relocationbynumbers.com";
  const protocol =
    h.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const data = getFireShareData(resolvedSearchParams);
  const origin = await getOriginFromHeaders();
  const imageUrl = buildFireShareImageUrl(origin, data);

  // Use the dramatic stat as the social title, not a generic label
  const yearsNum = Number(data.years);
  const title =
    yearsNum > 0
      ? `FIRE at ${data.fireAge} — ${data.years} years earlier by moving`
      : `FIRE at age ${data.fireAge}`;

  const description =
    yearsNum > 0
      ? `Moving from ${data.from} to ${data.to} could bring financial independence forward by ${data.years} years. Calculate your own FIRE timeline.`
      : `Financial independence projected at age ${data.fireAge} from ${data.from}. See how location, taxes, and spending change your FIRE date.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Relocation by Numbers FIRE share result",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function FireSharePage({ searchParams }: SharePageProps) {
  const resolvedSearchParams = await searchParams;
  const data = getFireShareData(resolvedSearchParams);

  const yearsNum = Number(data.years);
  const hasMove = yearsNum > 0 && data.to && data.to !== data.from;

  // Build the calculator URL with the user's city pre-filled so the
  // visitor lands with context already populated
  const calcHref = data.from
    ? `/fire-calculator?from=${encodeURIComponent(data.from)}`
    : "/fire-calculator";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-10">

        {/* ── Logo nav ───────────────────────────────────────────────── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Relocation by Numbers
        </Link>

        {/* ── Dynamic headline ───────────────────────────────────────── */}
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-400">
            Someone's FIRE result
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {hasMove
              ? `FIRE at ${data.fireAge} — ${data.years} ${yearsNum === 1 ? "year" : "years"} earlier`
              : `FIRE at age ${data.fireAge}`}
          </h1>

          <p className="mt-3 max-w-xl text-lg text-slate-300">
            {hasMove
              ? `By moving from ${data.from} to ${data.to}, lower taxes and spending could bring financial independence ${data.years} years forward.`
              : `Calculated for ${data.from}. See how your location, spending, and savings rate shape your own FIRE timeline.`}
          </p>
        </div>

        {/* ── Result cards ───────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">
              {hasMove ? "Why it changed" : "Location"}
            </div>
            <div className="mt-3 text-xl font-semibold leading-tight">
              {hasMove ? `${data.from} → ${data.to}` : data.from}
            </div>
            {hasMove && (
              <div className="mt-2 text-sm text-slate-300">{data.reason}</div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">
              {hasMove ? "Without move" : "Current path"}
            </div>
            <div className="mt-3 text-4xl font-bold">
              Age {data.baselineAge}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="text-sm text-emerald-100/80">
              {hasMove ? "With move" : "FIRE age"}
            </div>
            <div className="mt-3 text-4xl font-bold text-emerald-300">
              Age {data.fireAge}
            </div>
            {hasMove && (
              <div className="mt-2 text-sm font-semibold text-emerald-200">
                {data.years} {yearsNum === 1 ? "year" : "years"} sooner
              </div>
            )}
          </div>
        </div>

        {/* ── CTA block ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
          <h2 className="text-xl font-semibold text-white">
            What's your FIRE number?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Enter your income, spending, and location to see your projected FIRE
            age — and how a move could change your timeline.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={calcHref}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              Calculate my FIRE number →
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Compare cities
            </Link>
          </div>
        </div>

        {/* ── Footer note ────────────────────────────────────────────── */}
        <p className="text-xs text-slate-500">
          Planning estimate only. Not tax, legal, or financial advice.{" "}
          <Link
            href="/methodology"
            className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300"
          >
            See methodology
          </Link>
        </p>
      </div>
    </main>
  );
}