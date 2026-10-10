import { cn } from '../lib/utils'

const RISK_MAP = {
  Low:      { cls: 'risk-low',      dot: '#22c55e', label: 'Low' },
  Medium:   { cls: 'risk-medium',   dot: '#f59e0b', label: 'Medium' },
  High:     { cls: 'risk-high',     dot: '#f97316', label: 'High' },
  Critical: { cls: 'risk-critical', dot: '#ef4444', label: 'Critical' },
}

export function RiskBadge({ tier, className }) {
  const r = RISK_MAP[tier] || RISK_MAP['Low']
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
        r.cls,
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: r.dot, boxShadow: `0 0 6px ${r.dot}` }}
      />
      {r.label}
    </span>
  )
}

export function getRiskColor(tier) {
  return { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' }[tier] || '#22c55e'
}
