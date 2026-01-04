/**
 * Rich Text Editor Component
 *
 * Tiptap-based rich text editor with keyboard shortcuts.
 * Formatting toolbar is rendered by parent component.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Callback to expose editor instance to parent */
  onEditorReady?: (editor: Editor) => void;
}

export interface RichTextEditorRef {
  focus: () => void;
  getHTML: () => string;
  getEditor: () => Editor | null;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, onBlur, placeholder, disabled = false, autoFocus = false, onEditorReady }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2],
          },
        }),
        Underline,
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
      onCreate: ({ editor }) => {
        onEditorReady?.(editor);
      },
      editorProps: {
        attributes: {
          class: 'rich-text-editor-content',
          'data-placeholder': placeholder || 'Start typing...',
        },
      },
    });

    // Notify parent when editor is ready
    useEffect(() => {
      if (editor) {
        onEditorReady?.(editor);
      }
    }, [editor, onEditorReady]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => editor?.chain().focus().run(),
      getHTML: () => editor?.getHTML() || '',
      getEditor: () => editor,
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
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
