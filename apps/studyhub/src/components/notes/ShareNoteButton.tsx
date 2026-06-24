"use client";

import { useState } from "react";
import styles from "./ShareNoteButton.module.css";

type ShareNoteButtonProps = {
  noteId: string;
};

export default function ShareNoteButton({ noteId }: ShareNoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const createInvite = async () => {
    setLoading(true);
    setCopied(false);
    setError("");

    const res = await fetch(`/api/notes/${noteId}/invites`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke lave invite link");
      setLoading(false);
      return;
    }

    await navigator.clipboard.writeText(data.inviteUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2500);

    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        onClick={createInvite}
        disabled={loading}
      >
        {loading ? "Laver link..." : copied ? "Link kopieret ✅" : "Share"}
      </button>

      {error ? (
        <p className={`${styles.status} ${styles.error}`}>{error}</p>
      ) : null}
    </div>
  );
}
