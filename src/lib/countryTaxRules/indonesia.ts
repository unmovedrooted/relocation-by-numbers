/**
 * Indonesia: PPh 21 annual income tax for 2026, in rupiah, shared by the Asia and International estimators.
 *
 * Directorate General of Taxes (pajak.go.id), read 2026-10-14: Article 17 layers 5% to IDR 60 million, 15% to 250 million, 25% to
 * 500 million, 30% to 5 billion, 35% above (the middle layer limits were not re-read on a page); PTKP IDR 54 million for a single
 * person and IDR 58.5 million for a married person with no dependants; occupational cost allowance of 5% of gross pay, at most
 * IDR 6 million a year (pensioners: at most IDR 2.4 million, standard rule not re-read). BPJS contributions and dependants' PTKP are
 * not modeled.
 */
export const INDONESIA_TAX_YEAR_LABEL = "2026";

export const INDONESIA_NOTE =
  "Uses the Article 17 layers (5% to 35%), the PTKP non-taxable amount (IDR 54 million single, IDR 58.5 million married) and the occupational-cost allowance (5%, at most IDR 6 million), as published by the Directorate General of Taxes. The monthly TER withholding tables are a payment method and give the same annual tax. Not modelled: BPJS pension, old-age and health contributions (about 4% of pay up to wage ceilings), dependants' PTKP and the temporary 2026 PPh 21 incentives for some sectors. Income must be passed in IDR.";

const LAYERS = [
  { upTo: 60_000_000, rate: 0.05 }, { upTo: 250_000_000, rate: 0.15 }, { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.30 }, { upTo: Infinity, rate: 0.35 },
] as const;

export function indonesiaTax(income: number, filing: "single" | "married", retired: boolean): number {
  const gross = Math.max(0, income);
  const ptkp = filing === "married" ? 58_500_000 : 54_000_000;
  const taxable = Math.max(0, gross - Math.min(gross * 0.05, retired ? 2_400_000 : 6_000_000) - ptkp);
  let tax = 0;
  let previous = 0;
  for (const l of LAYERS) {
    if (taxable <= previous) break;
    tax += (Math.min(taxable, l.upTo) - previous) * l.rate;
    previous = l.upTo;
  }
  return tax;
}
