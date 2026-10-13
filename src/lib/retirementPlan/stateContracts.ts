import type { StateCode } from "../states";

const VERIFIED = "verified-law-precredit" as const;

/** The contract flag each state's module requires, and its value. Flags only mark that the planning assumptions were accepted. */
export const STATE_CONTRACT_FIELD = {
  ny: ["newYorkContract", "enacted-law-precredit"],
  md: ["marylandContract", VERIFIED], in: ["indianaContract", VERIFIED], dc: ["dcContract", VERIFIED], il: ["illinoisContract", VERIFIED],
  nj: ["newJerseyContract", VERIFIED], co: ["coloradoContract", VERIFIED], nm: ["newMexicoContract", VERIFIED], mn: ["minnesotaContract", VERIFIED],
  ut: ["utahContract", VERIFIED], pa: ["pennsylvaniaContract", VERIFIED], ct: ["connecticutContract", VERIFIED], vt: ["vermontContract", VERIFIED],
  mt: ["montanaContract", VERIFIED], ri: ["rhodeIslandContract", VERIFIED], ca: ["californiaContract", VERIFIED], va: ["virginiaContract", VERIFIED],
  az: ["arizonaContract", VERIFIED], ga: ["georgiaContract", VERIFIED], nc: ["northCarolinaContract", VERIFIED], sc: ["southCarolinaContract", VERIFIED],
  oh: ["ohioContract", VERIFIED], ma: ["massachusettsContract", VERIFIED], ia: ["iowaContract", VERIFIED], ms: ["mississippiContract", VERIFIED],
  mo: ["missouriContract", VERIFIED], wa: ["washingtonContract", VERIFIED], al: ["alabamaContract", VERIFIED], ar: ["arkansasContract", VERIFIED],
  de: ["delawareContract", VERIFIED], ks: ["kansasContract", VERIFIED], ky: ["kentuckyContract", VERIFIED], ne: ["nebraskaContract", VERIFIED],
  wv: ["westVirginiaContract", VERIFIED], id: ["idahoContract", VERIFIED], la: ["louisianaContract", VERIFIED], mi: ["michiganContract", VERIFIED],
  ok: ["oklahomaContract", VERIFIED], wi: ["wisconsinContract", VERIFIED], hi: ["hawaiiContract", VERIFIED], me: ["maineContract", VERIFIED],
  nd: ["northDakotaContract", VERIFIED], or: ["oregonContract", VERIFIED],
} as const satisfies Partial<Record<StateCode, readonly [string, string]>>;

/** All contract flags at once, for callers that run any state's module without a consent step (the wage and retirement-view engines). */
export const CONTRACTS = Object.freeze(
  Object.fromEntries(Object.values(STATE_CONTRACT_FIELD).map(([field, value]) => [field, value])),
) as Readonly<Record<string, string>>;

/** The one flag a state needs, or nothing for a state without income tax. */
export function contractFlagsFor(state: StateCode): Record<string, string> {
  const entry = (STATE_CONTRACT_FIELD as Partial<Record<StateCode, readonly [string, string]>>)[state];
  return entry ? { [entry[0]]: entry[1] } : {};
}
