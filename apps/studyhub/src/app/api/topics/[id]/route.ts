import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, subjects, topics } from "@studyhub/db";
import { and, eq } from "drizzle-orm";
// Håndterer opdatering, sletning og hentning af et enkelt emne (topic)
// Først og fremmest tjekker den om brugeren er logget ind, og om det emne de prøver at tilgå rent faktisk tilhører dem
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;
  const body = await req.json();
  const title = body?.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      subject: true,
    },
  });

  if (!topic || topic.subject.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updatedTopic] = await db
    .update(topics)
    .set({ title })
    .where(eq(topics.id, topicId))
    .returning();

  return NextResponse.json(updatedTopic);
}
// Sletning af et emne, tjekker også om det tilhører brugeren
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;

  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      subject: true,
    },
  });

  if (!topic || topic.subject.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(topics).where(eq(topics.id, topicId));

  return NextResponse.json({ success: true });
}
// Hentning af et emne, tjekker også om det tilhører brugeren
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;

  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      subject: true,
      notePlacements: {
        with: {
          note: true,
        },
      },
    },
  });

  if (!topic || topic.subject.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 🔥 Flatten notes (meget vigtigt)
  // Når vi henter et emne, vil vi også gerne have alle de noter der er placeret i det emne.
  const notes = topic.notePlacements.map((np) => np.note);

  return NextResponse.json({
    id: topic.id,
    title: topic.title,
    subjectId: topic.subjectId, 
    notes,
  });
}