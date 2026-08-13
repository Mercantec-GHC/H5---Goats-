"use client";

import { useEffect, useState } from "react";
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
import { useNotePreview } from "@/hooks/useNotePreview";
import { StudyHubImage } from "@/extensions/StudyHubImage";
import { ClearLinkOnDelete } from "@/extensions/ClearLinkOnDelete";

import BubbleToolbar from "@/components/BubbleToolbar";
import EditorToolbar from "@/components/EditorToolbar";
import OnlineUsers from "@/components/OnlineUsers";
import TableBubbleToolbar from "@/components/TableBubbleToolbar";
import ImageBubbleToolbar from "@/components/ImageBubbleToolbar";

import { createProvider } from "@/lib/collab/createProvider";
import { createYDoc } from "@/lib/collab/createYDoc";
import { createImageDropHandler } from "@/lib/editor/createImageDropHandler";

import { useNoteImageSync } from "@/hooks/useNoteImageSync";

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

function CollaborativeEditor({
  noteId,
  ydoc,
  provider,
  user,
}: CollaborativeEditorProps) {
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

      editorProps: {
        handleDrop: createImageDropHandler(noteId),
      },

      immediatelyRender: false,
    },
    [noteId, ydoc, provider, user],
  );

  /*
   * Holder note_images synkroniseret med
   * hvilke imageId'er der findes i editor-dokumentet.
   *
   * Håndterer bl.a.:
   * - toolbar delete
   * - Backspace/Delete
   * - Undo/Redo
   * - collaborative changes
   */
  useNoteImageSync(editor);
  useNotePreview(editor, noteId);

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
