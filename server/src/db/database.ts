import { Database } from 'bun:sqlite'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(import.meta.dir, '..', '..', 'kinsley.db')
const SCHEMA_PATH = path.join(import.meta.dir, 'schema.sql')

let db: Database

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
    initSchema()
    seedIfEmpty()
  }
  return db
}

function initSchema() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8')
  db.exec(schema)
}

function seedIfEmpty() {
  const count = (db.query('SELECT COUNT(*) as c FROM generators').get() as { c: number }).c
  if (count > 0) return

  const insertGenerator = db.prepare(`
    INSERT INTO generators (serial_number, model, manufacturer, client_name, location, install_date, last_serviced, status)
    VALUES ($serial_number, $model, $manufacturer, $client_name, $location, $install_date, $last_serviced, $status)
  `)

  const generators = [
    { $serial_number: 'KG-1001', $model: 'C15 500kW', $manufacturer: 'Caterpillar', $client_name: 'Verizon', $location: 'Newark Data Center', $install_date: '2019-04-12', $last_serviced: '2025-11-03', $status: 'operational' },
    { $serial_number: 'KG-1002', $model: 'QSK60 2000kW', $manufacturer: 'Cummins', $client_name: 'Mount Sinai Health', $location: 'Main Hospital Campus', $install_date: '2018-07-22', $last_serviced: '2026-02-22', $status: 'operational' },
    { $serial_number: 'KG-1003', $model: 'MTU 12V2000 G65', $manufacturer: 'Rolls-Royce', $client_name: 'JPMorgan Chase', $location: 'Midtown Trading Floor', $install_date: '2020-01-15', $last_serviced: '2025-09-14', $status: 'needs_service' },
    { $serial_number: 'KG-1004', $model: '3512C 1500kW', $manufacturer: 'Caterpillar', $client_name: 'Columbia University', $location: 'Morningside Heights Campus', $install_date: '2017-10-30', $last_serviced: '2025-08-20', $status: 'operational' },
    { $serial_number: 'KG-1005', $model: 'C32 1000kW', $manufacturer: 'Caterpillar', $client_name: 'Equinix', $location: 'Secaucus NJ Data Center', $install_date: '2021-03-08', $last_serviced: '2025-12-01', $status: 'needs_service' },
    { $serial_number: 'KG-1006', $model: 'QSK78 2500kW', $manufacturer: 'Cummins', $client_name: 'NYC Health + Hospitals', $location: 'Bellevue Hospital', $install_date: '2016-06-18', $last_serviced: '2025-07-30', $status: 'needs_service' },
    { $serial_number: 'KG-1007', $model: 'S16R-PTA 2000kW', $manufacturer: 'Mitsubishi', $client_name: 'Brookfield Properties', $location: 'Manhattan West Tower', $install_date: '2022-05-14', $last_serviced: '2026-01-10', $status: 'operational' },
    { $serial_number: 'KG-1008', $model: '4012-46TAG2A 1350kW', $manufacturer: 'Perkins', $client_name: 'Verizon', $location: 'Financial District Hub', $install_date: '2019-11-25', $last_serviced: '2025-10-18', $status: 'operational' },
    { $serial_number: 'KG-1009', $model: 'C9.3 250kW', $manufacturer: 'Caterpillar', $client_name: 'NYU Langone', $location: 'Tisch Hospital', $install_date: '2023-02-06', $last_serviced: null, $status: 'out_of_commission' },
    { $serial_number: 'KG-1010', $model: 'QST30 1000kW', $manufacturer: 'Cummins', $client_name: 'Related Companies', $location: 'Hudson Yards Complex', $install_date: '2020-09-01', $last_serviced: '2025-06-15', $status: 'operational' },
  ]

  const seedGenerators = db.transaction(() => {
    for (const g of generators) insertGenerator.run(g)
  })
  seedGenerators()

  // ── Parts Inventory (150 parts) ──────────────────────────────────────────
  const insertPart = db.prepare(`
    INSERT INTO parts_inventory (part_number, name, category, quantity_in_stock, low_stock_threshold)
    VALUES ($part_number, $name, $category, $quantity_in_stock, $low_stock_threshold)
  `)

  const parts = [
    // Engine (25)
    { $part_number: 'KP-ENG-001', $name: 'Piston Ring Set — 6-Cylinder', $category: 'Engine', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-002', $name: 'Cylinder Head Gasket Kit', $category: 'Engine', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-003', $name: 'Connecting Rod Assembly', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-004', $name: 'Crankshaft Main Bearing Set', $category: 'Engine', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-005', $name: 'Valve Spring Set', $category: 'Engine', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-ENG-006', $name: 'Camshaft Assembly', $category: 'Engine', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-007', $name: 'Engine Block Heater 1000W', $category: 'Engine', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-008', $name: 'Turbocharger Cartridge', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-009', $name: 'Fuel Injector Nozzle', $category: 'Engine', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-ENG-010', $name: 'Rocker Arm Assembly', $category: 'Engine', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-ENG-011', $name: 'Timing Chain Kit', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-012', $name: 'Oil Pump Assembly', $category: 'Engine', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-013', $name: 'Cylinder Liner Set — 6pc', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-014', $name: 'Push Rod Set', $category: 'Engine', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-015', $name: 'Valve Cover Gasket Set', $category: 'Engine', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-ENG-016', $name: 'Intake Manifold Gasket', $category: 'Engine', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-ENG-017', $name: 'Engine Mount Kit', $category: 'Engine', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-018', $name: 'Crankshaft Rear Seal Kit', $category: 'Engine', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-019', $name: 'Piston Assembly — Complete', $category: 'Engine', $quantity_in_stock: 0, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-020', $name: 'Flywheel Ring Gear', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-021', $name: 'Engine Oil Cooler Core', $category: 'Engine', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-022', $name: 'Intercooler Assembly', $category: 'Engine', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-023', $name: 'Vibration Damper — Crankshaft', $category: 'Engine', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-ENG-024', $name: 'Cylinder Head Bolt Set', $category: 'Engine', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ENG-025', $name: 'Connecting Rod Bearing Set', $category: 'Engine', $quantity_in_stock: 5, $low_stock_threshold: 3 },

    // Electrical (25)
    { $part_number: 'KP-ELC-001', $name: 'Automatic Voltage Regulator (AVR)', $category: 'Electrical', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-002', $name: 'Starter Motor Assembly 24V', $category: 'Electrical', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-003', $name: 'Alternator Rectifier Bridge', $category: 'Electrical', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-004', $name: 'Battery Charger 24V 20A', $category: 'Electrical', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-005', $name: 'Transfer Switch Contactor 400A', $category: 'Electrical', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-006', $name: 'Control Panel Display HMI', $category: 'Electrical', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-007', $name: 'Main Wiring Harness Assembly', $category: 'Electrical', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-008', $name: 'Main Circuit Breaker 400A', $category: 'Electrical', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-009', $name: 'Relay Module 24VDC', $category: 'Electrical', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-ELC-010', $name: 'Solenoid Valve 24VDC', $category: 'Electrical', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-ELC-011', $name: 'Battery 12V 200Ah AGM', $category: 'Electrical', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-012', $name: 'Alternator Assembly 24V 70A', $category: 'Electrical', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-013', $name: 'Current Transformer 200/5A', $category: 'Electrical', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-014', $name: 'Magnetic Pickup Sensor', $category: 'Electrical', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-015', $name: 'Excitation Rheostat', $category: 'Electrical', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-016', $name: 'Contactor 3-Phase 200A', $category: 'Electrical', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-017', $name: 'Terminal Block 20-Circuit', $category: 'Electrical', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-ELC-018', $name: 'Copper Bus Bar 150A', $category: 'Electrical', $quantity_in_stock: 0, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-019', $name: 'Capacitor Bank 25kVAR', $category: 'Electrical', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-020', $name: 'Generator Output Breaker 800A', $category: 'Electrical', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-ELC-021', $name: 'Fuse Block Assembly 12-Way', $category: 'Electrical', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-ELC-022', $name: 'Diode Assembly — Rotating Rectifier', $category: 'Electrical', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-ELC-023', $name: 'Resistor Network — Damping', $category: 'Electrical', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-ELC-024', $name: 'Cable Lug Kit — Assorted', $category: 'Electrical', $quantity_in_stock: 10, $low_stock_threshold: 5 },
    { $part_number: 'KP-ELC-025', $name: 'Contactor Coil 24VDC Replacement', $category: 'Electrical', $quantity_in_stock: 6, $low_stock_threshold: 3 },

    // Cooling (20)
    { $part_number: 'KP-CLG-001', $name: 'Radiator Core Assembly', $category: 'Cooling', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-CLG-002', $name: 'Water Pump Assembly', $category: 'Cooling', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-003', $name: 'Thermostat 82°C', $category: 'Cooling', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-CLG-004', $name: 'Coolant Hose — Upper Radiator', $category: 'Cooling', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-CLG-005', $name: 'Coolant Hose — Lower Radiator', $category: 'Cooling', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-CLG-006', $name: 'Fan Belt — Drive', $category: 'Cooling', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-CLG-007', $name: 'Fan Blade Assembly 28"', $category: 'Cooling', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CLG-008', $name: 'Coolant Temperature Sensor', $category: 'Cooling', $quantity_in_stock: 7, $low_stock_threshold: 3 },
    { $part_number: 'KP-CLG-009', $name: 'Coolant Expansion Tank', $category: 'Cooling', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-010', $name: 'Radiator Cap 13 PSI', $category: 'Cooling', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-CLG-011', $name: 'Coolant Hose — Bypass', $category: 'Cooling', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-012', $name: 'Water Pump Seal Kit', $category: 'Cooling', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-013', $name: 'Fan Clutch Assembly', $category: 'Cooling', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CLG-014', $name: 'Radiator Hose Clamp Kit', $category: 'Cooling', $quantity_in_stock: 12, $low_stock_threshold: 5 },
    { $part_number: 'KP-CLG-015', $name: 'Coolant Concentration Tester', $category: 'Cooling', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-016', $name: 'Heat Exchanger Core', $category: 'Cooling', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-CLG-017', $name: 'Coolant Spin-On Filter', $category: 'Cooling', $quantity_in_stock: 10, $low_stock_threshold: 5 },
    { $part_number: 'KP-CLG-018', $name: 'Pressure Relief Valve — Cooling', $category: 'Cooling', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-CLG-019', $name: 'Expansion Tank Cap — Pressurized', $category: 'Cooling', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-CLG-020', $name: 'Jacket Water Heater 2000W', $category: 'Cooling', $quantity_in_stock: 3, $low_stock_threshold: 1 },

    // Fuel System (20)
    { $part_number: 'KP-FUL-001', $name: 'Fuel Injector Assembly', $category: 'Fuel System', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-002', $name: 'Fuel Filter — Primary', $category: 'Fuel System', $quantity_in_stock: 15, $low_stock_threshold: 6 },
    { $part_number: 'KP-FUL-003', $name: 'Fuel Transfer Pump', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-FUL-004', $name: 'Fuel Supply Line 3/8"', $category: 'Fuel System', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-FUL-005', $name: 'Fuel Pressure Regulator', $category: 'Fuel System', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-006', $name: 'Fuel Tank Level Sensor', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-007', $name: 'Fuel Priming Pump — Manual', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-008', $name: 'Injector Return Line Kit', $category: 'Fuel System', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-009', $name: 'Fuel Shutoff Solenoid 24V', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-010', $name: 'Fuel Water Separator Assembly', $category: 'Fuel System', $quantity_in_stock: 10, $low_stock_threshold: 5 },
    { $part_number: 'KP-FUL-011', $name: 'Fuel Day Tank — 50 Gallon', $category: 'Fuel System', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-FUL-012', $name: 'Fuel Lift Pump Assembly', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-FUL-013', $name: 'Fuel Rail Assembly', $category: 'Fuel System', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-FUL-014', $name: 'Injector Sleeve Kit', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-015', $name: 'Fuel System Fitting Kit', $category: 'Fuel System', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-FUL-016', $name: 'Flexible Fuel Line 24"', $category: 'Fuel System', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-FUL-017', $name: 'Fuel Pressure Gauge 0-100 PSI', $category: 'Fuel System', $quantity_in_stock: 5, $low_stock_threshold: 3 },
    { $part_number: 'KP-FUL-018', $name: 'Fuel Pump Drive Coupling', $category: 'Fuel System', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-FUL-019', $name: 'Fuel Tank Vent Valve', $category: 'Fuel System', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-FUL-020', $name: 'Low Fuel Level Alarm Switch', $category: 'Fuel System', $quantity_in_stock: 0, $low_stock_threshold: 2 },

    // Filters (15)
    { $part_number: 'KP-FLT-001', $name: 'Engine Oil Filter', $category: 'Filters', $quantity_in_stock: 25, $low_stock_threshold: 10 },
    { $part_number: 'KP-FLT-002', $name: 'Air Filter — Primary Element', $category: 'Filters', $quantity_in_stock: 18, $low_stock_threshold: 8 },
    { $part_number: 'KP-FLT-003', $name: 'Air Filter — Safety Element', $category: 'Filters', $quantity_in_stock: 15, $low_stock_threshold: 6 },
    { $part_number: 'KP-FLT-004', $name: 'Fuel Water Separator Filter', $category: 'Filters', $quantity_in_stock: 20, $low_stock_threshold: 8 },
    { $part_number: 'KP-FLT-005', $name: 'Hydraulic Return Filter', $category: 'Filters', $quantity_in_stock: 12, $low_stock_threshold: 5 },
    { $part_number: 'KP-FLT-006', $name: 'Crankcase Breather Filter', $category: 'Filters', $quantity_in_stock: 14, $low_stock_threshold: 6 },
    { $part_number: 'KP-FLT-007', $name: 'Filter Housing — Engine Oil', $category: 'Filters', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-FLT-008', $name: 'Filter Head Adapter', $category: 'Filters', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-FLT-009', $name: 'Air Filter Housing Assembly', $category: 'Filters', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-FLT-010', $name: 'Bypass Oil Filter Element', $category: 'Filters', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-FLT-011', $name: 'Lube Oil Filter — Spin-On', $category: 'Filters', $quantity_in_stock: 20, $low_stock_threshold: 8 },
    { $part_number: 'KP-FLT-012', $name: 'Differential Pressure Indicator', $category: 'Filters', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-FLT-013', $name: 'Filter Mounting Bracket', $category: 'Filters', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-FLT-014', $name: 'Air Restriction Indicator', $category: 'Filters', $quantity_in_stock: 7, $low_stock_threshold: 3 },
    { $part_number: 'KP-FLT-015', $name: 'Combo Filter Kit — Oil + Air', $category: 'Filters', $quantity_in_stock: 6, $low_stock_threshold: 3 },

    // Hardware (15)
    { $part_number: 'KP-HDW-001', $name: 'Mounting Bolt Kit M12 — 50pc', $category: 'Hardware', $quantity_in_stock: 30, $low_stock_threshold: 10 },
    { $part_number: 'KP-HDW-002', $name: 'Vibration Isolator 2" — Anti-Vibe', $category: 'Hardware', $quantity_in_stock: 20, $low_stock_threshold: 8 },
    { $part_number: 'KP-HDW-003', $name: 'Engine Gasket Set — Complete', $category: 'Hardware', $quantity_in_stock: 8, $low_stock_threshold: 3 },
    { $part_number: 'KP-HDW-004', $name: 'O-Ring Kit — Assorted 200pc', $category: 'Hardware', $quantity_in_stock: 15, $low_stock_threshold: 5 },
    { $part_number: 'KP-HDW-005', $name: 'Hose Clamp — Stainless 2" 10pk', $category: 'Hardware', $quantity_in_stock: 35, $low_stock_threshold: 12 },
    { $part_number: 'KP-HDW-006', $name: 'Coupling Guard — Split Half', $category: 'Hardware', $quantity_in_stock: 8, $low_stock_threshold: 3 },
    { $part_number: 'KP-HDW-007', $name: 'Flexible Connector 4" Flanged', $category: 'Hardware', $quantity_in_stock: 6, $low_stock_threshold: 2 },
    { $part_number: 'KP-HDW-008', $name: 'Mounting Bolt Kit M16 — 30pc', $category: 'Hardware', $quantity_in_stock: 25, $low_stock_threshold: 8 },
    { $part_number: 'KP-HDW-009', $name: 'Vibration Isolator 3" — Heavy Duty', $category: 'Hardware', $quantity_in_stock: 18, $low_stock_threshold: 6 },
    { $part_number: 'KP-HDW-010', $name: 'Copper Crush Washer Kit — 50pc', $category: 'Hardware', $quantity_in_stock: 20, $low_stock_threshold: 8 },
    { $part_number: 'KP-HDW-011', $name: 'Allen Key Set — Metric 9pc', $category: 'Hardware', $quantity_in_stock: 10, $low_stock_threshold: 4 },
    { $part_number: 'KP-HDW-012', $name: 'Safety Cable Kit — Stainless', $category: 'Hardware', $quantity_in_stock: 12, $low_stock_threshold: 5 },
    { $part_number: 'KP-HDW-013', $name: 'Anti-Vibration Pad — 12x12"', $category: 'Hardware', $quantity_in_stock: 22, $low_stock_threshold: 8 },
    { $part_number: 'KP-HDW-014', $name: 'Hex Nut Kit M12 — 100pc', $category: 'Hardware', $quantity_in_stock: 40, $low_stock_threshold: 15 },
    { $part_number: 'KP-HDW-015', $name: 'Thread Repair Insert Kit — Heli-Coil', $category: 'Hardware', $quantity_in_stock: 8, $low_stock_threshold: 3 },

    // Exhaust (15)
    { $part_number: 'KP-EXH-001', $name: 'Exhaust Manifold Gasket Set', $category: 'Exhaust', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-EXH-002', $name: 'Muffler — Critical Silenced Grade', $category: 'Exhaust', $quantity_in_stock: 1, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-003', $name: 'Flex Connector — 6" Diameter', $category: 'Exhaust', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-EXH-004', $name: 'Exhaust Bellows 8" — Stainless', $category: 'Exhaust', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-005', $name: 'Rain Cap 6" — Stainless Steel', $category: 'Exhaust', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-EXH-006', $name: 'Exhaust Gas Temperature Sensor', $category: 'Exhaust', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-EXH-007', $name: 'Exhaust Manifold Stud Kit', $category: 'Exhaust', $quantity_in_stock: 8, $low_stock_threshold: 4 },
    { $part_number: 'KP-EXH-008', $name: 'Expansion Joint 8" — Weld Neck', $category: 'Exhaust', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-009', $name: 'Exhaust Elbow 90° — Cast Iron', $category: 'Exhaust', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-010', $name: 'Muffler — Residential Grade', $category: 'Exhaust', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-011', $name: 'Flex Pipe — Stainless 24"', $category: 'Exhaust', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-EXH-012', $name: 'Exhaust Clamp Kit — 6" 5pk', $category: 'Exhaust', $quantity_in_stock: 10, $low_stock_threshold: 4 },
    { $part_number: 'KP-EXH-013', $name: 'Stack Termination Cap — Louvered', $category: 'Exhaust', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-EXH-014', $name: 'Exhaust Insulation Wrap — 50ft Roll', $category: 'Exhaust', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-EXH-015', $name: 'Catalytic Oxidizer Module', $category: 'Exhaust', $quantity_in_stock: 0, $low_stock_threshold: 1 },

    // Control Panel (15)
    { $part_number: 'KP-CTL-001', $name: 'HMI Display Panel 7" Color Touch', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-002', $name: 'PLC Controller Module', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-003', $name: 'Electronic Governor Actuator', $category: 'Control Panel', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-004', $name: 'Speed Sensor — Magnetic Pickup', $category: 'Control Panel', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-CTL-005', $name: 'Emergency Stop Button — Latching', $category: 'Control Panel', $quantity_in_stock: 6, $low_stock_threshold: 3 },
    { $part_number: 'KP-CTL-006', $name: 'Annunciator Panel — 16 Point', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-007', $name: 'Load Sharing Module', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-008', $name: 'AMF Automatic Mains Failure Controller', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-009', $name: 'Digital Power Meter — 3-Phase', $category: 'Control Panel', $quantity_in_stock: 3, $low_stock_threshold: 2 },
    { $part_number: 'KP-CTL-010', $name: 'Sync Check Relay', $category: 'Control Panel', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-011', $name: 'Battery Management Module', $category: 'Control Panel', $quantity_in_stock: 3, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-012', $name: 'Remote Monitoring Display Panel', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
    { $part_number: 'KP-CTL-013', $name: 'Control Panel Door Gasket Kit', $category: 'Control Panel', $quantity_in_stock: 4, $low_stock_threshold: 2 },
    { $part_number: 'KP-CTL-014', $name: 'Panel Cooling Fan 120mm', $category: 'Control Panel', $quantity_in_stock: 5, $low_stock_threshold: 2 },
    { $part_number: 'KP-CTL-015', $name: 'Logic Controller Module — Expansion', $category: 'Control Panel', $quantity_in_stock: 2, $low_stock_threshold: 1 },
  ]

  const seedParts = db.transaction(() => {
    for (const p of parts) insertPart.run(p)
  })
  seedParts()

  // ── Sample Service Orders ────────────────────────────────────────────────
  const insertOrder = db.prepare(`
    INSERT INTO service_orders (generator_id, status, assigned_tech, problem_description, created_at, updated_at)
    VALUES ($generator_id, $status, $assigned_tech, $problem_description, $created_at, $updated_at)
  `)
  const insertLog = db.prepare(`
    INSERT INTO service_order_logs (service_order_id, timestamp, entry_type, message)
    VALUES ($service_order_id, $timestamp, $entry_type, $message)
  `)
  const insertPartRequest = db.prepare(`
    INSERT INTO parts_requests (service_order_id, part_id, quantity_requested, status, created_at)
    VALUES ($service_order_id, $part_id, $quantity_requested, $status, $created_at)
  `)
  const updateGeneratorStatus = db.prepare(`UPDATE generators SET status = $status WHERE id = $id`)
  const updatePartStock = db.prepare(`UPDATE parts_inventory SET quantity_in_stock = quantity_in_stock - $qty WHERE id = $id`)

  const seedOrders = db.transaction(() => {
    // Order 1: Completed — KG-1002 (Mount Sinai), generator_id=2
    const o1 = insertOrder.run({
      $generator_id: 2, $status: 'completed', $assigned_tech: 'Mike Rivera',
      $problem_description: 'Coolant leak detected during routine inspection — puddle observed beneath radiator, potential failed hose or gasket.',
      $created_at: '2026-02-15T08:30:00.000Z', $updated_at: '2026-02-22T16:45:00.000Z',
    })
    const o1id = o1.lastInsertRowid
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-15T08:30:00.000Z', $entry_type: 'system', $message: 'Service order created.' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-15T09:00:00.000Z', $entry_type: 'status_change', $message: 'Status changed from open to assigned.' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-17T07:15:00.000Z', $entry_type: 'status_change', $message: 'Status changed from assigned to in_progress.' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-17T10:30:00.000Z', $entry_type: 'parts_request', $message: 'Parts request: 2x Coolant Hose — Upper Radiator' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-18T09:00:00.000Z', $entry_type: 'parts_request', $message: 'Parts request: 1x Water Pump Seal Kit' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-18T14:00:00.000Z', $entry_type: 'note', $message: 'Upper radiator hose replaced. Seal kit installed on water pump. Topping up coolant now.' })
    insertLog.run({ $service_order_id: o1id, $timestamp: '2026-02-22T16:45:00.000Z', $entry_type: 'status_change', $message: 'Status changed from in_progress to completed.' })
    // KP-CLG-004 = id 54, KP-CLG-012 = id 62 (Engine 25 + Elec 25 = 50; CLG starts at 51)
    insertPartRequest.run({ $service_order_id: o1id, $part_id: 54, $quantity_requested: 2, $status: 'delivered', $created_at: '2026-02-17T10:30:00.000Z' })
    insertPartRequest.run({ $service_order_id: o1id, $part_id: 62, $quantity_requested: 1, $status: 'delivered', $created_at: '2026-02-18T09:00:00.000Z' })
    updatePartStock.run({ $qty: 2, $id: 54 })
    updatePartStock.run({ $qty: 1, $id: 62 })

    // Order 2: In Progress — KG-1006 (Bellevue), generator_id=6
    updateGeneratorStatus.run({ $status: 'needs_service', $id: 6 })
    const o2 = insertOrder.run({
      $generator_id: 6, $status: 'in_progress', $assigned_tech: 'Sarah Chen',
      $problem_description: 'Generator failed to start during monthly load test. Cranks but does not fire. Suspect fuel delivery issue or solenoid fault.',
      $created_at: '2026-03-05T11:00:00.000Z', $updated_at: '2026-03-07T08:30:00.000Z',
    })
    const o2id = o2.lastInsertRowid
    insertLog.run({ $service_order_id: o2id, $timestamp: '2026-03-05T11:00:00.000Z', $entry_type: 'system', $message: 'Service order created.' })
    insertLog.run({ $service_order_id: o2id, $timestamp: '2026-03-06T09:00:00.000Z', $entry_type: 'status_change', $message: 'Status changed from open to assigned.' })
    insertLog.run({ $service_order_id: o2id, $timestamp: '2026-03-07T08:30:00.000Z', $entry_type: 'status_change', $message: 'Status changed from assigned to in_progress.' })
    insertLog.run({ $service_order_id: o2id, $timestamp: '2026-03-07T10:15:00.000Z', $entry_type: 'parts_request', $message: 'Parts request: 1x Fuel Shutoff Solenoid 24V' })
    insertLog.run({ $service_order_id: o2id, $timestamp: '2026-03-08T09:00:00.000Z', $entry_type: 'note', $message: 'Confirmed fuel is reaching the rail. Solenoid tested — not opening under command. Replacement approved, awaiting delivery.' })
    // KP-FUL-009 = id 79 (Engine 25 + Elec 25 + Cooling 20 = 70; FUL starts at 71)
    insertPartRequest.run({ $service_order_id: o2id, $part_id: 79, $quantity_requested: 1, $status: 'approved', $created_at: '2026-03-07T10:15:00.000Z' })
    updatePartStock.run({ $qty: 1, $id: 79 })

    // Order 3: Assigned — KG-1005 (Equinix), generator_id=5
    updateGeneratorStatus.run({ $status: 'needs_service', $id: 5 })
    const o3 = insertOrder.run({
      $generator_id: 5, $status: 'assigned', $assigned_tech: 'James Wright',
      $problem_description: 'Abnormal vibration reported by facility team during weekly run test. Vibration increases under load above 60%.',
      $created_at: '2026-03-09T13:00:00.000Z', $updated_at: '2026-03-09T14:00:00.000Z',
    })
    const o3id = o3.lastInsertRowid
    insertLog.run({ $service_order_id: o3id, $timestamp: '2026-03-09T13:00:00.000Z', $entry_type: 'system', $message: 'Service order created.' })
    insertLog.run({ $service_order_id: o3id, $timestamp: '2026-03-09T14:00:00.000Z', $entry_type: 'status_change', $message: 'Status changed from open to assigned.' })

    // Order 4: Open — KG-1003 (JPMorgan), generator_id=3
    updateGeneratorStatus.run({ $status: 'needs_service', $id: 3 })
    const o4 = insertOrder.run({
      $generator_id: 3, $status: 'open', $assigned_tech: null,
      $problem_description: 'Voltage output fluctuation reported under load — output drops from 480V to 455V when trading floor load exceeds 70%. AVR suspected.',
      $created_at: '2026-03-10T07:45:00.000Z', $updated_at: '2026-03-10T07:45:00.000Z',
    })
    const o4id = o4.lastInsertRowid
    insertLog.run({ $service_order_id: o4id, $timestamp: '2026-03-10T07:45:00.000Z', $entry_type: 'system', $message: 'Service order created.' })
  })
  seedOrders()
}
