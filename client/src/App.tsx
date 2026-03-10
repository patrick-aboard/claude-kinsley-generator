import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ServiceOrdersDashboard from '@/pages/ServiceOrdersDashboard'
import ServiceOrderDetail from '@/pages/ServiceOrderDetail'
import PartsInventory from '@/pages/PartsInventory'
import GeneratorDirectory from '@/pages/GeneratorDirectory'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/service-orders" replace />} />
        <Route path="/service-orders" element={<ServiceOrdersDashboard />} />
        <Route path="/service-orders/:id" element={<ServiceOrderDetail />} />
        <Route path="/parts" element={<PartsInventory />} />
        <Route path="/generators" element={<GeneratorDirectory />} />
      </Route>
    </Routes>
  )
}
