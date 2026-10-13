/**
 * A retirement-plan scenario packed into a URL fragment (the part after #), so a link reopens the same inputs.
 * Browsers do not send the fragment to the site's server, so the scenario stays in the person's browser unless they share the link.
 */
export type SharedScenario = Readonly<{
  v: 1;
  values: Record<string, string>;
  accounts: unknown;
  saving: unknown;
  medicare: unknown;
  conversions: unknown;
}>;

const PREFIX = "#s=";
/** Longest fragment accepted, in characters. Links this long are far beyond any real scenario. */
export const MAX_FRAGMENT_LENGTH = 200_000;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

export function encodeScenario(scenario: Omit<SharedScenario, "v">): string {
  return PREFIX + toBase64Url(JSON.stringify({ v: 1, ...scenario }));
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a fragment made by encodeScenario. Returns null for anything else, including damaged or hand-edited links. */
export function decodeScenario(fragment: string): SharedScenario | null {
  if (!fragment.startsWith(PREFIX) || fragment.length > MAX_FRAGMENT_LENGTH) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(fragment.slice(PREFIX.length)));
    if (!isPlainObject(parsed) || parsed.v !== 1 || !isPlainObject(parsed.values)) return null;
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.values)) {
      if (typeof value !== "string" || key === "__proto__") return null;
      values[key] = value;
    }
    for (const key of ["accounts", "saving", "medicare", "conversions"] as const) {
      if (!isPlainObject(parsed[key])) return null;
    }
    return { v: 1, values, accounts: parsed.accounts, saving: parsed.saving, medicare: parsed.medicare, conversions: parsed.conversions };
  } catch {
    return null;
  }
}
