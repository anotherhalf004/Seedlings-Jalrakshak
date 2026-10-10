/**
 * ReactBits-inspired AuroraText
 * Renders text with an animated aurora/shimmer gradient, matching the JalRakshak
 * ocean palette. Inspired by reactbits.dev AuroraText pattern.
 */
import { useRef } from 'react'

export function AuroraText({ children, className = '', speed = 3, colors }) {
  const textRef = useRef(null)

  const palette = colors || ['#00f0ff', '#3a86ff', '#a78bfa', '#00f0ff']
  const gradient = `linear-gradient(90deg, ${palette.join(', ')})`

  return (
    <span
      ref={textRef}
      className={className}
      style={{
        background: gradient,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `auroraShift ${speed}s linear infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  )
}

// Inject the animation keyframe once
if (typeof document !== 'undefined' && !document.getElementById('aurora-keyframes')) {
  const style = document.createElement('style')
  style.id = 'aurora-keyframes'
  style.textContent = `
    @keyframes auroraShift {
      0%   { background-position: 0% center; }
      100% { background-position: 200% center; }
    }
  `
  document.head.appendChild(style)
}
