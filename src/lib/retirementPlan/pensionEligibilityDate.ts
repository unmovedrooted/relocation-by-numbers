/** Calendar-month age convention, clamped to the last day of shorter months. */
export function pensionEligibilityDate(birthDate: string): string {
  const parsed = new Date(`${birthDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== birthDate) throw new RangeError("Invalid pension owner birth date.");
  const [year, month, day] = birthDate.split("-").map(Number);
  const first = new Date(Date.UTC(year + 59, month - 1 + 6, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(day, last));
  return first.toISOString().slice(0, 10);
}
