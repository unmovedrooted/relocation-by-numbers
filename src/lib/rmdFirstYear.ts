/**
 * The first-RMD timing choice.
 *
 * The first required minimum distribution, for the year you reach your RMD age, may be taken in that year or delayed until
 * April 1 of the next year. The second RMD is still due by December 31 of that next year, so delaying puts two distributions
 * in one tax year. The second RMD is the balance at the end of the first year divided by the next age's distribution period;
 * when the first RMD is delayed it is still in the account on that date, so the second RMD is slightly larger too.
 * (IRS Publication 590-B, "Distributions by the required beginning date" and "Distributions after the required beginning date".)
 *
 * Balances follow the calculator's convention: a withdrawal taken in a year leaves the account before that year's growth.
 */
export type FirstRmdOption = Readonly<{
  /** RMD dollars taken in the first year (the year you reach the RMD age) and the tax on them. */
  year1Rmd: number;
  year1Tax: number;
  /** RMD dollars taken in the second year and the tax on them. */
  year2Rmd: number;
  year2Tax: number;
  totalTax: number;
}>;

export type FirstRmdChoice = Readonly<{
  firstAge: number;
  firstRmd: number;
  takeInFirstYear: FirstRmdOption;
  delayToApril: FirstRmdOption;
  /** Tax over the two years when delaying, minus the tax when taking the first RMD in the first year. Positive means delaying costs more. */
  extraTaxFromDelay: number;
}>;

export function firstRmdChoice(input: {
  /** Balance on December 31 before the first RMD year. */
  startBalance: number;
  firstAge: number;
  divisorFirst: number;
  divisorSecond: number;
  /** Annual growth as a decimal, for example 0.05. */
  returnRate: number;
  /** Income tax an RMD of this size adds at this age. */
  taxOn: (rmd: number, age: number) => number;
}): FirstRmdChoice {
  const { startBalance, firstAge, divisorFirst, divisorSecond, returnRate, taxOn } = input;
  const firstRmd = startBalance / divisorFirst;

  const secondIfTaken = ((startBalance - firstRmd) * (1 + returnRate)) / divisorSecond;
  const y1Tax = taxOn(firstRmd, firstAge);
  const y2Tax = taxOn(secondIfTaken, firstAge + 1);
  const takeInFirstYear: FirstRmdOption = { year1Rmd: firstRmd, year1Tax: y1Tax, year2Rmd: secondIfTaken, year2Tax: y2Tax, totalTax: y1Tax + y2Tax };

  // Delayed: nothing comes out in the first year, so the year-end balance used for the second RMD is higher.
  const secondIfDelayed = (startBalance * (1 + returnRate)) / divisorSecond;
  const bothInYear2 = firstRmd + secondIfDelayed;
  const delayedTax = taxOn(bothInYear2, firstAge + 1);
  const delayToApril: FirstRmdOption = { year1Rmd: 0, year1Tax: 0, year2Rmd: bothInYear2, year2Tax: delayedTax, totalTax: delayedTax };

  return { firstAge, firstRmd, takeInFirstYear, delayToApril, extraTaxFromDelay: delayToApril.totalTax - takeInFirstYear.totalTax };
}
