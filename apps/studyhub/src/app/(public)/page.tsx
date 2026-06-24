/*import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main>
      <h1>StudyHub</h1>
      <p>Organisér og samarbejd på dine noter</p>
    </main>
  );
} */

import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>StudyHub</h1>
        <p className={styles.subtitle}>
          Organisér og samarbejd på dine noter det virker
        </p>

        <div className={styles.buttons}>
          <Link href="/login">
            <button className={styles.primaryButton}>
              Kom i gang
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}