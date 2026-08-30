# AI Workflow Note

## Tools used

- Claude (Anthropic), used conversationally to scaffold, implement, and iterate on the full stack, and to run/verify the build in a sandboxed dev environment (installing dependencies, running the server, executing curl-based API smoke tests, running the automated test suite, and doing a production client build).

## Where AI materially sped up the work

- **Scaffolding speed**: generating the repetitive-but-necessary boilerplate (Express route/controller wiring, Mongoose schemas, Tiptap editor setup, Tailwind config) in minutes rather than hours, freeing time for the parts that actually needed judgment.
- **The storage abstraction decision**: I asked for a MERN stack; going a step further to design a repository interface with two swappable backends (JSON file store for zero-setup local running, Mongoose for real MongoDB) was a design tradeoff I evaluated and chose deliberately given I couldn't reach an external MongoDB instance from the sandboxed environment I was building and testing in.
- **Test generation**: the initial test cases were AI-drafted, then reviewed against the assignment's actual evaluation criteria — the suite was reshaped to focus specifically on the owner/editor/viewer permission matrix (the part most likely to have subtle bugs), not just happy-path CRUD.
- **Verification loop**: AI ran the server, seeded demo data, hit the API directly with curl for every core flow (login, create, edit, share, permission denial, file import — both valid and invalid file types), ran the automated test suite, and built the client for production, fixing real issues found along the way (e.g. a `multer@1.x` deprecation warning was caught and upgraded to 2.x during install).

## What AI-generated output was changed or rejected

- Initial file-import logic treated uploaded text as a single opaque paragraph; this was reworked into a small heading/list-aware parser (`utils/editor.js`) so imports land as genuinely structured, editable documents rather than a wall of plain text.
- The first pass at the sharing data model considered an array field on the document (`sharedWith: [userId]`); this was rejected in favor of a separate `Share` collection with an explicit `permission` field, since it makes viewer/editor a first-class, queryable concept instead of an implicit boolean.

## How correctness, UX quality, and reliability were verified

- **Automated**: 16 Vitest + Supertest tests, all passing, specifically targeting auth failures, document CRUD, save/reopen persistence, the full permission matrix (denied access, owner-only share/delete, viewer read-only, editor read/write), and file import (valid `.md` parsing + invalid file type rejection).
- **Manual, end-to-end**: booted the real server, seeded real demo accounts, and drove the actual HTTP API with curl through the full story — login as Alice, create and edit a document, confirm Bob is denied access, share as viewer, confirm Bob can read but not write, promote to editor, confirm Bob can write, import a `.md` file and confirm headings/lists parsed correctly, reject a `.docx` upload, confirm bad credentials and missing-token requests are rejected.
- **Build verification**: `npm run build` on the client succeeds cleanly; the built client was served and checked against the live API with a cross-origin request to confirm CORS is correctly configured for the deployed-apart frontend/backend topology this app is designed for.
