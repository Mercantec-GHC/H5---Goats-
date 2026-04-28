import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, notePlacements, topics } from "@studyhub/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const title = body?.title?.trim();
  const topicId = body?.topicId ?? null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (topicId) {
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
      with: {
        subject: true,
      },
    });

    if (!topic || topic.subject.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
  }

  const [newNote] = await db
    .insert(notes)
    .values({
      title,
      ydocState: "",
      ownerId: session.user.id,
    })
    .returning();

  await db.insert(notePlacements).values({
    noteId: newNote.id,
    userId: session.user.id,
    topicId,
  });

  return NextResponse.json(newNote, { status: 201 });
}