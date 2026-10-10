import { useState } from 'react'
import { Droplets, AlertTriangle, TrendingDown, Activity, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { RiskBadge, getRiskColor } from '../components/RiskBadge'
import { WaterBalanceChart, RiskDistributionChart, GroundwaterRadar } from '../components/Charts'
import { LoadingShimmer } from '../components/LoadingShimmer'

// ─── KPI card using @number-flow/react for animated numbers ─────────────────
function KPICard({ icon: Icon, label, value, suffix = '', accent, sub }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
        >
          {Icon && <Icon size={20} style={{ color: accent }} />}
        </div>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <NumberFlow
        value={value}
        suffix={suffix}
        format={{ notation: 'standard' }}
        style={{ color: accent || '#e2e8f0' }}
        className="text-3xl font-bold font-display tabular-nums leading-none"
      />
    </div>
  )
}

function NationalKPIs({ cities }) {
  const total = cities.length
  const critical = cities.filter((c) => c.shortage_risk_category === 'Critical').length
  const high = cities.filter((c) => c.shortage_risk_category === 'High').length
  const totalShortage = Math.round(cities.reduce((s, c) => s + c.estimated_shortage_mld, 0))

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KPICard icon={Droplets}      label="Cities Monitored" value={total}         accent="#00f0ff" />
      <KPICard icon={AlertTriangle} label="Critical Risk"    value={critical}      accent="#ef4444" sub="cities" />
      <KPICard icon={TrendingDown}  label="High Risk"        value={high}          accent="#f97316" sub="cities" />
      <KPICard icon={Activity}      label="Total Shortage"   value={totalShortage} suffix=" MLD"    accent="#f59e0b" />
    </div>
  )
}

// ─── City table ──────────────────────────────────────────────────────────────
function CityTable({ cities, onSelect }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'shortage_percentage', dir: 'desc' })
  const [filter, setFilter] = useState('All')

  const TIERS = ['All', 'Critical', 'High', 'Medium', 'Low']
  const COLS = [
    { key: 'city', label: 'City' },
    { key: 'state_ut', label: 'State' },
    { key: 'population_estimated', label: 'Population' },
    { key: 'benchmark_demand_mld', label: 'Demand' },
    { key: 'estimated_supply_mld', label: 'Supply' },
    { key: 'shortage_percentage', label: 'Shortage %' },
    { key: 'nrw_loss_percentage', label: 'NRW Loss' },
    { key: 'shortage_risk_category', label: 'Risk' },
  ]

  const sorted = [...cities]
    .filter((c) => filter === 'All' || c.shortage_risk_category === filter)
    .filter((c) =>
      c.city.toLowerCase().includes(query.toLowerCase()) ||
      c.state_ut.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const v = sort.dir === 'asc' ? 1 : -1
      return typeof a[sort.key] === 'number'
        ? (a[sort.key] - b[sort.key]) * v
        : a[sort.key].localeCompare(b[sort.key]) * v
    })

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  function SortIcon({ k }) {
    if (sort.key !== k) return <span className="opacity-20 ml-1 text-xs">↕</span>
    return sort.dir === 'asc'
      ? <ChevronUp size={11} className="inline ml-1" style={{ color: '#00f0ff' }} />
      : <ChevronDown size={11} className="inline ml-1" style={{ color: '#00f0ff' }} />
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="city-search"
            type="text"
            placeholder="Search city or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TIERS.map((t) => (
            <button
              key={t}
              id={`filter-${t.toLowerCase()}`}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === t
                  ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
                  : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {COLS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap"
                >
                  {label}<SortIcon k={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((city) => (
              <tr
                key={city.city}
                className="city-row border-b border-white/[0.03] cursor-pointer"
                onClick={() => onSelect(city)}
              >
                <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                  {city.city.replace(' (phreatic)', '').replace(' (confined)', '')}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{city.state_ut}</td>
                <td className="px-4 py-3 text-slate-300 tabular-nums">
                  {(city.population_estimated / 1e6).toFixed(2)}M
                </td>
                <td className="px-4 py-3 tabular-nums font-medium" style={{ color: '#3a86ff' }}>
                  {city.benchmark_demand_mld.toFixed(0)}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium" style={{ color: '#00f0ff' }}>
                  {city.estimated_supply_mld.toFixed(0)}
                </td>
                <td className="px-4 py-3 tabular-nums font-bold" style={{ color: getRiskColor(city.shortage_risk_category) }}>
                  {city.shortage_percentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3 tabular-nums text-xs" style={{ color: '#f59e0b' }}>
                  {city.nrw_loss_percentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <RiskBadge tier={city.shortage_risk_category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No cities match your filters.</div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-white/5 text-xs text-slate-600">
        Showing {sorted.length} of {cities.length} cities · Click any row for details
      </div>
    </div>
  )
}

// ─── City detail modal ───────────────────────────────────────────────────────
function CityModal({ city, onClose }) {
  if (!city) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative glass-bright rounded-2xl w-full max-w-2xl border border-white/10 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100">
              {city.city.replace(' (phreatic)', '').replace(' (confined)', '')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{city.state_ut}</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge tier={city.shortage_risk_category} />
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: 'Population', value: (city.population_estimated / 1e6).toFixed(2) + 'M', color: '#e2e8f0' },
              { label: 'Monitoring Wells', value: city.monitoring_wells_count, color: '#a78bfa' },
              { label: 'GW Stress Index', value: city.groundwater_stress_index.toFixed(1), color: '#f59e0b' },
              { label: 'Design Demand', value: city.benchmark_demand_mld.toFixed(0) + ' MLD', color: '#3a86ff' },
              { label: 'Supply Capacity', value: city.estimated_supply_mld.toFixed(0) + ' MLD', color: '#00f0ff' },
              { label: 'Shortage', value: city.estimated_shortage_mld.toFixed(0) + ' MLD (' + city.shortage_percentage.toFixed(1) + '%)', color: getRiskColor(city.shortage_risk_category) },
              { label: 'NRW Loss %', value: city.nrw_loss_percentage.toFixed(1) + '%', color: '#f59e0b' },
              { label: 'Unaccounted Water', value: city.unaccounted_water_mld.toFixed(0) + ' MLD', color: '#f97316' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
          <GroundwaterRadar city={city} height={260} />
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard({ cities, loading }) {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(58,134,255,0.12) 0%, transparent 60%)' }}
        />
        <h1 className="text-3xl sm:text-4xl font-black font-display leading-tight mb-2"
          style={{
            background: 'linear-gradient(90deg, #00f0ff, #3a86ff, #a78bfa)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          National Water Intelligence
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          ML-powered water balance forecasting across 66 urban Indian cities.
          Sources: CGWB · IMD · JJM Har Ghar Jal · Census 2011
        </p>
      </div>

      {loading ? (
        <LoadingShimmer rows={4} className="mb-8" />
      ) : (
        <>
          <NationalKPIs cities={cities} />
          <div className="grid lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2">
              <WaterBalanceChart cities={cities} height={320} />
            </div>
            <RiskDistributionChart cities={cities} height={320} />
          </div>
          <CityTable cities={cities} onSelect={setSelected} />
        </>
      )}

      <CityModal city={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
