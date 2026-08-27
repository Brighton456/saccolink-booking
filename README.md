# SaccoLink Passenger Booking Portal

A standalone, public-facing booking portal for SaccoLink passengers. Built with React, Tailwind CSS, and Supabase.

## Features

- **Search trips** — origin/destination autocomplete from real stations
- **Interactive seat selection** — visual van layout with live availability
- **M-Pesa STK Push** — pay directly from phone
- **Digital boarding pass** — instant ticket with booking reference
- **Mobile-first** — works perfectly on phones, tablets, and desktop

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in Supabase credentials
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

## Deploy to Vercel

```bash
# Option 1: CLI
npx vercel --prod

# Option 2: GitHub integration
# Push to GitHub, connect repo in Vercel dashboard
# Set env vars in Vercel project settings
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key |

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: Safaricom Daraja STK Push via Supabase Edge Functions
- **Database**: Same database as the main SaccoLink admin system
- **Deployment**: Vercel (separate project from admin dashboard)

## How It Connects

The booking portal uses the same Supabase database as the main SaccoLink admin system. When a passenger books a ticket:
1. The booking is created via `api_online_booking` PostgreSQL function
2. The ticket appears instantly in the station clerk's portal
3. M-Pesa payments are processed via `mpesa_stk_push` Edge Function
4. Seat availability updates in real-time for all users
