# 🇬🇪 Georgian Football Talent Platform (MVP)

A web platform that centralizes Georgian youth football players and connects them with scouts, agents, and clubs worldwide.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel

# Option 2: Connect GitHub repo to Vercel dashboard
# Push to GitHub → Import in vercel.com → Auto-deploys
```

## Features

- **Player Database** — 12 demo players with filters, search autocomplete, URL-based filter state
- **Player Profiles** — Detailed stats, radar skill charts, scouting reports, video embeds
- **Player Comparison** — Side-by-side skill and stat comparison
- **Shortlist/Favorites** — Save players to shortlist (localStorage)
- **Match Library** — Match results, reports, top performers
- **Club Pages** — Squad lists and club matches
- **Bilingual** — English + Georgian language toggle
- **Dark Theme** — Professional football tech aesthetic
- **Responsive** — Mobile-first design
- **404 Page** — Custom not found page
- **Loading Skeletons** — Smooth loading states

## Tech Stack

- React 19 + Vite
- React Router v6
- Tailwind CSS v4
- Static JSON data (no backend)
- localStorage for shortlist
