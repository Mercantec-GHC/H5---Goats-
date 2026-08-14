"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
// LoginPage er en React-komponent, der repræsenterer login-siden for applikationen. Komponenten bruger NextAuth's useSession hook til at få adgang til den aktuelle autentificeringssession og dens status. Hvis sessionen stadig indlæses, returneres null for at undgå at vise noget indhold. Hvis brugeren allerede er logget ind (dvs. sessionen er tilgængelig), omdirigeres de automatisk til "/homepage". Hvis brugeren ikke er logget ind, vises en login-knap, der giver dem mulighed for at logge ind med Google ved hjælp af NextAuth's signIn-funktion.
export default function LoginPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    redirect("/homepage");
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
