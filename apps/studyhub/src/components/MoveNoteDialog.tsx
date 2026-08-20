"use client";

import { useState } from "react";
import { FolderInput, X } from "lucide-react";

import styles from "./MoveNoteDialog.module.css";

type TopicOption = {
  id: string;
  title: string;
};

type SubjectOption = {
  id: string;
  title: string;
  topics: TopicOption[];
};

type Props = {
  noteId: string;
  currentTopicId?: string | null;
  subjects: SubjectOption[];
  onClose: () => void;
  onMoved?: () => void;
};

export default function MoveNoteDialog({
  noteId,
  currentTopicId,
  subjects,
  onClose,
  onMoved,
}: Props) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    currentTopicId ?? null,
  );

  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState("");

  const moveNote = async () => {
    if (isMoving) {
      return;
    }

    setError("");
    setIsMoving(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId: selectedTopicId,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Noten kunne ikke flyttes.");
      }

      onMoved?.();
      onClose();
    } catch (error) {
      console.error("Move note failed:", error);

      setError(
        error instanceof Error ? error.message : "Der skete en ukendt fejl.",
      );
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-note-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="move-note-title" className={styles.title}>
              Flyt note
            </h2>

            <p className={styles.description}>Vælg hvor noten skal placeres.</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Luk"
            title="Luk"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.destinations}>
          <button
            type="button"
            className={`${styles.destination} ${
              selectedTopicId === null ? styles.selectedDestination : ""
            }`}
            onClick={() => setSelectedTopicId(null)}
          >
            <FolderInput size={16} />

            <span>Unsorted</span>
          </button>

          {subjects.map((subject) => (
            <div key={subject.id} className={styles.subjectGroup}>
              <div className={styles.subjectTitle}>{subject.title}</div>

              {subject.topics.length === 0 ? (
                <p className={styles.emptyTopics}>Ingen topics</p>
              ) : (
                subject.topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={`${styles.destination} ${
                      selectedTopicId === topic.id
                        ? styles.selectedDestination
                        : ""
                    }`}
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    <span className={styles.topicDot} />

                    <span>{topic.title}</span>
                  </button>
                ))
              )}
            </div>
          ))}
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isMoving}
          >
            Annuller
          </button>

          <button
            type="button"
            className={styles.moveButton}
            onClick={() => {
              void moveNote();
            }}
            disabled={isMoving || selectedTopicId === currentTopicId}
          >
            {isMoving ? "Flytter..." : "Flyt note"}
          </button>
        </div>
      </div>
    </div>
  );
}
