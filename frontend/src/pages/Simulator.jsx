import { useState } from 'react'
import { FlaskConical, TrendingUp, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { SimulationBarChart } from '../components/Charts'
import { simulate } from '../api'

function RiskTransitionArrow({ from, to }) {
  return (
    <div className="flex items-center gap-2 justify-center py-2.5 bg-muted rounded border border-border my-2.5">
      <RiskBadge tier={from} />
      <ArrowRight size={14} className="text-muted-foreground" />
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
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Control panel */}
      <div className="lg:col-span-2">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FlaskConical size={14} />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-foreground">NRW Scenario Simulator</h2>
              <p className="text-xs font-sans text-muted-foreground">Distribution loss mitigation modeling</p>
            </div>
          </div>

          <form onSubmit={handleSim} className="space-y-4">
            {/* City picker */}
            <div>
              <label htmlFor="sim-city" className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Target Urban Center
              </label>
              <input
                id="sim-city"
                type="text"
                list="sim-city-list"
                placeholder="Select urban center…"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
              <datalist id="sim-city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </div>

            {/* Current NRW */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <span>Baseline NRW Loss</span>
                <span className="text-amber-500 font-mono font-bold tabular-nums">{currentNRW}%</span>
              </div>
              <input
                id="current-nrw"
                type="range" min={1} max={60} step={0.5}
                value={currentNRW}
                onChange={(e) => { setCurrentNRW(+e.target.value); if (+e.target.value <= targetNRW) setTargetNRW(+e.target.value - 1) }}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono tabular-nums mt-0.5">
                <span>1%</span><span>60%</span>
              </div>
            </div>

            {/* Target NRW */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <span>Target NRW Loss</span>
                <span className="text-emerald-500 font-mono font-bold tabular-nums">{targetNRW}%</span>
              </div>
              <input
                id="target-nrw"
                type="range" min={0} max={Math.max(currentNRW - 1, 1)} step={0.5}
                value={targetNRW}
                onChange={(e) => setTargetNRW(+e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono tabular-nums mt-0.5">
                <span>0%</span><span>{Math.max(currentNRW - 1, 1)}%</span>
              </div>
            </div>

            {/* Reduction preview badge */}
            <div className="p-3 rounded border border-primary/20 bg-primary/5 text-center">
              <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block">Target Loss Reduction</span>
              <span className="text-xl font-bold font-mono text-primary tabular-nums">
                -{(currentNRW - targetNRW).toFixed(1)}%
              </span>
              <span className="text-xs font-sans text-muted-foreground block mt-0.5">recoverable distribution loss</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-sans font-medium">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              id="simulate-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-sans font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> SIMULATING…</> : <><TrendingUp size={14} /> RUN SCENARIO SIMULATION</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-4">
        {!result && !loading && (
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <FlaskConical size={22} />
            </div>
            <p className="text-foreground font-display font-bold text-sm">Awaiting Scenario Configuration</p>
            <p className="text-muted-foreground text-xs sm:text-[13px] font-sans mt-1 max-w-sm leading-relaxed">Adjust baseline and target NRW leakage parameters on the left to project net municipal water recovery and risk tier reduction.</p>
          </div>
        )}

        {result && bl && sr && (
          <>
            {/* Impact summary */}
            <div className="glass-panel p-4 border-primary/25 bg-primary/5">
              <span className="text-[11px] font-sans font-semibold text-primary uppercase tracking-wider block mb-1">Scenario Diagnostics</span>
              <p className="text-xs text-foreground leading-relaxed font-sans">{result.impact_summary}</p>
              <RiskTransitionArrow from={bl.initial_risk_tier} to={sr.new_risk_tier} />
            </div>

            {/* Before / After cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Before */}
              <div className="glass-panel p-3.5 border-border">
                <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Baseline Status</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Supply</span>
                    <span className="font-mono tabular-nums font-semibold text-foreground">{bl.current_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">NRW Loss</span>
                    <span className="font-mono tabular-nums font-semibold text-amber-500">{bl.current_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Deficit</span>
                    <span className="font-mono tabular-nums font-semibold text-destructive">{bl.initial_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Deficit %</span>
                    <span className="font-mono tabular-nums font-semibold text-destructive">{bl.initial_shortage_pct}%</span>
                  </div>
                  <div className="pt-1.5 border-t border-border"><RiskBadge tier={bl.initial_risk_tier} /></div>
                </div>
              </div>

              {/* After */}
              <div className="glass-panel p-3.5 border-emerald-500/30 bg-emerald-500/5">
                <span className="text-[11px] font-sans font-semibold text-emerald-500 uppercase tracking-wider block mb-2">Simulated Mitigation</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Supply</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-500">{sr.improved_effective_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Target NRW</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-500">{sr.target_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Deficit</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-500">{sr.new_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Deficit %</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-500">{sr.new_shortage_pct}%</span>
                  </div>
                  <div className="pt-1.5 border-t border-border"><RiskBadge tier={sr.new_risk_tier} /></div>
                </div>
              </div>
            </div>

            {/* Water saved highlight */}
            <div className="glass-panel p-4 text-center border-primary/20 bg-primary/5">
              <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Net Water Volume Recovered</span>
              <span className="text-3xl font-bold font-mono text-primary tabular-nums block">
                +{sr.water_saved_mld} MLD
              </span>
              <span className="text-xs font-sans text-muted-foreground mt-1 block">
                Shortage reduced by <span className="font-mono tabular-nums font-medium text-foreground">{sr.shortage_reduction_pct_points}</span> percentage points
              </span>
            </div>

            {/* Bar comparison chart */}
            <div className="chart-container">
              <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Effective Supply &amp; Shortage Comparison</span>
              <SimulationBarChart baseline={bl} result={sr} height={110} />
            </div>

            <p className="text-xs font-sans text-muted-foreground text-center">{result.simulation_disclaimer}</p>
          </>
        )}
      </div>
    </div>
  )
}

