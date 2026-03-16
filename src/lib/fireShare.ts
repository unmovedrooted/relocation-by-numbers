export type FireShareData = {
  fireAge: number;
  baselineAge: number;
  from: string;
  to: string;
  years: number;
  reason: string;
};

function cleanText(value: string | null | undefined, fallback: string, max = 60) {
  if (!value) return fallback;
  return value.trim().slice(0, max) || fallback;
}

function cleanNumber(
  value: string | null | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function getFireShareData(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined
): FireShareData {
  const getValue = (key: string) => {
    if (!searchParams) return undefined;

    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }

    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const fireAge = cleanNumber(getValue("fireAge"), 47, 18, 90);
  const baselineAge = cleanNumber(getValue("baselineAge"), 62, 18, 90);
  const years = cleanNumber(getValue("years"), Math.max(0, baselineAge - fireAge), 0, 50);

  return {
    fireAge,
    baselineAge,
    years,
    from: cleanText(getValue("from"), "NYC", 40),
    to: cleanText(getValue("to"), "Charlotte", 40),
    reason: cleanText(
      getValue("reason"),
      "Lower taxes + lower spending",
      80
    ),
  };
}

export function buildFireShareImageUrl(
  origin: string,
  data: FireShareData
) {
  const params = new URLSearchParams({
    fireAge: String(data.fireAge),
    baselineAge: String(data.baselineAge),
    from: data.from,
    to: data.to,
    years: String(data.years),
    reason: data.reason,
  });

  return `${origin}/fire-calculator/share-image?${params.toString()}`;
}

export function buildFireSharePageUrl(
  origin: string,
  data: FireShareData
) {
  const params = new URLSearchParams({
    fireAge: String(data.fireAge),
    baselineAge: String(data.baselineAge),
    from: data.from,
    to: data.to,
    years: String(data.years),
    reason: data.reason,
  });

  return `${origin}/fire-calculator/share?${params.toString()}`;
}