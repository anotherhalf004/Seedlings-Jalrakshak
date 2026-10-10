import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { cn } from '../lib/utils'
export { CityWaterMap as WaterBalanceChart } from './CityWaterMap'

/**
 * RiskDistributionChart — evilcharts-style interactive donut chart of shortage risk tiers
 */
export function RiskDistributionChart({ cities, height = 320 }) {
  const [selected, setSelected] = useState(null)

  if (!cities || cities.length === 0) return null

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  cities.forEach((c) => {
    if (counts[c.shortage_risk_category] !== undefined) {
      counts[c.shortage_risk_category]++
    }
  })

  const TOTAL = cities.length

  const SERIES = [
    {
      key: 'Critical',
      label: 'Critical',
      value: counts.Critical,
      share: Math.round((counts.Critical / (TOTAL || 1)) * 100),
      color: '#fb7185',
      swatch: 'bg-[#fb7185]',
    },
    {
      key: 'High',
      label: 'High',
      value: counts.High,
      share: Math.round((counts.High / (TOTAL || 1)) * 100),
      color: '#fb923c',
      swatch: 'bg-[#fb923c]',
    },
    {
      key: 'Medium',
      label: 'Medium',
      value: counts.Medium,
      share: Math.round((counts.Medium / (TOTAL || 1)) * 100),
      color: '#fbbf24',
      swatch: 'bg-[#fbbf24]',
    },
    {
      key: 'Low',
      label: 'Low',
      value: counts.Low,
      share: Math.round((counts.Low / (TOTAL || 1)) * 100),
      color: '#2dd4bf',
      swatch: 'bg-[#2dd4bf]',
    },
  ]

  const activeSeries = SERIES.find((s) => s.key === selected)
  const displayValue = activeSeries ? activeSeries.value : TOTAL
  const displayLabel = activeSeries
    ? `${activeSeries.label} (${activeSeries.share}%)`
    : 'Cities Monitored'

  const chartData = SERIES.map(({ key, label, value, color }) => {
    const isMuted = selected !== null && selected !== key
    return {
      name: label,
      value,
      itemStyle: {
        color,
        opacity: isMuted ? 0.25 : 1,
        borderRadius: 4,
      },
    }
  })

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: 'var(--card-foreground)',
        fontSize: 11,
        fontFamily: 'Plus Jakarta Sans',
      },
      formatter: (params) => {
        return `<div style="display:flex; align-items:center; gap:6px; font-family:'Plus Jakarta Sans'; font-size:11px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${params.color};"></span>
          <strong>${params.name}:</strong>
          <span style="font-family:'JetBrains Mono'; font-weight:600;">${params.value} cities</span>
          <span style="color:var(--muted-foreground);">(${params.percent}%)</span>
        </div>`
      },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['56%', '88%'],
        center: ['50%', '50%'],
        padAngle: 3,
        startAngle: 90,
        endAngle: -270,
        data: chartData,
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 14,
            shadowColor: 'rgba(0, 0, 0, 0.35)',
          },
        },
      },
    ],
  }

  const onEvents = {
    click: (params) => {
      const match = SERIES.find((s) => s.label === params.name)
      if (match) {
        setSelected((prev) => (prev === match.key ? null : match.key))
      }
    },
  }

  return (
    <div className="chart-container flex flex-col justify-between h-full" style={{ minHeight: height }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-sans font-semibold text-foreground uppercase tracking-wider block">
          Risk Category Distribution
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-[10px] font-sans font-medium text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      <div className="relative min-h-[195px] w-full flex-1 flex items-center justify-center">
        <ReactECharts
          option={option}
          style={{ height: '100%', minHeight: 195, width: '100%' }}
          onEvents={onEvents}
          notMerge
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums transition-colors"
            style={{ color: activeSeries ? activeSeries.color : 'var(--foreground)' }}
          >
            {displayValue}
          </span>
          <span className="text-muted-foreground text-[10px] sm:text-xs font-sans uppercase tracking-wider">
            {displayLabel}
          </span>
        </div>
      </div>

      <div className="border-border mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3">
        {SERIES.map(({ key, label, value, share, swatch }) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => setSelected((prev) => (prev === key ? null : key))}
            className={cn(
              "flex cursor-pointer items-center gap-2 text-left text-xs transition-opacity p-1 rounded hover:bg-muted/60",
              selected !== null && selected !== key && "opacity-40",
              selected === key && "bg-muted font-medium"
            )}
          >
            <span className={cn("size-3 shrink-0 rounded-[3px]", swatch)} />
            <span className="text-foreground font-medium">{label}</span>
            <span className="text-foreground font-mono tabular-nums font-semibold ml-auto">{value}</span>
            <span className="text-muted-foreground/70 font-mono tabular-nums text-[11px]">({share}%)</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * GroundwaterRadar — radar chart for a single city's water stress indicators
 */
export function GroundwaterRadar({ city, height = 280 }) {
  if (!city) return null

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      textStyle: { color: 'var(--card-foreground)', fontSize: 12 },
    },
    radar: {
      indicator: [
        { name: 'GW Fall %', max: 100 },
        { name: 'GW Fall >4m', max: 100 },
        { name: 'Shortage %', max: 100 },
        { name: 'NRW Loss %', max: 40 },
        { name: 'Stress Index', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      nameTextStyle: { color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Plus Jakarta Sans' },
      splitLine: { lineStyle: { color: 'var(--border)' } },
      splitArea: { areaStyle: { color: ['rgba(45, 212, 191, 0.04)', 'rgba(56, 189, 248, 0.02)'] } },
      axisLine: { lineStyle: { color: 'var(--border)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        name: city.city,
        value: [
          city.gw_fall_pct,
          city.gw_fall_gt_4m_pct,
          Math.min(city.shortage_percentage, 100),
          Math.min(city.nrw_loss_percentage, 40),
          city.groundwater_stress_index,
        ],
        lineStyle: { color: '#2dd4bf', width: 2 },
        itemStyle: { color: '#2dd4bf' },
        areaStyle: { color: 'rgba(45, 212, 191, 0.18)' },
      }],
    }],
  }

  return (
    <div className="chart-container">
      <span className="text-[11px] font-sans font-semibold text-foreground uppercase tracking-wider block mb-0.5">
        Water Stress Radar
      </span>
      <p className="text-xs font-sans text-muted-foreground mb-2">{city.city}</p>
      <ReactECharts option={option} style={{ height }} notMerge />
    </div>
  )
}

/**
 * ShortageGauge — ECharts gauge for shortage percentage
 */
export function ShortageGauge({ shortage_pct, height = 240 }) {
  const color = shortage_pct >= 40 ? '#ef4444'
    : shortage_pct >= 25 ? '#f97316'
    : shortage_pct >= 10 ? '#f59e0b'
    : '#22c55e'

  const option = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0, max: 100,
      splitNumber: 4,
      radius: '85%',
      center: ['50%', '60%'],
      axisLine: {
        lineStyle: {
          width: 14,
          color: [
            [0.1, '#22c55e'], [0.25, '#f59e0b'], [0.4, '#f97316'], [1, '#ef4444'],
          ],
        },
      },
      pointer: {
        itemStyle: { color: color },
        length: '65%',
        width: 4,
      },
      axisTick: { distance: -18, length: 6, lineStyle: { color: 'var(--border)', width: 1 } },
      splitLine: { distance: -22, length: 12, lineStyle: { color: 'var(--border)', width: 2 } },
      axisLabel: { color: 'var(--muted-foreground)', fontSize: 10, distance: -30, fontFamily: 'Inter' },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color,
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono',
        offsetCenter: [0, '35%'],
      },
      data: [{ value: +shortage_pct.toFixed(1), name: 'Shortage' }],
      title: { color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Inter', offsetCenter: [0, '55%'] },
    }],
  }

  return <ReactECharts option={option} style={{ height }} notMerge />
}

/**
 * SimulationBar — horizontal stacked bar comparing before/after simulation
 */
export function SimulationBarChart({ baseline, result, height = 120 }) {
  if (!baseline || !result) return null

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      textStyle: { color: 'var(--card-foreground)', fontSize: 12, fontFamily: 'Inter' },
    },
    grid: { left: 80, right: 16, top: 8, bottom: 8 },
    xAxis: {
      type: 'value',
      max: baseline.demand_mld,
      axisLine: { lineStyle: { color: 'var(--border)' } },
      splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      axisLabel: { color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' },
    },
    yAxis: {
      type: 'category',
      data: ['After', 'Before'],
      axisLine: { lineStyle: { color: 'var(--border)' } },
      splitLine: { show: false },
      axisLabel: { color: 'var(--foreground)', fontSize: 11, fontFamily: 'Inter', fontWeight: 'bold' },
    },
    series: [
      {
        name: 'Supply',
        type: 'bar',
        stack: 'total',
        data: [result.improved_effective_supply_mld, baseline.current_supply_mld],
        itemStyle: { color: 'var(--primary)', borderRadius: [3, 0, 0, 3] },
        label: { show: true, position: 'inside', color: 'var(--primary-foreground)', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: '{c} MLD' },
      },
      {
        name: 'Shortage',
        type: 'bar',
        stack: 'total',
        data: [result.new_shortage_mld, baseline.initial_shortage_mld],
        itemStyle: { color: 'rgba(251, 113, 133, 0.75)', borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: '{c} MLD' },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} notMerge />
}

