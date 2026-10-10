import { cn } from '../lib/utils'

export function StatCard({ icon: Icon, label, value, unit, sub, accentClass, className }) {
  return (
    <div className={cn('stat-card group relative', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={cn('w-6 h-6 rounded flex items-center justify-center border text-xs', accentClass || 'bg-primary/10 text-primary border-primary/20')}>
            <Icon size={13} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-sans font-medium text-muted-foreground">{unit}</span>}
      </div>

      {sub && (
        <div className="mt-1.5 text-xs font-sans text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-primary/60" />
          {sub}
        </div>
      )}
    </div>
  )
}

export function MiniStatCard({ label, value, unit, color = 'text-foreground' }) {
  return (
    <div className="glass-panel p-3 flex flex-col gap-0.5 border-border">
      <span className="text-[11px] font-sans font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-mono font-bold tabular-nums ${color}`}>{value}</span>
        {unit && <span className="text-xs font-sans font-medium text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}
