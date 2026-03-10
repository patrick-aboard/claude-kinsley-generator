export type ServiceOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed'

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
