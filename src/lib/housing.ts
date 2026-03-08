import { estimateMortgageMonthly } from "@/lib/mortgage";

export function monthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  const r = (annualRatePct / 100) / 12;
  const n = termYears * 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function monthlyHousingCost(opts: {
  homePrice: number;
  downPct: number;       // percent (e.g. 20)
  ratePct: number;       // percent (e.g. 7)
  termYears: number;
  propertyTaxPct: number; // annual % of home price
  homeInsMonthly: number;
  hoaMonthly: number;
}) {
  const down = Math.max(0, Math.min(100, opts.downPct));
  const loan = Math.max(0, opts.homePrice * (1 - down / 100));

  // ✅ Centralized mortgage math (helper expects decimals)
  const principalInterest =
    estimateMortgageMonthly(opts.homePrice, {
      downPct: down / 100,         // 20 -> 0.20
      rate: opts.ratePct / 100,    // 7 -> 0.07
      years: opts.termYears,
    }) ?? 0;

  const propertyTax = Math.max(0, (opts.homePrice * (opts.propertyTaxPct / 100)) / 12);
  const homeInsurance = Math.max(0, opts.homeInsMonthly);
  const hoa = Math.max(0, opts.hoaMonthly);

  const totalMonthly = principalInterest + propertyTax + homeInsurance + hoa;

  return {
    loanAmount: loan,
    principalInterest,
    propertyTax,
    homeInsurance,
    hoa,
    totalMonthly,
  };
}