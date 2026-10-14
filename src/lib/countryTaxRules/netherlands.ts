/**
 * Netherlands: box 1 income tax and national-insurance premiums for 2026, with the tax credits, in euros.
 *
 * Belastingdienst, "Voorlopige aanslag 2026: gebruikte tarieven en heffingskortingen",
 * https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen
 * (read 2026-10-14): under the AOW (state pension) age 35.75% to EUR 38,883 (income tax 8.10% plus premiums 27.65%), 37.56% to
 * EUR 78,426, 49.50% above; at AOW age (born from 1946) 17.85% to EUR 38,883, then the same. General tax credit EUR 3,115 up to
 * EUR 29,736, falling by 6.398% of the excess to zero at EUR 78,426. Labour credit: 8.324% to EUR 11,965; EUR 996 + 31.009% to
 * EUR 25,845; EUR 5,300 + 1.95% to EUR 45,592 (EUR 5,685); then falling 6.51% of the excess to zero at EUR 132,920.
 * Elderly credit EUR 2,067 up to EUR 46,002, falling 15% of the excess to zero at EUR 59,782; single elderly credit EUR 540.
 * The general credit at AOW age is EUR 1,556 (secondary sources; the page lists only the under-AOW table), phased out
 * proportionally to zero at EUR 78,426 (derived).
 *
 * The 30% ruling treats 30% of pay as a tax-free allowance. Tax credits are applied to the tax and premiums together. Retirees are
 * assumed to be at AOW age. Not modeled: the income-related health premium for pensioners and the flat health-insurance premium,
 * box 2 and box 3 (savings) tax, the transferable credits between partners, and the salary cap on the 30% ruling.
 */
export const NETHERLANDS_TAX_YEAR_LABEL = "2026";

export function netherlandsTax(income: number, retired: boolean, ruling30: boolean): number {
  const g = Math.max(0, income) * (ruling30 && !retired ? 0.7 : 1);
  const r1 = retired ? 0.1785 : 0.3575;
  const gross = r1 * Math.min(g, 38_883) + 0.3756 * Math.max(0, Math.min(g, 78_426) - 38_883) + 0.495 * Math.max(0, g - 78_426);
  const general = retired
    ? 1_556 * Math.max(0, Math.min(1, (78_426 - g) / (78_426 - 29_736)))
    : Math.max(0, Math.min(3_115, 3_115 - 0.06398 * (g - 29_736)));
  let labour = 0;
  if (!retired) {
    labour = g <= 11_965 ? 0.08324 * g
      : g <= 25_845 ? 996 + 0.31009 * (g - 11_965)
      : g <= 45_592 ? 5_300 + 0.0195 * (g - 25_845)
      : Math.max(0, 5_685 - 0.0651 * (g - 45_592));
  }
  const elderly = retired ? Math.max(0, Math.min(2_067, 2_067 - 0.15 * (g - 46_002))) : 0;
  return Math.max(0, gross - general - labour - elderly);
}
