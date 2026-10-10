import { useState } from 'react'
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
    <div className="space-y-1">
      <label htmlFor={id} className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs font-sans text-muted-foreground/80">{hint}</p>}
    </div>
  )
}

function SliderField({ id, label, value, min, max, step = 1, unit = '', onChange, hint }) {
  return (
    <FieldRow id={id} label={label} hint={hint}>
      <div className="flex items-center gap-2.5">
        <input
          id={id}
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="flex-1"
        />
        <span className="text-xs font-mono font-bold text-primary tabular-nums w-12 text-right bg-muted px-1.5 py-0.5 rounded border border-border">
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
    if (!cityName) return
    const cleanInput = cityName.trim().toLowerCase()
    const c = (cities || []).find((x) => {
      const cleanCity = x.city.replace(/\s*\(.*?\)/g, '').trim().toLowerCase()
      if (cleanCity === cleanInput || x.city.toLowerCase() === cleanInput) return true
      if (cleanInput === 'bengaluru' && x.city.toLowerCase().includes('bangalore')) return true
      if (cleanInput === 'bangalore' && x.city.toLowerCase().includes('bengaluru')) return true
      return false
    })
    if (c) {
      setForm((f) => ({
        ...f,
        city: c.city.replace(/\s*\(.*?\)/g, '').trim(),
        population: c.population_estimated ?? '',
        gw_fall_pct: c.gw_fall_pct ?? 50,
        gw_fall_gt_4m_pct: c.gw_fall_gt_4m_pct ?? 10,
        gw_rise_pct: c.gw_rise_pct ?? 20,
        state_tap_water_coverage_pct: c.state_tap_water_coverage_pct ?? 75,
        rainfall_period_actual_mm: c.rainfall_period_actual_mm ?? 20,
        rainfall_period_dep_pct: c.rainfall_period_dep_pct ?? -15,
        monitoring_wells_count: c.monitoring_wells_count ?? 10,
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
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Form panel */}
      <div className="lg:col-span-2">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Zap size={14} />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-foreground">Inference Parameters</h2>
              <p className="text-xs font-sans text-muted-foreground">Hydrological &amp; consumption vector</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* City */}
            <FieldRow id="city" label="Target Urban Center" hint="Type or select monitored city">
              <input
                id="city"
                type="text"
                list="city-list"
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={(e) => { set('city', e.target.value); autofill(e.target.value) }}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
              <datalist id="city-list">
                {cities.map((c) => <option key={c.city} value={c.city.replace(' (phreatic)', '').replace(' (confined)', '')} />)}
              </datalist>
            </FieldRow>

            {/* Population */}
            <FieldRow id="population" label="Population Base" hint="Leave blank for census estimation">
              <input
                id="population"
                type="number"
                placeholder="Auto-estimated"
                value={form.population}
                onChange={(e) => set('population', e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
              />
            </FieldRow>

            <SliderField id="gw_fall_pct" label="Groundwater Fall %" value={form.gw_fall_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_pct', v)} hint="% wells with declining table" />
            <SliderField id="gw_fall_gt4" label="GW Fall >4m %" value={form.gw_fall_gt_4m_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_fall_gt_4m_pct', v)} />
            <SliderField id="gw_rise_pct" label="Groundwater Rise %" value={form.gw_rise_pct} min={0} max={100} unit="%" onChange={(v) => set('gw_rise_pct', v)} />
            <SliderField id="tap_pct" label="Tap Water Coverage" value={form.state_tap_water_coverage_pct} min={0} max={100} unit="%" onChange={(v) => set('state_tap_water_coverage_pct', v)} hint="JJM Har Ghar Jal coverage" />
            <SliderField id="rain_mm" label="Rainfall (Period)" value={form.rainfall_period_actual_mm} min={0} max={500} unit="mm" onChange={(v) => set('rainfall_period_actual_mm', v)} />
            <SliderField id="rain_dep" label="Rainfall Departure" value={form.rainfall_period_dep_pct} min={-100} max={200} unit="%" onChange={(v) => set('rainfall_period_dep_pct', v)} hint="% deviation from normal" />
            <SliderField id="wells" label="Monitoring Wells" value={form.monitoring_wells_count} min={1} max={100} onChange={(v) => set('monitoring_wells_count', v)} />

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-sans font-medium">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              id="predict-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-sans font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> RUNNING INFERENCE…</> : <><Send size={14} /> EXECUTE MODEL INFERENCE</>}
            </button>
          </form>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3 space-y-4">
        {!result && !loading && (
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <Zap size={22} />
            </div>
            <p className="text-foreground font-display font-bold text-sm">Awaiting Inference Execution</p>
            <p className="text-muted-foreground text-xs sm:text-[13px] font-sans mt-1 max-w-sm leading-relaxed">Configure parameters on the left to compute demand projection, groundwater stress coefficient, and NRW anomalies.</p>
          </div>
        )}

        {result && wb && (
          <>
            {/* Header telemetry */}
            <div className="glass-panel p-4 border-primary/25 bg-primary/5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">{result.city}</h3>
                  <p className="text-xs font-sans text-muted-foreground">{result.forecast_period} · Pop <span className="font-mono tabular-nums font-semibold">{(result.population / 1e6).toFixed(2)}M</span></p>
                </div>
                <RiskBadge tier={wb.risk_tier} />
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-xs font-sans font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="text-emerald-500 font-semibold">{result.model_metadata?.prediction_status}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{result.model_metadata?.benchmark_standard}</span>
              </div>
            </div>

            {/* Gauge + Radar */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="chart-container">
                <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Shortage Gauge</span>
                <ShortageGauge shortage_pct={wb.shortage_percentage} height={190} />
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
                height={190}
              />
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <MiniStatCard label="Demand" value={wb.predicted_demand_mld?.toFixed(0)} unit="MLD" color="text-primary" />
              <MiniStatCard label="Supply Capacity" value={wb.predicted_supply_mld?.toFixed(0)} unit="MLD" color="text-emerald-500" />
              <MiniStatCard label="Deficit" value={wb.estimated_shortage_mld?.toFixed(0)} unit="MLD" color="text-destructive" />
              <MiniStatCard label="Supply Ratio" value={(wb.predicted_supply_ratio * 100).toFixed(1)} unit="%" color="text-cyan-500" />
              <MiniStatCard label="NRW Loss Est." value={result.water_loss_diagnostics?.estimated_nrw_loss_percentage?.toFixed(1)} unit="%" color="text-amber-500" />
              <MiniStatCard label="Unaccounted" value={result.water_loss_diagnostics?.estimated_unaccounted_water_mld?.toFixed(0)} unit="MLD" color="text-orange-500" />
            </div>

            {/* Advisory */}
            <div className="glass-panel p-3.5 border-amber-500/25 bg-amber-500/5">
              <span className="text-[11px] font-sans font-semibold text-amber-500 uppercase tracking-wider block mb-1">Decision Advisory</span>
              <p className="text-xs font-sans text-foreground leading-relaxed">{result.advisory}</p>
            </div>

            {/* Anomaly */}
            {result.water_loss_diagnostics?.suspected_loss_anomaly_flag && (
              <div className="glass-panel p-3.5 border-destructive/25 bg-destructive/5 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-sans font-semibold text-destructive uppercase tracking-wider block mb-0.5">Telemetry Loss Anomaly</span>
                  <p className="text-xs font-sans text-foreground">{result.water_loss_diagnostics.disclaimer}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

