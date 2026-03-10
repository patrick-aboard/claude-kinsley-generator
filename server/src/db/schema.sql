-- Kinsley Generator Repair CRM — SQLite Schema

CREATE TABLE IF NOT EXISTS generators (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number TEXT UNIQUE NOT NULL,
  model         TEXT NOT NULL,
  manufacturer  TEXT NOT NULL,
  client_name   TEXT NOT NULL,
  location      TEXT NOT NULL,
  install_date  TEXT NOT NULL,
  last_serviced TEXT,
  status        TEXT NOT NULL DEFAULT 'operational'
);

CREATE TABLE IF NOT EXISTS service_orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  generator_id        INTEGER NOT NULL REFERENCES generators(id),
  status              TEXT NOT NULL DEFAULT 'open',
  assigned_tech       TEXT,
  problem_description TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_order_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  service_order_id INTEGER NOT NULL REFERENCES service_orders(id),
  timestamp        TEXT NOT NULL,
  entry_type       TEXT NOT NULL,
  message          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parts_inventory (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number        TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL,
  quantity_in_stock  INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS parts_requests (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  service_order_id   INTEGER NOT NULL REFERENCES service_orders(id),
  part_id            INTEGER NOT NULL REFERENCES parts_inventory(id),
  quantity_requested INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'requested',
  created_at         TEXT NOT NULL
);
