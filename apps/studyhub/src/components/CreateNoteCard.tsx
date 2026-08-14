"use client";

import { useRouter } from "next/navigation";
import styles from "./CreateNoteCard.module.css";
// CreateNoteCard er en React-komponent, der viser et kort med en "+"-knap og teksten "Ny note". Når brugeren klikker på knappen, sendes en POST-anmodning til "/api/notes" for at oprette en ny note med titlen "Untitled note". Hvis anmodningen er vellykket, navigeres brugeren til den nye notes side ved hjælp af Next.js' useRouter hook.
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
