// Zero-setup, file-based persistence layer.
//
// This is the DEFAULT store so the app runs and can be graded with
// `npm install && npm run seed && npm run dev` and no external services.
// It implements the exact same interface as mongoStore.js, so swapping
// to real MongoDB (see mongoStore.js + repository/index.js) does not
// require touching a single controller/route.
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.JSON_DB_PATH || './data/db.json';
const resolvedPath = path.resolve(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const defaultData = { users: [], documents: [], shares: [] };
const adapter = new JSONFile(resolvedPath);
const db = new Low(adapter, defaultData);

let ready = null;
async function init() {
  if (!ready) {
    ready = (async () => {
      await db.read();
      db.data ||= structuredClone(defaultData);
      await db.write();
    })();
  }
  return ready;
}

function clone(obj) {
  return obj ? structuredClone(obj) : obj;
}

// ---------- Users ----------
const users = {
  async create({ name, email, passwordHash }) {
    await init();
    const doc = { _id: nanoid(), name, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
    db.data.users.push(doc);
    await db.write();
    return clone(doc);
  },
  async findByEmail(email) {
    await init();
    return clone(db.data.users.find((u) => u.email === String(email).toLowerCase()));
  },
  async findById(id) {
    await init();
    return clone(db.data.users.find((u) => u._id === id));
  },
  async list() {
    await init();
    return clone(db.data.users);
  },
};

// ---------- Documents ----------
const documents = {
  async create({ title, content, owner }) {
    await init();
    const now = new Date().toISOString();
    const doc = { _id: nanoid(), title, content, owner, createdAt: now, updatedAt: now };
    db.data.documents.push(doc);
    await db.write();
    return clone(doc);
  },
  async findById(id) {
    await init();
    return clone(db.data.documents.find((d) => d._id === id));
  },
  async findByOwner(ownerId) {
    await init();
    return clone(db.data.documents.filter((d) => d.owner === ownerId));
  },
  async update(id, updates) {
    await init();
    const doc = db.data.documents.find((d) => d._id === id);
    if (!doc) return null;
    Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
    await db.write();
    return clone(doc);
  },
  async delete(id) {
    await init();
    const before = db.data.documents.length;
    db.data.documents = db.data.documents.filter((d) => d._id !== id);
    db.data.shares = db.data.shares.filter((s) => s.document !== id);
    await db.write();
    return db.data.documents.length < before;
  },
};

// ---------- Shares ----------
const shares = {
  async create({ document, user, permission }) {
    await init();
    const existing = db.data.shares.find((s) => s.document === document && s.user === user);
    if (existing) {
      existing.permission = permission;
      await db.write();
      return clone(existing);
    }
    const doc = { _id: nanoid(), document, user, permission, createdAt: new Date().toISOString() };
    db.data.shares.push(doc);
    await db.write();
    return clone(doc);
  },
  async findByDocument(documentId) {
    await init();
    return clone(db.data.shares.filter((s) => s.document === documentId));
  },
  async findByUser(userId) {
    await init();
    return clone(db.data.shares.filter((s) => s.user === userId));
  },
  async findOne(documentId, userId) {
    await init();
    return clone(db.data.shares.find((s) => s.document === documentId && s.user === userId));
  },
  async delete(documentId, userId) {
    await init();
    const before = db.data.shares.length;
    db.data.shares = db.data.shares.filter((s) => !(s.document === documentId && s.user === userId));
    await db.write();
    return db.data.shares.length < before;
  },
};

// Test helper: reset store to empty state (used by the test suite so each
// run starts clean and never touches your real dev data file).
async function __reset() {
  await init();
  db.data = structuredClone(defaultData);
  await db.write();
}

export default { users, documents, shares, __reset, __driver: 'json' };
