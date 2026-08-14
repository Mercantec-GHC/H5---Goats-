"use client";

import { useEffect, useState } from "react";
import styles from "./CollaboratorsSidebar.module.css";

type Collaborator = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

type CollaboratorsResponse = {
  owner: Collaborator | null;
  collaborators: Collaborator[];
};

type CollaboratorsSidebarProps = {
  noteId: string;
};

function getColorFromString(str: string) {
  const colors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#f59e0b",
    "#0891b2",
    "#db2777",
    "#ea580c",
    "#4f46e5",
    "#059669",
    "#be123c",
    "#7c3aed",
    "#0f766e",
    "#c2410c",
    "#4338ca",
  ];

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
// CollaboratorsSidebar component
export default function CollaboratorsSidebar({
  noteId,
}: CollaboratorsSidebarProps) {
  const [data, setData] = useState<CollaboratorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchCollaborators = async () => {
    setError("");

    const res = await fetch(`/api/notes/${noteId}/collaborators`);

    if (!res.ok) {
      setLoading(false);
      setError("Could not load collaborators");
      return;
    }

    const data = await res.json();
    setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollaborators();
  }, [noteId]);
// removeCollaborator er en asynkron funktion, der håndterer fjernelsen af en samarbejdspartner fra en note. Funktionen starter med at bede brugeren om bekræftelse, og hvis brugeren bekræfter, sender den en DELETE-anmodning til serveren for at fjerne samarbejdspartneren. Hvis anmodningen lykkes, opdateres den lokale tilstand for at fjerne samarbejdspartneren fra listen. Hvis der opstår en fejl under processen, vises en fejlmeddelelse.
  const removeCollaborator = async (userId: string) => {
    const confirmed = confirm(
      "Are you sure you want to remove this collaborator?",
    );

    if (!confirmed) return;

    setRemovingUserId(userId);
    setError("");

    const res = await fetch(`/api/notes/${noteId}/collaborators/${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not remove collaborator");
      setRemovingUserId(null);
      return;
    }

    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        collaborators: prev.collaborators.filter(
          (collaborator) => collaborator.id !== userId,
        ),
      };
    });

    setRemovingUserId(null);
  };

  if (loading) return <p className={styles.muted}>Loading...</p>;

  const users = [
    ...(data?.owner ? [data.owner] : []),
    ...(data?.collaborators ?? []),
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Collaborators</h3>

      {error ? <p className={styles.error}>{error}</p> : null}

      {users.length === 0 ? (
        <p className={styles.muted}>No collaborators yet</p>
      ) : (
        <div className={styles.list}>
          {users.map((user) => {
            const displayName = user.name ?? user.email ?? "Unknown user";
            const isOwner = user.role === "owner";
            const isRemoving = removingUserId === user.id;

            return (
              <div key={`${user.id}-${user.role}`} className={styles.userRow}>
                <div
                  className={styles.avatar}
                  style={{
                    backgroundColor: getColorFromString(user.id),
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className={styles.userInfo}>
                  <p className={styles.name}>{displayName}</p>
                  <p className={styles.role}>{user.role}</p>
                </div>

                {!isOwner ? (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeCollaborator(user.id)}
                    disabled={isRemoving}
                  >
                    {isRemoving ? "..." : "Remove"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
