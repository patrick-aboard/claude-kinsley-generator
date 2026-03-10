import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

// GET /api/service-orders
router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { search, status } = req.query as Record<string, string>

  let query = `
    SELECT so.*, g.serial_number, g.client_name, g.location, g.model
    FROM service_orders so
    JOIN generators g ON so.generator_id = g.id
    WHERE 1=1
  `
  const params: string[] = []

  if (status) {
    query += ` AND so.status = ?`
    params.push(status)
  }
  if (search) {
    query += ` AND (g.serial_number LIKE ? OR g.client_name LIKE ? OR so.problem_description LIKE ?)`
    const term = `%${search}%`
    params.push(term, term, term)
  }
  query += ' ORDER BY so.created_at DESC'

  const orders = db.prepare(query).all(...params)
  res.json(orders)
})

// GET /api/service-orders/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const order = db.prepare(`
    SELECT so.*, g.serial_number, g.client_name, g.location, g.model, g.manufacturer
    FROM service_orders so
    JOIN generators g ON so.generator_id = g.id
    WHERE so.id = ?
  `).get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Service order not found' })

  const logs = db.prepare(`
    SELECT * FROM service_order_logs WHERE service_order_id = ? ORDER BY timestamp DESC
  `).all(req.params.id)

  const partsRequests = db.prepare(`
    SELECT pr.*, p.name AS part_name, p.part_number, p.quantity_in_stock
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.service_order_id = ?
    ORDER BY pr.created_at DESC
  `).all(req.params.id)

  res.json({ ...order as object, logs, parts_requests: partsRequests })
})

// POST /api/service-orders
router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { generator_id, problem_description, assigned_tech } = req.body
  if (!generator_id || !problem_description) {
    return res.status(400).json({ error: 'generator_id and problem_description are required' })
  }

  const generator = db.prepare('SELECT * FROM generators WHERE id = ?').get(generator_id)
  if (!generator) return res.status(404).json({ error: 'Generator not found' })

  const now = new Date().toISOString()
  const initialStatus = assigned_tech ? 'assigned' : 'open'

  const create = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO service_orders (generator_id, status, assigned_tech, problem_description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generator_id, initialStatus, assigned_tech ?? null, problem_description, now, now)

    const orderId = result.lastInsertRowid

    db.prepare(`
      INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
      VALUES (?, ?, 'system', 'Service order created.')
    `).run(orderId, now)

    if (assigned_tech) {
      db.prepare(`
        INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
        VALUES (?, ?, 'status_change', ?)
      `).run(orderId, now, `Status changed from open to assigned.`)
    }

    db.prepare(`UPDATE generators SET status = 'needs_service' WHERE id = ?`).run(generator_id)

    return orderId
  })

  const orderId = create()
  const created = db.prepare(`
    SELECT so.*, g.serial_number, g.client_name, g.location, g.model
    FROM service_orders so
    JOIN generators g ON so.generator_id = g.id
    WHERE so.id = ?
  `).get(orderId)

  res.status(201).json(created)
})

// PATCH /api/service-orders/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { status, assigned_tech, problem_description } = req.body

  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!order) return res.status(404).json({ error: 'Service order not found' })

  const now = new Date().toISOString()
  const newStatus = status ?? order.status
  const newTech = assigned_tech !== undefined ? assigned_tech : order.assigned_tech
  const newDesc = problem_description ?? order.problem_description
  const statusChanged = status && status !== order.status

  const update = db.transaction(() => {
    db.prepare(`
      UPDATE service_orders SET status = ?, assigned_tech = ?, problem_description = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, newTech, newDesc, now, req.params.id)

    if (statusChanged) {
      db.prepare(`
        INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
        VALUES (?, ?, 'status_change', ?)
      `).run(req.params.id, now, `Status changed from ${order.status} to ${status}.`)
    }

    if (status === 'completed') {
      db.prepare(`UPDATE generators SET status = 'operational', last_serviced = ? WHERE id = ?`)
        .run(now, order.generator_id)
    }
  })

  update()
  const updated = db.prepare(`
    SELECT so.*, g.serial_number, g.client_name, g.location, g.model
    FROM service_orders so
    JOIN generators g ON so.generator_id = g.id
    WHERE so.id = ?
  `).get(req.params.id)
  res.json(updated)
})

// POST /api/service-orders/:id/logs
router.post('/:id/logs', (req: Request, res: Response) => {
  const db = getDb()
  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  const order = db.prepare('SELECT id FROM service_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Service order not found' })

  const now = new Date().toISOString()
  const result = db.prepare(`
    INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
    VALUES (?, ?, 'note', ?)
  `).run(req.params.id, now, message)

  const log = db.prepare('SELECT * FROM service_order_logs WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(log)
})

// POST /api/service-orders/:id/parts-requests
router.post('/:id/parts-requests', (req: Request, res: Response) => {
  const db = getDb()
  const { part_id, quantity_requested } = req.body
  if (!part_id || !quantity_requested || quantity_requested < 1) {
    return res.status(400).json({ error: 'part_id and quantity_requested (>0) are required' })
  }

  const order = db.prepare('SELECT id FROM service_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Service order not found' })

  const part = db.prepare('SELECT * FROM parts_inventory WHERE id = ?').get(part_id) as Record<string, unknown> | undefined
  if (!part) return res.status(404).json({ error: 'Part not found' })

  if ((part.quantity_in_stock as number) < quantity_requested) {
    return res.status(400).json({ error: 'Insufficient stock' })
  }

  const now = new Date().toISOString()
  const create = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO parts_requests (service_order_id, part_id, quantity_requested, status, created_at)
      VALUES (?, ?, ?, 'requested', ?)
    `).run(req.params.id, part_id, quantity_requested, now)

    db.prepare(`
      INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
      VALUES (?, ?, 'parts_request', ?)
    `).run(req.params.id, now, `Parts request: ${quantity_requested}x ${part.name}`)

    return result.lastInsertRowid
  })

  const requestId = create()
  const created = db.prepare(`
    SELECT pr.*, p.name AS part_name, p.part_number, p.quantity_in_stock
    FROM parts_requests pr
    JOIN parts_inventory p ON pr.part_id = p.id
    WHERE pr.id = ?
  `).get(requestId)

  res.status(201).json(created)
})

export default router
