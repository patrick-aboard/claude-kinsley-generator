import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

// PATCH /api/parts-requests/:id/approve
router.patch('/:id/approve', (req: Request, res: Response) => {
  const db = getDb()

  const request = db.prepare(`
    SELECT pr.*, p.name AS part_name, p.quantity_in_stock
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined

  if (!request) return res.status(404).json({ error: 'Parts request not found' })
  if (request.status !== 'requested') return res.status(400).json({ error: 'Only requested parts can be approved' })

  if ((request.quantity_in_stock as number) < (request.quantity_requested as number)) {
    return res.status(400).json({ error: 'Insufficient stock to approve' })
  }

  const now = new Date().toISOString()
  const approve = db.transaction(() => {
    db.prepare(`UPDATE parts_requests SET status = 'approved' WHERE id = ?`).run(req.params.id)
    db.prepare(`UPDATE parts_inventory SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?`)
      .run(request.quantity_requested, request.part_id)
    db.prepare(`
      INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
      VALUES (?, ?, 'system', ?)
    `).run(request.service_order_id, now, `Parts approved: ${request.quantity_requested}x ${request.part_name}`)
  })

  approve()
  const updated = db.prepare(`
    SELECT pr.*, p.name AS part_name, p.part_number, p.quantity_in_stock
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.id = ?
  `).get(req.params.id)
  res.json(updated)
})

// PATCH /api/parts-requests/:id/deliver
router.patch('/:id/deliver', (req: Request, res: Response) => {
  const db = getDb()

  const request = db.prepare(`
    SELECT pr.*, p.name AS part_name
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined

  if (!request) return res.status(404).json({ error: 'Parts request not found' })
  if (request.status !== 'approved') return res.status(400).json({ error: 'Only approved parts can be marked delivered' })

  const now = new Date().toISOString()
  const deliver = db.transaction(() => {
    db.prepare(`UPDATE parts_requests SET status = 'delivered' WHERE id = ?`).run(req.params.id)
    db.prepare(`
      INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
      VALUES (?, ?, 'system', ?)
    `).run(request.service_order_id, now, `Parts delivered: ${request.quantity_requested}x ${request.part_name}`)
  })

  deliver()
  const updated = db.prepare(`
    SELECT pr.*, p.name AS part_name, p.part_number, p.quantity_in_stock
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.id = ?
  `).get(req.params.id)
  res.json(updated)
})

export default router
