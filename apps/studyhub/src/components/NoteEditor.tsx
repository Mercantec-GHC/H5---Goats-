"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import { StudyHubImage } from "@/extensions/StudyHubImage";
import { ClearLinkOnDelete } from "@/extensions/ClearLinkOnDelete";

import { uploadNoteImage } from "@/lib/images/uploadNoteImage";
import {
  getImageIdsFromEditor,
  restoreNoteImage,
} from "@/lib/images/syncNoteImages";

import BubbleToolbar from "@/components/BubbleToolbar";
import EditorToolbar from "@/components/EditorToolbar";
import OnlineUsers from "@/components/OnlineUsers";
import TableBubbleToolbar from "@/components/TableBubbleToolbar";
import ImageBubbleToolbar from "@/components/ImageBubbleToolbar";

import { createProvider } from "@/lib/collab/createProvider";
import { createYDoc } from "@/lib/collab/createYDoc";

import styles from "./NoteEditor.module.css";

type NoteEditorUser = {
  name: string;
  color: string;
};

type NoteEditorProps = {
  noteId: string;
  user: NoteEditorUser;
};

type CollaborativeEditorProps = {
  noteId: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: NoteEditorUser;
};

/*
 * Marker et billede som slettet i databasen.
 *
 * R2-filen slettes IKKE her.
 * Det håndteres senere af garbage collection.
 */
async function softDeleteNoteImage(imageId: string) {
  const response = await fetch(`/api/note-images/${imageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(data?.error ?? "Billedet kunne ikke markeres som slettet.");
  }
}

function CollaborativeEditor({
  noteId,
  ydoc,
  provider,
  user,
}: CollaborativeEditorProps) {
  /*
   * Holder styr på hvilke billeder der fandtes
   * ved sidste dokumentopdatering.
   */
  const previousImageIdsRef = useRef<Set<string>>(new Set());

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false,
          link: false,
          underline: false,
        }),

        Collaboration.configure({
          document: ydoc,
          field: "default",
        }),

        CollaborationCaret.configure({
          provider,
          user,
        }),

        Link.configure({
          openOnClick: true,
          autolink: true,
          defaultProtocol: "https",
        }),

        Underline,
        Highlight,

        StudyHubImage,

        Table.configure({
          resizable: true,
        }),

        TableRow,
        TableHeader,
        TableCell,

        ClearLinkOnDelete,
      ],

      /*
       * Drag & drop image upload
       */
      editorProps: {
        handleDrop(view, event) {
          const files = Array.from(event.dataTransfer?.files ?? []);

          const imageFiles = files.filter((file) =>
            file.type.startsWith("image/"),
          );

          /*
           * Ikke et image-drop.
           * Lad ProseMirror håndtere eventet normalt.
           */
          if (imageFiles.length === 0) {
            return false;
          }

          event.preventDefault();

          const position = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (!position) {
            return true;
          }

          const dropPosition = position.pos;

          void (async () => {
            let currentPosition = dropPosition;

            for (const file of imageFiles) {
              try {
                /*
                 * Upload først til API → database → R2.
                 */
                const image = await uploadNoteImage(noteId, file);

                if (view.isDestroyed) {
                  return;
                }

                /*
                 * Opret image-node med database-ID.
                 */
                const imageNode = view.state.schema.nodes.image.create({
                  src: image.url,

                  imageId: image.id,

                  alt: image.altText || image.originalName || file.name,

                  title: image.originalName || file.name,

                  alignment: "center",
                });

                /*
                 * Indsæt billedet præcis hvor brugeren droppede det.
                 */
                const transaction = view.state.tr.insert(
                  currentPosition,
                  imageNode,
                );

                view.dispatch(transaction);

                /*
                 * Hvis flere billeder bliver droppet samtidig,
                 * indsæt næste efter det foregående.
                 */
                currentPosition += imageNode.nodeSize;
              } catch (error) {
                console.error("Dropped image upload failed:", error);
              }
            }
          })();

          return true;
        },
      },

      immediatelyRender: false,
    },
    [noteId, ydoc, provider, user],
  );

  /*
   * Synkronisér hvilke billeder der faktisk findes
   * i Yjs/Tiptap-dokumentet med note_images-tabellen.
   *
   * Dette håndterer:
   *
   * - toolbar delete
   * - Backspace/Delete
   * - Undo
   * - Redo
   * - collaborative changes
   */
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    /*
     * Start med dokumentets nuværende state.
     *
     * Vi sender ikke API-kald her.
     */
    previousImageIdsRef.current = getImageIdsFromEditor(editor);

    const syncImages = () => {
      if (editor.isDestroyed) {
        return;
      }

      const previousImageIds = previousImageIdsRef.current;

      const currentImageIds = getImageIdsFromEditor(editor);

      /*
       * --------------------------------
       * BILLEDER DER ER KOMMET TILBAGE
       * --------------------------------
       *
       * Fx:
       *
       * Delete
       * → Undo
       *
       * eller en collaborator gendanner billedet.
       */
      for (const imageId of currentImageIds) {
        if (!previousImageIds.has(imageId)) {
          void restoreNoteImage(imageId).catch((error) => {
            console.error(`Could not restore image ${imageId}:`, error);
          });
        }
      }

      /*
       * --------------------------------
       * BILLEDER DER ER FORSVUNDET
       * --------------------------------
       *
       * Fx:
       *
       * toolbar delete
       * Backspace
       * Delete
       * Redo
       * collaboration
       */
      for (const imageId of previousImageIds) {
        if (!currentImageIds.has(imageId)) {
          void softDeleteNoteImage(imageId).catch((error) => {
            console.error(`Could not soft-delete image ${imageId}:`, error);
          });
        }
      }

      /*
       * Gem det nye snapshot til næste update.
       */
      previousImageIdsRef.current = currentImageIds;
    };

    editor.on("update", syncImages);

    return () => {
      editor.off("update", syncImages);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.editorShell}>
      <EditorToolbar editor={editor} noteId={noteId} />

      <TableBubbleToolbar editor={editor} />

      <ImageBubbleToolbar editor={editor} />

      <BubbleToolbar editor={editor} />

      <EditorContent editor={editor} className={styles.editor} />
    </div>
  );
}

export default function NoteEditor({ noteId, user }: NoteEditorProps) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  useEffect(() => {
    const doc = createYDoc();

    const hocuspocusProvider = createProvider(noteId, doc);

    setYdoc(doc);
    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      doc.destroy();

      setYdoc(null);
      setProvider(null);
    };
  }, [noteId]);

  if (!ydoc || !provider) {
    return <p>Indlæser editor...</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <OnlineUsers provider={provider} />
      </div>

      <CollaborativeEditor
        noteId={noteId}
        ydoc={ydoc}
        provider={provider}
        user={user}
      />
    </div>
  );
}
