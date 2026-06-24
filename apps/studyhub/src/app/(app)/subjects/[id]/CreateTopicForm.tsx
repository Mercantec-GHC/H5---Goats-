"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function CreateTopicForm({ subjectId }: { subjectId: string }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const createTopic = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/subjects/${subjectId}/topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke oprette emne");
      setLoading(false);
      return;
    }

    setTitle("");
    setLoading(false);

    // 🔥 Trigger server re-fetch
    router.refresh();
  };

  return (
    <div className={styles.createBox}>
      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nyt emne"
      />

      <button
        className={styles.button}
        onClick={createTopic}
        disabled={loading || !title.trim()}
      >
        {loading ? "Opretter..." : "Opret emne"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
