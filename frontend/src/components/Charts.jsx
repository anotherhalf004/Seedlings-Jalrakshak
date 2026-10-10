import ReactECharts from 'echarts-for-react'

// ─── Shared ECharts theme ─────────────────────────────────────────────────
const GRID = { left: 16, right: 16, top: 24, bottom: 16, containLabel: true }
const AXIS_STYLE = {
  axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
  axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'Inter' },
}

/**
 * WaterBalanceChart — grouped bar (Demand vs Supply) + shortage line
 * Uses ECharts via echarts-for-react
 */
export function WaterBalanceChart({ cities, height = 340 }) {
  if (!cities || cities.length === 0) return null

  const top20 = [...cities]
    .sort((a, b) => b.benchmark_demand_mld - a.benchmark_demand_mld)
    .slice(0, 20)

  const labels = top20.map((c) => c.city.replace(' (phreatic)', '').replace(' (confined)', ''))
  const demand = top20.map((c) => +c.benchmark_demand_mld.toFixed(1))
  const supply = top20.map((c) => +c.estimated_supply_mld.toFixed(1))
  const shortage = top20.map((c) => +c.estimated_shortage_mld.toFixed(1))

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6,13,31,0.95)',
      borderColor: 'rgba(0,240,255,0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params) => {
        const city = params[0].name
        const rows = params.map(
          (p) => `<div style="display:flex;gap:8px;align-items:center">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>
            <span style="color:#94a3b8">${p.seriesName}</span>
            <b style="color:#e2e8f0;margin-left:auto">${p.value} MLD</b>
          </div>`
        ).join('')
        return `<div style="font-family:Inter;padding:4px"><b style="color:#00f0ff">${city}</b><br/>${rows}</div>`
      },
    },
    legend: {
      data: ['Demand', 'Supply', 'Shortage'],
      textStyle: { color: '#64748b', fontSize: 12 },
      top: 4,
      right: 0,
    },
    grid: GRID,
    xAxis: {
      type: 'category',
      data: labels,
      ...AXIS_STYLE,
      axisLabel: { ...AXIS_STYLE.axisLabel, rotate: 35, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: 'MLD',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      ...AXIS_STYLE,
    },
    series: [
      {
        name: 'Demand',
        type: 'bar',
        data: demand,
        barMaxWidth: 24,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#3a86ff' }, { offset: 1, color: '#1d4ed8' }] },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Supply',
        type: 'bar',
        data: supply,
        barMaxWidth: 24,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#00f0ff' }, { offset: 1, color: '#0891b2' }] },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Shortage',
        type: 'line',
        data: shortage,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.2)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] },
        },
      },
    ],
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
        Water Balance — Top 20 Cities (MLD)
      </h3>
      <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
    </div>
  )
}

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
      backgroundColor: 'rgba(6,13,31,0.95)',
      borderColor: 'rgba(0,240,255,0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: '{b}: {c} cities ({d}%)',
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '50%'],
      data,
      label: {
        show: true,
        formatter: '{b}\n{c}',
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter',
      },
      labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      emphasis: {
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,240,255,0.4)' },
      },
    }],
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
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
      backgroundColor: 'rgba(6,13,31,0.95)',
      borderColor: 'rgba(0,240,255,0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
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
      nameTextStyle: { color: '#94a3b8', fontSize: 11, fontFamily: 'Inter' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      splitArea: { areaStyle: { color: ['rgba(58,134,255,0.03)', 'rgba(0,240,255,0.03)'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
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
        lineStyle: { color: '#00f0ff', width: 2 },
        itemStyle: { color: '#00f0ff' },
        areaStyle: { color: 'rgba(0,240,255,0.12)' },
      }],
    }],
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wider">
        Water Stress Radar
      </h3>
      <p className="text-xs text-slate-500 mb-2">{city.city}</p>
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
      axisTick: { distance: -18, length: 6, lineStyle: { color: '#fff', width: 1 } },
      splitLine: { distance: -22, length: 12, lineStyle: { color: '#fff', width: 2 } },
      axisLabel: { color: '#64748b', fontSize: 10, distance: -30, fontFamily: 'Inter' },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color,
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Space Grotesk',
        offsetCenter: [0, '35%'],
      },
      data: [{ value: +shortage_pct.toFixed(1), name: 'Shortage' }],
      title: { color: '#64748b', fontSize: 11, fontFamily: 'Inter', offsetCenter: [0, '55%'] },
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
      backgroundColor: 'rgba(6,13,31,0.95)',
      borderColor: 'rgba(0,240,255,0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
    },
    grid: { left: 80, right: 16, top: 8, bottom: 8 },
    xAxis: {
      type: 'value',
      max: baseline.demand_mld,
      ...AXIS_STYLE,
    },
    yAxis: {
      type: 'category',
      data: ['After', 'Before'],
      ...AXIS_STYLE,
    },
    series: [
      {
        name: 'Supply',
        type: 'bar',
        stack: 'total',
        data: [result.improved_effective_supply_mld, baseline.current_supply_mld],
        itemStyle: { color: '#00f0ff', borderRadius: [4, 0, 0, 4] },
        label: { show: true, position: 'inside', color: '#000', fontSize: 10, formatter: '{c} MLD' },
      },
      {
        name: 'Shortage',
        type: 'bar',
        stack: 'total',
        data: [result.new_shortage_mld, baseline.initial_shortage_mld],
        itemStyle: { color: 'rgba(239,68,68,0.6)', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, formatter: '{c} MLD' },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} notMerge />
}
