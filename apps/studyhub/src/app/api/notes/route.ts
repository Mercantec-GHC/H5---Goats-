import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, notePlacements, topics } from "@studyhub/db";
import { desc, eq } from "drizzle-orm";
// Håndterer hentning og oprettelse af noter
// Først og fremmest tjekker den om brugeren er logget ind, og ved oprettelse tjekker den også om det emne (topic) de prøver at placere noten under rent faktisk tilhører dem
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPlacements = await db.query.notePlacements.findMany({
    where: eq(notePlacements.userId, session.user.id),
    with: {
      note: true,
      topic: {
        with: {
          subject: true,
        },
      },
    },
    orderBy: [desc(notePlacements.createdAt)],
  });

  const userNotes = userPlacements.map((placement) => ({
    ...placement.note,
    topicId: placement.topicId,
    topic: placement.topic,
  }));

  return NextResponse.json(userNotes);
}
// Funktion til oprettelse af noter
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const title = body?.title?.trim();
  const topicId = typeof body.topicId === "string" ? body.topicId : null;

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

  return NextResponse.json(
    {
      ...newNote,
      topicId,
    },
    { status: 201 },
  );
}