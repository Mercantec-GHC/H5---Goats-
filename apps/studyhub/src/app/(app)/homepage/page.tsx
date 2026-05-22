import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, notePlacements } from "@studyhub/db";
import { desc, eq } from "drizzle-orm";
import styles from "./page.module.css";
import NoteCard from "@/components/NoteCard";
import CreateNoteCard from "@/components/CreateNoteCard";
import NotesSearch from "@/components/notes/NotesSearch";
// Hovedsiden efter login, viser seneste noter, delte noter og unsorted noter
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

  const sharedWithMe = notes.filter((note) => note.ownerId !== session.user.id);

  const ownNotes = notes.filter((note) => note.ownerId === session.user.id);

  const unsorted = ownNotes.filter((note) => note.topicId === null);
  const recent = notes.slice(0, 6);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>Velkommen tilbage 👋</h1>
        <p>Fortsæt hvor du slap</p>
      </div>

      <section className={styles.section}>
        <NotesSearch notes={notes} currentUserId={session.user.id} />
        <h2 className={styles.sectionTitle}>Seneste noter</h2>

        <div className={styles.grid}>
          <CreateNoteCard />

          {recent.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              topicTitle={
                note.ownerId !== session.user.id
                  ? "Delt med mig"
                  : note.topic?.title
              }
              updatedAt={note.updatedAt}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Delt med mig</h2>

        {sharedWithMe.length === 0 ? (
          <p>Ingen delte noter endnu</p>
        ) : (
          <div className={styles.grid}>
            {sharedWithMe.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                topicTitle="Delt med mig"
                updatedAt={note.updatedAt}
              />
            ))}
          </div>
        )}
      </section>

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
