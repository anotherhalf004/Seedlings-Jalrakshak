/** Utility: merge class names (lightweight clsx + tailwind-merge) */
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) { return twMerge(clsx(inputs)) }

export function getRiskColor(tier) {
  return { Low: '#2dd4bf', Medium: '#fbbf24', High: '#fb923c', Critical: '#fb7185' }[tier] || '#2dd4bf'
}
