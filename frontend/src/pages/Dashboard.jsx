import { useState } from 'react'
import { Droplets, AlertTriangle, TrendingDown, Activity, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { RiskBadge, getRiskColor } from '../components/RiskBadge'
import { WaterBalanceChart, RiskDistributionChart, GroundwaterRadar } from '../components/Charts'
import { LoadingShimmer } from '../components/LoadingShimmer'

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, suffix = '', accentClass = 'text-primary bg-primary/10 border-primary/20', sub }) {
  return (
    <div className="stat-card group relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${accentClass}`}>
          {Icon && <Icon size={18} />}
        </div>
        {sub && <span className="text-xs text-muted-foreground font-medium">{sub}</span>}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <NumberFlow
        value={value}
        suffix={suffix}
        format={{ notation: 'standard' }}
        className="text-3xl font-extrabold tabular-nums leading-tight font-sans text-foreground"
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
      <KPICard icon={Droplets}      label="Cities Monitored" value={total}         accentClass="text-primary bg-primary/10 border-primary/20" />
      <KPICard icon={AlertTriangle} label="Critical Risk"    value={critical}      accentClass="text-destructive bg-destructive/10 border-destructive/20" sub="cities" />
      <KPICard icon={TrendingDown}  label="High Risk"        value={high}          accentClass="text-orange-500 bg-orange-500/10 border-orange-500/20" sub="cities" />
      <KPICard icon={Activity}      label="Total Shortage"   value={totalShortage} suffix=" MLD" accentClass="text-amber-500 bg-amber-500/10 border-amber-500/20" />
    </div>
  )
}

// ─── City Table ──────────────────────────────────────────────────────────────
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
    { key: 'shortage_risk_category', label: 'Risk Tier' },
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
    if (sort.key !== k) return <span className="opacity-25 ml-1 text-xs">↕</span>
    return sort.dir === 'asc'
      ? <ChevronUp size={12} className="inline ml-1 text-primary" />
      : <ChevronDown size={12} className="inline ml-1 text-primary" />
  }

  return (
    <div className="glass-panel overflow-hidden border border-border">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border bg-card/40">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="city-search"
            type="text"
            placeholder="Search city or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/60 border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TIERS.map((t) => (
            <button
              key={t}
              id={`filter-${t.toLowerCase()}`}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === t
                  ? 'text-primary-foreground bg-primary border-primary shadow-xs'
                  : 'text-muted-foreground border-border bg-muted/40 hover:text-foreground hover:bg-muted'
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
            <tr className="border-b border-border bg-muted/30">
              {COLS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
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
                className="city-row border-b border-border/50 cursor-pointer"
                onClick={() => onSelect(city)}
              >
                <td className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">
                  {city.city.replace(' (phreatic)', '').replace(' (confined)', '')}
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">{city.state_ut}</td>
                <td className="px-4 py-3.5 text-foreground tabular-nums font-mono">
                  {(city.population_estimated / 1e6).toFixed(2)}M
                </td>
                <td className="px-4 py-3.5 tabular-nums font-semibold font-mono text-primary">
                  {city.benchmark_demand_mld.toFixed(0)}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {city.estimated_supply_mld.toFixed(0)}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-bold font-mono" style={{ color: getRiskColor(city.shortage_risk_category) }}>
                  {city.shortage_percentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5 tabular-nums text-xs font-mono text-amber-600 dark:text-amber-400">
                  {city.nrw_loss_percentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5">
                  <RiskBadge tier={city.shortage_risk_category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No cities match your filters.</div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <span>Showing {sorted.length} of {cities.length} cities</span>
        <span>Click any row for detailed stress breakdown</span>
      </div>
    </div>
  )
}

// ─── City Detail Modal ───────────────────────────────────────────────────────
function CityModal({ city, onClose }) {
  if (!city) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div
        className="relative bg-card text-card-foreground rounded-2xl w-full max-w-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
              {city.city.replace(' (phreatic)', '').replace(' (confined)', '')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{city.state_ut}</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge tier={city.shortage_risk_category} />
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            {[
              { label: 'Population (Est.)', value: (city.population_estimated / 1e6).toFixed(2) + 'M', color: 'text-foreground' },
              { label: 'Monitoring Wells', value: city.monitoring_wells_count, color: 'text-primary' },
              { label: 'GW Stress Index', value: city.groundwater_stress_index.toFixed(1), color: 'text-amber-500' },
              { label: 'Design Demand', value: city.benchmark_demand_mld.toFixed(0) + ' MLD', color: 'text-primary' },
              { label: 'Supply Capacity', value: city.estimated_supply_mld.toFixed(0) + ' MLD', color: 'text-emerald-500' },
              { label: 'Shortage', value: city.estimated_shortage_mld.toFixed(0) + ' MLD (' + city.shortage_percentage.toFixed(1) + '%)', color: 'text-destructive' },
              { label: 'NRW Loss %', value: city.nrw_loss_percentage.toFixed(1) + '%', color: 'text-amber-500' },
              { label: 'Unaccounted Water', value: city.unaccounted_water_mld.toFixed(0) + ' MLD', color: 'text-orange-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className={`font-semibold font-mono text-sm ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <GroundwaterRadar city={city} height={260} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────
export default function Dashboard({ cities, loading }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            National Water Stress Analytics
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            Water Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-2xl leading-relaxed">
            Machine Learning forecasting and real-time risk assessment across 66 Indian urban centers.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingShimmer rows={4} className="mb-8" />
      ) : (
        <>
          <NationalKPIs cities={cities} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WaterBalanceChart cities={cities} height={320} onSelect={setSelected} />
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

