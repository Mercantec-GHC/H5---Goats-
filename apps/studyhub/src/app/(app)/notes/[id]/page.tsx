"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import NoteEditor from "@/components/NoteEditor";

type Note = {
  id: string;
  title: string;
  topicId: string | null;
};

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      const res = await fetch(`/api/notes/${id}`);
      const data = await res.json();

      setNote(data);
      setLoading(false);
    };

    fetchNote();
  }, [id]);

  const saveTitle = async () => {
    if (!note) return;

    setSavingTitle(true);

    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: note.title,
      }),
    });

    setSavingTitle(false);
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
        onBlur={saveTitle}
      />

      <NoteEditor noteId={note.id} />

      {savingTitle ? <p>Gemmer titel...</p> : null}
    </section>
  );
}
