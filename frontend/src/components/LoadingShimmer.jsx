export function LoadingShimmer({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted border border-border rounded h-14 w-full opacity-60" />
      ))}
    </div>
  )
}

export function CardShimmer() {
  return (
    <div className="glass-panel p-4 space-y-2.5 animate-pulse">
      <div className="bg-muted rounded h-3.5 w-1/3" />
      <div className="bg-muted rounded h-6 w-1/2" />
      <div className="bg-muted rounded h-2.5 w-2/3" />
    </div>
  )
}

export function ChartShimmer({ height = 300 }) {
  return (
    <div
      className="glass-panel animate-pulse bg-muted border border-border rounded opacity-70"
      style={{ height }}
    />
  )
}

