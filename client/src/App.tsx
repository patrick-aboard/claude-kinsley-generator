import { useState, useEffect } from 'react'

type ServiceOrder = {
  id: number
  status: string
  assigned_tech: string | null
  problem_description: string
  created_at: string
  serial_number: string
  client_name: string
  location: string
}

export default function App() {
  const [data, setData] = useState<ServiceOrder[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/service-orders')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: ServiceOrder[]) => { setData(d); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Kinsley Generator CRM
      </h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Phase 1 Checkpoint — <code>/api/service-orders</code>
      </p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto', fontSize: '0.8rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
