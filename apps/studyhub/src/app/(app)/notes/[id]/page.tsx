"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import NoteEditor from "@/components/NoteEditor";
import { useSession } from "next-auth/react";
import ShareNoteButton from "@/components/notes/ShareNoteButton";
import CollaboratorsSidebar from "@/components/notes/CollaboratorsSidebar";
type Note = {
  id: string;
  title: string;
  topicId: string | null;
};

function getColorFromString(str: string) {
  const colors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#f59e0b",
    "#0891b2",
    "#db2777",
    "#ea580c",
    "#4f46e5",
    "#059669",
    "#be123c",
    "#7c3aed",
    "#0f766e",
    "#c2410c",
    "#4338ca",
  ];

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
// Viser en note og dens detaljer
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
// Gemmer den opdaterede titel på noten
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
// Håndterer loading, error og not found states
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!note) return <p>Note ikke fundet</p>;

  const userName = session?.user?.name ?? session?.user?.email ?? "Anonymous";

  const colorKey = session?.user?.id ?? session?.user?.email ?? userName;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <input
          className={styles.title}
          value={note.title}
          onChange={(e) =>
            setNote((prev) => prev && { ...prev, title: e.target.value })
          }
          onBlur={saveTitle}
        />

        <ShareNoteButton noteId={note.id} />
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.editorSection}>
          <NoteEditor
            noteId={note.id}
            user={{
              name: userName,
              color: getColorFromString(colorKey),
            }}
          />
        </div>

        <aside className={styles.sidebar}>
          <CollaboratorsSidebar noteId={note.id} />
        </aside>
      </div>

      {savingTitle ? <p>Gemmer titel...</p> : null}
    </section>
  );
}
