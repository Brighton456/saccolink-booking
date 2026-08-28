# SaccoLink Passenger Booking Portal

A standalone, public-facing booking portal for SaccoLink passengers. Built with React, Tailwind CSS, Supabase, and BrightPay.

## Features

- **Search trips** — origin/destination autocomplete from real stations
- **Interactive seat selection** — visual van layout with live availability
- **M-Pesa STK Push** — pay directly from phone via BrightPay
- **Digital boarding pass** — instant ticket with booking reference
- **Mobile-first** — Android-optimized with haptic feedback, dark mode, skeleton loading
- **Favorite routes** — saved to localStorage for quick rebooking
- **Trip countdown** — live timer until next departure
- **Share ticket** — copy or native share your boarding pass

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in Supabase credentials
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key |

> **BrightPay credentials** are configured in `src/lib/brightpay.ts`. No env vars needed.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: BrightPay M-Pesa STK Push (frontend-only integration)
- **Database**: Same database as the main SaccoLink admin system

## How the Payment Flow Works

1. Passenger selects seats and enters details
2. Seats are booked via `api_online_booking` PostgreSQL function
3. BrightPay `endpoint-pay` triggers M-Pesa STK Push to passenger's phone
4. Passenger enters M-Pesa PIN on their phone
5. Frontend polls `endpoint-status` every 3s until payment completes
6. Digital boarding pass is generated with M-Pesa receipt
