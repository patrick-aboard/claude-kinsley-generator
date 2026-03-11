import type {
  Generator,
  GeneratorDetail,
  Part,
  PartsRequest,
  ServiceOrder,
  ServiceOrderDetail,
  ServiceOrderLog,
} from './types'

const BASE = '/api'

// ── Service Orders ────────────────────────────────────────────────────────

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

export async function fetchServiceOrderDetail(
  id: string | number
): Promise<ServiceOrderDetail> {
  const res = await fetch(`${BASE}/service-orders/${id}`)
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

export async function updateServiceOrder(
  id: number,
  data: { status?: string; assigned_tech?: string }
): Promise<ServiceOrder> {
  const res = await fetch(`${BASE}/service-orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function addLogNote(
  orderId: number,
  message: string
): Promise<ServiceOrderLog> {
  const res = await fetch(`${BASE}/service-orders/${orderId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createPartsRequest(
  orderId: number,
  data: { part_id: number; quantity_requested: number }
): Promise<PartsRequest> {
  const res = await fetch(`${BASE}/service-orders/${orderId}/parts-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Parts Requests ────────────────────────────────────────────────────────

export async function approvePartsRequest(id: number): Promise<PartsRequest> {
  const res = await fetch(`${BASE}/parts-requests/${id}/approve`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deliverPartsRequest(id: number): Promise<PartsRequest> {
  const res = await fetch(`${BASE}/parts-requests/${id}/deliver`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Parts Inventory ───────────────────────────────────────────────────────

export async function fetchParts(search?: string): Promise<Part[]> {
  const url = new URL(`${BASE}/parts`, window.location.origin)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Generators ────────────────────────────────────────────────────────────

export async function fetchGenerators(params?: {
  search?: string
  status?: string
}): Promise<Generator[]> {
  const url = new URL(`${BASE}/generators`, window.location.origin)
  if (params?.search) url.searchParams.set('search', params.search)
  if (params?.status) url.searchParams.set('status', params.status)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchGeneratorDetail(id: number): Promise<GeneratorDetail> {
  const res = await fetch(`${BASE}/generators/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
