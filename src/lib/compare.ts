import { findCity, isMajorCity } from "@/lib/cities";

export function isSameCompare(a?: string, b?: string) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function isAllowedCompareRoute(from?: string, to?: string) {
  if (!from || !to) return false;
  if (isSameCompare(from, to)) return false;

  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return false;

  return isMajorCity(fromCity) || isMajorCity(toCity);
}