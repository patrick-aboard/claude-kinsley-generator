import express from 'express'
import cors from 'cors'
import path from 'path'
import { existsSync } from 'fs'
import { getDb } from './db/database'
import generatorsRouter from './routes/generators'
import serviceOrdersRouter from './routes/serviceOrders'
import partsInventoryRouter from './routes/partsInventory'
import partsRequestsRouter from './routes/partsRequests'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const CLIENT_DIST = path.join(import.meta.dir, '..', '..', 'client', 'dist')

app.use(cors())
app.use(express.json())

// Initialize DB on startup
getDb()

app.use('/api/generators', generatorsRouter)
app.use('/api/service-orders', serviceOrdersRouter)
app.use('/api/parts', partsInventoryRouter)
app.use('/api/parts-requests', partsRequestsRouter)

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Kinsley server running on http://localhost:${PORT}`)
})
