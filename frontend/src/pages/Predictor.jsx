import { useState } from 'react'
import NumberFlow from '@number-flow/react'
import { Zap, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { ShortageGauge, GroundwaterRadar } from '../components/Charts'
import { MiniStatCard } from '../components/StatCard'
import { predict } from '../api'

const FIELD_DEFAULTS = {
  city: '',
  population: '',
  gw_fall_pct: 50,
  gw_fall_gt_4m_pct: 10,
  gw_rise_pct: 20,
  state_tap_water_coverage_pct: 75,
  rainfall_period_actual_mm: 20,
  rainfall_period_dep_pct: -15,
  monitoring_wells_count: 10,
  forecast_period: 'Upcoming Month',
}

function FieldRow({ label, id, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  )
}

function SliderField({ id, label, value, min, max, step = 1, unit = '', onChange, hint }) {
  return (
    <FieldRow id={id} label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="flex-1"
          style={{ accentColor: '#00f0ff' }}
        />
        <span className="text-sm font-bold font-display text-cyan-glow tabular-nums w-16 text-right">
          {value}{unit}
        </span>
      </div>
    </FieldRow>
  )
}

export default function Predictor({ cities }) {
  const [form, setForm] = useState({ ...FIELD_DEFAULTS })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  function autofill(cityName) {
    const c = cities.find((x) => x.city.toLowerCase() === cityName.toLowerCase())
    if (c) {
      setForm((f) => ({
        ...f,
        city: c.city,
        population: c.population_estimated,
        gw_fall_pct: c.gw_fall_pct,
        gw_fall_gt_4m_pct: c.gw_fall_gt_4m_pct,
        gw_rise_pct: c.gw_rise_pct,
        state_tap_water_coverage_pct: c.state_tap_water_coverage_pct,
        rainfall_period_actual_mm: c.rainfall_period_actual_mm ?? 20,
        rainfall_period_dep_pct: c.rainfall_period_dep_pct ?? -15,
        monitoring_wells_count: c.monitoring_wells_count,
      }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.city.trim()) { setError('City name is required'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = { ...form, population: form.population || undefined }
      const res = await predict(payload)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const wb = result?.water_balance

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form panel */}
      <div className="lg:col-span-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-glow/15 flex items-center justify-center">
              <Zap size={16} className="text-cyan-glow" />
            </div>
            <h2 className="text-lg font-bold font-display text-slate-100">ML Predictor</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* City */}
            <FieldRow id="city" label="City Name" hint="Type or pick from monitored cities">
              <input
                id="city"
                type="text"
                list="city-list"
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={(e) => { set('city', e.target.value); autofill(e.target.value) }}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-glow/40 transition-colors"
                required
              />
              <datalist id="city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </FieldRow>

            {/* Population */}
            <FieldRow id="population" label="Population" hint="Leave blank to auto-estimate">
              <input
                id="population"
                type="number"
                placeholder="Auto-estimated from census"
                value={form.population}
                onChange={(e) => set('population', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-glow/40 transition-colors"
              />
            </FieldRow>

            <SliderField id="gw_fall_pct" label="Groundwater Fall %" value={form.gw_fall_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_pct', v)} hint="% wells with declining water table" />
            <SliderField id="gw_fall_gt4" label="GW Fall >4m %" value={form.gw_fall_gt_4m_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_gt_4m_pct', v)} />
            <SliderField id="gw_rise_pct" label="Groundwater Rise %" value={form.gw_rise_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_rise_pct', v)} />
            <SliderField id="tap_pct" label="Tap Water Coverage" value={form.state_tap_water_coverage_pct} min={0} max={100} unit="%" onChange={(v) => set('state_tap_water_coverage_pct', v)} hint="JJM Har Ghar Jal %" />
            <SliderField id="rain_mm" label="Rainfall (Period)" value={form.rainfall_period_actual_mm} min={0} max={500} unit="mm" onChange={(v) => set('rainfall_period_actual_mm', v)} />
            <SliderField id="rain_dep" label="Rainfall Departure" value={form.rainfall_period_dep_pct} min={-100} max={200} unit="%" onChange={(v) => set('rainfall_period_dep_pct', v)} hint="% deviation from IMD normal" />
            <SliderField id="wells" label="Monitoring Wells" value={form.monitoring_wells_count} min={1} max={100} onChange={(v) => set('monitoring_wells_count', v)} />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              id="predict-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: loading ? 'rgba(0,240,255,0.1)' : 'linear-gradient(135deg, #00f0ff, #3a86ff)',
                color: loading ? '#00f0ff' : '#000',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,240,255,0.3)',
              }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Predicting…</> : <><Send size={16} /> Run Prediction</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-4">
        {!result && !loading && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-glow/10 flex items-center justify-center mb-4 animate-float">
              <Zap size={28} className="text-cyan-glow opacity-60" />
            </div>
            <p className="text-slate-400 font-medium">Configure parameters and run prediction</p>
            <p className="text-slate-600 text-sm mt-1">The ML model will forecast demand, supply, shortage risk, and NRW loss anomaly</p>
          </div>
        )}

        {result && wb && (
          <>
            {/* Header */}
            <div className="glass-bright rounded-2xl p-5 border border-cyan-glow/20">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-xl font-bold font-display text-slate-100">{result.city}</h3>
                  <p className="text-xs text-slate-500">{result.forecast_period} · Pop {(result.population / 1e6).toFixed(2)}M</p>
                </div>
                <RiskBadge tier={wb.risk_tier} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">{result.model_metadata?.prediction_status}</span>
                <span className="text-slate-600 text-xs mx-1">·</span>
                <span className="text-xs text-slate-500">{result.model_metadata?.benchmark_standard}</span>
              </div>
            </div>

            {/* Gauge + radar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="chart-container">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Shortage Level</p>
                <ShortageGauge shortage_pct={wb.shortage_percentage} height={210} />
              </div>
              <GroundwaterRadar
                city={{
                  city: result.city,
                  gw_fall_pct: form.gw_fall_pct,
                  gw_fall_gt_4m_pct: form.gw_fall_gt_4m_pct,
                  shortage_percentage: wb.shortage_percentage,
                  nrw_loss_percentage: result.water_loss_diagnostics?.estimated_nrw_loss_percentage || 0,
                  groundwater_stress_index: result.groundwater_stress_index || 50,
                }}
                height={210}
              />
            </div>

            {/* Water balance stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniStatCard label="Predicted Demand" value={wb.predicted_demand_mld?.toFixed(0)} unit="MLD" color="#3a86ff" />
              <MiniStatCard label="Supply Capacity" value={wb.predicted_supply_mld?.toFixed(0)} unit="MLD" color="#00f0ff" />
              <MiniStatCard label="Shortage" value={wb.estimated_shortage_mld?.toFixed(0)} unit="MLD" color="#ef4444" />
              <MiniStatCard label="Supply Ratio" value={(wb.predicted_supply_ratio * 100).toFixed(1)} unit="%" color="#a78bfa" />
              <MiniStatCard label="NRW Loss Est." value={result.water_loss_diagnostics?.estimated_nrw_loss_percentage?.toFixed(1)} unit="%" color="#f59e0b" />
              <MiniStatCard label="Unaccounted" value={result.water_loss_diagnostics?.estimated_unaccounted_water_mld?.toFixed(0)} unit="MLD" color="#f97316" />
            </div>

            {/* Advisory */}
            <div className="glass rounded-2xl p-4 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Advisory</p>
              <p className="text-sm text-slate-300 leading-relaxed">{result.advisory}</p>
            </div>

            {/* Loss anomaly */}
            {result.water_loss_diagnostics?.suspected_loss_anomaly_flag && (
              <div className="glass rounded-2xl p-4 border border-red-500/30 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Anomaly Detected</p>
                  <p className="text-sm text-slate-300">{result.water_loss_diagnostics.disclaimer}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
