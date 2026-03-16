import type { Metadata } from "next";
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

  const title = `FIRE Result: Age ${data.fireAge} vs ${data.baselineAge}`;
  const description = `${data.from} → ${data.to}. ${data.years} years earlier with ${data.reason.toLowerCase()}.`;

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-sm text-slate-400">Relocation by Numbers</div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          FIRE result
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          See how taxes, spending, and moving cities can change your FIRE date.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Why it changed</div>
            <div className="mt-3 text-2xl font-semibold">
              {data.from} → {data.to}
            </div>
            <div className="mt-2 text-slate-300">{data.reason}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Baseline</div>
            <div className="mt-3 text-4xl font-bold">Age {data.baselineAge}</div>
          </div>

          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="text-sm text-emerald-100/80">New path</div>
            <div className="mt-3 text-4xl font-bold text-emerald-300">
              Age {data.fireAge}
            </div>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
          {data.years} years earlier
        </div>
      </div>
    </main>
  );
}