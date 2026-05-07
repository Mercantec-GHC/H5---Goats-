import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, notePlacements } from "@studyhub/db";
import { desc, eq } from "drizzle-orm";
import styles from "./page.module.css";
import NoteCard from "@/components/NoteCard";
import CreateNoteCard from "@/components/CreateNoteCard";

export default async function Homepage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const placements = await db.query.notePlacements.findMany({
    where: eq(notePlacements.userId, session.user.id),
    with: {
      note: true,
      topic: true,
    },
    orderBy: [desc(notePlacements.createdAt)],
  });

  const notes = placements.map((placement) => ({
    ...placement.note,
    topicId: placement.topicId,
    topic: placement.topic,
  }));

  const unsorted = notes.filter((note) => note.topicId === null);
  const recent = notes.slice(0, 6);

  return (
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Velkommen tilbage 👋</h1>
        <p>Fortsæt hvor du slap</p>
      </div>

      {/* Recent Notes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Seneste noter</h2>

        {recent.length === 0 ? (
          <p>Ingen noter endnu</p>
        ) : (
          <div className={styles.grid}>
            <CreateNoteCard />
            {recent.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                topicTitle={note.topic?.title}
                updatedAt={note.updatedAt}
              />
            ))}
          </div>
        )}
      </section>

      {/* Unsorted */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Unsorted</h2>

        {unsorted.length === 0 ? (
          <p>Ingen unsorted noter</p>
        ) : (
          <div className={styles.grid}>
            {unsorted.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                topicTitle={null}
                updatedAt={note.updatedAt}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
