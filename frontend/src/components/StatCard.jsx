import { cn } from '../lib/utils'

export function StatCard({ icon: Icon, label, value, unit, sub, accent, className }) {
  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {Icon && <Icon size={20} style={{ color: accent }} />}
        </div>
        {sub && (
          <span className="text-xs text-slate-400 font-medium">{sub}</span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-3xl font-bold font-display tabular-nums leading-none"
          style={{ color: accent || '#e2e8f0' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>
    </div>
  )
}

export function MiniStatCard({ label, value, unit, color }) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-display" style={{ color: color || '#e2e8f0' }}>{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  )
}
