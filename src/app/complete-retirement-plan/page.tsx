import type { Metadata } from "next";
import RetirementPlanPreview from "@/components/RetirementPlanPreview";

export const metadata: Metadata = {
  title: "Complete Retirement Plan — Beta Preview",
  description:
    "Beta household retirement planner: pre-retirement income, Social Security and pensions, required minimum distributions, IRA/Roth basis, ESPP sales, state income taxes and year-by-year cash-flow projections. A planning estimate, not tax or financial advice.",
  alternates: { canonical: "https://www.relocationbynumbers.com/complete-retirement-plan" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <RetirementPlanPreview />;
}
