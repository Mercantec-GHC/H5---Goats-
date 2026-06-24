"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./OnlineUsers.module.css";

type OnlineUser = {
  name: string;
  color: string;
};

type OnlineUsersProps = {
  provider: HocuspocusProvider;
};

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
