"use client";

import { use, useEffect, useState } from "react";
import { JSONContent } from "@tiptap/react";
import styles from "./page.module.css";
import NoteEditor from "@/components/NoteEditor";

type Note = {
  id: string;
  title: string;
  ydocState: string;
  topicId: string | null;
};

const emptyDocument: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function parseEditorContent(value: string): JSONContent {
  if (!value) return emptyDocument;

  try {
    return JSON.parse(value);
  } catch {
    return emptyDocument;
  }
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [note, setNote] = useState<Note | null>(null);
  const [editorContent, setEditorContent] =
    useState<JSONContent>(emptyDocument);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNote = async () => {
    const res = await fetch(`/api/notes/${id}`);
    const data = await res.json();

    setNote(data);
    setEditorContent(parseEditorContent(data.ydocState));
    setLoading(false);
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

  const saveNote = async () => {
    if (!note) return;

    setSaving(true);

    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: note.title,
        ydocState: JSON.stringify(editorContent),
      }),
    });

    setSaving(false);
  };

  if (loading) return <p>Loading...</p>;
  if (!note) return <p>Note ikke fundet</p>;

  return (
    <section className={styles.container}>
      <input
        className={styles.title}
        value={note.title}
        onChange={(e) =>
          setNote((prev) => prev && { ...prev, title: e.target.value })
        }
      />

      <NoteEditor noteId={note.id} />

      <button
        className={styles.saveButton}
        onClick={saveNote}
        disabled={saving}
      >
        {saving ? "Gemmer..." : "Gem"}
      </button>
    </section>
  );
}
