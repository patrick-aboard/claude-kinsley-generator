import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { ServiceOrder } from '@/lib/types'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  order: ServiceOrder
}

export default function KanbanCard({ order }: KanbanCardProps) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => navigate(`/service-orders/${order.id}`)}
      className={cn(
        'bg-card border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing shadow-sm select-none',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div>
        <div className="font-medium text-sm">{order.serial_number}</div>
        <div className="text-xs text-muted-foreground">{order.client_name}</div>
      </div>
      <p className="text-sm line-clamp-1">{order.problem_description}</p>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className={order.assigned_tech ? 'text-foreground' : ''}>
          {order.assigned_tech ?? 'Unassigned'}
        </span>
        <span>
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
