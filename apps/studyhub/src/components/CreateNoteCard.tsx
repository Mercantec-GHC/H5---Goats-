"use client";

import { useRouter } from "next/navigation";
import styles from "./CreateNoteCard.module.css";

export default function CreateNoteCard() {
  const router = useRouter();

  const handleCreateNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Untitled note",
      }),
    });

    if (!res.ok) {
      return;
    }

    const note = await res.json();

    router.push(`/notes/${note.id}`);
  };

  return (
    <button className={styles.card} onClick={handleCreateNote}>
      <span className={styles.plus}>+</span>
      <p className={styles.text}>Ny note</p>
    </button>
  );
}
