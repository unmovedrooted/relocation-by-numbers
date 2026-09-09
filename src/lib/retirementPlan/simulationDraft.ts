import type { TimelineInput } from "./timeline";
import type { HouseholdSimulationRequest } from "./monteCarlo";

export function simulationRequest(input: TimelineInput, paths: string, seed: string,
  volatility: Readonly<Record<string, string>>, confirmed: boolean): HouseholdSimulationRequest {
  if (!confirmed) throw new RangeError("Confirm the simulation assumptions first.");
  const number = (raw: string | undefined, label: string, max: number, integer = false) => {
    if (typeof raw !== "string" || !raw.trim()) throw new RangeError(`Enter ${label}.`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > max || (integer && !Number.isInteger(value))) throw new RangeError(`Check ${label}.`);
    return value;
  };
  const count = number(paths, "path count (1–1000)", 1000, true);
  if (count < 1) throw new RangeError("Use at least one path.");
  return { paths: count, seed: number(seed, "seed (0–4294967295)", 0xffffffff, true),
    volatilityByAccount: Object.fromEntries(input.accounts.filter(a => a.kind !== "cash" && a.kind !== "annuity")
      .map(a => [a.id, number(volatility[a.id], `volatility for ${a.id} (0–100%)`, 100) / 100])),
    returnModel: "lognormal-shared-market-nominal", conversionPolicy: "fixed-input-schedule" };
}
