// components/FireUpsellCard.tsx
// Drop this in where the TODO comment placeholder sits in FireCalculator.tsx
// (below affiliate cards, above the share button)

type Props = {
  fireAge: number | null;
  yearsToFI: number | null;
};

export default function FireUpsellCard({ fireAge, yearsToFI }: Props) {
  const alreadyFI = (yearsToFI ?? 1) <= 0;

  return (
    <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Coming soon
          </div>
          <p className="text-base font-semibold text-white">
            {alreadyFI
              ? "Get a personalized withdrawal strategy"
              : "Get a personalized FIRE roadmap"}
          </p>
          <p className="text-sm leading-6 text-slate-400">
            {alreadyFI
              ? "Roth conversion ladders, sequence-of-returns protection, and a withdrawal order optimized for your accounts."
              : fireAge
              ? `A step-by-step plan to reach FIRE at ${fireAge}, account strategy, contribution order, and tax optimization.`
              : "A step-by-step plan built around your income, accounts, and timeline."}
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => {
              // Replace with your waitlist / product page URL when ready
              window.location.href = "/waitlist";
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-300/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-300/20 active:scale-[0.98]"
          >
            Join waitlist →
          </button>
        </div>
      </div>
    </div>
  );
}