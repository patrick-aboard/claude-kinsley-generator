import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { toast } from 'sonner'
import { updateServiceOrder } from '@/lib/api'
import type { ServiceOrder, ServiceOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import KanbanCard from './KanbanCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const VALID_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  open:        ['assigned'],
  assigned:    ['in_progress', 'open'],
  in_progress: ['completed', 'assigned', 'open'],
  completed:   ['in_progress'],
}

const COLUMNS: { id: ServiceOrderStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]

interface KanbanColumnProps {
  id: ServiceOrderStatus
  label: string
  orders: ServiceOrder[]
  activeId: number | null
}

function KanbanColumn({ id, label, orders, activeId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="w-72 shrink-0 flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {orders.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-lg p-2 min-h-40 transition-colors',
          isOver ? 'bg-muted' : 'bg-muted/40'
        )}
      >
        {orders.map(order => (
          <div
            key={order.id}
            className={cn(activeId === order.id && 'invisible')}
          >
            <KanbanCard order={order} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  orders: ServiceOrder[]
  onOrderUpdated: () => void
}

export default function KanbanBoard({ orders, onOrderUpdated }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    orderId: number
    fromStatus: ServiceOrderStatus
  } | null>(null)
  const [techName, setTechName] = useState('')
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const activeOrder = orders.find(o => o.id === activeId) ?? null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const orderId = active.id as number
    const toStatus = over.id as ServiceOrderStatus
    const order = orders.find(o => o.id === orderId)
    if (!order || order.status === toStatus) return

    if (!VALID_TRANSITIONS[order.status].includes(toStatus)) {
      toast.error(
        order.status === 'open'
          ? 'Assign a technician first'
          : order.status === 'completed'
          ? 'Move to In Progress first — completed orders can only be reopened one step at a time'
          : 'Orders must move one step at a time'
      )
      return
    }

    if (toStatus === 'open') {
      try {
        await updateServiceOrder(orderId, { status: 'open', assigned_tech: null })
        onOrderUpdated()
        toast.success(
          order.assigned_tech
            ? `Moved to Open — ${order.assigned_tech} unassigned`
            : 'Moved to Open'
        )
      } catch {
        toast.error('Failed to update status')
      }
      return
    }

    if (toStatus === 'assigned') {
      if (order.assigned_tech) {
        try {
          await updateServiceOrder(orderId, { status: 'assigned' })
          onOrderUpdated()
          toast.success('Moved to Assigned')
        } catch {
          toast.error('Failed to update status')
        }
      } else {
        setPendingMove({ orderId, fromStatus: order.status })
      }
      return
    }

    try {
      await updateServiceOrder(orderId, { status: toStatus })
      onOrderUpdated()
      toast.success(`Moved to ${COLUMNS.find(c => c.id === toStatus)?.label}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleAssignConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingMove || !techName.trim()) return
    setSaving(true)
    try {
      await updateServiceOrder(pendingMove.orderId, {
        status: 'assigned',
        assigned_tech: techName.trim(),
      })
      setPendingMove(null)
      setTechName('')
      onOrderUpdated()
      toast.success('Technician assigned')
    } catch {
      toast.error('Failed to assign technician')
    } finally {
      setSaving(false)
    }
  }

  function handleAssignCancel() {
    setPendingMove(null)
    setTechName('')
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              orders={orders.filter(o => o.status === col.id)}
              activeId={activeId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOrder && <KanbanCard order={activeOrder} />}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={!!pendingMove}
        onOpenChange={open => { if (!open) handleAssignCancel() }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignConfirm} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="kanban-tech-name">Technician Name</Label>
              <Input
                id="kanban-tech-name"
                placeholder="e.g. Mike Rivera"
                value={techName}
                onChange={e => setTechName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter showCloseButton>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !techName.trim()}
              >
                {saving ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
