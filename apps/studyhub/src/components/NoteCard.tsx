import Link from "next/link";
import styles from "./NoteCard.module.css";

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

  return (
    <Link href={`/notes/${id}`} className={styles.card}>
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
