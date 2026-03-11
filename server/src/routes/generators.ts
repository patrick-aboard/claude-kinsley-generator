import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

// GET /api/generators
router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { search, status } = req.query as Record<string, string>

  let query = 'SELECT * FROM generators WHERE 1=1'
  const params: string[] = []

  if (search) {
    query += ` AND (serial_number LIKE ? OR model LIKE ? OR client_name LIKE ? OR location LIKE ?)`
    const term = `%${search}%`
    params.push(term, term, term, term)
  }
  if (status) {
    query += ` AND status = ?`
    params.push(status)
  }
  query += ' ORDER BY serial_number'

  const generators = db.prepare(query).all(...params)
  res.json(generators)
})

// GET /api/generators/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const generator = db.prepare('SELECT * FROM generators WHERE id = ?').get(req.params.id)
  if (!generator) return res.status(404).json({ error: 'Generator not found' })

  const serviceOrders = db.prepare(`
    SELECT id, status, assigned_tech, problem_description, created_at, updated_at
    FROM service_orders
    WHERE generator_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id)

  res.json({ ...generator as object, service_orders: serviceOrders })
})

// POST /api/generators
router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { serial_number, model, manufacturer, client_name, location, install_date, last_serviced, status } = req.body
  if (!serial_number || !model || !manufacturer || !client_name || !location || !install_date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const result = db.prepare(`
    INSERT INTO generators (serial_number, model, manufacturer, client_name, location, install_date, last_serviced, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serial_number, model, manufacturer, client_name, location, install_date, last_serviced ?? null, status ?? 'operational')
  const created = db.prepare('SELECT * FROM generators WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(created)
})

export default router
