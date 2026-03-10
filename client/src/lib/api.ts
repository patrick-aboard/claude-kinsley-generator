import type { Generator, ServiceOrder } from './types'

const BASE = '/api'

export async function fetchServiceOrders(params?: {
  search?: string
  status?: string
}): Promise<ServiceOrder[]> {
  const url = new URL(`${BASE}/service-orders`, window.location.origin)
  if (params?.search) url.searchParams.set('search', params.search)
  if (params?.status) url.searchParams.set('status', params.status)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createServiceOrder(data: {
  generator_id: number
  problem_description: string
  assigned_tech?: string
}): Promise<ServiceOrder> {
  const res = await fetch(`${BASE}/service-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchGenerators(search?: string): Promise<Generator[]> {
  const url = new URL(`${BASE}/generators`, window.location.origin)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
