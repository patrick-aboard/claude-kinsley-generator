import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

// GET /api/parts/categories — must be before /:id to avoid conflict
router.get('/categories', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare(`SELECT DISTINCT category FROM parts_inventory ORDER BY category`).all() as { category: string }[]
  res.json(rows.map(r => r.category))
})

// GET /api/parts
router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { search, category } = req.query as Record<string, string>

  let query = 'SELECT * FROM parts_inventory WHERE 1=1'
  const params: string[] = []

  if (search) {
    query += ` AND (name LIKE ? OR part_number LIKE ?)`
    const term = `%${search}%`
    params.push(term, term)
  }
  if (category) {
    query += ` AND category = ?`
    params.push(category)
  }
  query += ' ORDER BY category, part_number'

  const parts = db.prepare(query).all(...params)
  res.json(parts)
})

export default router
