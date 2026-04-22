"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>StudyHub</h1>
        <p className={styles.subtitle}>Log ind for at fortsætte</p>
        <button
          className={styles.button}
          onClick={() => signIn("google", { callbackUrl: "/homepage" })}
        >
          Log ind med Google
        </button>
      </div>
    </div>
  );
}
