"use client";

import type { Editor } from "@tiptap/react";
import { List, ListOrdered, Minus, Undo2, Redo2 } from "lucide-react";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
};

export default function EditorToolbar({ editor }: Props) {
  const buttonClass = (active: boolean) =>
    active ? styles.activeButton : styles.toolbarButton;

  const getBlockType = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    if (editor.isActive("blockquote")) return "quote";
    if (editor.isActive("codeBlock")) return "code";

    return "paragraph";
  };

  const handleBlockTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    switch (value) {
      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;

      case "h1":
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;

      case "h2":
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;

      case "h3":
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;

      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;

      case "code":
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
  };

  return (
    <div className={styles.toolbar}>
      {/* History */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        title="Undo"
      >
        <Undo2 size={18} />
      </button>

      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        title="Redo"
      >
        <Redo2 size={18} />
      </button>

      <span className={styles.separator} />

      {/* Block type */}
      <select
        className={styles.toolbarSelect}
        value={getBlockType()}
        onChange={handleBlockTypeChange}
        aria-label="Text type"
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
        <option value="code">Code block</option>
      </select>

      <span className={styles.separator} />

      {/* Lists */}
      <button
        type="button"
        className={buttonClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
        title="Bullet list"
      >
        <List size={18} />
      </button>

      <button
        type="button"
        className={buttonClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
        title="Ordered list"
      >
        <ListOrdered size={18} />
      </button>

      <span className={styles.separator} />

      {/* Insert */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Insert horizontal rule"
        title="Horizontal rule"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}
