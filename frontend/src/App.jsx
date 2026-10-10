import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Predictor from './pages/Predictor'
import Simulator from './pages/Simulator'
import { getCities } from './api'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getCities()
      .then((data) => setCities(data.cities || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-sans">
          <strong>Backend connection error:</strong> {error}<br />
          <span className="text-xs opacity-80 mt-1 block">
            Start backend API: <code className="bg-destructive/10 px-1 py-0.5 rounded font-mono text-[11px]">uvicorn backend.main:app --reload --port 8000</code>
          </span>
        </div>
      )}

      {tab === 'dashboard' && <Dashboard cities={cities} loading={loading} />}
      {tab === 'predictor' && <Predictor cities={cities} />}
      {tab === 'simulator' && <Simulator cities={cities} />}
    </Layout>
  )
}
