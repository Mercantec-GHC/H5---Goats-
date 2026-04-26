"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
type Note = {
  id: string;
  title: string;
  content: string;
};

type TopicWithNotes = {
  id: string;
  title: string;
  notes: Note[];
  subjectId: string;
};

export default function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [topic, setTopic] = useState<TopicWithNotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");

  const fetchTopic = async () => {
    const res = await fetch(`/api/topics/${id}`);
    const data = await res.json();

    setTopic(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const createNote = async () => {
    if (!noteTitle.trim()) return;

    await fetch(`/api/topics/${id}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: noteTitle }),
    });

    setNoteTitle("");
    fetchTopic();
  };

  if (loading) return <p>Loading...</p>;
  if (!topic) return <p>Emne ikke fundet</p>;

  return (
    <section className={styles.container}>
      <Link href={`/subjects/${topic.subjectId}`} className={styles.backButton}>
        ← Tilbage til emner
      </Link>
      <h1 className={styles.title}>{topic.title}</h1>

      {/* Create note */}
      <div className={styles.createBox}>
        <input
          className={styles.input}
          placeholder="Ny note"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
        />
        <button className={styles.button} onClick={createNote}>
          Opret
        </button>
      </div>

      {/* Notes */}
      <div className={styles.notes}>
        {topic.notes.length === 0 ? (
          <p>Ingen noter endnu</p>
        ) : (
          topic.notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={styles.noteCard}
            >
              {note.title}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
