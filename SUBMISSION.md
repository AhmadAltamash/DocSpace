# SUBMISSION.md

## What's included in this folder

- `server/` — Express + Node API (auth, documents, sharing, file import), with a dual JSON-file / MongoDB persistence layer, seed script, and automated test suite (16 passing tests)
- `client/` — React + Vite + Tailwind + Tiptap frontend (dashboard, rich-text editor with autosave, share modal, login)
- `README.md` — setup and run instructions, demo accounts, feature/scope summary
- `ARCHITECTURE.md` — architecture note and key engineering decisions
- `AI_WORKFLOW.md` — AI usage note (tools, what sped things up, what was changed/rejected, verification)
- `SUBMISSION.md` — this file
- `WALKTHROUGH_URL.txt` — placeholder for the walkthrough video link (to be filled in)
- `sample-import.md` — a small sample file to demonstrate the file-import feature during review

## What is working

- Document creation, rename, rich-text editing (bold/italic/underline/headings/lists), autosave, and persistence across refresh
- File import: `.txt` and `.md` files, parsed into structured editable content (headings + lists recognized), with unsupported types rejected
- Sharing: owner can grant viewer or editor access by email; dashboard separates "My Documents" from "Shared With Me"; access control enforced server-side (verified by automated tests, not just UI hiding)
- Error handling: invalid login, missing/expired auth tokens, malformed requests, unsupported file types, empty-title renames, and 403/404s for unauthorized/missing document access all return clear errors
- 16 automated tests (Vitest + Supertest), all passing
- Production client build verified (`npm run build` succeeds); local client↔API integration verified live via CORS-aware request

## What I'd build next with another 2-4 hours

- Document version history (a `versions` collection with periodic snapshots, restore UI)
- `.pdf` import via `mammoth`
- Export to PDF/Markdown
