/*
"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import styles from "./NoteEditor.module.css";

type NoteEditorProps = {
  noteId: string;
};

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const ydoc = useMemo(() => new Y.Doc(), [noteId]);

  const provider = useMemo(() => {
    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `note-${noteId}`,
      document: ydoc,
    });

    provider.on("status", ({ status }: { status: string }) => {
      console.log("[hocuspocus status]", status);
    });

    provider.on("connect", () => {
      console.log("[hocuspocus] connected");
    });

    provider.on("synced", () => {
      console.log("[hocuspocus] synced");
    });

    provider.on("outgoingMessage", () => {
      console.log("[hocuspocus] outgoing message", Date.now());
    });

    provider.on("message", () => {
      console.log("[hocuspocus] incoming message", Date.now());
    });

    return provider;
  }, [noteId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: ydoc,
        field: "default",
      }),
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  if (!editor) return null;

  return (
    <div className={styles.wrapper}>
      <EditorContent editor={editor} className={styles.editor} />
    </div>
  );
}
*/

"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import styles from "./NoteEditor.module.css";

type NoteEditorProps = {
  noteId: string;
};

function CollaborativeEditor({ ydoc }: { ydoc: Y.Doc }) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        Collaboration.configure({
          document: ydoc,
          field: "default",
        }),
      ],
      immediatelyRender: false,
    },
    [ydoc],
  );

  if (!editor) return null;

  return <EditorContent editor={editor} className={styles.editor} />;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `note-${noteId}`,
      document: doc,
    });

    provider.on("status", ({ status }: { status: string }) => {
      console.log("[hocuspocus status]", status);
    });

    setYdoc(doc);

    return () => {
      provider.destroy();
      doc.destroy();
      setYdoc(null);
    };
  }, [noteId]);

  if (!ydoc) return null;

  return (
    <div className={styles.wrapper}>
      <CollaborativeEditor ydoc={ydoc} />
    </div>
  );
}
