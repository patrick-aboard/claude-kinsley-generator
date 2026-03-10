import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchServiceOrders } from '@/lib/api'
import type { ServiceOrder, ServiceOrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import NewServiceOrderDialog from '@/components/NewServiceOrderDialog'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const

type TabValue = (typeof STATUS_TABS)[number]['value']

const STATUS_BADGE: Record<
  ServiceOrderStatus,
  { label: string; className: string }
> = {
  open: {
    label: 'Open',
    className: 'bg-muted text-muted-foreground border-border',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
}

export default function ServiceOrdersDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = () => {
    fetchServiceOrders()
      .then(setOrders)
      .catch(() => toast.error('Failed to load service orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      result[o.status] = (result[o.status] ?? 0) + 1
    }
    return result
  }, [orders])

  const filtered = useMemo(() => {
    let list = orders
    if (activeTab !== 'all') {
      list = list.filter(o => o.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        o =>
          o.serial_number.toLowerCase().includes(q) ||
          o.client_name.toLowerCase().includes(q) ||
          o.problem_description.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, activeTab, search])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Service Orders</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-3.5" />
          New Service Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
          <TabsList>
            {STATUS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <span className="ml-1 tabular-nums opacity-50 text-[11px]">
                  {counts[tab.value] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-7 w-56 text-sm"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Status</TableHead>
              <TableHead>Generator</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead className="w-32">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-10"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-10"
                >
                  No service orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(order => {
                const badge = STATUS_BADGE[order.status]
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/service-orders/${order.id}`)}
                  >
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {order.serial_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.client_name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm line-clamp-1 block">
                        {order.problem_description}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.assigned_tech ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <NewServiceOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          load()
          toast.success('Service order created')
        }}
      />
    </div>
  )
}
