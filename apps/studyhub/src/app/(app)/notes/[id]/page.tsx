"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";

type Note = {
  id: string;
  title: string;
  content: string;
  topicId: string;
};

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNote = async () => {
    const res = await fetch(`/api/notes/${id}`);
    const data = await res.json();

    setNote(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

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

      <textarea
        className={styles.editor}
        value={note.content || ""}
        onChange={(e) =>
          setNote((prev) => prev && { ...prev, content: e.target.value })
        }
        placeholder="Skriv dine noter..."
      />
    </section>
  );
}
