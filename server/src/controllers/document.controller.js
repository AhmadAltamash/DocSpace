import store from '../repository/index.js';
import { resolveAccess, canEdit } from '../utils/access.js';
import { emptyDoc } from '../utils/editor.js';

// GET /api/documents  -> { owned: [...], shared: [...] }
export async function listDocuments(req, res) {
  const userId = req.user.id;
  const owned = await store.documents.findByOwner(userId);

  const myShares = await store.shares.findByUser(userId);
  const shared = [];
  for (const share of myShares) {
    const doc = await store.documents.findById(share.document);
    if (doc) {
      const owner = await store.users.findById(doc.owner);
      shared.push({ ...doc, permission: share.permission, ownerName: owner?.name || 'Unknown' });
    }
  }

  res.json({
    owned: owned.map((d) => ({ ...d, permission: 'owner' })),
    shared,
  });
}

// POST /api/documents  { title? }
export async function createDocument(req, res) {
  const title = (req.body?.title || '').trim() || 'Untitled document';
  const doc = await store.documents.create({ title, content: emptyDoc(), owner: req.user.id });
  res.status(201).json({ document: doc });
}

// GET /api/documents/:id
export async function getDocument(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!access) return res.status(403).json({ error: 'You do not have access to this document' });
  res.json({ document: doc, permission: access });
}

// PATCH /api/documents/:id  { title?, content? }
export async function updateDocument(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!canEdit(access)) return res.status(403).json({ error: 'You do not have permission to edit this document' });

  const updates = {};
  if (typeof req.body?.title === 'string') {
    const trimmed = req.body.title.trim();
    if (!trimmed) return res.status(400).json({ error: 'Title cannot be empty' });
    updates.title = trimmed;
  }
  if (req.body?.content !== undefined) {
    if (typeof req.body.content !== 'object' || req.body.content === null) {
      return res.status(400).json({ error: 'content must be a Tiptap JSON object' });
    }
    updates.content = req.body.content;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update — provide title and/or content' });
  }

  const updated = await store.documents.update(req.params.id, updates);
  res.json({ document: updated, permission: access });
}

// DELETE /api/documents/:id  (owner only)
export async function deleteDocument(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (access !== 'owner') return res.status(403).json({ error: 'Only the owner can delete this document' });
  await store.documents.delete(req.params.id);
  res.status(204).end();
}
