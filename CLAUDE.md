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
cd server && bun run dev

# Client only (port 5173)
cd client && bun run dev

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
- Service orders: `open` → `assigned` → `in_progress` → `in_review` → `completed`
- Parts requests: `requested` → `approved` (decrements stock) → `delivered`
- Generator status updates automatically when orders are created/completed

## In Review Feature

Service orders pass through an `in_review` step before completion. A reviewer inspects the work, then either approves (→ `completed`) or sends back (→ `in_progress`).

**Transition rules** (enforced client-side in `client/src/components/KanbanBoard.tsx`):
- `in_progress` → `in_review` only (no direct path to `completed`)
- `in_review` → `completed` (approve) or `in_progress` (send back)

**Review panel** (`client/src/pages/ServiceOrderDetail.tsx`): shown when `status === 'in_review'`. Displays parts used, work log, reviewer notes textarea, and Approve/Send Back buttons.

**Sent-back banner**: shown when `status === 'in_progress'` and a recent `"Review feedback: "` log entry exists (not dismissed). Dismissible via X button (stores dismissed log ID in local state).

**Log entry prefixes — do not change these strings** (the banner and review panel key off them):
- `"Review feedback: "` — written on Send Back; detected by the sent-back banner
- `"Review approved: "` — written on Approve (if reviewer left notes)

**`load()` in ServiceOrderDetail must return its Promise** so that `await load()` after status transitions properly waits for fresh data before the UI updates.

## Branch Strategy

- `main` — primary branch
- `staging` — staging environment
- `first-build` — active development branch
