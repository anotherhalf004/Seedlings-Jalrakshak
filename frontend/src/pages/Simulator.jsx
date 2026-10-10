import { useState } from 'react'
import { FlaskConical, TrendingUp, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { SimulationBarChart } from '../components/Charts'
import { simulate } from '../api'

function RiskTransitionArrow({ from, to }) {
  const COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' }
  return (
    <div className="flex items-center gap-3 justify-center py-4">
      <RiskBadge tier={from} />
      <ArrowRight size={18} className="text-slate-500" />
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
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <FlaskConical size={16} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-100">What-If Simulator</h2>
              <p className="text-xs text-slate-500 mt-0.5">NRW Loss Reduction Scenario</p>
            </div>
          </div>

          <form onSubmit={handleSim} className="space-y-6">
            {/* City picker */}
            <div>
              <label htmlFor="sim-city" className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                City
              </label>
              <input
                id="sim-city"
                type="text"
                list="sim-city-list"
                placeholder="Select a city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400/40 transition-colors"
                required
              />
              <datalist id="sim-city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </div>

            {/* Current NRW */}
            <div>
              <label htmlFor="current-nrw" className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Current NRW Loss</span>
                <span className="text-amber-400 font-bold">{currentNRW}%</span>
              </label>
              <input
                id="current-nrw"
                type="range" min={1} max={60} step={0.5}
                value={currentNRW}
                onChange={(e) => { setCurrentNRW(+e.target.value); if (+e.target.value <= targetNRW) setTargetNRW(+e.target.value - 1) }}
                className="w-full"
                style={{ accentColor: '#f59e0b' }}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1%</span><span>60%</span>
              </div>
            </div>

            {/* Target NRW */}
            <div>
              <label htmlFor="target-nrw" className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Target NRW (Goal)</span>
                <span className="text-emerald-400 font-bold">{targetNRW}%</span>
              </label>
              <input
                id="target-nrw"
                type="range" min={0} max={Math.max(currentNRW - 1, 1)} step={0.5}
                value={targetNRW}
                onChange={(e) => setTargetNRW(+e.target.value)}
                className="w-full"
                style={{ accentColor: '#22c55e' }}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0%</span><span>{Math.max(currentNRW - 1, 1)}%</span>
              </div>
            </div>

            {/* Reduction preview */}
            <div className="glass-bright rounded-xl p-3 text-center border border-purple-500/20">
              <p className="text-xs text-slate-400 mb-1">Reduction</p>
              <p className="text-2xl font-bold font-display text-purple-400">
                {(currentNRW - targetNRW).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">loss recovered</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              id="simulate-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? 'rgba(168,85,247,0.1)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 0 20px rgba(168,85,247,0.25)',
              }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Simulating…</> : <><TrendingUp size={16} /> Run Simulation</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-4">
        {!result && !loading && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 animate-float">
              <FlaskConical size={28} className="text-purple-400 opacity-60" />
            </div>
            <p className="text-slate-400 font-medium">Configure and run your NRW scenario</p>
            <p className="text-slate-600 text-sm mt-1">See how reducing distribution losses improves supply and lowers crisis risk</p>
          </div>
        )}

        {result && bl && sr && (
          <>
            {/* Impact summary */}
            <div className="glass-bright rounded-2xl p-5 border border-purple-500/20">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Impact Summary</p>
              <p className="text-slate-200 text-sm leading-relaxed">{result.impact_summary}</p>
              <RiskTransitionArrow from={bl.initial_risk_tier} to={sr.new_risk_tier} />
            </div>

            {/* Before / After cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="glass rounded-2xl p-4 border border-white/5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Before</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Supply</span>
                    <span className="font-bold text-slate-200">{bl.current_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">NRW Loss</span>
                    <span className="font-bold text-amber-400">{bl.current_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shortage</span>
                    <span className="font-bold text-red-400">{bl.initial_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shortage %</span>
                    <span className="font-bold text-red-400">{bl.initial_shortage_pct}%</span>
                  </div>
                  <div className="pt-2"><RiskBadge tier={bl.initial_risk_tier} /></div>
                </div>
              </div>

              {/* After */}
              <div className="glass rounded-2xl p-4 border border-emerald-500/20">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">After</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Supply</span>
                    <span className="font-bold text-emerald-400">{sr.improved_effective_supply_mld} MLD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">NRW Target</span>
                    <span className="font-bold text-emerald-400">{sr.target_nrw_loss_pct}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shortage</span>
                    <span className="font-bold text-emerald-300">{sr.new_shortage_mld} MLD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shortage %</span>
                    <span className="font-bold text-emerald-300">{sr.new_shortage_pct}%</span>
                  </div>
                  <div className="pt-2"><RiskBadge tier={sr.new_risk_tier} /></div>
                </div>
              </div>
            </div>

            {/* Water saved highlight */}
            <div
              className="glass rounded-2xl p-5 text-center border border-cyan-glow/15"
              style={{ background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.05) 0%, transparent 70%)' }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Water Recovered</p>
              <p className="text-5xl font-black font-display gradient-text-cyan tabular-nums">
                {sr.water_saved_mld}
              </p>
              <p className="text-slate-400 text-sm mt-1">Million Litres / Day saved</p>
              <p className="text-xs text-slate-500 mt-2">
                Shortage reduced by {sr.shortage_reduction_pct_points} percentage points
              </p>
            </div>

            {/* Bar comparison chart */}
            <div className="chart-container">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Supply vs Shortage — Before & After</p>
              <SimulationBarChart baseline={bl} result={sr} height={110} />
            </div>

            <p className="text-xs text-slate-600 text-center">{result.simulation_disclaimer}</p>
          </>
        )}
      </div>
    </div>
  )
}
