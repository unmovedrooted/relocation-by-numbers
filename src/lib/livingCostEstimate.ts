import type { City } from "./cities";

/**
 * Everyday living costs a month other than housing, in the relocation calculator's own starting figures: groceries $600, utilities $250 and
 * transportation $300 in the current city, scaled by the BEA regional price parities of the two cities, plus $300 dining out and $200 for
 * subscriptions and miscellaneous. Used to hand a comparison to the FIRE calculator with the same assumptions the relocation calculator uses.
 */
export const BASE_LIVING = { groceries: 600, utilities: 250, transport: 300, dining: 300, misc: 200 } as const;

const BASE_TOTAL = BASE_LIVING.groceries + BASE_LIVING.utilities + BASE_LIVING.transport + BASE_LIVING.dining + BASE_LIVING.misc;

export function estimateLivingCosts(from: Pick<City, "col"> | undefined, to: Pick<City, "col"> | undefined): { current: number; target: number } {
  if (!from?.col || !to?.col) return { current: BASE_TOTAL, target: BASE_TOTAL };
  const target =
    BASE_LIVING.groceries * (to.col.groceries / from.col.groceries) +
    BASE_LIVING.utilities * (to.col.utilities / from.col.utilities) +
    BASE_LIVING.transport * (to.col.transport / from.col.transport) +
    BASE_LIVING.dining +
    BASE_LIVING.misc;
  return { current: BASE_TOTAL, target };
}
