/*
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import NoteCard from "@/components/NoteCard";

import styles from "./page.module.css";

type Note = {
  id: string;
  title: string;
  previewImageUrl?: string | null;
  updatedAt?: string | Date;
};

type TopicOption = {
  id: string;
  title: string;
};

type SubjectOption = {
  id: string;
  title: string;
  topics: TopicOption[];
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
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");

  const fetchTopic = async () => {
    const response = await fetch(`/api/topics/${id}`);

    if (!response.ok) {
      setTopic(null);
      setLoading(false);
      return;
    }

    const data = (await response.json()) as TopicWithNotes;

    setTopic(data);
  };

  const fetchSubjects = async () => {
    const response = await fetch("/api/subjects");

    if (!response.ok) {
      console.error("Could not load subjects");
      return;
    }

    const data = (await response.json()) as SubjectOption[];

    setSubjects(data);
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);

      await Promise.all([fetchTopic(), fetchSubjects()]);

      setLoading(false);
    };

    void loadPage();
  }, [id]);

  const createNote = async () => {
    if (!noteTitle.trim()) {
      return;
    }

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: noteTitle.trim(),
        topicId: id,
      }),
    });

    if (!response.ok) {
      console.error("Could not create note");
      return;
    }

    setNoteTitle("");

    await fetchTopic();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!topic) {
    return <p>Emne ikke fundet</p>;
  }

  return (
    <section className={styles.container}>
      <Link href={`/subjects/${topic.subjectId}`} className={styles.backButton}>
        ← Tilbage til emner
      </Link>

      <h1 className={styles.title}>{topic.title}</h1>

      <div className={styles.createBox}>
        <input
          className={styles.input}
          placeholder="Ny note"
          value={noteTitle}
          onChange={(event) => {
            setNoteTitle(event.target.value);
          }}
        />

        <button
          type="button"
          className={styles.button}
          onClick={() => {
            void createNote();
          }}
        >
          Opret
        </button>
      </div>

      <div className={styles.notes}>
        {topic.notes.length === 0 ? (
          <p>Ingen noter endnu</p>
        ) : (
          <div className={styles.grid}>
            {topic.notes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                previewImageUrl={note.previewImageUrl}
                currentTopicId={topic.id}
                subjects={subjects}
                topicTitle={topic.title}
                updatedAt={note.updatedAt}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
*/
