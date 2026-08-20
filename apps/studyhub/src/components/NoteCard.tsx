"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, MoveRight, Trash2 } from "lucide-react";

import MoveNoteDialog from "@/components/MoveNoteDialog";

import styles from "./NoteCard.module.css";

type TopicOption = {
  id: string;
  title: string;
};

type SubjectOption = {
  id: string;
  title: string;
  topics: TopicOption[];
};

type NoteCardProps = {
  id: string;
  title: string;
  previewImageUrl?: string | null;
  currentTopicId?: string | null;
  subjects: SubjectOption[];
  topicTitle?: string | null;
  updatedAt?: string | Date;
};

export default function NoteCard({
  id,
  title,
  previewImageUrl,
  currentTopicId,
  subjects,
  topicTitle,
  updatedAt,
}: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const dateText = updatedAt
    ? new Date(updatedAt).toLocaleDateString("da-DK")
    : "";

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setShowMenu((current) => !current);
  };

  const openMoveDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setShowMenu(false);
    setShowMoveDialog(true);
  };

  const deleteNote = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setShowMenu(false);

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
    <>
      <Link
        href={`/notes/${id}`}
        className={styles.card}
        onClick={() => {
          setShowMenu(false);
        }}
      >
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={toggleMenu}
            aria-label={`Handlinger for ${title}`}
            aria-expanded={showMenu}
            title="Flere handlinger"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu ? (
            <div
              className={styles.actionMenu}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={openMoveDialog}
              >
                <MoveRight size={16} />
                <span>Flyt note</span>
              </button>

              <div className={styles.actionMenuDivider} />

              <button
                type="button"
                className={`${styles.actionMenuItem} ${styles.dangerMenuItem}`}
                onClick={deleteNote}
              >
                <Trash2 size={16} />
                <span>Slet note</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.preview}>
          {previewImageUrl ? (
            <img
              src={
                updatedAt
                  ? `${previewImageUrl}?v=${new Date(updatedAt).getTime()}`
                  : previewImageUrl
              }
              alt=""
              className={styles.previewImage}
            />
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

      {showMoveDialog ? (
        <MoveNoteDialog
          noteId={id}
          currentTopicId={currentTopicId}
          subjects={subjects}
          onClose={() => {
            setShowMoveDialog(false);
          }}
          onMoved={() => {
            window.location.reload();
          }}
        />
      ) : null}
    </>
  );
}
