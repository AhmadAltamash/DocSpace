import store from '../repository/index.js';

// Resolves what access (if any) a user has to a document.
// Returns one of: 'owner' | 'editor' | 'viewer' | null
export async function resolveAccess(documentId, userId) {
  const doc = await store.documents.findById(documentId);
  if (!doc) return { doc: null, access: null };
  if (String(doc.owner) === String(userId)) return { doc, access: 'owner' };
  const share = await store.shares.findOne(documentId, userId);
  if (share) return { doc, access: share.permission }; // 'viewer' | 'editor'
  return { doc, access: null };
}

export function canView(access) {
  return access === 'owner' || access === 'editor' || access === 'viewer';
}

export function canEdit(access) {
  return access === 'owner' || access === 'editor';
}
