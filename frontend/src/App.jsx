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
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <strong>Backend not reachable:</strong> {error}<br />
          <span className="text-xs text-red-500 mt-1 block">
            Start the API: <code className="bg-red-500/10 px-1 rounded">uvicorn backend.main:app --reload --port 8000</code>
          </span>
        </div>
      )}

      {tab === 'dashboard' && <Dashboard cities={cities} loading={loading} />}
      {tab === 'predictor' && <Predictor cities={cities} />}
      {tab === 'simulator' && <Simulator cities={cities} />}
    </Layout>
  )
}
