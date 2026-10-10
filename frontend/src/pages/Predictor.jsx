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
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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
        />
        <span className="text-sm font-bold font-mono text-primary tabular-nums w-16 text-right">
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
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-sans">ML Shortage Predictor</h2>
              <p className="text-xs text-muted-foreground">Run predictive model inference</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* City */}
            <FieldRow id="city" label="City Name" hint="Type or select monitored city">
              <input
                id="city"
                type="text"
                list="city-list"
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={(e) => { set('city', e.target.value); autofill(e.target.value) }}
                className="w-full px-4 py-2.5 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                required
              />
              <datalist id="city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </FieldRow>

            {/* Population */}
            <FieldRow id="population" label="Population" hint="Leave blank for census auto-estimate">
              <input
                id="population"
                type="number"
                placeholder="Auto-estimated from census"
                value={form.population}
                onChange={(e) => set('population', e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all font-mono"
              />
            </FieldRow>

            <SliderField id="gw_fall_pct" label="Groundwater Fall %" value={form.gw_fall_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_pct', v)} hint="% wells with declining table" />
            <SliderField id="gw_fall_gt4" label="GW Fall >4m %" value={form.gw_fall_gt_4m_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_gt_4m_pct', v)} />
            <SliderField id="gw_rise_pct" label="Groundwater Rise %" value={form.gw_rise_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_rise_pct', v)} />
            <SliderField id="tap_pct" label="Tap Water Coverage" value={form.state_tap_water_coverage_pct} min={0} max={100} unit="%" onChange={(v) => set('state_tap_water_coverage_pct', v)} hint="JJM Har Ghar Jal %" />
            <SliderField id="rain_mm" label="Rainfall (Period)" value={form.rainfall_period_actual_mm} min={0} max={500} unit="mm" onChange={(v) => set('rainfall_period_actual_mm', v)} />
            <SliderField id="rain_dep" label="Rainfall Departure" value={form.rainfall_period_dep_pct} min={-100} max={200} unit="%" onChange={(v) => set('rainfall_period_dep_pct', v)} hint="% deviation from normal" />
            <SliderField id="wells" label="Monitoring Wells" value={form.monitoring_wells_count} min={1} max={100} onChange={(v) => set('monitoring_wells_count', v)} />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button
              id="predict-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Running Prediction…</> : <><Send size={16} /> Run Prediction</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-5">
        {!result && !loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center min-h-[440px]">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary animate-float">
              <Zap size={28} />
            </div>
            <p className="text-foreground font-semibold text-base">Select parameters to predict water shortage</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">The ML pipeline will calculate demand projections, groundwater stress levels, and NRW loss anomalies.</p>
          </div>
        )}

        {result && wb && (
          <>
            {/* Header */}
            <div className="glass-panel p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-extrabold text-foreground font-sans">{result.city}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.forecast_period} · Pop {(result.population / 1e6).toFixed(2)}M</p>
                </div>
                <RiskBadge tier={wb.risk_tier} />
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{result.model_metadata?.prediction_status}</span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">{result.model_metadata?.benchmark_standard}</span>
              </div>
            </div>

            {/* Gauge + Radar */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="chart-container">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shortage Risk Gauge</p>
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

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniStatCard label="Predicted Demand" value={wb.predicted_demand_mld?.toFixed(0)} unit="MLD" color="text-primary" />
              <MiniStatCard label="Supply Capacity" value={wb.predicted_supply_mld?.toFixed(0)} unit="MLD" color="text-emerald-500" />
              <MiniStatCard label="Shortage" value={wb.estimated_shortage_mld?.toFixed(0)} unit="MLD" color="text-destructive" />
              <MiniStatCard label="Supply Ratio" value={(wb.predicted_supply_ratio * 100).toFixed(1)} unit="%" color="text-purple-500" />
              <MiniStatCard label="NRW Loss Est." value={result.water_loss_diagnostics?.estimated_nrw_loss_percentage?.toFixed(1)} unit="%" color="text-amber-500" />
              <MiniStatCard label="Unaccounted Water" value={result.water_loss_diagnostics?.estimated_unaccounted_water_mld?.toFixed(0)} unit="MLD" color="text-orange-500" />
            </div>

            {/* Advisory */}
            <div className="glass-panel p-5 border-amber-500/30 bg-amber-500/5">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">Model Action Advisory</p>
              <p className="text-sm text-foreground leading-relaxed">{result.advisory}</p>
            </div>

            {/* Anomaly */}
            {result.water_loss_diagnostics?.suspected_loss_anomaly_flag && (
              <div className="glass-panel p-5 border-destructive/30 bg-destructive/5 flex items-start gap-3">
                <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Loss Anomaly Detected</p>
                  <p className="text-sm text-foreground">{result.water_loss_diagnostics.disclaimer}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

