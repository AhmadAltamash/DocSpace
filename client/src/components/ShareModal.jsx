import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { documentsApi, errorMessage } from '../services/api.js';

export default function ShareModal({ docId, onClose }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('editor');
  const [shares, setShares] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingShares, setLoadingShares] = useState(true);

  async function loadShares() {
    setLoadingShares(true);
    try {
      const res = await documentsApi.listShares(docId);
      setShares(res.data.shares);
    } catch {
      // owner-only endpoint; silently ignore if viewer somehow opens this
    } finally {
      setLoadingShares(false);
    }
  }

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  async function handleShare(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await documentsApi.share(docId, email.trim(), permission);
      setSuccess(`Shared with ${res.data.sharedWith.name}`);
      setEmail('');
      loadShares();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(userId) {
    try {
      await documentsApi.revokeShare(docId, userId);
      loadShares();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={18} /> Share Document
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleShare} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email / User</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user2@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Permission</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Sharing…' : 'Share'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">People with access</p>
          {loadingShares ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-xs text-gray-400">Only you have access right now.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((s) => (
                <li key={s._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-700">{s.user.name}</p>
                    <p className="text-xs text-gray-400">{s.user.email} · {s.permission}</p>
                  </div>
                  <button onClick={() => handleRevoke(s.user.id)} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
