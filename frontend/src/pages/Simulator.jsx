import { useState } from 'react'
import { FlaskConical, TrendingUp, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { SimulationBarChart } from '../components/Charts'
import { simulate } from '../api'

function RiskTransitionArrow({ from, to }) {
  return (
    <div className="flex items-center gap-3 justify-center py-4 bg-muted/40 rounded-xl border border-border my-3">
      <RiskBadge tier={from} />
      <ArrowRight size={18} className="text-muted-foreground" />
      <RiskBadge tier={to} />
    </div>
  )
}

export default function Simulator({ cities }) {
  const [city, setCity] = useState('')
  const [currentNRW, setCurrentNRW] = useState(20)
  const [targetNRW, setTargetNRW] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSim(e) {
    e.preventDefault()
    if (!city.trim()) { setError('Select a city'); return }
    if (targetNRW >= currentNRW) { setError('Target NRW must be less than current NRW'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await simulate({
        city,
        current_nrw_loss_pct: currentNRW,
        target_nrw_loss_pct: targetNRW,
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const bl = result?.baseline
  const sr = result?.simulation_results

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Control panel */}
      <div className="lg:col-span-2">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <FlaskConical size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-sans">What-If Simulator</h2>
              <p className="text-xs text-muted-foreground">NRW Leakage Reduction Scenarios</p>
            </div>
          </div>

          <form onSubmit={handleSim} className="space-y-6">
            {/* City picker */}
            <div>
              <label htmlFor="sim-city" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Target City
              </label>
              <input
                id="sim-city"
                type="text"
                list="sim-city-list"
                placeholder="Select a city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                required
              />
              <datalist id="sim-city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </div>

            {/* Current NRW */}
            <div>
              <label htmlFor="current-nrw" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Current NRW Loss</span>
                <span className="text-amber-500 font-mono font-bold">{currentNRW}%</span>
              </label>
              <input
                id="current-nrw"
                type="range" min={1} max={60} step={0.5}
                value={currentNRW}
                onChange={(e) => { setCurrentNRW(+e.target.value); if (+e.target.value <= targetNRW) setTargetNRW(+e.target.value - 1) }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                <span>1%</span><span>60%</span>
              </div>
            </div>

            {/* Target NRW */}
            <div>
              <label htmlFor="target-nrw" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Target NRW Goal</span>
                <span className="text-emerald-500 font-mono font-bold">{targetNRW}%</span>
              </label>
              <input
                id="target-nrw"
                type="range" min={0} max={Math.max(currentNRW - 1, 1)} step={0.5}
                value={targetNRW}
                onChange={(e) => setTargetNRW(+e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                <span>0%</span><span>{Math.max(currentNRW - 1, 1)}%</span>
              </div>
            </div>

            {/* Reduction preview */}
            <div className="glass-panel p-4 text-center border-purple-500/20 bg-purple-500/5">
              <p className="text-xs text-muted-foreground font-medium mb-1">Target Reduction</p>
              <p className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                {(currentNRW - targetNRW).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">water loss recovered</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button
              id="simulate-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-purple-600 dark:bg-purple-500 text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Simulating Scenario…</> : <><TrendingUp size={16} /> Run Simulation</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-5">
        {!result && !loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center min-h-[440px]">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-500 animate-float">
              <FlaskConical size={28} />
            </div>
            <p className="text-foreground font-semibold text-base">Configure NRW loss reduction targets</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">Simulate how reducing non-revenue water loss increases effective municipal supply and mitigates risk.</p>
          </div>
        )}

        {result && bl && sr && (
          <>
            {/* Impact summary */}
            <div className="glass-panel p-6 border-purple-500/20 bg-purple-500/5">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Scenario Impact Summary</p>
              <p className="text-foreground text-sm leading-relaxed">{result.impact_summary}</p>
              <RiskTransitionArrow from={bl.initial_risk_tier} to={sr.new_risk_tier} />
            </div>

            {/* Before / After cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Before */}
              <div className="glass-panel p-5 border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Baseline (Current)</p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Supply</span>
                    <span className="font-semibold font-mono text-foreground">{bl.current_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NRW Loss</span>
                    <span className="font-semibold font-mono text-amber-500">{bl.current_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shortage Volume</span>
                    <span className="font-semibold font-mono text-destructive">{bl.initial_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shortage %</span>
                    <span className="font-semibold font-mono text-destructive">{bl.initial_shortage_pct}%</span>
                  </div>
                  <div className="pt-2 border-t border-border/50"><RiskBadge tier={bl.initial_risk_tier} /></div>
                </div>
              </div>

              {/* After */}
              <div className="glass-panel p-5 border-emerald-500/30 bg-emerald-500/5">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Simulated Outcome</p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Supply</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{sr.improved_effective_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target NRW</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{sr.target_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shortage Volume</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{sr.new_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shortage %</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{sr.new_shortage_pct}%</span>
                  </div>
                  <div className="pt-2 border-t border-border/50"><RiskBadge tier={sr.new_risk_tier} /></div>
                </div>
              </div>
            </div>

            {/* Water saved highlight */}
            <div className="glass-panel p-6 text-center border-primary/20 bg-primary/5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Water Recovered</p>
              <p className="text-4xl sm:text-5xl font-extrabold font-mono text-primary tabular-nums">
                {sr.water_saved_mld}
              </p>
              <p className="text-foreground text-sm font-medium mt-1">Million Litres / Day Recovered</p>
              <p className="text-xs text-muted-foreground mt-2">
                Shortage reduced by {sr.shortage_reduction_pct_points} percentage points
              </p>
            </div>

            {/* Bar comparison chart */}
            <div className="chart-container">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Supply vs Shortage — Before & After Comparison</p>
              <SimulationBarChart baseline={bl} result={sr} height={110} />
            </div>

            <p className="text-xs text-muted-foreground text-center">{result.simulation_disclaimer}</p>
          </>
        )}
      </div>
    </div>
  )
}

