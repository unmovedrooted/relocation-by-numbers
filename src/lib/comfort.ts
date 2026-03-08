export function comfortScore(housingPctOfNet: number) {
  const pct = housingPctOfNet;

  if (!Number.isFinite(pct)) {
    return { band: "—", label: "Insufficient data", note: "Add income and housing inputs to calculate comfort." };
  }

  if (pct < 25) {
    return { band: "🟢", label: "Comfortable", note: "Plenty of margin for saving, repairs, and life." };
  }
  if (pct < 35) {
    return { band: "🟡", label: "Manageable", note: "Doable, but watch recurring costs and lifestyle creep." };
  }
  if (pct < 45) {
    return { band: "🟠", label: "Tight", note: "Any surprise expense will sting. Consider lower price or better rate." };
  }
  return { band: "🔴", label: "High Risk", note: "Housing is crowding out everything else. Rework the scenario." };
}
