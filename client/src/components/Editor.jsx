import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar.jsx';

const AUTOSAVE_DELAY_MS = 800;

export default function Editor({ content, editable, onSave, onDirtyChange }) {
  const saveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onDirtyChange?.(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onSave(editor.getJSON());
      }, AUTOSAVE_DELAY_MS);
    },
  });

  // Keep editable state in sync (e.g. if permission info arrives after mount)
  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <Toolbar editor={editor} readOnly={!editable} />
      <div className="px-6 py-4 max-w-3xl mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
