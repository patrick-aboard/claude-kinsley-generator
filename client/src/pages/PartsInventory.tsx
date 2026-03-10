import { useState, useEffect, useMemo } from 'react'
import { SearchIcon, AlertTriangleIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchParts } from '@/lib/api'
import type { Part } from '@/lib/types'
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

const CATEGORY_COLORS: Record<string, string> = {
  Engine: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  Electrical: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  Cooling: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  'Fuel System': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  Filters: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  Hardware: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600',
  Exhaust: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600',
  'Control Panel': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
}

export default function PartsInventory() {
  const [parts, setParts] = useState<Part[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    Promise.all([
      fetchParts(),
      fetch('/api/parts/categories').then(r => r.json()) as Promise<string[]>,
    ])
      .then(([partsData, cats]) => {
        setParts(partsData)
        setCategories(cats)
      })
      .catch(() => toast.error('Failed to load parts inventory'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = parts
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.part_number.toLowerCase().includes(q)
      )
    }
    return list
  }, [parts, activeCategory, search])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Parts Inventory</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} part{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-7 w-56 text-sm"
            placeholder="Search parts..."
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
              <TableHead className="w-36">Part #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-36">Category</TableHead>
              <TableHead className="w-28 text-right">In Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No parts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(part => {
                const isOut = part.quantity_in_stock === 0
                const isLow =
                  !isOut && part.quantity_in_stock <= part.low_stock_threshold

                return (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {part.part_number}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {part.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CATEGORY_COLORS[part.category] ?? ''}
                      >
                        {part.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isOut ? (
                        <span className="inline-flex items-center justify-end gap-1 text-sm font-medium text-destructive">
                          <XCircleIcon className="size-3.5 shrink-0" />
                          Out of stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center justify-end gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangleIcon className="size-3.5 shrink-0" />
                          {part.quantity_in_stock}
                        </span>
                      ) : (
                        <span className="text-sm">{part.quantity_in_stock}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
