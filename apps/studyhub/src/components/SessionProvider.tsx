"use client";

import { SessionProvider } from "next-auth/react";
// SessionProviderWrapper er en React-komponent, der fungerer som en wrapper omkring NextAuth's SessionProvider. Denne komponent tager children som prop og returnerer SessionProvider, der omslutter disse children. Dette gør det muligt for alle komponenter inden for SessionProviderWrapper at få adgang til autentificeringssessionen og relaterede funktioner, hvilket er nyttigt for at håndtere brugerautentificering og session management i applikationen.
export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
