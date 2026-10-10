import { useState, useEffect } from 'react'
import { Droplets, LayoutDashboard, Zap, FlaskConical, Wifi, WifiOff } from 'lucide-react'
import { checkHealth } from '../api'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predictor', label: 'ML Predictor', icon: Zap },
  { id: 'simulator', label: 'What-If Sim', icon: FlaskConical },
]

export default function Layout({ activeTab, onTabChange, children }) {
  const [apiStatus, setApiStatus] = useState('checking') // 'online' | 'offline' | 'checking'

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #060d1f 0%, #0b132b 50%, #060d1f 100%)' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06]" style={{ background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.25), rgba(58,134,255,0.25))', border: '1px solid rgba(0,240,255,0.25)' }}
              >
                <Droplets size={16} style={{ color: '#00f0ff' }} />
              </div>
              <div>
                <span className="font-bold font-display text-sm gradient-text-cyan">JalRakshak</span>
                <span className="hidden sm:inline text-slate-500 text-xs ml-1.5">Water Intelligence</span>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`nav-${id}`}
                  onClick={() => onTabChange(id)}
                  className={`nav-link flex items-center gap-1.5 ${activeTab === id ? 'active' : ''}`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>

            {/* API status */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                apiStatus === 'online'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : apiStatus === 'offline'
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
              }`}>
                {apiStatus === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                <span className="hidden sm:inline">{apiStatus === 'online' ? 'API Online' : apiStatus === 'offline' ? 'API Offline' : 'Connecting…'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>JalRakshak · Smart Water Crisis & Leakage Prevention</span>
          <span className="flex items-center gap-1">
            <span>Data: CGWB · IMD · JJM · Census 2011</span>
            <span className="mx-2">·</span>
            <span>ML: Ridge + GBM + IsoForest</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
