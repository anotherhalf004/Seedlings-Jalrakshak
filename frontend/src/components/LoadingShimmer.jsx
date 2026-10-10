export function LoadingShimmer({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer rounded-xl h-16 w-full" />
      ))}
    </div>
  )
}

export function CardShimmer() {
  return (
    <div className="glass rounded-2xl p-6 space-y-3 animate-pulse">
      <div className="shimmer rounded-lg h-4 w-1/3" />
      <div className="shimmer rounded-lg h-8 w-1/2" />
      <div className="shimmer rounded-lg h-3 w-2/3" />
    </div>
  )
}

export function ChartShimmer({ height = 300 }) {
  return (
    <div
      className="glass rounded-2xl shimmer"
      style={{ height }}
    />
  )
}
