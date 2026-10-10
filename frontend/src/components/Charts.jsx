import ReactECharts from 'echarts-for-react'
export { CityWaterMap as WaterBalanceChart } from './CityWaterMap'

// ─── Shared ECharts styling ─────────────────────────────────────────────────
const GRID = { left: 16, right: 16, top: 28, bottom: 16, containLabel: true }

/**
 * RiskDistributionChart — donut chart of shortage risk tiers
 */
export function RiskDistributionChart({ cities, height = 280 }) {
  if (!cities || cities.length === 0) return null

  const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 }
  cities.forEach((c) => { if (counts[c.shortage_risk_category] !== undefined) counts[c.shortage_risk_category]++ })

  const COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' }
  const data = Object.entries(counts).map(([name, value]) => ({
    name, value,
    itemStyle: { color: COLORS[name] },
  }))

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      borderWidth: 1,
      textStyle: { color: 'var(--card-foreground)', fontSize: 12, fontFamily: 'Inter' },
      formatter: '{b}: {c} cities ({d}%)',
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['50%', '50%'],
      data,
      label: {
        show: true,
        formatter: '{b}\n{c}',
        color: 'var(--muted-foreground)',
        fontSize: 11,
        fontFamily: 'Inter',
      },
      labelLine: { lineStyle: { color: 'var(--border)' } },
      emphasis: {
        itemStyle: { shadowBlur: 15, shadowColor: 'rgba(11, 114, 249, 0.3)' },
      },
    }],
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
        Risk Tier Distribution
      </h3>
      <ReactECharts option={option} style={{ height }} notMerge />
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
      nameTextStyle: { color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Inter' },
      splitLine: { lineStyle: { color: 'var(--border)' } },
      splitArea: { areaStyle: { color: ['rgba(11, 114, 249, 0.03)', 'rgba(4, 195, 220, 0.03)'] } },
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
        lineStyle: { color: 'rgb(11, 114, 249)', width: 2 },
        itemStyle: { color: 'rgb(11, 114, 249)' },
        areaStyle: { color: 'rgba(11, 114, 249, 0.15)' },
      }],
    }],
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wider">
        Water Stress Radar
      </h3>
      <p className="text-xs text-muted-foreground mb-2 font-medium">{city.city}</p>
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
        itemStyle: { color: 'rgb(11, 114, 249)', borderRadius: [4, 0, 0, 4] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: '{c} MLD' },
      },
      {
        name: 'Shortage',
        type: 'bar',
        stack: 'total',
        data: [result.new_shortage_mld, baseline.initial_shortage_mld],
        itemStyle: { color: 'rgba(239, 68, 68, 0.75)', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: '{c} MLD' },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} notMerge />
}

