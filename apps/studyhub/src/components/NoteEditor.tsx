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
    return new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `note-${noteId}`,
      document: ydoc,
    });
  }, [noteId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: ydoc,
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
