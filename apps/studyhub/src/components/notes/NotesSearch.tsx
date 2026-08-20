"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import NoteCard from "@/components/NoteCard";
import CreateNoteCard from "@/components/CreateNoteCard";

import styles from "./NotesSearch.module.css";

type TopicOption = {
  id: string;
  title: string;
};

type SubjectOption = {
  id: string;
  title: string;
  topics: TopicOption[];
};

type Note = {
  id: string;
  title: string;
  previewImageUrl?: string | null;
  topicId: string | null;
  ownerId: string;
  updatedAt: string | Date;
  topic?: {
    title: string;
  } | null;
};

type NotesSearchProps = {
  notes: Note[];
  currentUserId: string;
  subjects: SubjectOption[];

  activeTopicId?: string | null;
  activeTopicTitle?: string | null;
  activeSubjectTitle?: string | null;
};

type NoteFilter = "all" | "unsorted" | "shared";

type NoteSort = "updated-desc" | "updated-asc" | "title-asc";

export default function NotesSearch({
  notes,
  currentUserId,
  subjects,
  activeTopicId = null,
  activeTopicTitle = null,
  activeSubjectTitle = null,
}: NotesSearchProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [sort, setSort] = useState<NoteSort>("updated-desc");

  const normalizedQuery = query.trim().toLowerCase();

  const isTopicView = Boolean(activeTopicId);

  const filteredNotes = useMemo(() => {
    const result = notes.filter((note) => {
      const matchesQuery = note.title.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) {
        return false;
      }

      /*
       * Homepage har allerede filtreret notes til
       * det valgte topic.
       *
       * Derfor skal de globale filtre ikke bruges
       * inde i en topic-visning.
       */
      if (isTopicView) {
        return true;
      }

      switch (filter) {
        case "unsorted":
          return note.ownerId === currentUserId && note.topicId === null;

        case "shared":
          return note.ownerId !== currentUserId;

        case "all":
        default:
          return true;
      }
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "updated-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );

        case "title-asc":
          return a.title.localeCompare(b.title, "da");

        case "updated-desc":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
  }, [notes, normalizedQuery, filter, sort, currentUserId, isTopicView]);

  const filterButtonClass = (value: NoteFilter) =>
    filter === value ? styles.activeFilter : styles.filterButton;

  const showCreateNoteCard =
    !normalizedQuery && (isTopicView || filter === "all");

  return (
    <section className={styles.section}>
      {/* =========================
          Heading
      ========================= */}

      <div className={styles.heading}>
        {isTopicView ? (
          <>
            <h2 className={styles.title}>{activeTopicTitle ?? "Topic"}</h2>

            {activeSubjectTitle ? (
              <p className={styles.description}>
                {activeSubjectTitle} / {activeTopicTitle}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2 className={styles.title}>Noter</h2>

            <p className={styles.description}>
              Dine senest ændrede noter vises først
            </p>
          </>
        )}
      </div>

      {/* =========================
          Toolbar
      ========================= */}

      <div className={styles.toolbar}>
        {!isTopicView ? (
          <div className={styles.filters}>
            <button
              type="button"
              className={filterButtonClass("all")}
              onClick={() => setFilter("all")}
            >
              Alle
            </button>

            <button
              type="button"
              className={filterButtonClass("unsorted")}
              onClick={() => setFilter("unsorted")}
            >
              Unsorted
            </button>

            <button
              type="button"
              className={filterButtonClass("shared")}
              onClick={() => setFilter("shared")}
            >
              Delt med mig
            </button>
          </div>
        ) : (
          /*
           * Spacer gør, at sortering + søgning
           * stadig ligger til højre.
           */
          <div />
        )}

        <div className={styles.toolbarRight}>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(event) => setSort(event.target.value as NoteSort)}
            aria-label="Sortér noter"
          >
            <option value="updated-desc">Senest ændret</option>

            <option value="updated-asc">Ældst ændret</option>

            <option value="title-asc">Titel A-Å</option>
          </select>

          <div className={styles.search}>
            <Search
              size={16}
              className={styles.searchIcon}
              aria-hidden="true"
            />

            <input
              className={styles.input}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Søg efter noter..."
              aria-label="Søg efter noter"
            />
          </div>
        </div>
      </div>

      {/* =========================
          Notes
      ========================= */}

      <div className={styles.grid}>
        {showCreateNoteCard ? <CreateNoteCard topicId={activeTopicId} /> : null}

        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            id={note.id}
            title={note.title}
            previewImageUrl={note.previewImageUrl}
            currentTopicId={note.topicId}
            subjects={subjects}
            topicTitle={
              note.ownerId !== currentUserId
                ? "Delt med mig"
                : note.topic?.title
            }
            updatedAt={note.updatedAt}
          />
        ))}
      </div>

      {/* =========================
          Empty state
      ========================= */}

      {filteredNotes.length === 0 && !showCreateNoteCard ? (
        <div className={styles.empty}>
          <p>
            {query
              ? "Ingen noter matcher din søgning."
              : isTopicView
                ? "Der er ingen noter i dette topic endnu."
                : filter === "shared"
                  ? "Ingen delte noter endnu."
                  : filter === "unsorted"
                    ? "Ingen unsorted noter."
                    : "Ingen noter fundet."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
