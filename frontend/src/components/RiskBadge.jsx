import { cn } from '../lib/utils'

const RISK_MAP = {
  Low:      { cls: 'risk-low',      dot: '#2dd4bf', label: 'Low' },
  Medium:   { cls: 'risk-medium',   dot: '#fbbf24', label: 'Medium' },
  High:     { cls: 'risk-high',     dot: '#fb923c', label: 'High' },
  Critical: { cls: 'risk-critical', dot: '#fb7185', label: 'Critical' },
}

export function RiskBadge({ tier, className }) {
  const r = RISK_MAP[tier] || RISK_MAP['Low']
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-semibold tracking-wide border',
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

