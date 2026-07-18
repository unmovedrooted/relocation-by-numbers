import type { SouthAmericaInputUnit } from "./southAmericaCurrencyContract";
import { southAmericaInputToUsd } from "./southAmericaCurrencyContract";

export function calculateSouthAmericaCarCost(
  needCar: "yes" | "no",
  monthlyCarCost: string,
  inputUnit: SouthAmericaInputUnit,
  convertDestinationToUsd: (value: number) => number,
): number {
  if (needCar !== "yes") return 0;
  const parsed = Number(monthlyCarCost);
  return southAmericaInputToUsd(
    Number.isFinite(parsed) ? parsed : 0,
    inputUnit,
    convertDestinationToUsd,
  );
}
