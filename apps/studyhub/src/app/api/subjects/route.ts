import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, subjects } from "@studyhub/db";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSubjects = await db.query.subjects.findMany({
    where: eq(subjects.ownerId, session.user.id),
    orderBy: [asc(subjects.title)],
  });

  return NextResponse.json(userSubjects);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const title = body?.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const [newSubject] = await db
    .insert(subjects)
    .values({
      title,
      ownerId: session.user.id,
    })
    .returning();

  return NextResponse.json(newSubject, { status: 201 });
}