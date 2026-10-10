/**
 * AnimatedCounter — ReactBits-inspired rolling number counter
 * Smoothly counts from 0 → target using requestAnimationFrame.
 * Inspired by the react-bits Counter and @number-flow patterns.
 */
import { useEffect, useRef, useState } from 'react'

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedCounter({
  target,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style = {},
}) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    startRef.current = null
    const from = 0
    const to = +target

    function tick(timestamp) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)
      setValue(+(from + (to - from) * eased).toFixed(decimals))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration, decimals])

  return (
    <span className={className} style={style}>
      {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) : value}{suffix}
    </span>
  )
}

/**
 * AnimatedCounterCard — full card with icon, label, and rolling number
 */
export function AnimatedCounterCard({ icon: Icon, label, target, suffix = '', prefix = '', decimals = 0, accent, sub }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {Icon && <Icon size={20} style={{ color: accent }} />}
        </div>
        {sub && <span className="text-xs text-slate-400 font-medium">{sub}</span>}
      </div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <AnimatedCounter
        target={target}
        suffix={suffix}
        prefix={prefix}
        decimals={decimals}
        className="text-3xl font-bold font-display tabular-nums leading-none"
        style={{ color: accent || '#e2e8f0' }}
      />
    </div>
  )
}
