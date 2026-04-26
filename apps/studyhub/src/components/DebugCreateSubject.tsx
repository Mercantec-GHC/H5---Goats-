"use client";

import { useState } from "react";

type Subject = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
};

export default function DebugCreateSubject() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState("");

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subjects");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Kunne ikke hente subjects");
        return;
      }

      setSubjects(data);
    } catch (err) {
      setError("Kunne ikke kontakte serveren");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Noget gik galt");
        return;
      }

      setTitle("");
      await fetchSubjects();
    } catch (err) {
      setError("Kunne ikke kontakte serveren");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 500,
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: 8,
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <h2>Debug: Subjects</h2>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Skriv subject titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />

        <button
          onClick={handleCreateSubject}
          disabled={loading || !title.trim()}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            borderRadius: 6,
            background: "#111827",
            color: "white",
            cursor: "pointer",
          }}
        >
          Opret
        </button>
      </div>

      <button
        onClick={fetchSubjects}
        disabled={loading}
        style={{
          padding: "0.75rem 1rem",
          border: "none",
          borderRadius: 6,
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
        }}
      >
        Hent subjects
      </button>

      {error ? (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      ) : null}

      <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
        {subjects.map((subject) => (
          <li key={subject.id} style={{ marginBottom: "0.5rem" }}>
            <span>{subject.title}</span>

            <div
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                marginLeft: "1rem",
              }}
            >
              <button
                onClick={async () => {
                  const newTitle = prompt("Nyt navn:", subject.title);
                  if (!newTitle) return;

                  await fetch(`/api/subjects/${subject.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title: newTitle }),
                  });

                  fetchSubjects();
                }}
              >
                Rename
              </button>

              <button
                onClick={async () => {
                  await fetch(`/api/subjects/${subject.id}`, {
                    method: "DELETE",
                  });

                  fetchSubjects();
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
