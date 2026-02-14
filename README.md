# Valentine Live (front + backend)

This repo serves the 4 screens you already designed (index/yes/live/admin) and adds a backend
for realtime Markdown streaming to the `live.html` screen.

## Run locally

```bash
npm i
# IMPORTANT: choose your admin token
ADMIN_TOKEN="your-secret-token" npm run dev
```

Open:
- http://localhost:3000/               (proposal)
- http://localhost:3000/yes.html       (success)
- http://localhost:3000/live.html      (viewer screen)
- http://localhost:3000/admin.html?token=your-secret-token  (admin)

## How it works

- The Node server serves `/public` as static.
- A WebSocket endpoint `/ws` keeps current Markdown in memory (and persists to `server/data/state.json`).
- Admin sends `markdown:update` on every change, server broadcasts to viewers.

## Deploy

GitHub Pages cannot run the Node backend.

Common options:
- Render / Railway / Fly.io / any VPS: run `npm start` with `ADMIN_TOKEN` set.
- If you insist on GitHub Pages for static: keep `/public` there, and point WS to your backend host.
