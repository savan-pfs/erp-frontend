# Passion Farms ERP — Frontend

Web app for the Passion Farms ERP system: cultivation and operations management (React + TypeScript + Vite).

## About This Project

Frontend for the Passion Farms ERP:

- **Dashboard & analytics** — Stats, alerts, batches, compliance, environment widgets
- **Cultivation** — Batches, plants, mother plants, rooms, facilities, feeding, harvest, IPM
- **Inventory & manufacturing** — Inventory, waste, quality control, manufacturing
- **Compliance & audit** — Document verification, audit logs, SOPs, reports
- **Organization & access** — Multi-org, roles, permissions, team and user management
- **Integrations** — Configurable REST API backend (JWT auth)

## Tech Stack

- **Vite** — Build and dev server
- **React 18** + **TypeScript`**
- **Tailwind CSS** — Styling
- **shadcn/ui** (Radix) — UI components
- **React Router** — Routing
- **REST API + JWT** — Backend at `VITE_API_URL` (Passion Farms ERP backend); auth via JWT

## Requirements

- Node.js 18+
- Backend API (e.g. [erp-backend](https://github.com/savan-pfs/erp-backend)) running for full functionality

## Getting Started

1. **Clone and install**
  ```bash
   git clone https://github.com/savan-pfs/erp-frontend.git erp-frontend
   cd erp-frontend
   npm install
  ```
2. **Environment**
  ```bash
   cp .env.example .env
   # Edit .env: set VITE_API_URL to your backend (e.g. http://localhost:3004/api)
  ```
3. **Run dev server**
  ```bash
   npm run dev
  ```

App runs at `http://localhost:3003` (see `vite.config.ts`). Set `VITE_API_URL` to your backend (e.g. `http://localhost:3004/api`) for local development.

## Environment Variables


| Variable       | Description          | Example                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3004/api` |


All `VITE_`* variables are exposed to the client; do not put secrets in them.

## Scripts


| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start dev server (hot reload)    |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build locally |
| `npm run lint`    | Run ESLint                       |


## Repository

[https://github.com/savan-pfs/erp-frontend](https://github.com/savan-pfs/erp-frontend)

## Local Full Stack

1. Start backend: `cd erp-backend && npm run dev` (API at `http://localhost:3004`)
2. Set frontend `.env`: `VITE_API_URL=http://localhost:3004/api`
3. Start frontend: `cd erp-forntend && npm run dev` (app at `http://localhost:3003`)

