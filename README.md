# Passion Farms ERP — Frontend

Web app for the Passion Farms ERP system: cultivation and operations management (React + TypeScript + Vite).

## About This Project

Frontend for the Passion Farms ERP:

- **Dashboard & analytics** — Stats, alerts, batches, compliance, environment widgets
- **Cultivation** — Batches, plants, mother plants, rooms, facilities, feeding, harvest, IPM
- **Inventory & manufacturing** — Inventory, waste, quality control, manufacturing
- **Compliance & audit** — Document verification, audit logs, SOPs, reports
- **Organization & access** — Multi-org, roles, permissions, team and user management
- **Integrations** — Supabase (auth), configurable REST API backend

## Tech Stack

- **Vite** — Build and dev server
- **React 18** + **TypeScript`**
- **Tailwind CSS** — Styling
- **shadcn/ui** (Radix) — UI components
- **React Router** — Routing
- **Supabase** — Authentication
- **REST API** — Backend at `VITE_API_URL` (e.g. Passion Farms ERP backend)

## Requirements

- Node.js 18+
- Backend API (e.g. [erp-backend](https://github.com/savan-pfs/erp-backend)) running for full functionality

## Getting Started

1. **Clone and install**
  ```bash
   git clone https://github.com/savan-pfs/erp-frontend.git
   cd erp-frontend
   npm install
  ```
2. **Environment**
  ```bash
   cp .env.example .env
   # Edit .env: Supabase keys and VITE_API_URL (e.g. http://localhost:3004/api for local backend)
  ```
3. **Run dev server**
  ```bash
   npm run dev
  ```

App runs at `http://localhost:5173` (or the port Vite shows). Point `VITE_API_URL` to your backend (e.g. `http://localhost:3004/api`) for local development.

## Environment Variables


| Variable                        | Description          | Example                     |
| ------------------------------- | -------------------- | --------------------------- |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ID  | *(from Supabase dashboard)* |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key    | *(from Supabase dashboard)* |
| `VITE_SUPABASE_URL`             | Supabase project URL | `https://xxx.supabase.co`   |
| `VITE_API_URL`                  | Backend API base URL | `http://localhost:3004/api` |


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
3. Start frontend: `cd erp-frontend && npm run dev` (app at `http://localhost:5173`)

