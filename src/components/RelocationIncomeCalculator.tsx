'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { STATES, type StateCode } from '@/lib/states'
import { citiesForState, findCity, type City } from '@/lib/cities'
import { estimateNetAnnual, type FilingStatus } from '@/lib/tax'

// ─── Types ───────────────────────────────────────────────────────────────────

type HousingMode = 'rent' | 'buy'
type HouseholdType = 'solo' | 'couple' | 'family'
type Verdict = 'Safe' | 'Tight' | 'Stretch'

interface LivingCosts {
  groceries: number
  utilities: number
  transportation: number
  healthcare: number
  childcare: number
  miscellaneous: number
}

interface Results {
  netMonthlyOne: number
  netMonthlyTwo: number
  housingCost: number
  totalLiving: number
  flexibilityOne: number
  flexibilityTwo: number
  housingBurdenOne: number
  housingBurdenTwo: number
  verdictOne: Verdict
  verdictTwo: Verdict
  minIncomeForCashflow: number
  minIncomeFor30Pct: number
  taxesOne: number
  taxesTwo: number
  insightMessage: string
  targetCityName: string
  currentCityName: string
  hasTwoIncomes: boolean
}

// ─── Base COL (national monthly averages) ────────────────────────────────────

const BASE_COL = {
  solo:   { groceries: 380, utilities: 140, transportation: 280, healthcare: 200, childcare: 0,    miscellaneous: 280 },
  couple: { groceries: 650, utilities: 165, transportation: 480, healthcare: 350, childcare: 0,    miscellaneous: 400 },
  family: { groceries: 800, utilities: 185, transportation: 520, healthcare: 420, childcare: 1000, miscellaneous: 480 },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtK = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : fmt(n)

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
  if (v === 'Safe') return 'border-emerald-400 dark:border-emerald-700'
  if (v === 'Tight') return 'border-amber-400 dark:border-amber-700'
  return 'border-red-400 dark:border-red-700'
}

function estimateCombinedNet(
  income1: number,
  income2: number,
  state: StateCode,
  filing: FilingStatus,
  k401Pct1: number,
  k401Pct2: number,
  cityId: string,
): number {
  if (income2 === 0) {
    return estimateNetAnnual({ grossAnnual: income1, state, filing, k401Pct: k401Pct1, cityId })
  }
  if (filing === 'married') {
    // Combine for MFJ; handle dual 401k caps per person
    const k401_1 = Math.min(income1 * (k401Pct1 / 100), 23_000)
    const k401_2 = Math.min(income2 * (k401Pct2 / 100), 23_000)
    const combined = income1 + income2
    const effectiveK401Pct = combined > 0 ? ((k401_1 + k401_2) / combined) * 100 : 0
    return estimateNetAnnual({ grossAnnual: combined, state, filing: 'married', k401Pct: effectiveK401Pct, cityId })
  }
  // Non-married: sum separately
  const net1 = estimateNetAnnual({ grossAnnual: income1, state, filing: 'single', k401Pct: k401Pct1, cityId })
  const net2 = estimateNetAnnual({ grossAnnual: income2, state, filing: 'single', k401Pct: k401Pct2, cityId })
  return net1 + net2
}

function findMinIncome2(
  income1: number,
  state: StateCode,
  filing: FilingStatus,
  k401Pct1: number,
  k401Pct2: number,
  cityId: string,
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
  const col = city?.col
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

// ─── Label + Input primitives ─────────────────────────────────────────────────

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

// ─── Result stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelocationIncomeCalculator() {
  const resultsRef = useRef<HTMLDivElement>(null)

  // — Household
  const [householdType, setHouseholdType] = useState<HouseholdType>('couple')
  const [adults,   setAdults]   = useState(2)
  const [children, setChildren] = useState(0)

  // — Income
  const [income1,   setIncome1]   = useState('')
  const [income2,   setIncome2]   = useState('')
  const [filing,    setFiling]    = useState<FilingStatus>('married')
  const [k401Pct1,  setK401Pct1]  = useState('6')
  const [k401Pct2,  setK401Pct2]  = useState('6')

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
  const [mortgageRate,     setMortgageRate]      = useState('6.75')
  const [termYears,        setTermYears]         = useState('30')
  const [hoa,              setHoa]               = useState('0')

  // — Living costs
  const [costs, setCosts] = useState<LivingCosts>(() =>
    getPrefillCosts(findCity('raleigh-nc'), 'couple', 0)
  )
  const [costsManuallyEdited, setCostsManuallyEdited] = useState(false)

  // — Results
  const [results, setResults] = useState<Results | null>(null)
  const [error,   setError]   = useState('')
  const [saveStatus, setSaveStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  // — FAQ open state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Auto-update rent + home price when target city changes
  useEffect(() => {
    const city = findCity(targetCityId)
    if (city?.defaultRent)     setMonthlyRent(String(city.defaultRent))
    if (city?.medianHomePrice) setHomePrice(String(city.medianHomePrice))
  }, [targetCityId])

  // Auto-prefill living costs when city / household changes (unless manually edited)
  useEffect(() => {
    if (costsManuallyEdited) return
    const city = findCity(targetCityId)
    setCosts(getPrefillCosts(city, householdType, children))
  }, [targetCityId, householdType, children, costsManuallyEdited])

  // Reset manual-edit flag when city changes
  useEffect(() => { setCostsManuallyEdited(false) }, [targetCityId])

  // — State change → reset city to first in state
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

  // ─── Calculate ──────────────────────────────────────────────────────────────

  const calculate = useCallback(() => {
    setError('')

    const i1 = parseFloat(income1.replace(/,/g, '')) || 0
    const i2 = parseFloat(income2.replace(/,/g, '')) || 0
    const k1 = parseFloat(k401Pct1) || 0
    const k2 = parseFloat(k401Pct2) || 0

    if (i1 === 0) { setError('Please enter at least one income to calculate.'); return }

    const targetCity  = findCity(targetCityId)
    const currentCity = findCity(currentCityId)

    // Housing cost/month
    let housingCost = 0
    if (housingMode === 'rent') {
      housingCost = (parseFloat(monthlyRent) || 0) + (parseFloat(rentersInsurance) || 0)
    } else {
      const hp   = parseFloat(homePrice) || 0
      const dp   = parseFloat(downPct)   || 10
      const rate = parseFloat(mortgageRate) || 6.75
      const term = parseInt(termYears)   || 30
      const ptax = ((targetCity?.propertyTaxPct ?? 1) / 100) * hp / 12
      const ins  = (hp * 0.006) / 12
      const loanAmt = hp * (1 - dp / 100)
      const pmi     = (loanAmt / hp) > 0.8 ? (loanAmt * 0.008) / 12 : 0
      housingCost   = calcMortgagePI(hp, dp, rate, term) + ptax + ins + pmi + (parseFloat(hoa) || 0)
    }

    const totalLiving = Object.values(costs).reduce((a, b) => a + b, 0)

    // Net monthly
    const annualNetOne = estimateNetAnnual({ grossAnnual: i1, state: targetState, filing, k401Pct: k1, cityId: targetCityId })
    const netMonthlyOne = annualNetOne / 12

    const annualNetTwo = estimateCombinedNet(i1, i2, targetState, filing, k1, k2, targetCityId)
    const netMonthlyTwo = annualNetTwo / 12

    // Flexibility
    const flexOne = netMonthlyOne - housingCost - totalLiving
    const flexTwo = netMonthlyTwo - housingCost - totalLiving

    // Housing burden %
    const burdenOne = netMonthlyOne > 0 ? (housingCost / netMonthlyOne) * 100 : 100
    const burdenTwo = netMonthlyTwo > 0 ? (housingCost / netMonthlyTwo) * 100 : 100

    const verdictOne = getVerdict(burdenOne, flexOne)
    const verdictTwo = getVerdict(burdenTwo, flexTwo)

    // Taxes (approx)
    const k401_1 = Math.min(i1 * (k1 / 100), 23_000)
    const k401_2 = Math.min(i2 * (k2 / 100), 23_000)
    const taxesOne = Math.max(0, i1 - k401_1 - annualNetOne)
    const taxesTwo = Math.max(0, (i1 + i2) - k401_1 - k401_2 - annualNetTwo)

    // Min second income needed
    const breakEvenNet = housingCost + totalLiving
    const target30Net  = housingCost / 0.30

    const minForCashflow = findMinIncome2(i1, targetState, filing, k1, k2, targetCityId, breakEvenNet)
    const minFor30Pct    = findMinIncome2(i1, targetState, filing, k1, k2, targetCityId, target30Net)

    // Insight message
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
      insightMessage,
      targetCityName:  targetCity?.name  ?? targetState.toUpperCase(),
      currentCityName: currentCity?.name ?? currentState.toUpperCase(),
      hasTwoIncomes: i2 > 0,
    })

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }, [
    income1, income2, filing, k401Pct1, k401Pct2,
    currentState, currentCityId, targetState, targetCityId,
    housingMode, monthlyRent, rentersInsurance,
    homePrice, downPct, mortgageRate, termYears, hoa,
    costs,
  ])

  // ─── Derived lists ───────────────────────────────────────────────────────────

  const currentCities = citiesForState(currentState)
  const targetCities  = citiesForState(targetState)
  const showIncome2   = householdType !== 'solo'

  // ─── Section header ──────────────────────────────────────────────────────────

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500 mb-3">
      {children}
    </p>
  )

  const Divider = () => <div className="border-t border-slate-100 dark:border-slate-800 my-5" />

  // ─── Render ──────────────────────────────────────────────────────────────────

 return (
  <div className="space-y-6">
    <div className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between mb-4">
        


      {/* ── CALCULATOR CARD ── */}

  <SectionLabel>Household</SectionLabel>
  <button
    type="button"
    onClick={() => {
      setHouseholdType('couple')
      setAdults(2)
      setChildren(0)

      setIncome1('')
      setIncome2('')
      setFiling('married')
      setK401Pct1('6')
      setK401Pct2('6')

      setCurrentState('ny')
      setCurrentCityId('nyc-ny')
      setTargetState('nc')
      setTargetCityId('raleigh-nc')

      setHousingMode('rent')
      setMonthlyRent('')
      setRentersInsurance('20')
      setHomePrice('')
      setDownPct('10')
      setMortgageRate('6.75')
      setTermYears('30')
      setHoa('0')

      setCosts(getPrefillCosts(findCity('raleigh-nc'), 'couple', 0))
      setCostsManuallyEdited(false)

      setResults(null)
      setError('')
    }}
    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
  >
    Reset
  </button>
</div>
        {/* HOUSEHOLD */}
      
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel>Household type</FieldLabel>
            <select
              value={householdType}
              onChange={e => {
                const v = e.target.value as HouseholdType
                setHouseholdType(v)
                if (v === 'solo') { setAdults(1); setChildren(0); setFiling('single') }
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
              onChange={e => setAdults(Number(e.target.value))}
              className={inputCls} />
          </div>
          <div>
            <FieldLabel>Children</FieldLabel>
            <input type="number" min={0} max={10} value={children}
              onChange={e => setChildren(Number(e.target.value))}
              className={inputCls} />
          </div>
        </div>

        <Divider />

        {/* INCOME */}
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

        {/* LOCATIONS */}
        <SectionLabel>Locations</SectionLabel>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Current */}
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
          {/* Target */}
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

        {/* HOUSING */}
        <SectionLabel>Housing in target city</SectionLabel>

        {/* Toggle */}
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {/* LIVING COSTS */}
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Monthly living costs</SectionLabel>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic -mt-3">
            Pre-filled from city averages — edit as needed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        {/* CTA */}
       <div className="mt-6">
  <button
    onClick={calculate}
    className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.99]"
  >
    Calculate affordability →
  </button>

  <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
    Assumptions updated: March 2026 · Planning estimates only
  </p>
</div>

      {/* ── RESULTS ── */}
      {results && (
        <div ref={resultsRef} className="space-y-4 scroll-mt-6">

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
<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
  Verdicts consider both leftover cash and housing burden, so a move can still be rated Tight or Stretch even with some money left over.
</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* One income */}
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">On one income</p>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdictStyles(results.verdictOne)}`}>
                    {results.verdictOne}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Housing is {Math.round(results.housingBurdenOne)}% of take-home
                  </p>
                </div>
                {/* Two incomes */}
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
                  { label: 'One income', pct: results.housingBurdenOne, color: results.housingBurdenOne > 40 ? 'bg-red-500' : results.housingBurdenOne > 30 ? 'bg-amber-500' : 'bg-emerald-500' },
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

          {/* Card 4: Minimum second income needed */}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-sky-900/40 dark:bg-sky-950/20">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
        Save your scenario
      </div>
      <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        Copy this calculator link and reopen the exact same setup later.
      </div>
    </div>

    <button
      type="button"
      onClick={async () => {
        try {
          const saveUrl = new URL(window.location.href)

          const saveText =
            results
              ? `My relocation scenario: ${results.currentCityName} → ${results.targetCityName}.`
              : "My relocation scenario from Relocation by Numbers."

          const canNativeShare =
            typeof navigator !== "undefined" && "share" in navigator

          if (canNativeShare) {
            await (navigator as Navigator & {
              share: (data: {
                title?: string
                text?: string
                url?: string
              }) => Promise<void>
            }).share({
              title: "My Relocation Scenario",
              text: saveText,
              url: saveUrl.toString(),
            })
            setSaveStatus("shared")
          } else {
            await navigator.clipboard.writeText(saveUrl.toString())
            setSaveStatus("copied")
          }

          window.setTimeout(() => setSaveStatus("idle"), 2500)
        } catch (err) {
          console.error("Save/share failed", err)

          try {
            await navigator.clipboard.writeText(window.location.href)
            setSaveStatus("copied")
            window.setTimeout(() => setSaveStatus("idle"), 2500)
          } catch (clipboardErr) {
            console.error("Clipboard failed", clipboardErr)
            setSaveStatus("error")
            window.setTimeout(() => setSaveStatus("idle"), 2500)
          }
        }
      }}
      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
    >
      {saveStatus === "copied"
        ? "Link copied!"
        : saveStatus === "shared"
          ? "Shared!"
          : saveStatus === "error"
            ? "Save failed"
            : "Save scenario"}
    </button>
  </div>
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
