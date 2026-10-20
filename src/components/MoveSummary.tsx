'use client'

import type { MoveResult } from '@/lib/relocationMove'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const ESTIMATE_LABELS: Record<string, string> = {
  currentHousing: 'Current rent or mortgage',
  targetHousing: 'Housing in the new city',
  currentLiving: 'Current other living costs',
  targetLiving: 'Living costs in the new city',
  movers: 'Movers or truck',
  travel: 'Travel and storage',
  setup: 'Furniture and setup',
  leaseBreak: 'Lease break fee',
  fees: 'Fees not returned',
  refundableDeposit: 'Security deposit',
}

/** Input ids used by the one-income calculator. */
export const MOVE_INPUT_IDS: Record<string, string> = {
  currentHousing: 'in-curHousing', targetHousing: 'in-rent', currentLiving: 'in-curLiving',
  targetLiving: 'in-cost-groceries', movers: 'in-movers', travel: 'in-travel', setup: 'in-setup',
  leaseBreak: 'in-leaseBreak', fees: 'in-fees', refundableDeposit: 'in-deposit',
}


const signed = (n: number) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n))

export default function MoveSummary({
  move, fromName, toName, hasCurrentIncome, inputIds, fireHref, retirementHref, buying = false,
}: {
  move: MoveResult
  fromName: string
  toName: string
  hasCurrentIncome: boolean
  /** DOM ids of the inputs for each estimated figure, so "enter yours" can jump to them. */
  inputIds: Record<string, string>
  /** Link to the FIRE calculator prefilled with this move. */
  fireHref?: string
  /** Link to the retirement-state tax view for the two states. */
  retirementHref?: string
  /** True when the move is a home purchase: the cash then is a down payment, closing costs and moving expenses, not a rental deposit. */
  buying?: boolean
}) {
  const e = move.expected
  const rows = [
    { label: 'Pay (after tax, current-location taxes)', value: move.breakdown.salary },
    { label: 'Taxes from changing location',             value: move.breakdown.taxes },
    { label: 'Housing',                                  value: move.breakdown.housing },
    { label: 'Other living costs',                       value: move.breakdown.otherCosts },
  ]
  const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.value)))
  const goodText = 'text-emerald-600 dark:text-emerald-400'
  const badText = 'text-red-600 dark:text-red-400'
  const tone = (n: number) => (n >= 0 ? goodText : badText)
  const recover = (m: number | null) => (m === null ? 'never' : m === 0 ? 'none needed' : m > 36 ? 'over 3 years' : `${m} mo`)
  const estimated = move.estimatedItems.filter(k => ESTIMATE_LABELS[k] && inputIds[k])

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.08)] overflow-hidden border-t-4 border-violet-500">
      <div className="p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Is your household better off after this move?
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {fromName} → {toName}, comparing what you keep each month now and after the move.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Monthly change</p>
            <p className={`mt-1 whitespace-nowrap text-xl font-semibold tabular-nums sm:text-2xl ${tone(e.monthlyChange)}`}>{signed(e.monthlyChange)}</p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Range {signed(move.low.monthlyChange)} to {signed(move.high.monthlyChange)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">First-year impact</p>
            <p className={`mt-1 whitespace-nowrap text-xl font-semibold tabular-nums sm:text-2xl ${tone(e.firstYearImpact)}`}>{signed(e.firstYearImpact)}</p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">12 months of change minus {fmt(e.spentOneTime)} spent. Range {signed(move.low.firstYearImpact)} to {signed(move.high.firstYearImpact)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Cash needed upfront</p>
            <p className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums sm:text-2xl text-slate-900 dark:text-white">{fmt(e.cashUpfront)}</p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{buying ? 'Down payment (it becomes home equity), closing costs and moving expenses. Range' : 'Includes a refundable deposit. Range'} {fmt(move.high.cashUpfront)} to {fmt(move.low.cashUpfront)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Time to earn back the cost</p>
            <p className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums sm:text-2xl text-slate-900 dark:text-white">{recover(e.monthsToRecover)}</p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Best case {recover(move.high.monthsToRecover)}, worst case {recover(move.low.monthsToRecover)}</p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-slate-900 dark:text-white">Why it changes, per month</h3>
        <div className="mt-3 space-y-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-2 text-sm">
              <span className="w-44 shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:w-64">{r.label}</span>
              <div className="relative h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600" />
                <div
                  className={`absolute inset-y-0 rounded-full ${r.value >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={r.value >= 0
                    ? { left: '50%', width: `${(Math.abs(r.value) / maxAbs) * 50}%` }
                    : { right: '50%', width: `${(Math.abs(r.value) / maxAbs) * 50}%` }}
                />
              </div>
              <span className={`w-20 shrink-0 text-right text-xs font-semibold ${tone(r.value)}`}>{signed(r.value)}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-2 text-sm dark:border-slate-800">
            <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300">Total monthly change</span>
            <span className={`w-20 shrink-0 text-right text-xs font-semibold ${tone(e.monthlyChange)}`}>{signed(e.monthlyChange)}</span>
          </div>
        </div>
        {!hasCurrentIncome && (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            No separate current income entered, so pay is assumed unchanged. Enter your current salary in the field above to include a raise or pay cut.
          </p>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="py-1 font-medium">Per month</th>
                <th className="py-1 text-right font-medium">Now</th>
                <th className="py-1 text-right font-medium">After the move</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr><td className="py-1">Take-home pay</td><td className="py-1 text-right">{fmt(move.currentNetMonthly)}</td><td className="py-1 text-right">{fmt(move.offerNetMonthly)}</td></tr>
              <tr><td className="py-1">Left over after housing and other costs</td><td className="py-1 text-right">{fmt(move.currentLeftover)}</td><td className="py-1 text-right">{fmt(move.targetLeftover)}</td></tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
          The range changes only figures this site estimated: housing by 10%, living costs by 15% and one-time costs by 25%, in the worse direction for the low end and the better direction for the high end. Figures you typed do not move. These spreads are planning assumptions.
        </p>

        {(fireHref || retirementHref) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {fireHref && (
              <a
                href={fireHref}
                className="inline-flex items-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                See your FIRE number after this move →
              </a>
            )}
            {retirementHref && (
              <a
                href={retirementHref}
                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                How would retirement income be taxed there? →
              </a>
            )}
          </div>
        )}

        {estimated.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <p className="font-semibold">Estimated by this site, not entered by you</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {estimated.map(k => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(inputIds[k])
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      ;(el as HTMLInputElement | null)?.focus()
                    }}
                    className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-300 hover:bg-amber-100 dark:bg-slate-900 dark:ring-amber-800"
                  >
                    {ESTIMATE_LABELS[k]}: enter yours
                  </button>
                </li>
              ))}
            </ul>
            {move.estimatedItems.some(k => (k === 'currentLiving' || k === 'targetLiving') && !inputIds[k]) && (
              <p className="mt-2">
                Living costs in both cities are also estimates. Enter your own in the living-cost fields above to replace the new city&apos;s.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
