import type { Metadata } from "next";
import RetirementPlanPreview from "@/components/RetirementPlanPreview";

export const metadata: Metadata = {
  title: "Complete Retirement Plan — Local Development Preview",
  description:
    "Internal, unreleased preview of a full household retirement planner: pre-retirement income, Social Security and pensions, required minimum distributions, IRA/Roth basis, ESPP sales, and year-by-year cash-flow projections. Not indexed, not financial advice.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function Page() {
  return <RetirementPlanPreview />;
}
