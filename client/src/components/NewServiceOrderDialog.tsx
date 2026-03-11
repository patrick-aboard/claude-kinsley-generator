import { useState, useEffect } from 'react'
import { ChevronsUpDownIcon } from 'lucide-react'
import { fetchGenerators, createServiceOrder } from '@/lib/api'
import type { Generator } from '@/lib/types'
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
import { Textarea } from '@/components/ui/textarea'
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
  onCreated: () => void
}

export default function NewServiceOrderDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [generators, setGenerators] = useState<Generator[]>([])
  const [selected, setSelected] = useState<Generator | null>(null)
  const [comboOpen, setComboOpen] = useState(false)
  const [problem, setProblem] = useState('')
  const [tech, setTech] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchGenerators().then(setGenerators)
  }, [])

  function reset() {
    setSelected(null)
    setProblem('')
    setTech('')
    setComboOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !problem.trim()) return
    setSubmitting(true)
    try {
      await createServiceOrder({
        generator_id: selected.id,
        problem_description: problem.trim(),
        ...(tech.trim() ? { assigned_tech: tech.trim() } : {}),
      })
      reset()
      onOpenChange(false)
      onCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Service Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Generator selector */}
          <div className="space-y-1.5">
            <Label>Generator</Label>
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
                    ? `${selected.serial_number} — ${selected.client_name}`
                    : 'Select generator...'}
                </span>
                <ChevronsUpDownIcon className="size-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search by serial, client, location..." />
                  <CommandList>
                    <CommandEmpty>No generators found.</CommandEmpty>
                    <CommandGroup>
                      {generators.map(g => (
                        <CommandItem
                          key={g.id}
                          value={`${g.serial_number} ${g.client_name} ${g.location}`}
                          onSelect={() => {
                            setSelected(g)
                            setComboOpen(false)
                          }}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {g.serial_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {g.client_name} · {g.location}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Problem description */}
          <div className="space-y-1.5">
            <Label htmlFor="problem">Problem Description</Label>
            <Textarea
              id="problem"
              placeholder="Describe the issue..."
              value={problem}
              onChange={e => setProblem(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Technician */}
          <div className="space-y-1.5">
            <Label htmlFor="tech">
              Assign Technician{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="tech"
              placeholder="Technician name"
              value={tech}
              onChange={e => setTech(e.target.value)}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={submitting || !selected || !problem.trim()}
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
