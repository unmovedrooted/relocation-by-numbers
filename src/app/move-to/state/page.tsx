import Calculator from "@/components/Calculator";
import { notFound } from "next/navigation";
import { STATES } from "@/lib/states";

type Props = {
  params: { state: string };
};

export default function MoveToStatePage({ params }: Props) {
  const stateCode = params.state.toLowerCase();

  const state = STATES.find((s) => s.code === stateCode);

  if (!state) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-4">
        Moving to {state.name}
      </h1>

      <p className="mb-6 text-slate-600">
        See if you can afford to move to {state.name}.
      </p>

      <Calculator
        initialToState={state.code}
        monetization="state"
      />
    </div>
  );
}

export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.code }));
}
