import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  CheckIcon,
  PackageIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  WrenchIcon,
  ClipboardCheckIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import {
  fetchServiceOrderDetail,
  updateServiceOrder,
  approvePartsRequest,
  deliverPartsRequest,
  addLogNote,
} from '@/lib/api'
import type { ServiceOrderDetail, ServiceOrderStatus, LogEntryType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import RequestPartsDialog from '@/components/RequestPartsDialog'

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ServiceOrderStatus, { label: string; className: string }> = {
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
  in_review: {
    label: 'In Review',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
}

const PARTS_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  requested: {
    label: 'Requested',
    className: 'bg-muted text-muted-foreground border-border',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
}

const LOG_TYPE_CONFIG: Record<
  LogEntryType,
  { label: string; icon: React.ReactNode }
> = {
  system: {
    label: 'System',
    icon: <ArrowRightIcon className="size-3" />,
  },
  status_change: {
    label: 'Status',
    icon: <ArrowRightIcon className="size-3" />,
  },
  parts_request: {
    label: 'Parts',
    icon: <PackageIcon className="size-3" />,
  },
  note: {
    label: 'Note',
    icon: <MessageSquareIcon className="size-3" />,
  },
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<ServiceOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Assign tech dialog
  const [assignOpen, setAssignOpen] = useState(false)
  const [techName, setTechName] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Parts request dialog
  const [partsDialogOpen, setPartsDialogOpen] = useState(false)

  // Activity log note
  const [note, setNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Status transition loading
  const [transitioning, setTransitioning] = useState(false)

  // Review panel
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Sent-back banner
  const [dismissedFeedbackId, setDismissedFeedbackId] = useState<number | null>(null)

  // Parts row action loading
  const [partsActionId, setPartsActionId] = useState<number | null>(null)

  const noteInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    if (!id) return Promise.resolve()
    return fetchServiceOrderDetail(id)
      .then(setOrder)
      .catch(() => toast.error('Failed to load service order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleStatusTransition(newStatus: ServiceOrderStatus) {
    if (!order) return
    setTransitioning(true)
    try {
      await updateServiceOrder(order.id, { status: newStatus })
      await load()
      toast.success(`Status updated to ${STATUS_BADGE[newStatus].label}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setTransitioning(false)
    }
  }

  async function handleAssignTech(e: React.FormEvent) {
    e.preventDefault()
    if (!order || !techName.trim()) return
    setAssigning(true)
    try {
      await updateServiceOrder(order.id, {
        status: 'assigned',
        assigned_tech: techName.trim(),
      })
      setAssignOpen(false)
      setTechName('')
      await load()
      toast.success('Technician assigned')
    } catch {
      toast.error('Failed to assign technician')
    } finally {
      setAssigning(false)
    }
  }

  async function handleApprove(reqId: number) {
    setPartsActionId(reqId)
    try {
      await approvePartsRequest(reqId)
      await load()
      toast.success('Parts request approved')
    } catch {
      toast.error('Failed to approve parts request')
    } finally {
      setPartsActionId(null)
    }
  }

  async function handleDeliver(reqId: number) {
    setPartsActionId(reqId)
    try {
      await deliverPartsRequest(reqId)
      await load()
      toast.success('Parts marked as delivered')
    } catch {
      toast.error('Failed to mark parts as delivered')
    } finally {
      setPartsActionId(null)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!order || !note.trim()) return
    setAddingNote(true)
    try {
      await addLogNote(order.id, note.trim())
      setNote('')
      await load()
    } catch {
      toast.error('Failed to add note')
    } finally {
      setAddingNote(false)
      noteInputRef.current?.focus()
    }
  }

async function handleReviewAction(action: 'approve' | 'send_back') {
    if (!order) return
    setReviewing(true)
    const newStatus: ServiceOrderStatus = action === 'approve' ? 'completed' : 'in_progress'
    try {
      if (reviewNotes.trim()) {
        const prefix = action === 'approve' ? 'Review approved: ' : 'Review feedback: '
        await addLogNote(order.id, prefix + reviewNotes.trim())
      }
      await updateServiceOrder(order.id, { status: newStatus })
      setReviewNotes('')
      await load()
      toast.success(action === 'approve' ? 'Order approved and completed' : 'Order sent back for rework')
    } catch {
      toast.error('Failed to process review action')
    } finally {
      setReviewing(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <Link
          to="/service-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Service Orders
        </Link>
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  const statusBadge = STATUS_BADGE[order.status]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        to="/service-orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-3.5" />
        Service Orders
      </Link>

      {/* ── Order Header ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold">
                Order #{order.id}
              </h1>
              <Badge variant="outline" className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.problem_description}
            </p>
          </div>

          {/* Status action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {order.status === 'open' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAssignOpen(true)}
                >
                  <WrenchIcon className="size-3.5" />
                  Assign Tech
                </Button>
                <Button
                  size="sm"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition('in_progress')}
                >
                  Start Work
                </Button>
              </>
            )}
            {order.status === 'assigned' && (
              <Button
                size="sm"
                disabled={transitioning}
                onClick={() => handleStatusTransition('in_progress')}
              >
                Start Work
              </Button>
            )}
            {order.status === 'in_progress' && (
              <Button
                size="sm"
                disabled={transitioning}
                onClick={() => handleStatusTransition('in_review')}
              >
                <ClipboardCheckIcon className="size-3.5" />
                Submit for Review
              </Button>
            )}
            {order.status === 'in_review' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium">
                <ClipboardCheckIcon className="size-3.5" />
                Pending Review
              </span>
            )}
            {order.status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckIcon className="size-3.5" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Review panel */}
        {order.status === 'in_review' && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20 space-y-4 p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheckIcon className="size-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-200">Pending Review</h2>
            </div>

            {/* Parts summary */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-purple-800/70 dark:text-purple-300/70 uppercase tracking-wide">Parts Used</p>
              {order.parts_requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts requested.</p>
              ) : (
                <div className="space-y-1">
                  {order.parts_requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between text-sm">
                      <span>{req.part_name} <span className="text-muted-foreground">×{req.quantity_requested}</span></span>
                      <Badge variant="outline" className={PARTS_STATUS_BADGE[req.status].className}>
                        {PARTS_STATUS_BADGE[req.status].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work log summary */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-purple-800/70 dark:text-purple-300/70 uppercase tracking-wide">Work Log</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {order.logs.map(entry => (
                  <div key={entry.id} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0 text-xs mt-0.5">
                      {format(new Date(entry.timestamp), 'MMM d h:mm a')}
                    </span>
                    <span className="text-foreground/80">{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewer notes */}
            <div className="space-y-1.5">
              <Label htmlFor="review-notes" className="text-xs font-medium text-purple-800/70 dark:text-purple-300/70 uppercase tracking-wide">
                Reviewer Notes
              </Label>
              <Textarea
                id="review-notes"
                placeholder="Add feedback or notes for the technician..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                className="text-sm resize-none bg-white dark:bg-background"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={reviewing}
                onClick={() => handleReviewAction('send_back')}
              >
                Send Back for Rework
              </Button>
              <Button
                size="sm"
                disabled={reviewing}
                onClick={() => handleReviewAction('approve')}
              >
                <CheckIcon className="size-3.5" />
                Approve & Complete
              </Button>
            </div>
          </div>
        )}

        {/* Sent-back banner */}
        {order.status === 'in_progress' && (() => {
          const feedback = order.logs.find(
            l => l.message.startsWith('Review feedback: ') && l.id !== dismissedFeedbackId
          )
          if (!feedback) return null
          return (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Sent Back for Rework</h2>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="text-amber-600 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                  onClick={() => setDismissedFeedbackId(feedback.id)}
                  aria-label="Dismiss"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300 pl-6">
                {feedback.message.replace('Review feedback: ', '')}
              </p>
            </div>
          )
        })()}

        {/* Generator info card */}
        <div className="rounded-lg border bg-muted/30 p-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Generator</span>
            <span className="font-medium">{order.serial_number}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Model</span>
            <span>{order.model}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Manufacturer</span>
            <span>{order.manufacturer}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Client</span>
            <span>{order.client_name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Location</span>
            <span>{order.location}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Technician</span>
            <span className={order.assigned_tech ? '' : 'text-muted-foreground'}>
              {order.assigned_tech ?? 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Created</span>
            <span>{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* ── Parts Requests ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Parts Requests</h2>
          {order.status !== 'completed' && order.status !== 'in_review' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPartsDialogOpen(true)}
            >
              <PackageIcon className="size-3.5" />
              Request Parts
            </Button>
          )}
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Part #</TableHead>
                <TableHead className="w-20 text-right">Qty</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.parts_requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8 text-sm"
                  >
                    No parts requested yet.
                  </TableCell>
                </TableRow>
              ) : (
                order.parts_requests.map(req => {
                  const badge = PARTS_STATUS_BADGE[req.status]
                  const busy = partsActionId === req.id
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-sm">
                        {req.part_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.part_number}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {req.quantity_requested}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'requested' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleApprove(req.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {req.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleDeliver(req.id)}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        {req.status === 'delivered' && (
                          <CheckIcon className="size-4 text-green-600 ml-auto mr-0 block" />
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

      {/* ── Activity Log ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Activity</h2>

        {/* Add note */}
        {order.status !== 'completed' && order.status !== 'in_review' && (
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              ref={noteInputRef}
              placeholder="Add a note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={addingNote || !note.trim()}
            >
              {addingNote ? 'Adding...' : 'Add Note'}
            </Button>
          </form>
        )}

        {/* Log entries */}
        <div className="space-y-0 rounded-lg border divide-y">
          {order.logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            order.logs.map(entry => {
              const config = LOG_TYPE_CONFIG[entry.entry_type]
              return (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex shrink-0 items-center gap-1 text-muted-foreground/60">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm leading-snug">{entry.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60 uppercase tracking-wide font-medium">
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Assign Tech Dialog ───────────────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignTech} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="tech-name">Technician Name</Label>
              <Input
                id="tech-name"
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
                disabled={assigning || !techName.trim()}
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Request Parts Dialog ─────────────────────────────────────────── */}
      <RequestPartsDialog
        open={partsDialogOpen}
        onOpenChange={setPartsDialogOpen}
        orderId={order.id}
        onCreated={() => {
          load()
          toast.success('Parts request created')
        }}
      />
    </div>
  )
}
