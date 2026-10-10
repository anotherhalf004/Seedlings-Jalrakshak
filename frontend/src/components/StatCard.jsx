import { cn } from '../lib/utils'

export function StatCard({ icon: Icon, label, value, unit, sub, accentClass, className }) {
  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', accentClass || 'bg-primary/10 text-primary border-primary/20')}>
          {Icon && <Icon size={18} />}
        </div>
        {sub && (
          <span className="text-xs text-muted-foreground font-medium">{sub}</span>
        )}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold font-sans text-foreground tabular-nums leading-none">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
    </div>
  )
}

export function MiniStatCard({ label, value, unit, color = 'text-foreground' }) {
  return (
    <div className="glass-panel p-3.5 flex flex-col gap-1 border-border">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold font-mono ${color}`}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-mono">{unit}</span>}
      </div>
    </div>
  )
}

