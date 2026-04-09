// /lib/caribbeanTax/index.ts

import type { CaribbeanTaxCode, CountryTaxConfig } from "./types";

import AG_TAX_CONFIG from "./countries/ag";
import AW_TAX_CONFIG from "./countries/aw";
import BB_TAX_CONFIG from "./countries/bb";
import BL_TAX_CONFIG from "./countries/bl";
import BQ_BO_TAX_CONFIG from "./countries/bq-bo";
import BQ_SA_TAX_CONFIG from "./countries/bq-sa";
import BQ_SE_TAX_CONFIG from "./countries/bq-se";
import BS_TAX_CONFIG from "./countries/bs";
import CU_TAX_CONFIG from "./countries/cu";
import CW_TAX_CONFIG from "./countries/cw";
import DM_TAX_CONFIG from "./countries/dm";
import DO_TAX_CONFIG from "./countries/do";
import GD_TAX_CONFIG from "./countries/gd";
import GP_TAX_CONFIG from "./countries/gp";
import HT_TAX_CONFIG from "./countries/ht";
import JM_TAX_CONFIG from "./countries/jm";
import KN_TAX_CONFIG from "./countries/kn";
import KY_TAX_CONFIG from "./countries/ky";
import LC_TAX_CONFIG from "./countries/lc";
import MF_TAX_CONFIG from "./countries/mf";
import MQ_TAX_CONFIG from "./countries/mq";
import MS_TAX_CONFIG from "./countries/ms";
import PR_TAX_CONFIG from "./countries/pr";
import SX_TAX_CONFIG from "./countries/sx";
import TC_TAX_CONFIG from "./countries/tc";
import TT_TAX_CONFIG from "./countries/tt";
import VC_TAX_CONFIG from "./countries/vc";
import VG_TAX_CONFIG from "./countries/vg";
import VI_TAX_CONFIG from "./countries/vi";

export const TAX_CONFIG: Partial<Record<CaribbeanTaxCode, CountryTaxConfig>> = {
  AG: AG_TAX_CONFIG,
  AW: AW_TAX_CONFIG,
  BB: BB_TAX_CONFIG,
  BL: BL_TAX_CONFIG,
  "BQ-BO": BQ_BO_TAX_CONFIG,
  "BQ-SA": BQ_SA_TAX_CONFIG,
  "BQ-SE": BQ_SE_TAX_CONFIG,
  BS: BS_TAX_CONFIG,
  CU: CU_TAX_CONFIG,
  CW: CW_TAX_CONFIG,
  DM: DM_TAX_CONFIG,
  DO: DO_TAX_CONFIG,
  GD: GD_TAX_CONFIG,
  GP: GP_TAX_CONFIG,
  HT: HT_TAX_CONFIG,
  JM: JM_TAX_CONFIG,
  KN: KN_TAX_CONFIG,
  KY: KY_TAX_CONFIG,
  LC: LC_TAX_CONFIG,
  MF: MF_TAX_CONFIG,
  MQ: MQ_TAX_CONFIG,
  MS: MS_TAX_CONFIG,
  PR: PR_TAX_CONFIG,
  SX: SX_TAX_CONFIG,
  TC: TC_TAX_CONFIG,
  TT: TT_TAX_CONFIG,
  VC: VC_TAX_CONFIG,
  VG: VG_TAX_CONFIG,
  VI: VI_TAX_CONFIG,
};

export const AVAILABLE_TAX_COUNTRIES: CountryTaxConfig[] = [
  AG_TAX_CONFIG,
  AW_TAX_CONFIG,
  BB_TAX_CONFIG,
  BL_TAX_CONFIG,
  BQ_BO_TAX_CONFIG,
  BQ_SA_TAX_CONFIG,
  BQ_SE_TAX_CONFIG,
  BS_TAX_CONFIG,
  CU_TAX_CONFIG,
  CW_TAX_CONFIG,
  DM_TAX_CONFIG,
  DO_TAX_CONFIG,
  GD_TAX_CONFIG,
  GP_TAX_CONFIG,
  HT_TAX_CONFIG,
  JM_TAX_CONFIG,
  KN_TAX_CONFIG,
  KY_TAX_CONFIG,
  LC_TAX_CONFIG,
  MF_TAX_CONFIG,
  MQ_TAX_CONFIG,
  MS_TAX_CONFIG,
  PR_TAX_CONFIG,
  SX_TAX_CONFIG,
  TC_TAX_CONFIG,
  TT_TAX_CONFIG,
  VC_TAX_CONFIG,
  VG_TAX_CONFIG,
  VI_TAX_CONFIG,
];

export function getCountryTaxConfig(
  code: CaribbeanTaxCode
): CountryTaxConfig | undefined {
  return TAX_CONFIG[code];
}

export function hasTaxConfig(code: string): code is CaribbeanTaxCode {
  return code in TAX_CONFIG;
}

export { CARIBBEAN_TAX_ASSUMPTIONS_LABEL, TAX_YEAR_LABEL } from "./types";

export function getAvailableTaxCountryCodes(): CaribbeanTaxCode[] {
  return Object.keys(TAX_CONFIG) as CaribbeanTaxCode[];
}