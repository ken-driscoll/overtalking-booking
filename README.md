# Overtalking Booking

Guest booking site for the [Overtalking Podcast](https://overtalkingpod.libsyn.com/). Guests sign in with Google, pick an available 1-hour recording slot, and the app creates a Google Calendar event with a Zoom meeting link — no back-and-forth scheduling needed.

## Setup

### 1. Google Cloud

- Create a project, enable the **Google Calendar API**, and create an **OAuth 2.0 Web Application** credential
- Add `http://localhost:5173`, `http://localhost:8080`, and your production URL to authorized origins/redirect URIs
- Run the refresh token script to authorize the Overtalking Google account:
  ```bash
  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npx tsx scripts/get-refresh-token.ts
  ```
- Get both calendar IDs from Google Calendar settings (Overtalking Podcast calendar + Recording Blackout Dates calendar)

### 2. Zoom

- Create a **Server-to-Server OAuth** app at [marketplace.zoom.us](https://marketplace.zoom.us)
- Add scope `meeting:write:meeting:admin` and activate the app
- Copy the Account ID, Client ID, and Client Secret

### 3. Pushover (optional)

- Create an app at [pushover.net](https://pushover.net) to get a token
- Copy your user key from the Pushover dashboard
- If not set, booking notifications are silently skipped

### 4. Environment

```bash
cp .env.example .env
cp client/.env.example client/.env.local
# Fill in all values
```

### 5. Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Seasonal themes

Append `?theme=october` or `?theme=december` to the URL to activate a seasonal theme. Each theme swaps the background color and cover art:

| Theme | URL param | Background |
|---|---|---|
| Default | *(none)* | Yellow (#FDC02F) |
| Halloween | `?theme=october` | Orange (#E86B00) |
| Christmas | `?theme=december` | Green (#1B7033) |

Theme images live in `client/public/images/`. To add a new theme, add an entry to the `THEMES` object in `client/src/App.tsx`, drop the cover image in `public/images/`, and add background-color overrides in `client/src/index.css`.

## Deploy

```bash
docker compose up --build
```

Point Nginx Proxy Manager at port `3001`. The container serves both the API and the built React app.
