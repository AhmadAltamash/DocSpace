import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

function ToolButton({ active, onClick, disabled, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor, readOnly }) {
  if (!editor) return null;
  const disabled = readOnly;

  return (
    <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-2 flex-wrap">
      <ToolButton
        title="Bold"
        active={editor.isActive('bold')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </ToolButton>
      <ToolButton
        title="Italic"
        active={editor.isActive('italic')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </ToolButton>
      <ToolButton
        title="Underline"
        active={editor.isActive('underline')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={16} />
      </ToolButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolButton
        title="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} />
      </ToolButton>
      <ToolButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolButton
        title="Bulleted list"
        active={editor.isActive('bulletList')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolButton>
      <ToolButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolButton>
    </div>
  );
}
