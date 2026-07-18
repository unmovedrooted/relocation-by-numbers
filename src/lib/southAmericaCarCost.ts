export function calculateSouthAmericaCarCost(
  needCar: "yes" | "no",
  monthlyCarCost: string,
  convertDestinationToUsd: (value: number) => number,
): number {
  if (needCar !== "yes") return 0;
  const parsed = Number(monthlyCarCost);
  return convertDestinationToUsd(Number.isFinite(parsed) ? parsed : 0);
}
