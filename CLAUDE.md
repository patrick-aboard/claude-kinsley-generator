# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Demo CRM for Kinsley, a fictional industrial generator repair business. Vertical slice: generator breaks → service order created → tech assigned → parts requested → inventory updates → order closed.

## Tech Stack

- **Frontend:** React 18 + Vite 6 + Tailwind CSS v4 + shadcn/ui (New York style, neutral palette)
- **Backend:** Express 4 running on Bun (TypeScript natively, no transpile step)
- **Database:** SQLite via `bun:sqlite` (built-in, no native addon required)
- **Runtime:** Bun 1.3.x — use `bun` everywhere, never `npm` or `node`
- **Monorepo:** `/client` and `/server` at project root

## Commands

```bash
# Start both servers (runs from project root)
bun run dev

# Server only (port 3001)
bun --cwd server run dev        # or: cd server && bun run dev

# Client only (port 5173)
bun --cwd client run dev        # or: cd client && bun run dev

# Install dependencies after pulling
bun install && bun install --cwd client && bun install --cwd server

# Add a shadcn component
bunx shadcn@latest add <component-name>
```

The Vite dev server proxies `/api/*` to `localhost:3001`.

## Project Structure

```
/
├── package.json              # Root — just runs concurrently
├── client/                   # React + Vite app (port 5173)
│   ├── src/
│   │   ├── components/ui/    # shadcn/ui components
│   │   ├── pages/            # Page-level route components
│   │   ├── lib/              # API client helpers, types, utils
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts        # Includes @tailwindcss/vite plugin + /api proxy
│   └── tsconfig.app.json     # Has @/* path alias → ./src/*
└── server/
    ├── src/
    │   ├── db/
    │   │   ├── schema.sql     # Table definitions (reference)
    │   │   └── database.ts   # DB init, schema creation, and seed data
    │   ├── routes/
    │   │   ├── generators.ts
    │   │   ├── serviceOrders.ts   # Also handles /logs and /parts-requests sub-routes
    │   │   ├── partsInventory.ts
    │   │   └── partsRequests.ts   # /approve and /deliver endpoints
    │   └── index.ts           # Express app entry
    ├── kinsley.db             # SQLite database (auto-created on first run)
    └── tsconfig.json          # types: ["bun-types"] for bun:sqlite support
```

## Architecture

**Database** auto-initializes on first `getDb()` call: reads `schema.sql`, creates tables, then seeds if empty. Re-running won't re-seed. To reset, delete `server/kinsley.db`.

**bun:sqlite API** uses `$param` named params (not `@param` like better-sqlite3):
```ts
db.prepare('INSERT INTO t VALUES ($name)').run({ $name: 'value' })
```

**Auto-logging:** Backend creates `service_order_logs` entries inside transactions whenever status changes or parts requests are processed. Frontend never posts separate log entries for system events.

**Status flows:**
- Service orders: `open` → `assigned` → `in_progress` → `completed`
- Parts requests: `requested` → `approved` (decrements stock) → `delivered`
- Generator status updates automatically when orders are created/completed

## Branch Strategy

- `main` — primary branch
- `staging` — staging environment
- `first-build` — active development branch
