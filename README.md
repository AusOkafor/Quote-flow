# QuoteFlow — Frontend

React 18 + TypeScript + Vite + Supabase Auth

## Quick Start

```bash
cp .env.example .env      # add your Supabase keys
npm install
npm run dev               # runs on http://localhost:5173
```

## .env variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080
```

## Folder Structure

```
src/
├── components/
│   ├── ui/           Badge, Toggle, Modal, Toast
│   ├── layout/       AppShell (sidebar+toast), Topbar
│   ├── dashboard/    MetricCard, RecentQuotes, ActivityFeed
│   ├── quotes/       QuotesTable, LineItemsEditor, QuotePreviewModal, SendModal
│   ├── clients/      ClientCard
│   ├── modals/       AddClientModal
│   └── settings/     ProfilePanel, DefaultsPanel, TaxPanel, BillingPanel
├── pages/            One file per route
├── hooks/            useQuotes, useClients, useDashboard, useProfile, useToast
├── services/         api.ts — all backend calls
├── lib/              supabase.ts, utils.ts
├── types/            index.ts — all TypeScript interfaces
└── styles/           globals.css — design tokens + all component styles
```

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run type-check   # TypeScript check without emitting
npm run lint         # ESLint
```
