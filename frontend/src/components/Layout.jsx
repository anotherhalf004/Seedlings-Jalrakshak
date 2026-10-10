import { useState, useEffect } from 'react'
import { Droplets, LayoutDashboard, Zap, FlaskConical, Sun, Moon } from 'lucide-react'
import { checkHealth } from '../api'
import { GooeyNav } from './ui/gooey-nav'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { id: 'predictor', label: 'ML Predictor', icon: <Zap size={14} /> },
  { id: 'simulator', label: 'What-If Sim', icon: <FlaskConical size={14} /> },
]

export default function Layout({ activeTab, onTabChange, children }) {
  const [apiStatus, setApiStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))

    // Check system or initial class on <html>
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const activeIndex = NAV_ITEMS.findIndex(item => item.id === activeTab)

  const gooeyItems = NAV_ITEMS.map(({ label, icon }) => ({ label, icon }))

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand identity */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
                <Droplets size={16} />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-foreground">
                JalRakshak
              </span>
            </div>

            {/* Gooey Nav */}
            <GooeyNav
              items={gooeyItems}
              value={activeIndex === -1 ? 0 : activeIndex}
              size="sm"
              activeColor="var(--primary)"
              activeLabelColor="var(--primary-foreground)"
              onChange={(i) => onTabChange(NAV_ITEMS[i].id)}
            />

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold tracking-wider border transition-colors ${
                  apiStatus === 'online'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : apiStatus === 'offline'
                    ? 'text-destructive bg-destructive/10 border-destructive/20'
                    : 'text-muted-foreground bg-muted border-border'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="hidden md:inline">
                  {apiStatus === 'online' ? 'CGWB LIVE' : apiStatus === 'offline' ? 'OFFLINE' : 'CONNECTING'}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 bg-card text-xs font-sans text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">JalRakshak</span>
            <span>· National Water Crisis &amp; Shortage Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Sources: CGWB · IMD · JJM</span>
            <span>·</span>
            <span>ML: Ridge + Gradient Boosting</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
