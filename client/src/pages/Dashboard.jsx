import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, FileText } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import DocumentCard from '../components/DocumentCard.jsx';
import { documentsApi, filesApi, errorMessage } from '../services/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const res = await documentsApi.list();
      setOwned(res.data.owned);
      setShared(res.data.shared);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError('');
    try {
      const res = await documentsApi.create('Untitled document');
      navigate(`/documents/${res.data.document._id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const res = await filesApi.import(file);
      navigate(`/documents/${res.data.document._id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Welcome back</h1>
            <p className="text-sm text-gray-400 mt-1">Your documents, owned and shared</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-2 border border-gray-200 hover:border-brand-300 hover:text-brand-700 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              Import File
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.docx" onChange={handleImport} className="hidden" />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <Plus size={16} /> New Doc
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading documents…</p>
        ) : (
          <>
            <Section title="My Documents">
              {owned.length === 0 ? (
                <EmptyState onCreate={handleCreate} />
              ) : (
                <Grid>
                  {owned.map((doc) => (
                    <DocumentCard
                      key={doc._id}
                      doc={doc}
                      onDeleted={(deletedId) => {
                        setOwned((current) =>
                          current.filter((item) => item._id !== deletedId)
                        );
                      }}
                    />
                  ))}
                </Grid>
              )}
            </Section>

            <Section title="Shared With Me">
              {shared.length === 0 ? (
                <p className="text-sm text-gray-400">No one has shared a document with you yet.</p>
              ) : (
                <Grid>{shared.map((doc) => <DocumentCard key={doc._id} doc={doc} />)}</Grid>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function EmptyState({ onCreate }) {
  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
      <FileText size={28} className="mx-auto text-gray-300 mb-3" />
      <p className="text-sm text-gray-500 mb-4">You don't have any documents yet.</p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={16} /> Create your first document
      </button>
    </div>
  );
}
