import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, notePlacements, subjects } from "@studyhub/db";
import { desc, eq } from "drizzle-orm";

import NotesSearch from "@/components/notes/NotesSearch";
import DashboardRefresh from "@/components/DashboardRefresh";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type HomepageProps = {
  searchParams: Promise<{
    topic?: string;
  }>;
};

export default async function Homepage({ searchParams }: HomepageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { topic: activeTopicId } = await searchParams;

  const placements = await db.query.notePlacements.findMany({
    where: eq(notePlacements.userId, session.user.id),
    with: {
      note: true,
      topic: true,
    },
    orderBy: [desc(notePlacements.createdAt)],
  });

  const subjectStructure = await db.query.subjects.findMany({
    where: eq(subjects.ownerId, session.user.id),
    with: {
      topics: true,
    },
    orderBy: [desc(subjects.createdAt)],
  });

  const allNotes = placements
    .map((placement) => ({
      ...placement.note,
      topicId: placement.topicId,
      topic: placement.topic,
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  /*
   * Hvis et topic er valgt i sidebaren,
   * viser vi kun noter fra dette topic.
   */
  const notes = activeTopicId
    ? allNotes.filter((note) => note.topicId === activeTopicId)
    : allNotes;

  /*
   * Find det aktive topic + dets subject,
   * så NotesSearch kan vise fx:
   *
   * Dansk / Analyse
   */
  const activeSubject = activeTopicId
    ? subjectStructure.find((subject) =>
        subject.topics.some((topic) => topic.id === activeTopicId),
      )
    : undefined;

  const activeTopic = activeSubject?.topics.find(
    (topic) => topic.id === activeTopicId,
  );

  /*
   * Hvis URL'en indeholder et topic,
   * som brugeren ikke ejer/har adgang til,
   * sender vi dem tilbage til normal homepage.
   */
  if (activeTopicId && !activeTopic) {
    redirect("/homepage");
  }

  return (
    <main className={styles.container}>
      <DashboardRefresh />

      <NotesSearch
        notes={notes}
        currentUserId={session.user.id}
        subjects={subjectStructure}
        activeTopicId={activeTopicId ?? null}
        activeTopicTitle={activeTopic?.title ?? null}
        activeSubjectTitle={activeSubject?.title ?? null}
      />
    </main>
  );
}
