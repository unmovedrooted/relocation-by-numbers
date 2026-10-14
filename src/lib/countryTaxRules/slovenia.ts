/**
 * Slovenia: personal income tax (dohodnina) and employee social contributions for 2026, in euros.
 *
 * Rules on the annual scale, summarised from the Pravilnik o dolocitvi usklajenih zneskov olajsav, enacbe za dolocitev olajsave in lestvice
 * za odmero dohodnine za leto 2026 (Uradni list RS 104/25), read through adviser summaries 2026-10-14 (the Official Gazette and FURS
 * pages were not fetched): 16% to EUR 9,721.43 of net tax base; 26% to 28,592.44; 33% to 57,184.88; 39% to 82,346.23; 50% above. General
 * relief EUR 5,551.93 a year, plus 20,832.39 - 1.17259 x income for income up to EUR 17,766.18.
 * Employee contributions 23.1% since the long-term care contribution of 1% began in 2025: pension 15.5%, health 6.36%, long-term
 * care 1%, parental care 0.1%, employment 0.14%; they are deductible from the tax base. The old model omitted them and used a
 * 43% bracket that is not on the 2026 scale.
 *
 * Retirees pay income tax on pensions with the same relief and no contributions; remote workers paid abroad pay no Slovenian
 * contributions here. Not modeled: the young-employee relief, dependants' allowances, the annual pensioners' allowance, the
 * compulsory health contribution (a fixed monthly amount for people without employer cover) and the 25% flat tax rules.
 */
export const SLOVENIA_TAX_YEAR_LABEL = "2026";

export function slovenianScaleTax(base: number): number {
  const b = Math.max(0, base);
  return 0.16 * Math.min(b, 9_721.43) + 0.26 * Math.max(0, Math.min(b, 28_592.44) - 9_721.43)
    + 0.33 * Math.max(0, Math.min(b, 57_184.88) - 28_592.44) + 0.39 * Math.max(0, Math.min(b, 82_346.23) - 57_184.88)
    + 0.50 * Math.max(0, b - 82_346.23);
}

export function sloveniaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const contributions = scenario === "local" ? 0.231 * g : 0;
  const base = g - contributions;
  const relief = 5_551.93 + (base <= 17_766.18 ? Math.max(0, 20_832.39 - 1.17259 * base) : 0);
  return { incomeTax: slovenianScaleTax(Math.max(0, base - relief)), contributions };
}
