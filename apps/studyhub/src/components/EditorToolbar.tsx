"use client";

import { useRef, useState } from "react";
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

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
  noteId: string;
};

type UploadResponse = {
  image?: {
    id: string;
    url: string;
    originalName: string;
    altText: string;
  };
  error?: string;
};

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default function EditorToolbar({ editor, noteId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

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
    if (editor.isDestroyed) return;

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

      default:
        break;
    }
  };

  const openImagePicker = () => {
    if (editor.isDestroyed || isUploadingImage) {
      return;
    }

    setImageUploadError("");
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    /*
     * Nulstil inputtet med det samme. Så kan brugeren vælge
     * den samme fil igen efter en eventuel fejl.
     */
    event.target.value = "";

    if (!file || editor.isDestroyed) {
      return;
    }

    setImageUploadError("");

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImageUploadError("Kun JPEG, PNG, WebP og GIF er tilladt.");
      return;
    }

    if (file.size === 0) {
      setImageUploadError("Den valgte fil er tom.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageUploadError("Billedet må højst fylde 8 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("altText", file.name);

    setIsUploadingImage(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/images`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Billedet kunne ikke uploades.");
      }

      if (!data.image?.url) {
        throw new Error("Upload-endpointet returnerede ingen billed-URL.");
      }

      if (editor.isDestroyed) {
        return;
      }

      const inserted = editor
        .chain()
        .focus()
        .setImage({
          src: data.image.url,
          alt: data.image.altText || data.image.originalName || file.name,
          title: data.image.originalName || file.name,
        })
        .run();

      if (!inserted) {
        throw new Error("Billedet blev uploadet, men kunne ikke indsættes.");
      }
    } catch (error) {
      console.error("Image upload failed:", error);

      setImageUploadError(
        error instanceof Error
          ? error.message
          : "Der skete en ukendt fejl under upload.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const printDocument = () => {
    if (editor.isDestroyed) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      window.alert(
        "Browseren blokerede printvinduet. Tillad popups og prøv igen.",
      );
      return;
    }

    const documentHtml = editor.getHTML();

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="da">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>StudyHub-note</title>

          <style>
            @page {
              size: A4;
              margin: 20mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              color: #111827;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
            }

            h1 {
              margin: 0 0 16px;
              font-size: 24pt;
              line-height: 1.2;
            }

            h2 {
              margin: 24px 0 10px;
              font-size: 18pt;
              line-height: 1.3;
            }

            h3 {
              margin: 20px 0 8px;
              font-size: 14pt;
              line-height: 1.3;
            }

            p {
              margin: 0 0 10px;
            }

            ul,
            ol {
              margin: 8px 0 12px;
              padding-left: 24px;
            }

            li {
              margin: 3px 0;
            }

            a {
              color: #2563eb;
              text-decoration: underline;
            }

            mark {
              color: inherit;
              background: #fef08a;
              padding: 0 2px;
              border-radius: 2px;
            }

            blockquote {
              margin: 16px 0;
              padding-left: 14px;
              color: #4b5563;
              border-left: 3px solid #d1d5db;
            }

            pre {
              overflow-wrap: anywhere;
              white-space: pre-wrap;
              padding: 12px;
              background: #f3f4f6;
              border-radius: 6px;
            }

            code {
              font-family: "SFMono-Regular", Consolas, monospace;
            }

            hr {
              margin: 24px 0;
              border: 0;
              border-top: 1px solid #d1d5db;
            }

            img {
              display: block;
              max-width: 100%;
              height: auto;
              margin: 16px auto;
              break-inside: avoid;
            }

            table {
              width: 100%;
              margin: 16px 0;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th,
            td {
              padding: 8px 10px;
              border: 1px solid #9ca3af;
              text-align: left;
              vertical-align: top;
              overflow-wrap: anywhere;
            }

            th {
              background: #f3f4f6;
              font-weight: 600;
            }

            th p,
            td p {
              margin: 0;
            }

            th ul,
            th ol,
            td ul,
            td ol {
              margin: 0;
              padding-left: 20px;
            }

            table,
            blockquote,
            pre {
              break-inside: avoid;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }

              a {
                color: inherit;
              }
            }
          </style>
        </head>

        <body>
          <main>
            ${documentHtml}
          </main>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.addEventListener(
      "load",
      () => {
        printWindow.focus();
        printWindow.print();
      },
      { once: true },
    );
  };

  return (
    <>
      <div className={styles.toolbar}>
        {/* History */}
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

        {/* Block type */}
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

          {/*
          <option value="quote">Quote</option>
          <option value="code">Code block</option>
          */}
        </select>

        <span className={styles.separator} />

        {/* Lists */}
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

        {/* Insert */}
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

        {/* Export */}
        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={(event) => {
            event.preventDefault();
            printDocument();
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
