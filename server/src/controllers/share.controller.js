import store from '../repository/index.js';
import { resolveAccess } from '../utils/access.js';

// POST /api/documents/:id/share  { email, permission: 'viewer'|'editor' }
export async function shareDocument(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (access !== 'owner') return res.status(403).json({ error: 'Only the owner can share this document' });

  const { email, permission } = req.body || {};
  if (!email || !['viewer', 'editor'].includes(permission)) {
    return res.status(400).json({ error: 'email and a valid permission ("viewer" or "editor") are required' });
  }

  const target = await store.users.findByEmail(email);
  if (!target) return res.status(404).json({ error: `No user found with email ${email}` });
  if (String(target._id) === String(req.user.id)) {
    return res.status(400).json({ error: 'You already own this document' });
  }

  const share = await store.shares.create({ document: doc._id, user: target._id, permission });
  res.status(201).json({ share, sharedWith: { id: target._id, name: target.name, email: target.email } });
}

// GET /api/documents/:id/shares
export async function listShares(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (access !== 'owner') return res.status(403).json({ error: 'Only the owner can view sharing settings' });

  const shares = await store.shares.findByDocument(doc._id);
  const withUsers = await Promise.all(
    shares.map(async (s) => {
      const u = await store.users.findById(s.user);
      return { ...s, user: { id: u?._id, name: u?.name, email: u?.email } };
    })
  );
  res.json({ shares: withUsers });
}

// DELETE /api/documents/:id/share/:userId
export async function revokeShare(req, res) {
  const { doc, access } = await resolveAccess(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (access !== 'owner') return res.status(403).json({ error: 'Only the owner can revoke access' });

  await store.shares.delete(doc._id, req.params.userId);
  res.status(204).end();
}
