/**
 * Age at which required minimum distributions begin, by birth year.
 *
 * Source: IRS final regulations preamble (T.D. 10001, Internal Revenue Bulletin 2024-33): the applicable age
 * is 73 for an individual born from 1951 through 1959, and 75 for an individual born on or after
 * January 1, 1960 (IRC 401(a)(9)(C)(v) as amended by SECURE 2.0 sections 107 and 325). Anyone born in 1950
 * or earlier is already taking distributions (72 for 1949-1950; 70 1/2 before), so a single age is returned.
 * IRS Publication 590-B (2025) and the RMD pages describe 73 because they address people at RMD age now.
 */
export function rmdStartAge(birthYear: number): number {
  if (!Number.isFinite(birthYear)) return 73;
  if (birthYear >= 1960) return 75;
  if (birthYear >= 1951) return 73;
  return 72;
}

/** Birth year estimated from age in the given calendar year (a person's age can be off by one before their birthday). */
export function estimatedBirthYear(age: number, calendarYear: number): number {
  return calendarYear - Math.round(age);
}
