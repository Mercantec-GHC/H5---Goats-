"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import styles from "./NoteEditor.module.css";

import { createProvider } from "@/lib/collab/createProvider";
import { createYDoc } from "@/lib/collab/createYDoc";

import OnlineUsers from "@/components/OnlineUsers";
import EditorToolbar from "@/components/EditorToolbar";

type NoteEditorUser = {
  name: string;
  color: string;
};

type NoteEditorProps = {
  noteId: string;
  user: NoteEditorUser;
};

function CollaborativeEditor({
  ydoc,
  provider,
  user,
}: {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: NoteEditorUser;
}) {
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
        CollaborationCaret.configure({
          provider,
          user,
        }),
      ],
      immediatelyRender: false,
    },
    [ydoc, provider, user],
  );

  if (!editor) return null;

  return (
    <div className={styles.editorShell}>
      <EditorToolbar editor={editor} />

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

      <CollaborativeEditor ydoc={ydoc} provider={provider} user={user} />
    </div>
  );
}
