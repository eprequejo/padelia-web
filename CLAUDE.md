# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Padelia is a conversational padel tournament search engine (in Spanish). It's a static two-page website: a landing page (`/`) and a chat interface (`/chat/`). The backend API is separate (Google Cloud Run) — this repo is frontend only.

## Development

**No build step.** The site is pure HTML + CSS + vanilla JavaScript (ES Modules). To develop locally, serve with any static file server:

```bash
python3 -m http.server 8000
# or: npx serve .
```

The API client (`chat/lib/api.js`) auto-detects localhost and routes to `http://127.0.0.1:8000` for local dev, or the production Cloud Run URL otherwise.

**Deployment:** Push to `main` → GitHub Pages auto-deploys to `padelia.ai`.

**No tests, no linter, no CI/CD.**

## Architecture

**Two pages, file-based routing:**
- `index.html` — Landing/marketing page. Search box redirects to `/chat/?q=<query>`
- `chat/index.html` — Chat interface (also a PWA). Reads `?q` param and auto-submits

**Chat module system (`chat/lib/`):**
- `api.js` — Fetch wrapper for `POST /chat` with 60s timeout
- `parser.js` — Parses custom `[INTRO]...[/INTRO]`, `[TORNEO]...[/TORNEO]`, `[CIERRE]...[/CIERRE]` tagged response format from the API
- `markdown.js` — Renders tournament cards and attaches click tracking; appends UTM params to all URLs
- `ui.js` — DOM manipulation helpers for rendering messages
- `storage.js` — localStorage persistence for `user_id` and `thread_id` (UUIDs)
- `analytics.js` — Dual tracking via Google Sheets (Apps Script) + Plausible
- `chat.js` — Main controller, orchestrates all modules; manages quick-filter chips (time/gender), geolocation

**Design tokens:** All CSS custom properties live in `assets/palette-lima-azul.css`. Brand color is lime (`#BFFF00`), accent is blue (`#2979FF`), dark-only theme on navy background (`#0B0F19`).

## Key Conventions

- All UI copy is in **Spanish** (target market: Spain)
- **DM Sans** font exclusively (Google Fonts CDN)
- CSS uses BEM-inspired naming (e.g., `.chatTop__inner`, `.msg--bot`)
- Mobile-first responsive design with breakpoints at 820/768/640/560/400px
- `marked.min.js` loaded from jsdelivr CDN for markdown rendering in chat
- PWA support: `chat/manifest.json`, `sw.js` (network-first, no caching)
