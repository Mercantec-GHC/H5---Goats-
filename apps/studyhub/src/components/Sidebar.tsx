"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Sidebar.module.css";

type Subject = {
  id: string;
  title: string;
};

export default function Sidebar() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const fetchSubjects = async () => {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    setSubjects(data);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    await fetch("/api/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: newTitle }),
    });

    setNewTitle("");
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/subjects/${id}`, {
      method: "DELETE",
    });

    fetchSubjects();
  };

  const handleRename = async (id: string, current: string) => {
    const title = prompt("Nyt navn:", current);
    if (!title) return;

    await fetch(`/api/subjects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    fetchSubjects();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Subjects</span>
      </div>

      {/* Create */}
      <div className={styles.createBox}>
        <input
          className={styles.input}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New subject"
        />
        <button className={styles.createBtn} onClick={handleCreate}>
          +
        </button>
      </div>

      {/* List */}
      <ul className={styles.list}>
        {subjects.map((s) => (
          <li key={s.id} className={styles.item}>
            <Link href={`/subjects/${s.id}`} className={styles.link}>
              {s.title}
            </Link>

            <div className={styles.actions}>
              <button
                className={styles.button}
                onClick={() => handleRename(s.id, s.title)}
              >
                ✏️
              </button>

              <button
                className={styles.button}
                onClick={() => handleDelete(s.id)}
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
