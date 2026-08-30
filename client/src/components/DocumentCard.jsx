import {
  FileText,
  Crown,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { documentsApi } from '../services/api.js';

const permissionMeta = {
  owner: {
    label: 'Owned',
    icon: Crown,
    className: 'text-amber-600 bg-amber-50',
  },

  editor: {
    label: 'Shared · Editor',
    icon: Pencil,
    className: 'text-brand-600 bg-brand-50',
  },

  viewer: {
    label: 'Shared · Viewer',
    icon: Eye,
    className: 'text-gray-500 bg-gray-100',
  },
};

export default function DocumentCard({ doc, onDeleted }) {
  const navigate = useNavigate();

  const meta =
    permissionMeta[doc.permission] ||
    permissionMeta.viewer;

  const Icon = meta.icon;

  const updated = new Date(doc.updatedAt).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  async function handleDelete(event) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${doc.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await documentsApi.remove(doc._id);

      onDeleted?.(doc._id);
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        'Unable to delete document.';

      window.alert(message);
    }
  }

  function openDocument() {
    navigate(`/documents/${doc._id}`);
  }

  return (
    <div className="text-left bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-brand-200 transition-all group">
      <button
        onClick={openDocument}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="bg-gray-50 group-hover:bg-brand-50 rounded-lg p-2 transition-colors">
            <FileText
              size={18}
              className="text-gray-400 group-hover:text-brand-600"
            />
          </div>

          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${meta.className}`}
          >
            <Icon size={12} />
            {meta.label}
          </span>
        </div>

        <h3 className="font-medium text-gray-800 truncate">
          {doc.title}
        </h3>

        <p className="text-xs text-gray-400 mt-1">
          {doc.ownerName
            ? `by ${doc.ownerName} · `
            : ''}
          Updated {updated}
        </p>
      </button>

      {doc.permission === 'owner' && (
        <div className="flex justify-end mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete document"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}