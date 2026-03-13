import Calculator from "@/components/Calculator";
import { notFound } from "next/navigation";
import { STATES } from "@/lib/states";

type Props = {
  params: Promise<{ state: string }>;
};

export default async function MoveToStatePage({ params }: Props) {
  const { state } = await params;

  if (!state) notFound();

  const stateCode = state.toLowerCase();
  const matchedState = STATES.find((s) => s.code === stateCode);

  if (!matchedState) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-4">
        Moving to {matchedState.name}
      </h1>

      <p className="mb-6 text-slate-600">
        See if you can afford to move to {matchedState.name}.
      </p>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
    <a href="/about" className="transition hover:text-white">
      About
    </a>
    <span>•</span>
    <a href="/disclaimer" className="transition hover:text-white">
      Disclaimer
    </a>
    <span>•</span>
    <a href="/privacy" className="transition hover:text-white">
      Privacy
    </a>
    <span>•</span>
    <a href="/terms" className="transition hover:text-white">
      Terms
    </a>
  </div>

      <Calculator initialToState={matchedState.code} monetization="state" />
    </div>
  );
}

export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.code }));
}