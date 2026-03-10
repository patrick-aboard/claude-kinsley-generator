export type ServiceOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed'
export type PartsRequestStatus = 'requested' | 'approved' | 'delivered'
export type LogEntryType = 'system' | 'status_change' | 'parts_request' | 'note'

export type ServiceOrder = {
  id: number
  generator_id: number
  status: ServiceOrderStatus
  assigned_tech: string | null
  problem_description: string
  created_at: string
  updated_at: string
  // Joined from generators
  serial_number: string
  client_name: string
  location: string
  model: string
}

export type ServiceOrderDetail = ServiceOrder & {
  manufacturer: string
  logs: ServiceOrderLog[]
  parts_requests: PartsRequest[]
}

export type PartsRequest = {
  id: number
  service_order_id: number
  part_id: number
  quantity_requested: number
  status: PartsRequestStatus
  created_at: string
  // Joined from parts_inventory
  part_name: string
  part_number: string
  quantity_in_stock: number
}

export type ServiceOrderLog = {
  id: number
  service_order_id: number
  timestamp: string
  entry_type: LogEntryType
  message: string
}

export type Generator = {
  id: number
  serial_number: string
  model: string
  manufacturer: string
  client_name: string
  location: string
  install_date: string
  last_serviced: string | null
  status: 'operational' | 'needs_service' | 'out_of_service'
}

export type Part = {
  id: number
  part_number: string
  name: string
  category: string
  quantity_in_stock: number
  low_stock_threshold: number
}
