import { useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'

const CITY_COORDS = {
  'Mumbai': [19.076, 72.877],
  'Delhi': [28.613, 77.209],
  'Bangalore': [12.972, 77.594],
  'Bengaluru': [12.972, 77.594],
  'Chennai': [13.083, 80.270],
  'Hyderabad': [17.385, 78.486],
  'Kolkata': [22.572, 88.363],
  'Ahmedabad': [23.022, 72.571],
  'Pune': [18.520, 73.857],
  'Surat': [21.170, 72.831],
  'Jaipur': [26.912, 75.787],
  'Lucknow': [26.846, 80.946],
  'Kanpur': [26.449, 80.331],
  'Nagpur': [21.145, 79.082],
  'Indore': [22.719, 75.857],
  'Thane': [19.218, 72.978],
  'Bhopal': [23.259, 77.412],
  'Visakhapatnam': [17.686, 83.218],
  'Pimpri-Chinchwad': [18.627, 73.800],
  'Patna': [25.594, 85.137],
  'Vadodara': [22.307, 73.181],
  'Ghaziabad': [28.669, 77.453],
  'Ludhiana': [30.900, 75.857],
  'Agra': [27.176, 78.008],
  'Nashik': [19.997, 73.790],
  'Faridabad': [28.408, 77.317],
  'Meerut': [28.984, 77.706],
  'Rajkot': [22.303, 70.802],
  'Varanasi': [25.317, 82.973],
  'Aurangabad': [19.877, 75.342],
  'Dhanbad': [23.796, 86.430],
  'Amritsar': [31.634, 74.872],
  'Navi Mumbai': [19.033, 73.029],
  'Prayagraj': [25.435, 81.847],
  'Allahabad': [25.435, 81.847],
  'Ranchi': [23.344, 85.309],
  'Howrah': [22.588, 88.310],
  'Coimbatore': [11.017, 76.956],
  'Jabalpur': [23.182, 79.987],
  'Gwalior': [26.218, 78.182],
  'Vijayawada': [16.506, 80.648],
  'Jodhpur': [26.295, 73.017],
  'Madurai': [9.925, 78.119],
  'Raipur': [21.251, 81.629],
  'Kota': [25.182, 75.839],
  'Chandigarh': [30.733, 76.779],
  'Guwahati': [26.144, 91.736],
  'Solapur': [17.686, 75.905],
  'Hubli-Dharwad': [15.364, 75.124],
  'Bareilly': [28.367, 79.415],
  'Moradabad': [28.839, 78.776],
  'Mysore': [12.295, 76.639],
  'Mysuru': [12.295, 76.639],
  'Gurgaon': [28.459, 77.027],
  'Gurugram': [28.459, 77.027],
  'Aligarh': [27.881, 78.080],
  'Jalandhar': [31.326, 75.576],
  'Tiruchirappalli': [10.790, 78.704],
  'Bhubaneswar': [20.296, 85.825],
  'Salem': [11.664, 78.146],
  'Warangal': [17.977, 79.598],
  'Thiruvananthapuram': [8.524, 76.936],
  'Bhiwandi': [19.299, 73.059],
  'Saharanpur': [29.968, 77.546],
  'Guntur': [16.306, 80.436],
  'Amravati': [20.932, 77.752],
  'Bikaner': [28.018, 73.312],
  'Noida': [28.535, 77.391],
  'Jamshedpur': [22.802, 86.185],
  'Cuttack': [20.462, 85.882],
  'Kochi': [9.966, 76.280],
  'Nellore': [14.442, 79.987],
  'Bhavnagar': [21.762, 72.152],
  'Dehradun': [30.316, 78.032],
  'Durgapur': [23.480, 87.320],
  'Asansol': [23.683, 86.982],
  'Nanded': [19.153, 77.320],
  'Kolhapur': [16.705, 74.243],
  'Ajmer': [26.455, 74.637],
  'Akola': [20.709, 77.002],
  'Gulbarga': [17.330, 76.820],
  'Jamnagar': [22.470, 70.058],
  'Ujjain': [23.179, 75.784],
  'Siliguri': [26.727, 88.395],
  'Jhansi': [25.448, 78.569],
  'Jammu': [32.726, 74.857],
  'Mangalore': [12.914, 74.856],
  'Erode': [11.341, 77.727],
  'Belgaum': [15.851, 74.499],
  'Malegaon': [20.560, 74.524],
  'Tirunelveli': [8.727, 77.704],
  'Gaya': [24.797, 85.001],
  'Kalyan': [19.235, 73.130],
  'Vasai': [19.390, 72.834],
  'Firozabad': [27.153, 78.394],
}

function resolveCoords(rawName) {
  const clean = rawName.replace(/\s*\((phreatic|confined)\)/gi, '').trim()
  if (CITY_COORDS[clean]) return CITY_COORDS[clean]
  const first = clean.split(/[\s-]/)[0]
  return Object.entries(CITY_COORDS).find(([k]) =>
    k.toLowerCase().startsWith(first.toLowerCase())
  )?.[1] ?? null
}

function balanceColor(shortage, demand) {
  if (shortage <= 0) return '#2dd4bf'
  const ratio = shortage / demand
  if (ratio < 0.2) return '#fbbf24'
  if (ratio < 0.5) return '#fb923c'
  return '#fb7185'
}

const LEGEND = [
  ['#2dd4bf', 'Surplus'],
  ['#fbbf24', 'Mild'],
  ['#fb923c', 'Moderate'],
  ['#fb7185', 'Severe'],
]

const GRID = { left: 16, right: 16, top: 28, bottom: 16, containLabel: true }

function drawBubbles(cities, L, map, onSelect) {
  if (!cities?.length) return
  map.eachLayer((l) => { if (l._wb) map.removeLayer(l) })

  const top20 = [...cities]
    .sort((a, b) => b.benchmark_demand_mld - a.benchmark_demand_mld)
    .slice(0, 20)

  const maxDemand = Math.max(...top20.map((c) => c.benchmark_demand_mld))

  top20.forEach((c) => {
    const coords = resolveCoords(c.city)
    if (!coords) return

    const demand   = +(c.benchmark_demand_mld ?? 0).toFixed(1)
    const supply   = +(c.estimated_supply_mld ?? 0).toFixed(1)
    const shortage = +(c.estimated_shortage_mld ?? 0).toFixed(1)
    const color    = balanceColor(shortage, demand)
    const radius   = 8 + (demand / (maxDemand || 1)) * 24
    const label    = c.city.replace(/\s*\(.*?\)/gi, '').trim()

    const marker = L.circleMarker(coords, {
      radius,
      fillColor: color,
      color: '#fff',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.75,
    })
    marker._wb = true

    marker.bindTooltip(
      `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;line-height:1.7;min-width:160px;padding:2px 4px">
        <b style="font-size:13px;color:#2dd4bf">${label}</b><br/>
        <span style="color:#7e92a8">Demand :</span> <b>${demand} MLD</b><br/>
        <span style="color:#7e92a8">Supply  :</span> <b>${supply} MLD</b><br/>
        <span style="color:#7e92a8">Shortage:</span> <b style="color:${color}">${shortage > 0 ? shortage : 0} MLD</b>
        ${onSelect ? '<br/><span style="font-size:10px;color:#2dd4bf;opacity:0.85">Click for diagnostic telemetry →</span>' : ''}
      </div>`,
      { direction: 'top', offset: [0, -(radius + 2)], opacity: 1, className: 'water-map-tooltip' }
    )

    if (onSelect) {
      marker.on('click', () => onSelect(c))
    }

    marker.addTo(map)
  })
}

export function CityWaterMap({ cities, height = 340, onSelect }) {
  const [viewMode, setViewMode] = useState('map')
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (viewMode !== 'map') return
    if (!containerRef.current) return
    let cancelled = false

    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([mod]) => {
      if (cancelled || !containerRef.current) return
      const L = mod.default || mod

      if (mapRef.current) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
      if (containerRef.current && containerRef.current._leaflet_id) {
        containerRef.current._leaflet_id = null
      }

      const map = L.map(containerRef.current, {
        center: [21.8, 79.5],
        zoom: 4.4,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      mapRef.current = { map, L }
      drawBubbles(cities, L, map, onSelect)
      setTimeout(() => { map.invalidateSize() }, 150)
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && cities?.length) {
      drawBubbles(cities, mapRef.current.L, mapRef.current.map, onSelect)
    }
  }, [cities, onSelect, viewMode])

  // Bar chart fallback option
  const top20 = [...(cities || [])]
    .sort((a, b) => b.benchmark_demand_mld - a.benchmark_demand_mld)
    .slice(0, 20)

  const labels = top20.map((c) => c.city.replace(' (phreatic)', '').replace(' (confined)', ''))
  const demand = top20.map((c) => +c.benchmark_demand_mld.toFixed(1))
  const supply = top20.map((c) => +c.estimated_supply_mld.toFixed(1))
  const shortage = top20.map((c) => +c.estimated_shortage_mld.toFixed(1))

  const barOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      borderWidth: 1,
      textStyle: { color: 'var(--card-foreground)', fontSize: 12, fontFamily: 'Inter' },
    },
    legend: {
      data: ['Demand', 'Supply', 'Shortage'],
      textStyle: { color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'Inter' },
      top: 0,
      right: 0,
    },
    grid: GRID,
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'var(--border)' } },
      axisLabel: { color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter', rotate: 35 },
    },
    yAxis: {
      type: 'value',
      name: 'MLD',
      nameTextStyle: { color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Inter' },
      splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
      axisLabel: { color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Inter' },
    },
    series: [
      {
        name: 'Demand',
        type: 'bar',
        data: demand,
        barMaxWidth: 16,
        itemStyle: { color: 'var(--primary)', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Supply',
        type: 'bar',
        data: supply,
        barMaxWidth: 16,
        itemStyle: { color: 'var(--chart-2)', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Shortage',
        type: 'line',
        data: shortage,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: 'var(--destructive)', width: 2 },
        itemStyle: { color: 'var(--destructive)' },
      },
    ],
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-sans font-semibold text-foreground uppercase tracking-wider">
            Water Balance — Top 20 Urban Hubs
          </span>
          <div className="inline-flex rounded p-0.5 bg-muted border border-border">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 py-0.5 text-[11px] font-sans font-semibold tracking-wider rounded transition-all ${
                viewMode === 'map'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              MAP
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-2 py-0.5 text-[11px] font-sans font-semibold tracking-wider rounded transition-all ${
                viewMode === 'bar'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              BAR MATRIX
            </button>
          </div>
        </div>

        {viewMode === 'map' && (
          <div className="flex gap-2.5 flex-wrap">
            {LEGEND.map(([color, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'map' ? (
        <div
          ref={containerRef}
          style={{ height, borderRadius: '0.375rem', overflow: 'hidden', zIndex: 0 }}
        />
      ) : (
        <ReactECharts option={barOption} style={{ height }} notMerge />
      )}
    </div>
  )
}
