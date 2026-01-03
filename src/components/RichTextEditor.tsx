/**
 * Rich Text Editor Component
 *
 * Tiptap-based rich text editor with:
 * - Floating toolbar on text selection
 * - Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U, etc.)
 * - Markdown-style auto-convert
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { useEffect, useImperativeHandle, forwardRef, useCallback, useRef, useState } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, Heading2, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface RichTextEditorRef {
  focus: () => void;
  getHTML: () => string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, onBlur, placeholder, disabled = false, autoFocus = false }, ref) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2],
          },
        }),
        Underline,
        BubbleMenuExtension.configure({
          element: menuRef.current,
          shouldShow: ({ editor, from, to }) => {
            // Show on text selection
            const hasSelection = from !== to;
            const isEditable = editor.isEditable;
            setIsMenuVisible(hasSelection && isEditable);
            return hasSelection && isEditable;
          },
        }),
      ],
      content: content || '',
      editable: !disabled,
      autofocus: autoFocus ? 'end' : false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      onBlur: () => {
        onBlur?.();
      },
      editorProps: {
        attributes: {
          class: 'rich-text-editor-content',
          'data-placeholder': placeholder || 'Start typing...',
        },
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => editor?.chain().focus().run(),
      getHTML: () => editor?.getHTML() || '',
    }), [editor]);

    // Sync content changes from parent
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || '');
      }
    }, [content, editor]);

    // Custom keyboard handlers for mnemonic shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!editor) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case 'b':
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
            break;
          case 'n':
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
            break;
          case '8':
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
            break;
          case '7':
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
            break;
        }
      }
    }, [editor]);

    if (!editor) {
      return null;
    }

    return (
      <div className="rich-text-editor" onKeyDown={handleKeyDown}>
        {/* Floating toolbar - positioned by BubbleMenu extension */}
        <div
          ref={menuRef}
          className={`bubble-menu ${isMenuVisible ? 'visible' : ''}`}
          style={{ visibility: isMenuVisible ? 'visible' : 'hidden' }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold (Cmd+B)"
            aria-label="Toggle bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic (Cmd+I)"
            aria-label="Toggle italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="Underline (Cmd+U)"
            aria-label="Toggle underline"
          >
            <UnderlineIcon size={16} />
          </button>
          <span className="bubble-menu-divider" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="Heading (Cmd+Shift+H)"
            aria-label="Toggle heading"
          >
            <Heading2 size={16} />
          </button>
          <span className="bubble-menu-divider" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="Bullet List (Cmd+Shift+8)"
            aria-label="Toggle bullet list"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="Numbered List (Cmd+Shift+7)"
            aria-label="Toggle numbered list"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
