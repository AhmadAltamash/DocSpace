# DocSpace

A lightweight collaborative document editor built with the MERN stack (MongoDB-ready, Express, React, Node). Built for the AI-Native Full Stack Developer take-home assignment.

## Features

- Create, rename, edit, and reopen rich-text documents (bold, italic, underline, H1/H2/H3, bulleted/numbered lists)
- Autosave (debounced ~800ms) with a visible Saving… / Saved status
- Import `.txt` or `.md` files as new, fully editable documents (headings and lists are parsed, not dumped as plain text)
- Share a document with another user as **Viewer** (read-only) or **Editor** (can edit), with a real access-control check enforced server-side on every request
- Dashboard clearly separates **My Documents** (owned) from **Shared With Me**
- Seeded demo accounts so reviewers can test sharing without creating users manually

## Tech Stack

**Frontend:** React, Vite, React Router, Tailwind CSS, Tiptap (rich text), Axios, Lucide icons
**Backend:** Node.js, Express, JWT auth, Multer (file upload), bcryptjs
**Persistence:** see "A note on storage" below
**Testing:** Vitest + Supertest (16 automated tests covering auth, CRUD, and — most importantly — the sharing/permission matrix)

## A note on storage (read this first)

The assignment explicitly allows "a local file-based store if well documented," so the app ships with **two interchangeable storage backends behind the same repository interface** (`server/src/repository/`):

- **`json` (default)** — a small JSON file on disk (`server/data/db.json`), powered by `lowdb`. Zero setup: no database to install, no connection string to configure, no external service. This is what lets a reviewer clone the repo and have it running in under a minute.
- **`mongo`** — real MongoDB via Mongoose (`server/src/models/schemas.js`, `server/src/repository/mongoStore.js`), used when `STORE_DRIVER=mongo` and `MONGODB_URI` is set (e.g. a MongoDB Atlas connection string).

Every controller talks to `store.users` / `store.documents` / `store.shares` — it never touches lowdb or Mongoose directly — so switching backends is a one-line env var change, not a rewrite. See `ARCHITECTURE.md` for why this tradeoff was made deliberately, not as a shortcut.

**To run against real MongoDB:** set `STORE_DRIVER=mongo` and `MONGODB_URI=<your Atlas connection string>` in `server/.env`, then run `npm run seed` and `npm run dev` as normal — same commands, different backend.

## Local Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env      # defaults work out of the box (STORE_DRIVER=json)
npm run seed               # creates demo accounts + a sample shared document
npm run dev                 # http://localhost:5000
```

### 2. Client

```bash
cd client
npm install
cp .env.example .env      # points to http://localhost:5000 by default
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 and log in with a demo account below.

## Demo Accounts (seeded)

| Email | Password | Role |
|---|---|---|
| alice@example.com | password123 | Owns "Product Launch Plan" |
| bob@example.com | password123 | Has editor access to Alice's document |

Log in as Alice to see the owned document and try sharing; log in as Bob (in a different browser or incognito window) to see it appear under "Shared With Me."

## Running Tests

```bash
cd server
npm test
```

16 tests covering: login/auth failures, document CRUD, save → refresh persistence, and — the core scope requirement — the full sharing/permission matrix (owner vs. editor vs. viewer, denied access, delete restrictions, `.md` import).

### File Import

The application supports importing:

- `.txt`
- `.md`
- `.docx`

Imported files are converted into editable Tiptap document content.

For `.txt` and `.md`, the application supports basic structure such as:

- Headings
- Bullet lists
- Numbered lists
- Paragraphs

For `.docx`, the application uses Mammoth to convert the document into HTML and then maps common document structures into Tiptap JSON.

Maximum upload size: 10MB.

## Deployment

See `ARCHITECTURE.md` for the recommended deployment path (Vercel for the client, Render for the server, MongoDB Atlas for storage in `mongo` mode). This repo was verified locally end-to-end (server tests, client production build, and a live client↔API smoke test); deploying to your own Vercel/Render/Atlas accounts requires credentials I don't have, so I've documented the exact steps instead of guessing at a live URL.

## What's Working vs. What's Deferred

**Working end-to-end:** document creation/rename/edit/reopen, rich text formatting, autosave, `.txt`/`.md` import, sharing with viewer/editor permissions, access-control enforcement (verified by 16 passing tests + manual API testing), empty/loading/error states, seeded demo accounts.

**Intentionally deferred** (see `ARCHITECTURE.md` for reasoning): real-time collaboration, comments, version history, `.docx` import, production-grade authentication (OAuth/password reset).

**With another 2-4 hours** I would add: document version history (a `versions` collection with periodic snapshots), `.docx` import via `mammoth`, and export to PDF/Markdown.
