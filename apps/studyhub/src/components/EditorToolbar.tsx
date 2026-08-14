"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  ImagePlus,
  List,
  ListOrdered,
  Minus,
  Printer,
  Redo2,
  Table2,
  Undo2,
} from "lucide-react";

import { useToolbarImageUpload } from "@/hooks/useToolbarImageUpload";
import { printNote } from "@/lib/editor/printNote";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
  noteId: string;
};

export default function EditorToolbar({ editor, noteId }: Props) {
  const {
    fileInputRef,
    isUploadingImage,
    imageUploadError,
    openImagePicker,
    handleImageUpload,
  } = useToolbarImageUpload(editor, noteId);

  const {
    canUndo,
    canRedo,
    blockType,
    isBulletListActive,
    isOrderedListActive,
  } = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor || editor.isDestroyed) {
        return {
          canUndo: false,
          canRedo: false,
          blockType: "paragraph",
          isBulletListActive: false,
          isOrderedListActive: false,
        };
      }

      let blockType = "paragraph";

      if (editor.isActive("heading", { level: 1 })) {
        blockType = "h1";
      } else if (editor.isActive("heading", { level: 2 })) {
        blockType = "h2";
      } else if (editor.isActive("heading", { level: 3 })) {
        blockType = "h3";
      } else if (editor.isActive("blockquote")) {
        blockType = "quote";
      } else if (editor.isActive("codeBlock")) {
        blockType = "code";
      }

      return {
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        blockType,
        isBulletListActive: editor.isActive("bulletList"),
        isOrderedListActive: editor.isActive("orderedList"),
      };
    },
  });

  const buttonClass = (active: boolean) =>
    active ? styles.activeButton : styles.toolbarButton;

  const handleBlockTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (editor.isDestroyed) {
      return;
    }

    switch (event.target.value) {
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

      default:
        break;
    }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor.chain().focus().undo().run();
          }}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 size={18} />
        </button>

        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor.chain().focus().redo().run();
          }}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 size={18} />
        </button>

        <span className={styles.separator} />

        <select
          className={styles.toolbarSelect}
          value={blockType}
          onChange={handleBlockTypeChange}
          aria-label="Text type"
        >
          <option value="paragraph">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <span className={styles.separator} />

        <button
          type="button"
          className={buttonClass(isBulletListActive)}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor.chain().focus().toggleBulletList().run();
          }}
          aria-label="Bullet list"
          title="Bullet list"
        >
          <List size={18} />
        </button>

        <button
          type="button"
          className={buttonClass(isOrderedListActive)}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor.chain().focus().toggleOrderedList().run();
          }}
          aria-label="Ordered list"
          title="Ordered list"
        >
          <ListOrdered size={18} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor.chain().focus().setHorizontalRule().run();
          }}
          aria-label="Insert horizontal rule"
          title="Horizontal rule"
        >
          <Minus size={18} />
        </button>

        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();

            if (editor.isDestroyed) return;

            editor
              .chain()
              .focus()
              .insertTable({
                rows: 3,
                cols: 3,
                withHeaderRow: true,
              })
              .run();
          }}
          aria-label="Insert table"
          title="Insert table"
        >
          <Table2 size={18} />
        </button>

        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();
            openImagePicker();
          }}
          disabled={isUploadingImage}
          aria-label={isUploadingImage ? "Uploading image" : "Insert image"}
          title={isUploadingImage ? "Uploading image..." : "Insert image"}
        >
          <ImagePlus size={18} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();
            printNote(editor);
          }}
          aria-label="Export as PDF"
          title="Export as PDF"
        >
          <Printer size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handleImageUpload}
        />
      </div>

      {imageUploadError ? (
        <p className={styles.toolbarError} role="alert">
          {imageUploadError}
        </p>
      ) : null}
    </>
  );
}
