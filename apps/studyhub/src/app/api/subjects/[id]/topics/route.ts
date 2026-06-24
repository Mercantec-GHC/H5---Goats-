import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, subjects, topics } from "@studyhub/db";
import { and, asc, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: subjectId } = await params;

  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(subjects.id, subjectId),
      eq(subjects.ownerId, session.user.id)
    ),
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const subjectTopics = await db.query.topics.findMany({
    where: eq(topics.subjectId, subjectId),
    orderBy: [asc(topics.createdAt)],
  });

  return NextResponse.json(subjectTopics);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: subjectId } = await params;
  const body = await req.json();
  const title = body?.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(subjects.id, subjectId),
      eq(subjects.ownerId, session.user.id)
    ),
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const [newTopic] = await db
    .insert(topics)
    .values({
      title,
      subjectId,
    })
    .returning();

  return NextResponse.json(newTopic, { status: 201 });
}