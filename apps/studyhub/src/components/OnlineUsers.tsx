"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./OnlineUsers.module.css";
// OnlineUser er en type, der repræsenterer en online bruger i applikationen. Den indeholder to egenskaber: name, som er en streng, der repræsenterer brugerens navn, og color, som er en streng, der repræsenterer farven for brugerens avatar. Denne type bruges til at holde styr på og vise information om de brugere, der er online og samarbejder i realtid.
type OnlineUser = {
  name: string;
  color: string;
};
// OnlineUsersProps er en type, der definerer de props, som OnlineUsers-komponenten forventer at modtage. I dette tilfælde forventer den en enkelt prop kaldet provider, som er af typen HocuspocusProvider. Denne provider bruges til at få adgang til og lytte til ændringer i awareness-staten, som indeholder information om de online brugere.
type OnlineUsersProps = {
  provider: HocuspocusProvider;
};
// OnlineUsers er en React-komponent, der viser en liste over online brugere baseret på awareness-staten fra HocuspocusProvider. Komponenten bruger useEffect til at lytte til ændringer i awareness-staten og opdatere listen over online brugere, som derefter vises som avatarer med brugerens initialer og farve. Hvis der ikke er nogen online brugere, returnerer komponenten null og viser ingenting.
export default function OnlineUsers({ provider }: OnlineUsersProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      if (!provider.awareness) return;

      const states = Array.from(provider.awareness.getStates().values());

      const onlineUsers = states
        .map((state) => state.user as OnlineUser | undefined)
        .filter((user): user is OnlineUser => Boolean(user?.name));

      setUsers(onlineUsers);
    };

    updateUsers();

    if (!provider.awareness) return;

    provider.awareness.on("change", updateUsers);

    return () => {
      provider.awareness?.off("change", updateUsers);
    };
  }, [provider]);

  if (users.length === 0) return null;

  return (
    <div className={styles.container}>
      {users.map((user, index) => (
        <div
          key={`${user.name}-${index}`}
          className={styles.avatar}
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
