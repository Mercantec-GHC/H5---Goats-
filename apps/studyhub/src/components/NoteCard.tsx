"use client";

import Link from "next/link";
import styles from "./NoteCard.module.css";
import { Trash2 } from "lucide-react";
// NoteCard er en React-komponent, der repræsenterer et kort for en note i en noteoversigt. Komponentet viser notens titel, emne (hvis tilgængeligt) og opdateringsdato. Det inkluderer også en sletteknap, der giver brugeren mulighed for at slette noten. Når kortet klikkes, navigeres brugeren til den specifikke notes side ved hjælp af Next.js' Link-komponent.
type NoteCardProps = {
  id: string;
  title: string;
  topicTitle?: string | null;
  updatedAt?: string | Date;
};

export default function NoteCard({
  id,
  title,
  topicTitle,
  updatedAt,
}: NoteCardProps) {
  const dateText = updatedAt
    ? new Date(updatedAt).toLocaleDateString("da-DK")
    : "";

  const deleteNote = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = confirm("Er du sikker på at du vil slette noten?");

    if (!confirmed) return;

    await fetch(`/api/notes/${id}`, {
      method: "DELETE",
    });

    window.location.reload();
  };

  return (
    <Link href={`/notes/${id}`} className={styles.card}>
      <button className={styles.deleteButton} onClick={deleteNote}>
        <Trash2 size={16} />
      </button>

      <div className={styles.preview}>
        <div className={styles.line} />
        <div className={styles.lineShort} />
        <div className={styles.line} />
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
