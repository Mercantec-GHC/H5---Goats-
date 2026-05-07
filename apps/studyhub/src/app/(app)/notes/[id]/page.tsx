"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import NoteEditor from "@/components/NoteEditor";
import { useSession } from "next-auth/react";

type Note = {
  id: string;
  title: string;
  topicId: string | null;
};

// 🔥 deterministisk farve
function getColorFromString(str: string) {
  const colors = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#9333ea", // purple
    "#f59e0b", // yellow
    "#0891b2", // cyan
    "#db2777", // pink
  ];

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);
  const [error, setError] = useState("");

  const { data: session } = useSession();

  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/notes/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente note");
        setNote(null);
        setLoading(false);
        return;
      }

      setNote(data);
      setLoading(false);
    };

    fetchNote();
  }, [id]);

  const saveTitle = async () => {
    if (!note) return;

    setSavingTitle(true);

    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: note.title,
      }),
    });

    if (!res.ok) {
      setError("Kunne ikke gemme titel");
    }

    setSavingTitle(false);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!note) return <p>Note ikke fundet</p>;

  const userName = session?.user?.name ?? session?.user?.email ?? "Anonymous";

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

      <NoteEditor
        noteId={note.id}
        user={{
          name: userName,
          color: getColorFromString(userName),
        }}
      />

      {savingTitle ? <p>Gemmer titel...</p> : null}
    </section>
  );
}
