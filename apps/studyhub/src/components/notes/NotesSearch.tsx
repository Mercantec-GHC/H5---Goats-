"use client";

import { useState } from "react";
import NoteCard from "@/components/NoteCard";
import styles from "./NotesSearch.module.css";

type Note = {
  id: string;
  title: string;
  topicId: string | null;
  ownerId: string;
  updatedAt: string | Date;
  topic?: {
    title: string;
  } | null;
};

type NotesSearchProps = {
  notes: Note[];
  currentUserId: string;
};
// NotesSearch component
export default function NotesSearch({
  notes,
  currentUserId,
}: NotesSearchProps) {
  const [query, setQuery] = useState("");

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Alle noter</h2>

        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg efter noter..."
        />
      </div>

      {filteredNotes.length === 0 ? (
        <p className={styles.empty}>Ingen noter fundet</p>
      ) : (
        <div className={styles.grid}>
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              topicTitle={
                note.ownerId !== currentUserId
                  ? "Delt med mig"
                  : note.topic?.title
              }
              updatedAt={note.updatedAt}
            />
          ))}
        </div>
      )}
    </section>
  );
}
