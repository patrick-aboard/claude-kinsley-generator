import express from 'express'
import cors from 'cors'
import { getDb } from './db/database'
import generatorsRouter from './routes/generators'
import serviceOrdersRouter from './routes/serviceOrders'
import partsInventoryRouter from './routes/partsInventory'
import partsRequestsRouter from './routes/partsRequests'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Initialize DB on startup
getDb()

app.use('/api/generators', generatorsRouter)
app.use('/api/service-orders', serviceOrdersRouter)
app.use('/api/parts', partsInventoryRouter)
app.use('/api/parts-requests', partsRequestsRouter)

app.listen(PORT, () => {
  console.log(`Kinsley server running on http://localhost:${PORT}`)
})
