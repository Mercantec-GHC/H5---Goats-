"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import styles from "./NoteCard.module.css";

type NoteCardProps = {
  id: string;
  title: string;
  previewImageUrl?: string | null;
  topicTitle?: string | null;
  updatedAt?: string | Date;
};

export default function NoteCard({
  id,
  title,
  previewImageUrl,
  topicTitle,
  updatedAt,
}: NoteCardProps) {
  const dateText = updatedAt
    ? new Date(updatedAt).toLocaleDateString("da-DK")
    : "";

  const deleteNote = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm("Er du sikker på at du vil slette noten?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Noten kunne ikke slettes.");
      }

      window.location.reload();
    } catch (error) {
      console.error("Note deletion failed:", error);

      window.alert("Noten kunne ikke slettes.");
    }
  };

  return (
    <Link href={`/notes/${id}`} className={styles.card}>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={deleteNote}
        aria-label={`Slet ${title}`}
        title="Slet note"
      >
        <Trash2 size={16} />
      </button>

      <div className={styles.preview}>
        {previewImageUrl ? (
          <img src={previewImageUrl} alt="" className={styles.previewImage} />
        ) : (
          <div className={styles.previewPlaceholder}>
            <div className={styles.line} />
            <div className={styles.lineShort} />
            <div className={styles.line} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>

        <p className={styles.meta}>
          {topicTitle ?? "Unsorted"}
          {dateText ? ` · ${dateText}` : ""}
        </p>
      </div>
    </Link>
  );
}
