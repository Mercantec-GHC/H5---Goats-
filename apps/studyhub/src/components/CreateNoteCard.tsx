"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import styles from "./CreateNoteCard.module.css";

type CreateNoteCardProps = {
  topicId?: string | null;
};

export default function CreateNoteCard({
  topicId = null,
}: CreateNoteCardProps) {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled note",
          topicId,
        }),
      });

      if (!response.ok) {
        throw new Error("Noten kunne ikke oprettes.");
      }

      const note = (await response.json()) as {
        id: string;
      };

      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error("Note creation failed:", error);

      setIsCreating(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => {
        void handleCreateNote();
      }}
      disabled={isCreating}
      aria-label="Opret ny note"
    >
      <div className={styles.preview}>
        <div className={styles.createIcon}>
          <Plus size={28} strokeWidth={1.8} />
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.title}>{isCreating ? "Opretter..." : "Ny note"}</p>

        <p className={styles.meta}>Opret et nyt dokument</p>
      </div>
    </button>
  );
}
