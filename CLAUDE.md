# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs both Vite dev server on :5173 and Express on :3001 concurrently)
npm run dev

# Type-check only (no emit) — use the local tsc binary, not npx tsc
node_modules/typescript/bin/tsc --project server/tsconfig.json --noEmit
node_modules/typescript/bin/tsc --project client/tsconfig.json --noEmit

# Production build
npm run build        # builds client then server
npm start            # runs Express serving built client

# Docker
docker compose up --build
```

Vite proxies `/api/*` to Express in dev (`client/vite.config.ts`), so the client always hits `/api/...` regardless of environment.

## Architecture

**Monorepo** with two npm workspaces: `client/` (Vite + React + TypeScript SPA) and `server/` (Express + TypeScript API). In production, Express serves the built React app from `client/dist` as static files alongside the API.

**Auth flow:** Guest clicks the native Google Sign-In button (`@react-oauth/google`), which returns a Google access token. The client sends it to `POST /api/auth/verify-token`, the server calls Google's userinfo endpoint to get name + email, and sets a signed `cookie-session`. All API routes check `req.session.user` for auth.

**Booking flow (`POST /api/book`):**
1. Creates a Zoom meeting via Server-to-Server OAuth (`server/src/lib/zoom.ts`)
2. Creates a Google Calendar event on the Overtalking recordings calendar with the guest as an attendee and the Zoom join URL in the location/description (`server/src/lib/google-calendar.ts`)
3. Sends a Pushover push notification to the host with guest name, email, and formatted CT start time (`server/src/lib/pushover.ts`) — fire-and-forget, failure doesn't affect the booking response
4. Returns `{ eventLink, zoomJoinUrl }` to the client

**Slot availability (`GET /api/slots`):** Fetches events from both the recordings calendar and the blackout calendar for the next 8 weeks, then filters a generated list of candidate slots against them. Weekdays: 7:00 PM CT only. Weekends: 1:00, 1:30, 2:00, 2:30, 3:00 PM CT (all ending by 4 PM). All slot logic is in `server/src/lib/slots.ts`, timezone handled with `date-fns-tz` using `America/Chicago`.

**Google Calendar** uses a pre-authorized refresh token stored in `.env` (`GOOGLE_REFRESH_TOKEN`) for the `overtalkingpod@gmail.com` account — no per-request OAuth needed. The OAuth2 client is created fresh per request in `google-calendar.ts`.

**Zoom** uses Server-to-Server OAuth: exchanges `ZOOM_ACCOUNT_ID` + `ZOOM_CLIENT_ID` + `ZOOM_CLIENT_SECRET` for a short-lived access token on each meeting creation. No token caching — each booking makes a fresh token request.

## Deploy

Pushing to `main` triggers GitHub Actions (`.github/workflows/docker.yml`) which builds and pushes to `ghcr.io/ken-driscoll/overtalking-booking:latest`. Watchtower on infra-services (192.168.5.235) pulls the new image automatically at 3am daily. For an immediate redeploy, run on the Proxmox host (192.168.4.41):

```bash
pct exec 110 -- docker compose -f /opt/compose/compose.yml pull overtalking-booking \
  && docker compose -f /opt/compose/compose.yml up -d overtalking-booking
```

The `.env` lives at `/opt/appdata/overtalking-booking/.env` on infra-services. `VITE_GOOGLE_CLIENT_ID` must also be set as a GitHub Actions secret for the build.

## Environment

`.env` lives at the project root and is loaded by the server via `dotenv` at startup. The client needs `VITE_GOOGLE_CLIENT_ID` in `client/.env.local` for local dev (Vite build-time injection). See `.env.example` and `client/.env.example` for all required variables.

The one-time refresh token for the Overtalking Google account is obtained by running `npx tsx scripts/get-refresh-token.ts` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set — starts a local HTTP server on port 8080 to catch the OAuth redirect.
