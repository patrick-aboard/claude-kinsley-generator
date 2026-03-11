import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { fetchGenerators, fetchGeneratorDetail } from '@/lib/api'
import type { Generator, GeneratorDetail, GeneratorStatus, ServiceOrderStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Config ─────────────────────────────────────────────────────────────────

const GEN_STATUS: Record<GeneratorStatus, { label: string; className: string }> = {
  operational: {
    label: 'Operational',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
  needs_service: {
    label: 'Needs Service',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  out_of_commission: {
    label: 'Out of Commission',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  },
}

const ORDER_STATUS: Record<ServiceOrderStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-muted text-muted-foreground border-border' },
  assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' },
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'operational', label: 'Operational' },
  { value: 'needs_service', label: 'Needs Service' },
  { value: 'out_of_commission', label: 'Out of Commission' },
] as const

type TabValue = (typeof STATUS_TABS)[number]['value']

// ── Expanded detail panel ─────────────────────────────────────────────────

function GeneratorDetailPanel({ generatorId }: { generatorId: number }) {
  const [detail, setDetail] = useState<GeneratorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGeneratorDetail(generatorId)
      .then(setDetail)
      .catch(() => toast.error('Failed to load generator details'))
      .finally(() => setLoading(false))
  }, [generatorId])

  if (loading) {
    return <p className="text-sm text-muted-foreground py-2">Loading...</p>
  }
  if (!detail) return null

  return (
    <div className="space-y-4">
      {/* Generator details grid */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs block mb-0.5">Manufacturer</span>
          {detail.manufacturer}
        </div>
        <div>
          <span className="text-muted-foreground text-xs block mb-0.5">Install Date</span>
          {format(new Date(detail.install_date), 'MMM d, yyyy')}
        </div>
        <div>
          <span className="text-muted-foreground text-xs block mb-0.5">Last Serviced</span>
          {detail.last_serviced
            ? format(new Date(detail.last_serviced), 'MMM d, yyyy')
            : <span className="text-muted-foreground">Never</span>}
        </div>
        <div>
          <span className="text-muted-foreground text-xs block mb-0.5">Client</span>
          {detail.client_name}
        </div>
        <div>
          <span className="text-muted-foreground text-xs block mb-0.5">Location</span>
          {detail.location}
        </div>
      </div>

      {/* Service history */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Service History
        </p>
        {detail.service_orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service orders on record.</p>
        ) : (
          <div className="rounded-md border divide-y text-sm">
            {detail.service_orders.map(order => {
              const badge = ORDER_STATUS[order.status]
              return (
                <div key={order.id} className="flex items-center gap-4 px-3 py-2.5">
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                  <span className="flex-1 text-wrap text-muted-foreground">
                    {order.problem_description}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </span>
                  <Link
                    to={`/service-orders/${order.id}`}
                    className="text-xs text-primary hover:underline shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    View →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function GeneratorDirectory() {
  const [generators, setGenerators] = useState<Generator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetchGenerators()
      .then(setGenerators)
      .catch(() => toast.error('Failed to load generators'))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: generators.length }
    for (const g of generators) {
      result[g.status] = (result[g.status] ?? 0) + 1
    }
    return result
  }, [generators])

  const filtered = useMemo(() => {
    let list = generators
    if (activeTab !== 'all') {
      list = list.filter(g => g.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        g =>
          g.serial_number.toLowerCase().includes(q) ||
          g.client_name.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          g.model.toLowerCase().includes(q)
      )
    }
    return list
  }, [generators, activeTab, search])

  function toggleExpand(id: number) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Generators</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} generator{filtered.length !== 1 ? 's' : ''}
        </span>
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
            placeholder="Search generators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-24">Serial #</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="w-32">Manufacturer</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-32">Last Serviced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No generators found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.flatMap(gen => {
                const badge = GEN_STATUS[gen.status] ?? GEN_STATUS.operational
                const isExpanded = expandedId === gen.id
                return [
                  <TableRow
                    key={gen.id}
                    className="cursor-pointer"
                    onClick={() => toggleExpand(gen.id)}
                  >
                    <TableCell className="text-muted-foreground/50 pr-0">
                      {isExpanded
                        ? <ChevronDownIcon className="size-3.5" />
                        : <ChevronRightIcon className="size-3.5" />}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {gen.serial_number}
                    </TableCell>
                    <TableCell className="text-sm">{gen.model}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {gen.manufacturer}
                    </TableCell>
                    <TableCell className="text-sm">{gen.client_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {gen.location}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {gen.last_serviced
                        ? format(new Date(gen.last_serviced), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>,

                  ...(isExpanded
                    ? [
                        <TableRow key={`${gen.id}-detail`} className="hover:bg-transparent bg-muted/20">
                          <TableCell />
                          <TableCell colSpan={7} className="pb-5 pt-3">
                            <GeneratorDetailPanel generatorId={gen.id} />
                          </TableCell>
                        </TableRow>,
                      ]
                    : []),
                ]
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
