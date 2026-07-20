'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { STATES, type StateCode } from '@/lib/states'
import { citiesForState, findCity, type City } from '@/lib/cities'
import {
  estimateNetAnnual,
  estimateNetBreakdown,
  EMPLOYEE_401K_LIMIT,
  type FilingStatus,
} from '@/lib/tax'

// ─── Types ────────────────────────────────────────────────────────────────────

type HousingMode    = 'rent' | 'buy'
type HouseholdType  = 'solo' | 'couple' | 'family'
type Verdict        = 'Safe' | 'Tight' | 'Stretch'

interface LivingCosts {
  groceries:      number
  utilities:      number
  transportation: number
  healthcare:     number
  childcare:      number
  miscellaneous:  number
}

interface Results {
  netMonthlyOne:        number
  netMonthlyTwo:        number
  housingCost:          number
  totalLiving:          number
  flexibilityOne:       number
  flexibilityTwo:       number
  housingBurdenOne:     number
  housingBurdenTwo:     number
  verdictOne:           Verdict
  verdictTwo:           Verdict
  minIncomeForCashflow: number
  minIncomeFor30Pct:    number
  taxesOne:             number
  taxesTwo:             number
  grossMonthlyOne:      number
  insightMessage:       string
  targetCityName:       string
  targetCitySlug:       string
  currentCityName:      string
  hasTwoIncomes:        boolean
  // ── NEW: one-time moving cost payback ────────────────────────────────
  totalMovingCost:      number
  monthsToPayBack:      number | null   // null when flexibility ≤ 0
  // ── NEW: sales-tax purchasing-power note ─────────────────────────────
  salesTaxNote:         string | null
}

// ─── Base COL (national monthly averages) ────────────────────────────────────

const BASE_COL = {
  solo:   { groceries: 380, utilities: 140, transportation: 280, healthcare: 200, childcare: 0,    miscellaneous: 280 },
  couple: { groceries: 650, utilities: 165, transportation: 480, healthcare: 350, childcare: 0,    miscellaneous: 400 },
  family: { groceries: 800, utilities: 185, transportation: 520, healthcare: 420, childcare: 1000, miscellaneous: 480 },
}

// ─── Sales-tax tiers for purchasing-power note (FIX 3) ───────────────────────
// Combined state + average local rate, approximate
const STATE_SALES_TAX: Record<string, number> = {
  or: 0, nh: 0, mt: 0, de: 0, ak: 0.018,
  tn: 9.55, la: 9.55, ar: 9.47, wa: 9.23, al: 9.22,
  ok: 8.98, il: 8.83, ks: 8.68, ca: 8.68, nv: 8.23,
  ny: 8.52, tx: 8.19, ms: 7.07, co: 7.77, az: 8.37,
  ga: 7.38, fl: 7.08, sc: 7.44, nc: 6.99, va: 5.75,
  pa: 6.34, oh: 7.24, mi: 6.00, wi: 5.43, mn: 7.49,
}
const NO_SALES_TAX = new Set(['or', 'nh', 'mt', 'de'])

function getSalesTaxNote(fromState: string, toState: string): string | null {
  const from = STATE_SALES_TAX[fromState]
  const to   = STATE_SALES_TAX[toState]
  if (from == null || to == null) return null
  const diff = to - from
  if (Math.abs(diff) < 1.5) return null   // not significant enough to surface
  if (NO_SALES_TAX.has(fromState) && to >= 7) {
   return `Heads up: you're moving from a 0% sales-tax state to ~${to.toFixed(1)}% combined. Your take-home goes less far than the numbers suggest — factor an extra ~${to.toFixed(0)}% cost on taxable everyday spending.`
  }
  if (diff >= 3) {
    return `Sales tax in the target state (~${to.toFixed(1)}%) is notably higher than your current state (~${from.toFixed(1)}%). Your day-to-day purchasing power is slightly lower than the numbers alone indicate.`
  }
  if (diff <= -3) {
    return `Sales tax in the target state (~${to.toFixed(1)}%) is lower than your current state (~${from.toFixed(1)}%). Your everyday purchasing power stretches a bit further than the numbers show.`
  }
  return null
}

// ─── URL param keys ───────────────────────────────────────────────────────────

const PARAM_KEYS = [
  'household', 'adults', 'children',
  'income1', 'income2', 'filing', 'k401Pct1', 'k401Pct2',
  'currentState', 'currentCityId', 'targetState', 'targetCityId',
  'housingMode', 'monthlyRent', 'rentersInsurance',
  'homePrice', 'downPct', 'mortgageRate', 'termYears', 'hoa',
  'movingTruck', 'securityDeposit', 'furnitureBudget', 'miscMoving',
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtK = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : fmt(n)

function parseMoney(val: string): number {
  return Number(val.replace(/[^\d.]/g, '')) || 0
}

function calcMortgagePI(homePrice: number, downPct: number, ratePct: number, termYears: number): number {
  const principal = homePrice * (1 - downPct / 100)
  const r = ratePct / 100 / 12
  const n = termYears * 12
  if (r === 0 || n === 0) return principal / (n || 360)
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
}

function getVerdict(housingBurden: number, flexibility: number): Verdict {
  if (housingBurden > 40 || flexibility < 0) return 'Stretch'
  if (housingBurden > 30 || flexibility < 400) return 'Tight'
  return 'Safe'
}

function verdictStyles(v: Verdict): string {
  if (v === 'Safe')
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900'
  if (v === 'Tight')
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900'
  return 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900'
}

function verdictBorderColor(v: Verdict): string {
  if (v === 'Safe')   return 'border-emerald-400 dark:border-emerald-700'
  if (v === 'Tight')  return 'border-amber-400 dark:border-amber-700'
  return 'border-red-400 dark:border-red-700'
}

function estimateCombinedNet(
  income1:   number,
  income2:   number,
  state:     StateCode,
  filing:    FilingStatus,
  k401Pct1:  number,
  k401Pct2:  number,
  cityId:    string,
): number {
  if (income2 === 0) {
    return estimateNetAnnual({ grossAnnual: income1, state, filing, k401Pct: k401Pct1, cityId })
  }
  if (filing === 'married') {
    // The IRS elective deferral limit (EMPLOYEE_401K_LIMIT) applies per
    // person, not per return — a couple who each max out their own 401(k)
    // can jointly exclude up to 2x the single-filer limit. Cap each
    // spouse's contribution individually, then pass the summed dollar
    // amount via k401Dollar so tax.ts doesn't re-apply the single-person
    // cap to the household total.
    const k401_1 = Math.min(income1 * (k401Pct1 / 100), EMPLOYEE_401K_LIMIT)
    const k401_2 = Math.min(income2 * (k401Pct2 / 100), EMPLOYEE_401K_LIMIT)
    const combined = income1 + income2
    return estimateNetAnnual({ grossAnnual: combined, state, filing: 'married', k401Pct: 0, k401Dollar: k401_1 + k401_2, cityId })
  }
  const net1 = estimateNetAnnual({ grossAnnual: income1, state, filing: 'single', k401Pct: k401Pct1, cityId })
  const net2 = estimateNetAnnual({ grossAnnual: income2, state, filing: 'single', k401Pct: k401Pct2, cityId })
  return net1 + net2
}

function findMinIncome2(
  income1:          number,
  state:            StateCode,
  filing:           FilingStatus,
  k401Pct1:         number,
  k401Pct2:         number,
  cityId:           string,
  targetNetMonthly: number,
): number {
  const alreadyMet = estimateCombinedNet(income1, 0, state, filing, k401Pct1, k401Pct2, cityId) / 12
  if (alreadyMet >= targetNetMonthly) return 0
  let lo = 0
  let hi = 500_000
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const net = estimateCombinedNet(income1, mid, state, filing, k401Pct1, k401Pct2, cityId) / 12
    if (net < targetNetMonthly) lo = mid
    else hi = mid
  }
  return Math.ceil(hi / 1000) * 1000
}

function getPrefillCosts(city: City | undefined, householdType: HouseholdType, children: number): LivingCosts {
  const base = BASE_COL[householdType]
  const col  = city?.col
  const extraKids = Math.max(0, children - 1) * 850
  return {
    groceries:      Math.round(base.groceries      * (col?.groceries  ?? 1)),
    utilities:      Math.round(base.utilities      * (col?.utilities  ?? 1)),
    transportation: Math.round(base.transportation * (col?.transport  ?? 1)),
    healthcare:     Math.round(base.healthcare     * (col?.healthcare ?? 1)),
    childcare:
      householdType === 'family'
        ? Math.round((base.childcare + extraKids) * (col?.housing ?? 1))
        : 0,
    miscellaneous: base.miscellaneous,
  }
}

function cityLabel(c: City): string {
  if (c.id.startsWith('other-')) return 'Other'
  return c.tier ? `${c.name} — ${c.tier}` : c.name
}

// ─── URL serialise ─────────────────────────────────────────────────────────────

function buildScenarioUrl(state: {
  householdType: HouseholdType; adults: number; children: number
  income1: string; income2: string; filing: FilingStatus; k401Pct1: string; k401Pct2: string
  currentState: StateCode; currentCityId: string; targetState: StateCode; targetCityId: string
  housingMode: HousingMode; monthlyRent: string; rentersInsurance: string
  homePrice: string; downPct: string; mortgageRate: string; termYears: string; hoa: string
  movingTruck: string; securityDeposit: string; furnitureBudget: string; miscMoving: string
}): string {
  const url = new URL(window.location.href)
  url.searchParams.set('household',        state.householdType)
  url.searchParams.set('adults',           String(state.adults))
  url.searchParams.set('children',         String(state.children))
  url.searchParams.set('income1',          state.income1)
  url.searchParams.set('income2',          state.income2)
  url.searchParams.set('filing',           state.filing)
  url.searchParams.set('k401Pct1',         state.k401Pct1)
  url.searchParams.set('k401Pct2',         state.k401Pct2)
  url.searchParams.set('currentState',     state.currentState)
  url.searchParams.set('currentCityId',    state.currentCityId)
  url.searchParams.set('targetState',      state.targetState)
  url.searchParams.set('targetCityId',     state.targetCityId)
  url.searchParams.set('housingMode',      state.housingMode)
  url.searchParams.set('monthlyRent',      state.monthlyRent)
  url.searchParams.set('rentersInsurance', state.rentersInsurance)
  url.searchParams.set('homePrice',        state.homePrice)
  url.searchParams.set('downPct',          state.downPct)
  url.searchParams.set('mortgageRate',     state.mortgageRate)
  url.searchParams.set('termYears',        state.termYears)
  url.searchParams.set('hoa',              state.hoa)
  url.searchParams.set('movingTruck',      state.movingTruck)
  url.searchParams.set('securityDeposit',  state.securityDeposit)
  url.searchParams.set('furnitureBudget',  state.furnitureBudget)
  url.searchParams.set('miscMoving',       state.miscMoving)
  return url.toString()
}

// ─── Primitive UI pieces ──────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-500/20'

const selectCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-500/20 cursor-pointer'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── NEW: Money flow stacked bar (FIX 2) ──────────────────────────────────────

function MoneyFlowBar({
  grossMonthly, taxes, housing, living, flexibility,
}: {
  grossMonthly: number
  taxes:        number
  housing:      number
  living:       number
  flexibility:  number
}) {
  if (grossMonthly <= 0) return null

  const clamp = (n: number) => Math.max(0, Math.min(100, (n / grossMonthly) * 100))

  const segments = [
    { label: 'Taxes',         value: taxes,                   width: clamp(taxes),                   color: 'bg-slate-400 dark:bg-slate-500' },
    { label: 'Housing',       value: housing,                  width: clamp(housing),                  color: housing / grossMonthly > 0.40 ? 'bg-rose-500' : housing / grossMonthly > 0.30 ? 'bg-amber-500' : 'bg-sky-400' },
    { label: 'Living costs',  value: living,                   width: clamp(living),                   color: 'bg-violet-400 dark:bg-violet-500' },
    { label: 'Flexibility',   value: Math.max(0, flexibility), width: clamp(Math.max(0, flexibility)), color: flexibility < 0 ? 'bg-red-500' : flexibility < 400 ? 'bg-amber-400' : 'bg-emerald-400' },
  ]

  return (
    <div>
      {/* Bar */}
      <div className="flex h-7 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {segments.map(s => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${s.width}%` }}
            title={`${s.label}: ${fmt(s.value)}`}
          />
        ))}
        {/* Show overflow if flexibility is negative */}
        {flexibility < 0 && (
          <div className="bg-red-600 dark:bg-red-700 w-2" title="Over budget" />
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className={`h-2.5 w-2.5 rounded-sm flex-shrink-0 ${s.color}`} />
            <span>{s.label}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(s.value)}/mo</span>
            <span className="text-slate-400">({clamp(s.value).toFixed(0)}%)</span>
          </div>
        ))}
      </div>

      {flexibility < 0 && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          ⚠ Monthly expenses exceed take-home by {fmt(Math.abs(flexibility))}
        </p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelocationIncomeCalculator() {
  // FIX 4: separate scroll intent from calculate so debounce doesn't scroll
  const resultsRef   = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [shouldScroll, setShouldScroll] = useState(false)

  // — Household
  const [householdType, setHouseholdType] = useState<HouseholdType>('couple')
  const [adults,        setAdults]        = useState(2)
  const [children,      setChildren]      = useState(0)

  // — Income
  const [income1,  setIncome1]  = useState('')
  const [income2,  setIncome2]  = useState('')
  const [filing,   setFiling]   = useState<FilingStatus>('married')
  const [k401Pct1, setK401Pct1] = useState('6')
  const [k401Pct2, setK401Pct2] = useState('6')

  // — Locations
  const [currentState,  setCurrentState]  = useState<StateCode>('ny')
  const [currentCityId, setCurrentCityId] = useState('nyc-ny')
  const [targetState,   setTargetState]   = useState<StateCode>('nc')
  const [targetCityId,  setTargetCityId]  = useState('raleigh-nc')

  // — Housing
  const [housingMode,      setHousingMode]      = useState<HousingMode>('rent')
  const [monthlyRent,      setMonthlyRent]      = useState('')
  const [rentersInsurance, setRentersInsurance] = useState('20')
  const [homePrice,        setHomePrice]        = useState('')
  const [downPct,          setDownPct]          = useState('10')
  const [mortgageRate,     setMortgageRate]     = useState('6.75')
  const [termYears,        setTermYears]        = useState('30')
  const [hoa,              setHoa]              = useState('0')

  // — NEW: One-time moving costs (FIX 1)
  const [movingTruck,      setMovingTruck]      = useState('1500')
  const [securityDeposit,  setSecurityDeposit]  = useState('')
  const [furnitureBudget,  setFurnitureBudget]  = useState('2000')
  const [miscMoving,       setMiscMoving]       = useState('500')

  // — Living costs
  const [costs, setCosts] = useState<LivingCosts>(() =>
    getPrefillCosts(findCity('raleigh-nc'), 'couple', 0)
  )
  const [costsManuallyEdited, setCostsManuallyEdited] = useState(false)

  // — Results / UI state
  const [results,    setResults]    = useState<Results | null>(null)
  const [error,      setError]      = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle')

  // ─── FIX 4: scroll only when explicitly triggered via button ──────────────
  useEffect(() => {
    if (shouldScroll && results) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShouldScroll(false)
    }
  }, [shouldScroll, results])

  // ─── Restore from URL params on first mount ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)

    const household = p.get('household') as HouseholdType | null
    if (household && ['solo', 'couple', 'family'].includes(household)) setHouseholdType(household)
    if (p.get('adults'))           setAdults(Number(p.get('adults')))
    if (p.get('children'))         setChildren(Number(p.get('children')))
    if (p.get('income1'))          setIncome1(p.get('income1')!)
    if (p.get('income2'))          setIncome2(p.get('income2')!)

    const filing = p.get('filing') as FilingStatus | null
    if (filing && ['married', 'single'].includes(filing)) setFiling(filing)

    if (p.get('k401Pct1'))         setK401Pct1(p.get('k401Pct1')!)
    if (p.get('k401Pct2'))         setK401Pct2(p.get('k401Pct2')!)

    const cState = p.get('currentState') as StateCode | null
    if (cState) setCurrentState(cState)
    if (p.get('currentCityId'))    setCurrentCityId(p.get('currentCityId')!)

    const tState = p.get('targetState') as StateCode | null
    if (tState) setTargetState(tState)
    if (p.get('targetCityId'))     setTargetCityId(p.get('targetCityId')!)

    const mode = p.get('housingMode') as HousingMode | null
    if (mode && ['rent', 'buy'].includes(mode)) setHousingMode(mode)

    if (p.get('monthlyRent'))      setMonthlyRent(p.get('monthlyRent')!)
    if (p.get('rentersInsurance')) setRentersInsurance(p.get('rentersInsurance')!)
    if (p.get('homePrice'))        setHomePrice(p.get('homePrice')!)
    if (p.get('downPct'))          setDownPct(p.get('downPct')!)
    if (p.get('mortgageRate'))     setMortgageRate(p.get('mortgageRate')!)
    if (p.get('termYears'))        setTermYears(p.get('termYears')!)
    if (p.get('hoa'))              setHoa(p.get('hoa')!)

    if (p.get('movingTruck'))      setMovingTruck(p.get('movingTruck')!)
    if (p.get('securityDeposit'))  setSecurityDeposit(p.get('securityDeposit')!)
    if (p.get('furnitureBudget'))  setFurnitureBudget(p.get('furnitureBudget')!)
    if (p.get('miscMoving'))       setMiscMoving(p.get('miscMoving')!)
  }, [])

  // — Auto-fill rent + home price when target city changes
  useEffect(() => {
    const city = findCity(targetCityId)
    if (city?.defaultRent)     setMonthlyRent(String(city.defaultRent))
    if (city?.medianHomePrice) setHomePrice(String(city.medianHomePrice))
  }, [targetCityId])

  // — Auto-fill security deposit when rent changes (2× rent, unless user has typed something)
  useEffect(() => {
    if (housingMode !== 'rent' || securityDeposit) return
    const rent = parseMoney(monthlyRent)
    if (rent > 0) setSecurityDeposit(String(rent * 2))
  }, [monthlyRent, housingMode]) // intentionally omits securityDeposit to avoid loop

  // — Auto-prefill living costs unless manually edited
  useEffect(() => {
    if (costsManuallyEdited) return
    const city = findCity(targetCityId)
    setCosts(getPrefillCosts(city, householdType, children))
  }, [targetCityId, householdType, children, costsManuallyEdited])

  useEffect(() => { setCostsManuallyEdited(false) }, [targetCityId])

  // ─── Location helpers ──────────────────────────────────────────────────────

  const handleCurrentStateChange = (s: StateCode) => {
    setCurrentState(s)
    const cities = citiesForState(s)
    setCurrentCityId(cities[0]?.id ?? `other-${s}`)
  }

  const handleTargetStateChange = (s: StateCode) => {
    setTargetState(s)
    const cities = citiesForState(s)
    setTargetCityId(cities[0]?.id ?? `other-${s}`)
  }

  const handleCostChange = (key: keyof LivingCosts, val: string) => {
    setCostsManuallyEdited(true)
    setCosts(prev => ({ ...prev, [key]: parseFloat(val) || 0 }))
  }

  // ─── Calculate ─────────────────────────────────────────────────────────────

  const calculate = useCallback(() => {
    setError('')

    const i1 = parseMoney(income1)
    const i2 = parseMoney(income2)
    const k1 = parseFloat(k401Pct1) || 0
    const k2 = parseFloat(k401Pct2) || 0

    if (i1 === 0) { setError('Please enter at least one income to calculate.'); return }

    const targetCity  = findCity(targetCityId)
    const currentCity = findCity(currentCityId)

    // Housing cost / month
    let housingCost = 0
    if (housingMode === 'rent') {
      housingCost = (parseFloat(monthlyRent) || 0) + (parseFloat(rentersInsurance) || 0)
    } else {
      const hp   = parseFloat(homePrice)    || 0
      const dp   = parseFloat(downPct)      || 10
      const rate = parseFloat(mortgageRate) || 6.75
      const term = parseInt(termYears)      || 30
      const ptax  = ((targetCity?.propertyTaxPct ?? 1) / 100) * hp / 12
      const ins   = (hp * 0.006) / 12
      const loanAmt = hp * (1 - dp / 100)
      const pmi   = hp > 0 && (loanAmt / hp) > 0.8 ? (loanAmt * 0.008) / 12 : 0
      housingCost = calcMortgagePI(hp, dp, rate, term) + ptax + ins + pmi + (parseFloat(hoa) || 0)
    }

    const totalLiving = Object.values(costs).reduce((a, b) => a + b, 0)

    // Net monthly — single income
    const annualNetOne  = estimateNetAnnual({ grossAnnual: i1, state: targetState, filing, k401Pct: k1, cityId: targetCityId })
    const netMonthlyOne = annualNetOne / 12
    const grossMonthlyOne = i1 / 12

    // Net monthly — combined
    const annualNetTwo  = estimateCombinedNet(i1, i2, targetState, filing, k1, k2, targetCityId)
    const netMonthlyTwo = annualNetTwo / 12

    const flexOne = netMonthlyOne - housingCost - totalLiving
    const flexTwo = netMonthlyTwo - housingCost - totalLiving

    const burdenOne = netMonthlyOne > 0 ? (housingCost / netMonthlyOne) * 100 : 100
    const burdenTwo = netMonthlyTwo > 0 ? (housingCost / netMonthlyTwo) * 100 : 100

    const verdictOne = getVerdict(burdenOne, flexOne)
    const verdictTwo = getVerdict(burdenTwo, flexTwo)

    // Accurate tax figures from breakdown
    const breakdownOne = estimateNetBreakdown({ grossAnnual: i1, state: targetState, filing, k401Pct: k1, cityId: targetCityId })
    const taxesOne = breakdownOne.totalTax

    let taxesTwo: number
    if (i2 > 0 && filing === 'married') {
      // See estimateCombinedNet above — each spouse's 401(k) is capped
      // individually, then the summed dollar amount is passed via
      // k401Dollar so the household total isn't re-capped to a single
      // person's limit.
      const k401_1 = Math.min(i1 * (k1 / 100), EMPLOYEE_401K_LIMIT)
      const k401_2 = Math.min(i2 * (k2 / 100), EMPLOYEE_401K_LIMIT)
      const combined = i1 + i2
      const bd = estimateNetBreakdown({ grossAnnual: combined, state: targetState, filing: 'married', k401Pct: 0, k401Dollar: k401_1 + k401_2, cityId: targetCityId })
      taxesTwo = bd.totalTax
    } else if (i2 > 0) {
      const bd1 = estimateNetBreakdown({ grossAnnual: i1, state: targetState, filing: 'single', k401Pct: k1, cityId: targetCityId })
      const bd2 = estimateNetBreakdown({ grossAnnual: i2, state: targetState, filing: 'single', k401Pct: k2, cityId: targetCityId })
      taxesTwo = bd1.totalTax + bd2.totalTax
    } else {
      taxesTwo = taxesOne
    }

    // Min second income thresholds
    const breakEvenNet = housingCost + totalLiving
    const target30Net  = housingCost / 0.30

    const minForCashflow = findMinIncome2(i1, targetState, filing, k1, k2, targetCityId, breakEvenNet)
    const minFor30Pct    = findMinIncome2(i1, targetState, filing, k1, k2, targetCityId, target30Net)

    // ── FIX 1: one-time moving cost payback ───────────────────────────────
    const totalMovingCost =
      (parseFloat(movingTruck)     || 0) +
      (parseFloat(securityDeposit) || 0) +
      (parseFloat(furnitureBudget) || 0) +
      (parseFloat(miscMoving)      || 0)

    // Use the best applicable flexibility (two if available, else one)
    const bestFlex = i2 > 0 ? flexTwo : flexOne
    const monthsToPayBack = bestFlex > 0 ? Math.ceil(totalMovingCost / bestFlex) : null

    // ── FIX 3: sales tax note ─────────────────────────────────────────────
    const salesTaxNote = getSalesTaxNote(currentState, targetState)

    // Contextual insight
    let insightMessage = ''
    if (verdictOne === 'Safe') {
      insightMessage = `${targetCity?.name ?? 'This city'} is manageable on one income. Your household has breathing room even if the second income disappears.`
    } else if (verdictTwo === 'Safe' && verdictOne === 'Tight') {
      insightMessage = `This move works well on two incomes, but becomes tight if one income disappears. Consider building 6 months of reserves before relocating.`
    } else if (verdictTwo === 'Safe' && verdictOne === 'Stretch') {
      insightMessage = `This move depends on two incomes. Losing one income would put serious strain on this budget — plan accordingly.`
    } else if (verdictTwo === 'Tight') {
      insightMessage = `This is a stretch even on two incomes. Review your housing or cost assumptions — or consider a higher second income threshold.`
    } else {
      insightMessage = `This city is a financial stretch. Consider a lower-cost area or a larger combined income before committing to this move.`
    }

    setResults({
      netMonthlyOne, netMonthlyTwo, housingCost, totalLiving,
      flexibilityOne: flexOne, flexibilityTwo: flexTwo,
      housingBurdenOne: burdenOne, housingBurdenTwo: burdenTwo,
      verdictOne, verdictTwo,
      minIncomeForCashflow: minForCashflow, minIncomeFor30Pct: minFor30Pct,
      taxesOne, taxesTwo,
      grossMonthlyOne,
      insightMessage,
      targetCityName:  targetCity?.name  ?? targetState.toUpperCase(),
      targetCitySlug:  targetCityId,
      currentCityName: currentCity?.name ?? currentState.toUpperCase(),
      hasTwoIncomes: i2 > 0,
      totalMovingCost,
      monthsToPayBack,
      salesTaxNote,
    })
  }, [
    income1, income2, filing, k401Pct1, k401Pct2,
    currentState, currentCityId, targetState, targetCityId,
    housingMode, monthlyRent, rentersInsurance,
    homePrice, downPct, mortgageRate, termYears, hoa,
    movingTruck, securityDeposit, furnitureBudget, miscMoving,
    costs,
  ])

  // ─── Debounced auto-recalculate (does NOT trigger scroll) ─────────────────
  useEffect(() => {
    if (!parseMoney(income1)) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { calculate() }, 450)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [
    income1, income2, filing, k401Pct1, k401Pct2,
    currentState, currentCityId, targetState, targetCityId,
    housingMode, monthlyRent, rentersInsurance,
    homePrice, downPct, mortgageRate, termYears, hoa,
    movingTruck, securityDeposit, furnitureBudget, miscMoving,
    costs,
    calculate,
  ])

  // ─── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setHouseholdType('couple'); setAdults(2); setChildren(0)
    setIncome1(''); setIncome2(''); setFiling('married')
    setK401Pct1('6'); setK401Pct2('6')
    setCurrentState('ny'); setCurrentCityId('nyc-ny')
    setTargetState('nc'); setTargetCityId('raleigh-nc')
    setHousingMode('rent'); setMonthlyRent(''); setRentersInsurance('20')
    setHomePrice(''); setDownPct('10'); setMortgageRate('6.75'); setTermYears('30'); setHoa('0')
    setMovingTruck('1500'); setSecurityDeposit(''); setFurnitureBudget('2000'); setMiscMoving('500')
    setCosts(getPrefillCosts(findCity('raleigh-nc'), 'couple', 0))
    setCostsManuallyEdited(false)
    setResults(null); setError('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  // ─── Save scenario ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    const scenarioUrl = buildScenarioUrl({
      householdType, adults, children,
      income1, income2, filing, k401Pct1, k401Pct2,
      currentState, currentCityId, targetState, targetCityId,
      housingMode, monthlyRent, rentersInsurance,
      homePrice, downPct, mortgageRate, termYears, hoa,
      movingTruck, securityDeposit, furnitureBudget, miscMoving,
    })

    const shareText = results
      ? `My relocation scenario: ${results.currentCityName} → ${results.targetCityName}.`
      : 'My relocation scenario from Relocation by Numbers.'

    const nav = typeof navigator !== 'undefined' ? navigator : null
    try {
      if (nav && 'share' in nav) {
        await (nav as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: 'My Relocation Scenario', text: shareText, url: scenarioUrl,
        })
        setSaveStatus('shared')
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(scenarioUrl)
        setSaveStatus('copied')
      } else {
        setSaveStatus('error')
      }
    } catch {
      try { await nav?.clipboard.writeText(scenarioUrl); setSaveStatus('copied') }
      catch { setSaveStatus('error') }
    }
    setTimeout(() => setSaveStatus('idle'), 2500)
  }

  // ─── Derived values ────────────────────────────────────────────────────────

  const currentCities = citiesForState(currentState)
  const targetCities  = citiesForState(targetState)
  const showIncome2   = householdType !== 'solo'

  // ─── Sub-components ────────────────────────────────────────────────────────

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500 mb-3">
      {children}
    </p>
  )

  const Divider = () => <div className="border-t border-slate-100 dark:border-slate-800 my-5" />

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Household</SectionLabel>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </div>

        {/* ── HOUSEHOLD ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel>Household type</FieldLabel>
            <select
              value={householdType}
              onChange={e => {
                const v = e.target.value as HouseholdType
                setHouseholdType(v)
                if (v === 'solo')   { setAdults(1); setChildren(0); setFiling('single') }
                if (v === 'couple') { setAdults(2); setChildren(0) }
                if (v === 'family') { setAdults(2); setChildren(1) }
              }}
              className={selectCls}
            >
              <option value="solo">Solo</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
            </select>
          </div>
          <div>
            <FieldLabel>Adults</FieldLabel>
            <input type="number" min={1} max={4} value={adults}
              onChange={e => setAdults(Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <FieldLabel>Children</FieldLabel>
            <input type="number" min={0} max={10} value={children}
              onChange={e => setChildren(Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        <Divider />

        {/* ── INCOME ── */}
        <SectionLabel>Income</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Income 1 (annual)</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="text" placeholder="95,000" value={income1}
                onChange={e => setIncome1(e.target.value)}
                className={`${inputCls} pl-6`} />
            </div>
          </div>

          {showIncome2 && (
            <div>
              <FieldLabel>Income 2 (annual, optional)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="text" placeholder="68,000" value={income2}
                  onChange={e => setIncome2(e.target.value)}
                  className={`${inputCls} pl-6`} />
              </div>
            </div>
          )}

          <div>
            <FieldLabel>Filing status</FieldLabel>
            <select value={filing} onChange={e => setFiling(e.target.value as FilingStatus)} className={selectCls}>
              <option value="married">Married filing jointly</option>
              <option value="single">Single</option>
            </select>
          </div>

          <div>
            <FieldLabel>401(k) contribution — Income 1</FieldLabel>
            <div className="relative">
              <input type="number" min={0} max={60} step={0.5} value={k401Pct1}
                onChange={e => setK401Pct1(e.target.value)}
                className={`${inputCls} pr-8`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>

          {showIncome2 && income2 && (
            <div>
              <FieldLabel>401(k) contribution — Income 2</FieldLabel>
              <div className="relative">
                <input type="number" min={0} max={60} step={0.5} value={k401Pct2}
                  onChange={e => setK401Pct2(e.target.value)}
                  className={`${inputCls} pr-8`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── LOCATIONS ── */}
        <SectionLabel>Locations</SectionLabel>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              Current location
            </p>
            <div>
              <FieldLabel>State</FieldLabel>
              <select value={currentState} onChange={e => handleCurrentStateChange(e.target.value as StateCode)} className={selectCls}>
                {STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>City (optional)</FieldLabel>
              <select value={currentCityId} onChange={e => setCurrentCityId(e.target.value)} className={selectCls}>
                {currentCities.map(c => (
                  <option key={c.id} value={c.id}>{cityLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              Target location
            </p>
            <div>
              <FieldLabel>State</FieldLabel>
              <select value={targetState} onChange={e => handleTargetStateChange(e.target.value as StateCode)} className={selectCls}>
                {STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>City (optional)</FieldLabel>
              <select value={targetCityId} onChange={e => setTargetCityId(e.target.value)} className={selectCls}>
                {targetCities.map(c => (
                  <option key={c.id} value={c.id}>{cityLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Divider />

        {/* ── HOUSING ── */}
        <SectionLabel>Housing in target city</SectionLabel>

        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit mb-4 bg-white dark:bg-slate-900">
          {(['rent', 'buy'] as HousingMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setHousingMode(mode)}
              className={`px-5 py-2 text-sm font-medium capitalize transition ${
                housingMode === mode
                  ? 'bg-violet-600 text-white shadow-[0_6px_18px_rgba(124,58,237,0.28)] ring-1 ring-violet-500/40'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {housingMode === 'rent' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Monthly rent</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="text" placeholder="1,579" value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)} className={`${inputCls} pl-6`} />
              </div>
            </div>
            <div>
              <FieldLabel>Renter's insurance / mo</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={rentersInsurance}
                  onChange={e => setRentersInsurance(e.target.value)} className={`${inputCls} pl-6`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel>Home price</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="text" placeholder="450,000" value={homePrice}
                  onChange={e => setHomePrice(e.target.value)} className={`${inputCls} pl-6`} />
              </div>
            </div>
            <div>
              <FieldLabel>Down payment</FieldLabel>
              <div className="relative">
                <input type="number" min={3} max={100} value={downPct}
                  onChange={e => setDownPct(e.target.value)} className={`${inputCls} pr-8`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <FieldLabel>Interest rate</FieldLabel>
              <div className="relative">
                <input type="number" min={0} step={0.125} value={mortgageRate}
                  onChange={e => setMortgageRate(e.target.value)} className={`${inputCls} pr-8`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <FieldLabel>Loan term (years)</FieldLabel>
              <select value={termYears} onChange={e => setTermYears(e.target.value)} className={selectCls}>
                <option value="30">30 years</option>
                <option value="20">20 years</option>
                <option value="15">15 years</option>
                <option value="10">10 years</option>
              </select>
            </div>
            <div>
              <FieldLabel>HOA / mo</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" min={0} value={hoa}
                  onChange={e => setHoa(e.target.value)} className={`${inputCls} pl-6`} />
              </div>
            </div>
            <div className="flex items-end">
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed pb-2">
                Property tax &amp; PMI auto-estimated from city data
              </p>
            </div>
          </div>
        )}

        <Divider />

        {/* ── ONE-TIME MOVING COSTS (FIX 1) ── */}
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>One-time moving costs</SectionLabel>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic -mt-3">
            Used to calculate your payback period
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Movers / truck</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min={0} value={movingTruck}
                onChange={e => setMovingTruck(e.target.value)} className={`${inputCls} pl-6`} />
            </div>
          </div>
          <div>
            <FieldLabel>Security deposit</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min={0} value={securityDeposit}
                placeholder="auto 2× rent"
                onChange={e => setSecurityDeposit(e.target.value)} className={`${inputCls} pl-6`} />
            </div>
          </div>
          <div>
            <FieldLabel>Furniture &amp; setup</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min={0} value={furnitureBudget}
                onChange={e => setFurnitureBudget(e.target.value)} className={`${inputCls} pl-6`} />
            </div>
          </div>
          <div>
            <FieldLabel>Misc (travel, storage)</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min={0} value={miscMoving}
                onChange={e => setMiscMoving(e.target.value)} className={`${inputCls} pl-6`} />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Total shown in results. Payback = how many months of monthly flexibility it takes to recover the upfront hit.
        </p>

        <Divider />

        {/* ── LIVING COSTS ── */}
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Monthly living costs</SectionLabel>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic -mt-3">
            Pre-filled from city averages — edit as needed
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { key: 'groceries',      label: 'Groceries' },
              { key: 'utilities',      label: 'Utilities' },
              { key: 'transportation', label: 'Transportation' },
              { key: 'healthcare',     label: 'Healthcare' },
              { key: 'childcare',      label: 'Childcare' },
              { key: 'miscellaneous',  label: 'Miscellaneous' },
            ] as { key: keyof LivingCosts; label: string }[]
          ).map(({ key, label }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number" min={0} value={costs[key]}
                  onChange={e => handleCostChange(key, e.target.value)}
                  className={`${inputCls} pl-6`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* CTA — FIX 4: sets shouldScroll flag instead of calling scroll directly */}
        <div className="mt-6">
          <button
            onClick={() => { calculate(); setShouldScroll(true) }}
            className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.99]"
          >
            See if this move works →
          </button>
          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
            Assumptions updated: March 2026 · Planning estimates only
          </p>
        </div>

        {/* ── RESULTS ── */}
        {results && (
          <div ref={resultsRef} className="space-y-4 scroll-mt-6 mt-6">

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Results — {results.currentCityName} → {results.targetCityName}
            </p>

            {/* Card 1: Verdict */}
            <div className={`rounded-2xl bg-white ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)] overflow-hidden border-t-4 ${verdictBorderColor(results.verdictOne)}`}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Can you afford this move?</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Based on your income, housing, and living costs in {results.targetCityName}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Verdicts consider both leftover cash and housing burden, so a move can still be rated Tight or Stretch even with some money left over.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">On one income</p>
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdictStyles(results.verdictOne)}`}>
                      {results.verdictOne}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Housing is {Math.round(results.housingBurdenOne)}% of take-home
                    </p>
                  </div>

                  {results.hasTwoIncomes ? (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">On two incomes</p>
                      <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdictStyles(results.verdictTwo)}`}>
                        {results.verdictTwo}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Housing is {Math.round(results.housingBurdenTwo)}% of take-home
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 flex items-center justify-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                        Enter a second income above<br />to see the two-income scenario
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 px-4 py-3 text-sm text-violet-800 dark:text-violet-300 leading-relaxed">
                  {results.insightMessage}
                </div>

                <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                  Based on estimated taxes and average costs — adjust inputs above for your exact situation.
                </p>
              </div>
            </div>

            {/* Cards 2 + 3: Flexibility & Housing Pressure */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Monthly Flexibility */}
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly flexibility</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">One income</p>
                    <p className={`text-2xl font-semibold ${results.flexibilityOne < 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {fmt(results.flexibilityOne)}
                      <span className="text-sm font-normal text-slate-400 dark:text-slate-500"> left/mo</span>
                    </p>
                  </div>
                  {results.hasTwoIncomes && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Two incomes</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {fmt(results.flexibilityTwo)}
                        <span className="text-sm font-normal text-slate-400 dark:text-slate-500"> left/mo</span>
                      </p>
                      {results.flexibilityTwo > results.flexibilityOne && (
                        <span className="inline-block mt-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2.5 py-0.5">
                          +{fmt(results.flexibilityTwo - results.flexibilityOne)}/month with second income
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Housing Pressure */}
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Housing pressure</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">% of take-home pay going to housing</p>
                <div className="space-y-3">
                  {[
                    { label: 'One income',  pct: results.housingBurdenOne, color: results.housingBurdenOne  > 40 ? 'bg-red-500' : results.housingBurdenOne  > 30 ? 'bg-amber-500' : 'bg-emerald-500' },
                    ...(results.hasTwoIncomes ? [{ label: 'Two incomes', pct: results.housingBurdenTwo, color: results.housingBurdenTwo > 40 ? 'bg-red-500' : results.housingBurdenTwo > 30 ? 'bg-amber-500' : 'bg-violet-600' }] : []),
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <span className="min-w-[88px] text-xs text-slate-500 dark:text-slate-400">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[32px] text-right">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {[['Safe', '< 30%'], ['Tight', '30–40%'], ['Stretch', '> 40%']].map(([label, range]) => (
                    <div key={label} className="flex gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="min-w-[44px] font-medium">{label}</span>
                      <span>{range} of take-home</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card NEW: Money Flow Bar (FIX 2) */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Where your money goes — one income
                </h3>
              </div>
              <MoneyFlowBar
                grossMonthly={results.grossMonthlyOne}
                taxes={results.taxesOne / 12}
                housing={results.housingCost}
                living={results.totalLiving}
                flexibility={results.flexibilityOne}
              />
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Bar shows each category as a share of gross monthly income ({fmt(results.grossMonthlyOne)}/mo).
              </p>
            </div>

            {/* Card NEW: One-time moving costs (FIX 1) */}
            {results.totalMovingCost > 0 && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)] border-l-4 border-amber-400">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">The moving tax</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  The upfront cash hit before your new budget rhythm begins
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard
                    label="Total one-time costs"
                    value={fmt(results.totalMovingCost)}
                    sub="movers, deposit, furnishing, misc"
                  />
                  <StatCard
                    label="Payback period"
                    value={
                      results.monthsToPayBack === null
                        ? 'Never (budget is negative)'
                        : results.monthsToPayBack <= 1
                        ? '< 1 month'
                        : `${results.monthsToPayBack} months`
                    }
                    sub={
                      results.monthsToPayBack === null
                        ? 'Improve flexibility first'
                        : `at ${fmt(results.hasTwoIncomes ? results.flexibilityTwo : results.flexibilityOne)}/mo surplus`
                    }
                  />
                  <StatCard
                    label="Savings needed before moving"
                    value={fmt(results.totalMovingCost)}
                    sub="have this liquid before you give notice"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Payback = how many months of monthly flexibility it takes to recover the upfront cash. Does not include down payment if buying.
                </p>
              </div>
            )}

            {/* Card 4: Minimum second income */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)] border-l-4 border-violet-500">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Minimum second income needed — {results.targetCityName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                To make this move financially workable on a combined income
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                  label="To cover all monthly expenses"
                  value={results.minIncomeForCashflow === 0 ? 'Already covered' : `${fmtK(results.minIncomeForCashflow)} / yr`}
                  sub={results.minIncomeForCashflow === 0 ? 'One income is enough' : 'breaks even on monthly cash flow'}
                />
                <StatCard
                  label="To stay under 30% housing burden"
                  value={results.minIncomeFor30Pct === 0 ? 'Already met' : `${fmtK(results.minIncomeFor30Pct)} / yr`}
                  sub={results.minIncomeFor30Pct === 0 ? 'Housing is already under 30%' : 'comfortable affordability threshold'}
                />
              </div>
            </div>

            {/* Card 5: Net income breakdown */}
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Net income breakdown — {results.targetCityName}
                </h3>
              </div>

              {/* FIX 3: Sales tax note surfaces here */}
              {results.salesTaxNote && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <span className="font-semibold">Sales tax purchasing power: </span>
                  {results.salesTaxNote}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Net monthly — one income"  value={fmt(results.netMonthlyOne)}  sub="after tax & 401(k)" />
                {results.hasTwoIncomes && (
                  <StatCard label="Net monthly — two incomes" value={fmt(results.netMonthlyTwo)} sub="after tax & 401(k)" />
                )}
                <StatCard label="Est. taxes — one income" value={fmt(results.taxesOne / 12)} sub="federal + state / mo" />
                <StatCard label="Housing cost / mo" value={fmt(results.housingCost)} sub={housingMode === 'rent' ? 'rent + insurance' : 'mortgage + tax + ins'} />
                <StatCard label="Total living costs" value={fmt(results.totalLiving)} sub="groceries, transport, etc." />
                <StatCard label="Total monthly expenses" value={fmt(results.housingCost + results.totalLiving)} sub="housing + living costs" />
              </div>
            </div>

            {/* Save scenario */}
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-sky-900/40 dark:bg-sky-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                    Save your scenario
                  </div>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Copy this link to reopen the exact same setup later.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {saveStatus === 'copied' ? 'Link copied!' :
                   saveStatus === 'shared' ? 'Shared!' :
                   saveStatus === 'error'  ? 'Save failed' :
                   'Save scenario'}
                </button>
              </div>
            </div>

            {/* Dynamic city link */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Want the full picture?{' '}
                <a
                  href={`/cost-of-living/${results.targetCitySlug}`}
                  className="font-medium text-violet-600 underline underline-offset-2 hover:no-underline dark:text-violet-400"
                >
                  See full cost of living data for {results.targetCityName} →
                </a>
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-600">
              Planning estimates only · Tax figures based on 2025 brackets · Not financial advice
            </p>

          </div>
        )}

      </div>
    </div>
  )
}