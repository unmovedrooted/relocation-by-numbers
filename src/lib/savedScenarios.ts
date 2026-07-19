// src/lib/savedScenarios.ts
// localStorage-backed "saved scenarios" list, shared across every calculator
// on the site. There's no accounts/database system here, so scenarios are
// saved per-browser/device only. Each saved scenario stores the page path +
// query string that the calculator already keeps in sync with its own
// inputs, so "loading" a scenario is just navigating back to that URL — no
// separate state-restoration logic needed, as long as the calculator that
// created it fully syncs its inputs to the URL.

export type SavedScenario = {
  id: string;
  label: string;
  url: string; // relative path + query string, e.g. "/?to=tx&toCity=austin-tx&salary=150000"
  createdAt: number; // epoch ms
  subtitle?: string; // short one-line summary, e.g. "Comfortable · $1,850/mo flexibility"
  source?: string; // which calculator created it, e.g. "US", "Caribbean", "Asia" — for display only
};

const STORAGE_KEY = "rbn:savedScenarios";
const MAX_SCENARIOS = 20;

function readAll(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(scenarios: SavedScenario[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — fail silently.
  }
}

export function getSavedScenarios(): SavedScenario[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveScenario(input: Omit<SavedScenario, "id" | "createdAt">): SavedScenario {
  const scenario: SavedScenario = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const existing = readAll();
  const next = [scenario, ...existing].slice(0, MAX_SCENARIOS);
  writeAll(next);
  return scenario;
}

export function deleteScenario(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function renameScenario(id: string, label: string): void {
  writeAll(readAll().map((s) => (s.id === id ? { ...s, label } : s)));
}
