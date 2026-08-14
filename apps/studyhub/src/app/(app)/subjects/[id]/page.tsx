// src/app/(app)/subjects/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, subjects, topics } from "@studyhub/db";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import styles from "./page.module.css";
import CreateTopicForm from "./CreateTopicForm";
// Viser et fag og dets emner
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const subject = await db.query.subjects.findFirst({
    where: and(eq(subjects.id, id), eq(subjects.ownerId, session.user.id)),
    with: {
      topics: {
        orderBy: [asc(topics.createdAt)],
      },
    },
  });

  if (!subject) {
    return <p>Fag blev ikke fundet.</p>;
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <p className={styles.label}>Fag</p>
        <h1 className={styles.title}>{subject.title}</h1>
      </div>

      <CreateTopicForm subjectId={subject.id} />

      <div className={styles.topicSection}>
        <h2 className={styles.subtitle}>Emner</h2>

        {subject.topics.length === 0 ? (
          <p className={styles.empty}>Der er ingen emner endnu.</p>
        ) : (
          <ul className={styles.topicList}>
            {subject.topics.map((topic) => (
              <li key={topic.id} className={styles.topicItem}>
                <Link href={`/topics/${topic.id}`} className={styles.topicLink}>
                  {topic.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
