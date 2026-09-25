import { runRetirementTimeline, type TimelineInput } from "./timeline";
import { validatedDate, type HouseholdIncome } from "./householdTax";
import { assemblePreviewAccounts, type AccountEditorState } from "./previewAccounts";
import { addPreviewContributions, type ContributionEditorState } from "./previewContributions";
import { addPreviewIraContributions } from "./previewIraContributions";
import { addPreviewMedicare, type MedicareEditorState } from "./previewMedicare";
import { verifiedRetirementLocation } from "./verifiedLocation";

export const PREVIEW_DEFAULTS: Record<string, string> = {
  state: "fl", cityId: "",
  "one-pensionType": "unspecified", "two-pensionType": "unspecified",
  household: "single", startYear: "2026", endYear: "2060", spending: "50000", cash: "50000",
  inflation: "2.5", returns: "5", taxGrowth: "2", payrollGrowth: "2", thresholdGrowthMode: "linked",
  "one-birth": "1965-01-01", "one-retirement": "2030-01-01", "one-salary": "70000", "one-ira": "500000",
  "one-pension": "12000", "one-pensionStart": "2030-01-01", "one-benefit": "24000", "one-benefitStart": "2032-01-01",
  "two-birth": "1967-01-01", "two-retirement": "2032-01-01", "two-salary": "50000", "two-ira": "250000",
  "two-pension": "0", "two-pensionStart": "2032-01-01", "two-benefit": "20000", "two-benefitStart": "2034-01-01",
};

export function buildPreviewInput(values: Record<string, string>, editor?: AccountEditorState, saving?: ContributionEditorState, medicare?: MedicareEditorState): TimelineInput {
  const location = verifiedRetirementLocation(values.state ?? "fl", values.cityId ?? "");
  if (location.state === "ny" && values.nyContract !== "confirmed") throw new RangeError("Confirm the restricted New York planning assumptions.");
  if (location.state === "md" && values.mdContract !== "confirmed") throw new RangeError("Confirm the restricted Maryland planning assumptions.");
  if (location.state === "dc" && values.dcContract !== "confirmed") throw new RangeError("Confirm the restricted DC planning assumptions.");
  if (location.state === "il" && values.ilContract !== "confirmed") throw new RangeError("Confirm the restricted Illinois planning assumptions.");
  if (location.state === "nj" && values.njContract !== "confirmed") throw new RangeError("Confirm the restricted New Jersey planning assumptions.");
  if (location.state === "pa" && values.paContract !== "confirmed") throw new RangeError("Confirm the restricted Pennsylvania planning assumptions.");
  if (location.state === "co" && values.coContract !== "confirmed") throw new RangeError("Confirm the restricted Colorado planning assumptions.");
  if (location.state === "nm" && values.nmContract !== "confirmed") throw new RangeError("Confirm the restricted New Mexico planning assumptions.");
  if (location.state === "mn" && values.mnContract !== "confirmed") throw new RangeError("Confirm the restricted Minnesota planning assumptions.");
  if (location.state === "ut" && values.utContract !== "confirmed") throw new RangeError("Confirm the restricted Utah planning assumptions.");
  if (location.state === "in" && values.inContract !== "confirmed") throw new RangeError("Confirm the restricted Indiana planning assumptions.");
  if (location.state === "ct" && values.ctContract !== "confirmed") throw new RangeError("Confirm the restricted Connecticut planning assumptions.");
  if (location.state === "vt" && values.vtContract !== "confirmed") throw new RangeError("Confirm the restricted Vermont planning assumptions.");
  if (location.state === "mt" && values.mtContract !== "confirmed") throw new RangeError("Confirm the restricted Montana planning assumptions.");
  if (location.state === "ri" && values.riContract !== "confirmed") throw new RangeError("Confirm the restricted Rhode Island planning assumptions.");
  if (location.state === "ca" && values.caContract !== "confirmed") throw new RangeError("Confirm the restricted California planning assumptions.");
  if (location.state === "va" && values.vaContract !== "confirmed") throw new RangeError("Confirm the restricted Virginia planning assumptions.");
  if (location.state === "az" && values.azContract !== "confirmed") throw new RangeError("Confirm the restricted Arizona planning assumptions.");
  if (location.state === "ga" && values.gaContract !== "confirmed") throw new RangeError("Confirm the restricted Georgia planning assumptions.");
  if (location.state === "nc" && values.ncContract !== "confirmed") throw new RangeError("Confirm the restricted North Carolina planning assumptions.");
  if (location.state === "sc" && values.scContract !== "confirmed") throw new RangeError("Confirm the restricted South Carolina planning assumptions.");
  if (location.state === "oh" && values.ohContract !== "confirmed") throw new RangeError("Confirm the restricted Ohio planning assumptions.");
  if (location.state === "ma" && values.maContract !== "confirmed") throw new RangeError("Confirm the restricted Massachusetts planning assumptions.");
  if (location.state === "ia" && values.iaContract !== "confirmed") throw new RangeError("Confirm the restricted Iowa planning assumptions.");
  if (location.state === "ms" && values.msContract !== "confirmed") throw new RangeError("Confirm the restricted Mississippi planning assumptions.");
  if (location.state === "mo" && values.moContract !== "confirmed") throw new RangeError("Confirm the restricted Missouri planning assumptions.");
  if (location.state === "wa" && values.waContract !== "confirmed") throw new RangeError("Confirm the restricted Washington planning assumptions.");
  if (location.state === "al" && values.alContract !== "confirmed") throw new RangeError("Confirm the restricted Alabama planning assumptions.");
  if (location.state === "ar" && values.arContract !== "confirmed") throw new RangeError("Confirm the restricted Arkansas planning assumptions.");
  if (location.state === "de" && values.deContract !== "confirmed") throw new RangeError("Confirm the restricted Delaware planning assumptions.");
  const number = (key: string, min = 0, max = 1e9) => {
    const raw = values[key];
    if (typeof raw !== "string" || !raw.trim()) throw new RangeError(`Please enter ${key.replaceAll("-", " ")}.`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`Check ${key.replaceAll("-", " ")}: allowed range ${min}–${max}.`);
    return value;
  };
  const date = (key: string) => { validatedDate(values[key]); return values[key]; };
  const pensionType = (id: string): HouseholdIncome["pensionType"] => {
    const value = values[`${id}-pensionType`] ?? "unspecified";
    if (!["unspecified", "private", "ny-government", "federal-government", "other-government"].includes(value)) {
      throw new RangeError("Choose a valid pension type.");
    }
    return value as HouseholdIncome["pensionType"];
  };
  const startYear = number("startYear", 2026, 2126);
  const endYear = number("endYear", startYear, 2126);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) throw new RangeError("Years must be whole numbers.");
  if (values.household !== "single" && values.household !== "married") throw new RangeError("Choose one or two people.");
  const ids = values.household === "single" ? ["one"] : ["one", "two"];
  const inflation = number("inflation", 0, 20) / 100;
  const growthMode = values.thresholdGrowthMode ?? "separate";
  if (growthMode !== "linked" && growthMode !== "separate") throw new RangeError("Choose linked inflation or separate threshold growth.");
  const thresholdGrowth = growthMode === "linked" ? inflation : number("taxGrowth", 0, 20) / 100;
  const returns = editor ? 0 : number("returns", -20, 20) / 100;
  const input: TimelineInput = {
    startYear, endYear, spendingAnnual: number("spending"), inflation,
    taxProjection: { kind: "project-2026-law", annualBracketGrowth: thresholdGrowth,
      annualPayrollCapGrowth: thresholdGrowth, statePolicy: "freeze-2025-proxy" },
    filing: values.household, state: location.state, cityId: location.cityId, stateTreatment: "verified-resident-location",
    ...(location.state === "ny" ? { newYorkContract: "enacted-law-precredit" as const } : {}),
    ...(location.state === "md" ? { marylandContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "dc" ? { dcContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "il" ? { illinoisContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "nj" ? { newJerseyContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "pa" ? { pennsylvaniaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "co" ? { coloradoContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "nm" ? { newMexicoContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "mn" ? { minnesotaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ut" ? { utahContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "in" ? { indianaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ct" ? { connecticutContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "vt" ? { vermontContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "mt" ? { montanaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ri" ? { rhodeIslandContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ca" ? { californiaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "va" ? { virginiaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "az" ? { arizonaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ga" ? { georgiaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "nc" ? { northCarolinaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "sc" ? { southCarolinaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "oh" ? { ohioContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ma" ? { massachusettsContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ia" ? { iowaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ms" ? { mississippiContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "mo" ? { missouriContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "wa" ? { washingtonContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "al" ? { alabamaContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "ar" ? { arkansasContract: "verified-law-precredit" as const } : {}),
    ...(location.state === "de" ? { delawareContract: "verified-law-precredit" as const } : {}),
    people: ids.map(id => ({ id, birthDate: date(`${id}-birth`), blind: false, eligibleForSeniorDeduction: true,
      iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
      roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } })),
    retirementDates: Object.fromEntries(ids.map(id => [id, date(`${id}-retirement`)])),
    accounts: editor ? [] : [{ id: "cash", ownerId: "one", kind: "cash", balance: number("cash"), annualReturn: 0, interestTreatment: "none" },
      ...ids.map(id => ({ id: `${id}-ira`, ownerId: id, kind: "traditional-ira" as const, balance: number(`${id}-ira`), annualReturn: returns,
        rmd: { table: "uniform" as const, priorDecemberBalance: number(`${id}-ira`) } }))],
    income: ids.flatMap(id => [
      { id: `${id}-salary`, ownerId: id, kind: "wages" as const, annualAmount: number(`${id}-salary`), annualGrowth: inflation, startDate: `${startYear}-01-01`, endDate: null },
      { id: `${id}-pension`, ownerId: id, kind: "pension" as const, pensionType: pensionType(id), annualAmount: number(`${id}-pension`), annualGrowth: 0, startDate: date(`${id}-pensionStart`), endDate: null },
      { id: `${id}-benefit`, ownerId: id, kind: "social-security" as const, annualAmount: number(`${id}-benefit`), annualGrowth: inflation, startDate: date(`${id}-benefitStart`), endDate: null },
    ]),
    contributions: [], contributionCapacities: [], withdrawalOrder: ["cash", ...ids.map(id => `${id}-ira`)], surplusAccountId: "cash",
    lossCarryover: { shortTerm: 0, longTerm: 0 }, timing: "calendar-day-proration-annual-growth",
  };
  const assembled = editor ? { ...input, ...assemblePreviewAccounts(editor, input.people, startYear, number("cash")) } : input;
  const workplace = saving ? addPreviewContributions(assembled, saving) : assembled;
  const withIra = saving?.ira ? addPreviewIraContributions(workplace, saving.ira) : workplace;
  return medicare ? addPreviewMedicare(withIra, medicare) : withIra;
}

export function calculatePreview(values: Record<string, string>, editor?: AccountEditorState, saving?: ContributionEditorState, medicare?: MedicareEditorState) {
  return runRetirementTimeline(buildPreviewInput(values, editor, saving, medicare));
}
