import { useState, useEffect } from 'react'
import { Droplets, LayoutDashboard, Zap, FlaskConical, Wifi, WifiOff, Sun, Moon } from 'lucide-react'
import { checkHealth } from '../api'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predictor', label: 'ML Predictor', icon: Zap },
  { id: 'simulator', label: 'What-If Sim', icon: FlaskConical },
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-sidebar/85 border-b border-sidebar-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Droplets size={18} className="animate-pulse-slow" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight font-sans text-foreground">JalRakshak</span>
                <span className="hidden sm:inline text-muted-foreground text-xs ml-2 font-medium">
                  Water Intelligence Platform
                </span>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`nav-${id}`}
                  onClick={() => onTabChange(id)}
                  className={`nav-link flex items-center gap-2 ${activeTab === id ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline font-medium">{label}</span>
                </button>
              ))}
            </nav>

            {/* Actions & Status */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  apiStatus === 'online'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : apiStatus === 'offline'
                    ? 'text-destructive bg-destructive/10 border-destructive/20'
                    : 'text-muted-foreground bg-muted border-border'
                }`}
              >
                {apiStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span className="hidden sm:inline">
                  {apiStatus === 'online' ? 'API Active' : apiStatus === 'offline' ? 'API Offline' : 'Connecting…'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 bg-sidebar/50 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">JalRakshak</span>
            <span>· National Water Crisis & Shortage Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>Sources: CGWB · IMD · JJM · Census 2011</span>
            <span>·</span>
            <span>ML: Ridge + Gradient Boosting</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

