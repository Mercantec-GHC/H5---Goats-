"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type Topic = {
  id: string;
  title: string;
  subjectId: string;
  createdAt: string;
};

type SubjectWithTopics = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  topics: Topic[];
};

export default function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [subject, setSubject] = useState<SubjectWithTopics | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchSubject = async () => {
    setError("");

    const res = await fetch(`/api/subjects/${id}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente faget");
      setSubject(null);
      setLoading(false);
      return;
    }

    setSubject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const createTopic = async () => {
    if (!topicTitle.trim()) return;

    setCreating(true);
    setError("");

    const res = await fetch(`/api/subjects/${id}/topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: topicTitle }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke oprette emne");
      setCreating(false);
      return;
    }

    setTopicTitle("");
    await fetchSubject();
    setCreating(false);
  };

  if (loading) return <p>Loading...</p>;

  if (!subject) return <p>Fag blev ikke fundet.</p>;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>Fag</p>
          <h1 className={styles.title}>{subject.title}</h1>
        </div>
      </div>

      <div className={styles.createBox}>
        <input
          className={styles.input}
          value={topicTitle}
          onChange={(e) => setTopicTitle(e.target.value)}
          placeholder="Nyt emne"
        />

        <button
          className={styles.button}
          onClick={createTopic}
          disabled={creating || !topicTitle.trim()}
        >
          {creating ? "Opretter..." : "Opret emne"}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.topicSection}>
        <h2 className={styles.subtitle}>Emner</h2>

        {subject.topics.length === 0 ? (
          <p className={styles.empty}>Der er ingen emner endnu.</p>
        ) : (
          <ul className={styles.topicList}>
            {subject.topics.map((topic) => (
              <li key={topic.id} className={styles.topicItem}>
                <Link href={`/topics/${topic.id}`} className={styles.topicLink}>
                  {topic.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
