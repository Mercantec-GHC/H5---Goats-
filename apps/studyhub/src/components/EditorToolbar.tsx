"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
};

export default function EditorToolbar({ editor }: Props) {
  const buttonClass = (active: boolean) =>
    active ? styles.activeButton : styles.toolbarButton;

  return (
    <div className={styles.toolbar}>
      {/* Undo / Redo */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo2 size={18} />
      </button>

      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo2 size={18} />
      </button>

      <span className={styles.separator} />

      {/* Block Type */}
      <select
        className={styles.toolbarSelect}
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("blockquote")
                  ? "quote"
                  : editor.isActive("codeBlock")
                    ? "code"
                    : "paragraph"
        }
        onChange={(event) => {
          const value = event.target.value;

          switch (value) {
            case "paragraph":
              editor.chain().focus().setParagraph().run();
              break;

            case "h1":
              editor.chain().focus().toggleHeading({ level: 1 }).run();
              break;

            case "h2":
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              break;

            case "h3":
              editor.chain().focus().toggleHeading({ level: 3 }).run();
              break;

            case "quote":
              editor.chain().focus().toggleBlockquote().run();
              break;

            case "code":
              editor.chain().focus().toggleCodeBlock().run();
              break;
          }
        }}
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
        <option value="code">Code block</option>
      </select>

      <span className={styles.separator} />

      {/* Text Formatting */}
      <button
        type="button"
        className={buttonClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold size={18} />
      </button>

      <button
        type="button"
        className={buttonClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic size={18} />
      </button>

      <button
        type="button"
        className={buttonClass(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strike"
      >
        <Strikethrough size={18} />
      </button>

      <span className={styles.separator} />

      {/* Lists */}
      <button
        type="button"
        className={buttonClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <List size={18} />
      </button>

      <button
        type="button"
        className={buttonClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
      >
        <ListOrdered size={18} />
      </button>

      <span className={styles.separator} />

      {/* Blocks */}
      <button
        type="button"
        className={buttonClass(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Quote"
      >
        <Quote size={18} />
      </button>

      <button
        type="button"
        className={buttonClass(editor.isActive("codeBlock"))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Code Block"
      >
        <Code2 size={18} />
      </button>

      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Horizontal Rule"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}
