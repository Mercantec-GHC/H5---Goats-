"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import styles from "./Sidebar.module.css";

type Topic = {
  id: string;
  title: string;
};

type Subject = {
  id: string;
  title: string;
  topics: Topic[];
};

export default function Sidebar() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );

  const [creatingTopicForSubjectId, setCreatingTopicForSubjectId] = useState<
    string | null
  >(null);

  const [newTopicTitle, setNewTopicTitle] = useState("");

  const searchParams = useSearchParams();

  const activeTopicId = searchParams.get("topic");

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects");

      if (!response.ok) {
        throw new Error("Subjects kunne ikke hentes.");
      }

      const data = (await response.json()) as Subject[];

      setSubjects(data);

      if (activeTopicId) {
        const parentSubject = data.find((subject) =>
          subject.topics.some((topic) => topic.id === activeTopicId),
        );

        if (parentSubject) {
          setExpandedSubjects((current) => {
            const next = new Set(current);
            next.add(parentSubject.id);
            return next;
          });
        }
      }
    } catch (error) {
      console.error("Could not fetch subjects:", error);
    }
  };

  useEffect(() => {
    void fetchSubjects();
  }, []);

  useEffect(() => {
    if (!activeTopicId) {
      return;
    }

    const parentSubject = subjects.find((subject) =>
      subject.topics.some((topic) => topic.id === activeTopicId),
    );

    if (!parentSubject) {
      return;
    }

    setExpandedSubjects((current) => {
      const next = new Set(current);
      next.add(parentSubject.id);
      return next;
    });
  }, [activeTopicId, subjects]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((current) => {
      const next = new Set(current);

      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }

      return next;
    });
  };

  const handleCreateSubject = async () => {
    const title = newTitle.trim();

    if (!title) {
      return;
    }

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      });

      if (!response.ok) {
        throw new Error("Subject kunne ikke oprettes.");
      }

      setNewTitle("");

      await fetchSubjects();
    } catch (error) {
      console.error("Could not create subject:", error);
    }
  };

  const startCreateTopic = (subjectId: string) => {
    setCreatingTopicForSubjectId(subjectId);
    setNewTopicTitle("");

    setExpandedSubjects((current) => {
      const next = new Set(current);
      next.add(subjectId);
      return next;
    });
  };

  const cancelCreateTopic = () => {
    setCreatingTopicForSubjectId(null);
    setNewTopicTitle("");
  };

  const handleCreateTopic = async (subjectId: string) => {
    const title = newTopicTitle.trim();

    if (!title) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error ?? "Topic kunne ikke oprettes.");
      }

      setCreatingTopicForSubjectId(null);
      setNewTopicTitle("");

      await fetchSubjects();
    } catch (error) {
      console.error("Could not create topic:", error);
    }
  };

  const handleDelete = async (subjectId: string, subjectTitle: string) => {
    const confirmed = window.confirm(
      `Er du sikker på, at du vil slette "${subjectTitle}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Subject kunne ikke slettes.");
      }

      await fetchSubjects();
    } catch (error) {
      console.error("Could not delete subject:", error);
    }
  };

  const handleRename = async (subjectId: string, currentTitle: string) => {
    const input = window.prompt("Nyt navn:", currentTitle);

    if (input === null) {
      return;
    }

    const title = input.trim();

    if (!title || title === currentTitle) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      });

      if (!response.ok) {
        throw new Error("Subject kunne ikke omdøbes.");
      }

      await fetchSubjects();
    } catch (error) {
      console.error("Could not rename subject:", error);
    }
  };

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Subjects</span>
      </div>

      <div className={styles.createBox}>
        <input
          className={styles.input}
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleCreateSubject();
            }
          }}
          placeholder="New subject"
        />

        <button
          type="button"
          className={styles.createBtn}
          onClick={() => {
            void handleCreateSubject();
          }}
          aria-label="Opret subject"
          title="Opret subject"
        >
          +
        </button>
      </div>

      <ul className={styles.list}>
        {subjects.map((subject) => {
          const isExpanded = expandedSubjects.has(subject.id);

          const hasActiveTopic = subject.topics.some(
            (topic) => topic.id === activeTopicId,
          );

          const isCreatingTopic = creatingTopicForSubjectId === subject.id;

          return (
            <li
              key={subject.id}
              className={`${styles.subjectItem} ${
                hasActiveTopic ? styles.subjectActive : ""
              }`}
            >
              <div className={styles.subjectRow}>
                <button
                  type="button"
                  className={styles.subjectToggle}
                  onClick={() => {
                    toggleSubject(subject.id);
                  }}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Fold ${subject.title} sammen`
                      : `Fold ${subject.title} ud`
                  }
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}

                  <span>{subject.title}</span>
                </button>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => {
                      startCreateTopic(subject.id);
                    }}
                    aria-label={`Opret topic i ${subject.title}`}
                    title="Opret topic"
                  >
                    <Plus size={14} />
                  </button>

                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => {
                      void handleRename(subject.id, subject.title);
                    }}
                    aria-label={`Omdøb ${subject.title}`}
                    title="Omdøb subject"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => {
                      void handleDelete(subject.id, subject.title);
                    }}
                    aria-label={`Slet ${subject.title}`}
                    title="Slet subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div>
                  {isCreatingTopic ? (
                    <div className={styles.topicCreateRow}>
                      <input
                        autoFocus
                        className={styles.topicInput}
                        value={newTopicTitle}
                        onChange={(event) => {
                          setNewTopicTitle(event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void handleCreateTopic(subject.id);
                          }

                          if (event.key === "Escape") {
                            cancelCreateTopic();
                          }
                        }}
                        placeholder="Nyt topic"
                      />

                      <button
                        type="button"
                        className={styles.topicCreateButton}
                        onClick={() => {
                          void handleCreateTopic(subject.id);
                        }}
                        aria-label="Opret topic"
                        title="Opret topic"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : null}

                  <ul className={styles.topicList}>
                    {subject.topics.length === 0 ? (
                      <li className={styles.emptyTopics}>Ingen topics endnu</li>
                    ) : (
                      subject.topics.map((topic) => {
                        const isActive = topic.id === activeTopicId;

                        return (
                          <li key={topic.id}>
                            <Link
                              href={`/homepage?topic=${topic.id}`}
                              className={`${styles.topicLink} ${
                                isActive ? styles.topicActive : ""
                              }`}
                            >
                              {topic.title}
                            </Link>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
