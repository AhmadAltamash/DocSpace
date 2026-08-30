import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Eye,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import Editor from '../components/Editor.jsx';
import ShareModal from '../components/ShareModal.jsx';
import { documentsApi, errorMessage } from '../services/api.js';

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [showShare, setShowShare] = useState(false);
  const [title, setTitle] = useState('');
  const titleTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    documentsApi
      .get(id)
      .then((res) => {
        setDoc(res.data.document);
        setPermission(res.data.permission);
        setTitle(res.data.document.title);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const canEdit = permission === 'owner' || permission === 'editor';

  async function handleDelete() {
  const confirmed = window.confirm(
    `Delete "${title}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await documentsApi.remove(id);
    navigate('/');
  } catch (err) {
    setError(errorMessage(err));
  }
}

  const handleContentSave = useCallback(
    async (json) => {
      setSaveState('saving');
      try {
        await documentsApi.update(id, { content: json });
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        setError(errorMessage(err));
      }
    },
    [id]
  );

  function handleTitleChange(value) {
    setTitle(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      if (!value.trim()) return;
      setSaveState('saving');
      try {
        await documentsApi.update(id, { title: value.trim() });
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        setError(errorMessage(err));
      }
    }, 600);
  }

  if (loading) {
    return <CenteredMessage>Loading document…</CenteredMessage>;
  }

  if (error && !doc) {
    return (
      <CenteredMessage>
        <AlertTriangle className="mx-auto mb-2 text-red-400" size={24} />
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-brand-600 hover:underline">
          Back to documents
        </button>
      </CenteredMessage>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 shrink-0">
            <ArrowLeft size={18} />
          </button>

          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={!canEdit}
            className="flex-1 min-w-0 text-lg font-medium text-gray-800 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-2 py-1 disabled:opacity-70"
          />

          <PermissionBadge permission={permission} />
          <SaveStatus state={saveState} />

          {permission === 'owner' && (
            <>
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-700 border border-gray-200 rounded-lg px-3 py-1.5 shrink-0"
              >
                <Users size={14} />
                Share
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 shrink-0"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {!canEdit && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            <Eye size={14} /> You have view-only access to this document.
          </div>
        )}
        {error && doc && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <Editor content={doc.content} editable={canEdit} onSave={handleContentSave} />
      </main>

      {showShare && <ShareModal docId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function CenteredMessage({ children }) {
  return <div className="h-screen flex items-center justify-center text-center px-4">{children}</div>;
}

function PermissionBadge({ permission }) {
  const labels = { owner: 'Owned', editor: 'Shared · Editor', viewer: 'Shared · Viewer' };
  return <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{labels[permission]}</span>;
}

function SaveStatus({ state }) {
  if (state === 'idle') return null;
  const map = {
    saving: { icon: <Loader2 size={13} className="animate-spin" />, text: 'Saving…', className: 'text-gray-400' },
    saved: { icon: <Check size={13} />, text: 'Saved', className: 'text-green-600' },
    error: { icon: <AlertTriangle size={13} />, text: 'Save failed', className: 'text-red-500' },
  };
  const s = map[state];
  return (
    <span className={`flex items-center gap-1 text-xs shrink-0 ${s.className}`}>
      {s.icon} {s.text}
    </span>
  );
}
