import type { Metadata } from "next";
import RetirementPlanPreview from "@/components/RetirementPlanPreview";
import PlannerExplainer from "@/components/PlannerExplainer";
import FeedbackBox from "@/components/FeedbackBox";

const TITLE = "Retirement Planner with State Taxes, RMDs and Social Security";
const DESCRIPTION =
  "Household retirement planner: Social Security and pensions, required minimum distributions, IRA and Roth basis, Roth conversions, Medicare IRMAA, and federal plus state income taxes for 42 states and DC, year by year. A planning estimate, not tax or financial advice.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://www.relocationbynumbers.com/complete-retirement-plan" },
  openGraph: {
    type: "website",
    url: "https://www.relocationbynumbers.com/complete-retirement-plan",
    siteName: "Relocation by Numbers",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <>
      <RetirementPlanPreview />
      <PlannerExplainer />
      <div className="px-4 pb-8">
        <FeedbackBox path="/complete-retirement-plan" name="complete retirement plan" />
      </div>
    </>
  );
}
