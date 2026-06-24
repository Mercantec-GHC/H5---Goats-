"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const acceptInvite = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Kunne ikke acceptere invitation");
        setLoading(false);
        return;
      }

      router.push(`/notes/${data.noteId}`);
    } catch {
      setError("Noget gik galt");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>Invitation til note</h1>

      <p>Du er blevet inviteret til at samarbejde om en note.</p>

      <button
        onClick={acceptInvite}
        disabled={loading}
        style={{
          padding: "0.75rem 1.25rem",
          cursor: "pointer",
        }}
      >
        {loading ? "Accepterer..." : "Accepter invitation"}
      </button>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}
    </main>
  );
}
