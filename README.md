# ERP Frontend

Frontend application for the Passion Farms ERP system — a cultivation and operations management platform.

## About This Project

This is the web client for an enterprise resource planning (ERP) system built for cannabis cultivation and related operations. It provides:

- **Dashboard & analytics** — Real-time stats, alerts, batches, compliance, and environment widgets
- **Cultivation management** — Batches, plants, mother plants, rooms, facilities, feeding, harvest, and IPM
- **Inventory & manufacturing** — Inventory tracking, waste management, quality control, and manufacturing workflows
- **Compliance & audit** — Document verification, audit logs, SOPs, and compliance reporting
- **Organization & access** — Multi-organization support, role-based permissions, team management, and user administration
- **Integrations** — Supabase for auth and data, configurable API backend

The app uses **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**, with Supabase for authentication and an optional REST API backend.

## Tech Stack

- **Vite** — Build tool and dev server
- **TypeScript** — Type-safe JavaScript
- **React** — UI framework
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library
- **Supabase** — Authentication and optional data layer

## Getting Started

**Requirements:** Node.js and npm (or [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

```sh
# Clone the repository
git clone https://github.com/savan-pfs/erp-frontend.git
cd erp-frontend

# Install dependencies
npm install

# Copy environment template and add your values
cp .env.example .env

# Start the development server
npm run dev
```

Configure `.env` with your Supabase project ID, URL, anon key, and API URL (see `.env.example`).

## Repository

**URL:** https://github.com/savan-pfs/erp-frontend

## Scripts

- `npm run dev` — Start dev server with hot reload
- `npm run build` — Production build
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint
