import type { StateCode } from "./states";

type Tier = "major" | "mid" | "small";

export type COL = {
  housing: number;
  groceries: number;
  utilities: number;
  transport: number;
  healthcare: number;
};

// 1) State baselines (100 = national avg)
// These are “reasonable” baselines. Not perfect. Consistent.
export const STATE_BASE: Record<StateCode, number> = {
  al: 90, ak: 125, az: 103, ar: 88, ca: 140, co: 118, ct: 122, de: 105,
  fl: 110, ga: 102, hi: 165, id: 98, il: 110, in: 95, ia: 92, ks: 92,
  ky: 93, la: 95, me: 108, md: 120, ma: 135, mi: 100, mn: 108, ms: 86,
  mo: 96, mt: 100, ne: 94, nv: 112, nh: 118, nj: 130, nm: 95, ny: 128,
  nc: 100, nd: 98, oh: 97, ok: 92, or: 120, pa: 105, ri: 120, sc: 97,
  sd: 96, tn: 98, tx: 102, ut: 108, vt: 112, va: 110, wa: 125, wv: 88,
  wi: 102, wy: 98,
};

// 2) Tier multipliers
const TIER_MULT: Record<Tier, number> = {
  major: 1.12,
  mid: 1.00,
  small: 0.92,
};

// 3) Deterministic tiny jitter so every city doesn’t look identical
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return ((h >>> 0) % 1000) / 1000;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function generateCOL(state: StateCode, tier: Tier, cityId: string): COL {
  const base = STATE_BASE[state] ?? 100;
  const tierMult = TIER_MULT[tier] ?? 1.0;

  // jitter in range ~ [-2, +2]
  const j = (hash01(cityId) - 0.5) * 4;

  // category sensitivities (housing moves most)
  const housing = base * tierMult * 1.10 + j;
  const groceries = base * tierMult * 0.98 + j * 0.6;
  const utilities = base * tierMult * 0.96 + j * 0.5;
  const transport = base * tierMult * 1.00 + j * 0.6;
  const healthcare = base * tierMult * 1.02 + j * 0.4;

  // Keep values sane
  return {
    housing: Math.round(clamp(housing, 70, 210)),
    groceries: Math.round(clamp(groceries, 75, 160)),
    utilities: Math.round(clamp(utilities, 80, 150)),
    transport: Math.round(clamp(transport, 75, 170)),
    healthcare: Math.round(clamp(healthcare, 80, 170)),
  };
}
