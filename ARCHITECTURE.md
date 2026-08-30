# Architecture Note

## Priorities

Given the 4-6 hour timebox, I optimized for a **complete, correctly-enforced document lifecycle** over feature breadth: create → edit → save → reopen → import → share → permission-enforced access. I'd rather have five things work correctly and be tested than ten things half-working. Real-time collaboration, comments, version history, and enterprise auth were deliberately deferred — they're additive features on top of this core, not prerequisites for it.

## System overview

```
React (Vite, Tailwind, Tiptap)
        │  REST + JWT (Authorization: Bearer)
        ▼
Express API
  ├── /api/auth       login, current user
  ├── /api/documents   CRUD + nested sharing routes
  ├── /api/files → import .txt/.md/.docx → Tiptap document
  └── middleware: requireAuth (JWT), upload (Multer), central error handler
        │
        ▼
Repository layer (single interface: users / documents / shares)
  ├── jsonStore.js  — lowdb JSON file (default)
  └── mongoStore.js — Mongoose / MongoDB (opt-in via STORE_DRIVER=mongo)
```

## Key engineering decisions

### 1. A pluggable storage layer instead of a hard MongoDB dependency

The assignment explicitly permits "a local file-based store if well documented." I used that permission deliberately: controllers never call Mongoose or lowdb directly, they call a repository interface (`store.users.findByEmail(...)`, `store.documents.update(...)`, etc.). Two implementations satisfy that interface — a zero-setup JSON file store and a full Mongoose/MongoDB store — selected by one environment variable (`STORE_DRIVER`).

This means: a reviewer can clone the repo and have a fully working app in under a minute with no database to install, while the code is still genuinely MERN-shaped and a real MongoDB Atlas deployment is a one-line config change, not a rewrite. It also means the sharing/permission logic — the part of this assignment I most wanted to get right — is tested against real behavior rather than mocked away.

### 2. Sharing as its own collection, not an array on the document

Instead of `document.sharedWith = [userId, userId, ...]`, sharing is a separate `Share { document, user, permission }` record. This makes permission an explicit, queryable property (`viewer` vs `editor`) rather than a boolean, keeps the document model itself simple, and mirrors how this would scale if group sharing or link-based sharing were added later.

### 3. Access control resolved once, checked consistently

`utils/access.js` has one function, `resolveAccess(documentId, userId)`, that every document/share route calls. It returns `'owner' | 'editor' | 'viewer' | null`. Every route then asks a yes/no question (`canView`, `canEdit`, or `=== 'owner'`) rather than re-implementing the owner-or-shared logic per-route. This was the single area I most wanted to be provably correct, so it's also the most heavily tested part of the suite (owner access, editor write access, viewer read-only, denied access, owner-only delete/share/revoke).

### 4. Tiptap JSON as the storage format, not HTML

Documents are stored as Tiptap/ProseMirror JSON rather than raw HTML. It's structurally validated on the way in (`content must be a Tiptap JSON object`), safer than storing arbitrary HTML, and trivial to re-render into the editor on reopen. Imported `.txt`/`.md`/`.docx` files are parsed into the same JSON shape (`utils/editor.js`) rather than wrapped as an opaque blob, so an imported document is genuinely editable, not just displayed.

### 5. Autosave over explicit save buttons

Content changes are debounced (~800ms) and PATCHed automatically, with a Saving…/Saved indicator in the header. This matches the Google-Docs-like mental model the assignment is inspired by, and removes an entire class of "I forgot to click save" bugs.

### File Import

The file import pipeline supports `.txt`, `.md`, and `.docx`.

`.txt` and `.md` files are parsed using the application's lightweight
text/Markdown parser.

`.docx` files are converted to HTML using Mammoth and then transformed
into the same Tiptap/ProseMirror JSON structure used by the editor.

This means imported documents are not stored as opaque files. Their
content becomes editable within the same document editor used for
native documents.

## What I deferred, and why

- **Real-time collaboration / WebSockets** — a genuinely different technical problem (CRDTs/OT, presence, conflict resolution) that would have consumed most of the timebox on its own, at the expense of getting the core lifecycle right.
- **Version history** — straightforward to add on top of the current model (a `versions` collection with periodic content snapshots) but not core to demonstrating the required capabilities.
- **`.pdf` import** — the assignment explicitly allows limiting file types if stated clearly; `.txt`/`.md`/`.docx` cover the "import content into an editable document" requirement without pulling in a heavier parsing dependency.
- **Production-grade auth (OAuth, password reset, refresh tokens)** — the assignment explicitly permits seeded/mocked auth for this scope; JWT + seeded accounts demonstrates real authenticated, authorized behavior without spending the timebox on auth infrastructure.

## Deployment path (recommended, not executed against live infra)

- **Client** → Vercel (`vercel --prod` from `client/`, or connect the GitHub repo; set `API_URL` to the deployed API URL)
- **Server** → Render (Web Service, root `server/`, build `npm install`, start `npm start`; set `JWT_SECRET`, `CLIENT_ORIGIN`, and either leave `STORE_DRIVER=json` or set `STORE_DRIVER=mongo` + `MONGODB_URI`)
- **Database** (only if using `mongo` mode) → MongoDB Atlas free tier

I don't have accounts to deploy this to on your behalf, so I've verified the app fully locally (automated tests + a live client↔API integration check) and documented the exact deploy steps rather than fabricate a URL.
