"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/homepage" className={styles.logo}>
          StudyHub
        </Link>
      </div>

      <div className={styles.right}>
        <span className={styles.email}>{session?.user?.email}</span>

        <button
          className={styles.button}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Log ud
        </button>
      </div>
    </nav>
  );
}
