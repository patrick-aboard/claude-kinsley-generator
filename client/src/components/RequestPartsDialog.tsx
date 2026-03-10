import { useState, useEffect } from 'react'
import { ChevronsUpDownIcon } from 'lucide-react'
import { fetchParts, createPartsRequest } from '@/lib/api'
import type { Part } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  onCreated: () => void
}

export default function RequestPartsDialog({
  open,
  onOpenChange,
  orderId,
  onCreated,
}: Props) {
  const [parts, setParts] = useState<Part[]>([])
  const [selected, setSelected] = useState<Part | null>(null)
  const [comboOpen, setComboOpen] = useState(false)
  const [qty, setQty] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchParts().then(setParts)
  }, [])

  function reset() {
    setSelected(null)
    setQty('1')
    setError(null)
    setComboOpen(false)
  }

  const parsedQty = parseInt(qty, 10)
  const maxQty = selected?.quantity_in_stock ?? 0
  const qtyInvalid =
    isNaN(parsedQty) || parsedQty < 1 || parsedQty > maxQty

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || qtyInvalid) return
    setSubmitting(true)
    setError(null)
    try {
      await createPartsRequest(orderId, {
        part_id: selected.id,
        quantity_requested: parsedQty,
      })
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Parts</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Part selector */}
          <div className="space-y-1.5">
            <Label>Part</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  />
                }
              >
                <span className={selected ? '' : 'text-muted-foreground'}>
                  {selected
                    ? `${selected.part_number} — ${selected.name}`
                    : 'Select part...'}
                </span>
                <ChevronsUpDownIcon className="size-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[440px] p-0">
                <Command>
                  <CommandInput placeholder="Search by name or part number..." />
                  <CommandList>
                    <CommandEmpty>No parts found.</CommandEmpty>
                    <CommandGroup>
                      {parts.map(p => (
                        <CommandItem
                          key={p.id}
                          value={`${p.part_number} ${p.name}`}
                          disabled={p.quantity_in_stock === 0}
                          onSelect={() => {
                            setSelected(p)
                            setQty('1')
                            setError(null)
                            setComboOpen(false)
                          }}
                        >
                          <div className="flex w-full items-center justify-between gap-4">
                            <div>
                              <div className="font-medium text-sm">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.part_number}
                              </div>
                            </div>
                            <span
                              className={
                                p.quantity_in_stock === 0
                                  ? 'text-xs text-destructive shrink-0'
                                  : 'text-xs text-muted-foreground shrink-0'
                              }
                            >
                              {p.quantity_in_stock === 0
                                ? 'Out of stock'
                                : `${p.quantity_in_stock} in stock`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={e => {
                setQty(e.target.value)
                setError(null)
              }}
              disabled={!selected}
              className="w-28"
            />
            {selected && (
              <p className="text-xs text-muted-foreground">
                {maxQty} available in stock
              </p>
            )}
            {selected && parsedQty > maxQty && (
              <p className="text-xs text-destructive">
                Cannot exceed available stock ({maxQty})
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={submitting || !selected || qtyInvalid}
            >
              {submitting ? 'Requesting...' : 'Request Part'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
