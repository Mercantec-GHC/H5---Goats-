import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, subjects, topics } from "@studyhub/db";
import { and, asc, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
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
    with: {
      topics: {
        orderBy: [asc(topics.createdAt)],
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json(subject);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(subjects).where(eq(subjects.id, subjectId));

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: RouteContext) {
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updatedSubject] = await db
    .update(subjects)
    .set({ title })
    .where(eq(subjects.id, subjectId))
    .returning();

  return NextResponse.json(updatedSubject);
}