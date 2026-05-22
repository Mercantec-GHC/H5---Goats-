// Hocuspocus server til collaborative note editing
// Kører på ws://localhost:1234
import { Server } from "@hocuspocus/server";
// Y er et CRDT-bibliotek til real-time samarbejde
import * as Y from "yjs";
// Drizzle-ORM bruges til at interagere med databasen
import { db, notes } from "@studyhub/db";
// eq bruges til at bygge SQL WHERE-klausuler
import { eq } from "drizzle-orm";
// dotenv bruges til at indlæse miljøvariabler fra .env-filen
import dotenv from "dotenv";
// path bruges til at håndtere filstier på tværs af platforme
import path from "path";

// Indlæs miljøvariabler fra .env-filen i projektets rod
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});
// SAVE_DEBOUNCE_MS definerer, hvor lang tid (i millisekunder) vi venter efter den sidste ændring, før vi gemmer dokumentet i databasen
const SAVE_DEBOUNCE_MS = 2000;
// PendingSave-typen holder styr på det timer og dokument, der venter på at blive gemt
type PendingSave = {
  timer: NodeJS.Timeout | null;
  document: Y.Doc;
};
// pendingSaves holder styr på dokumenter, der venter på at blive gemt, for at undgå for mange databaseopdateringer
const pendingSaves = new Map<string, PendingSave>();
// saveDocument gemmer det aktuelle Yjs-dokument i databasen ved at konvertere det til en base64-streng
async function saveDocument(documentName: string, document: Y.Doc) {
  const noteId = documentName.replace("note-", "");

  const update = Y.encodeStateAsUpdate(document);
  const base64State = Buffer.from(update).toString("base64");

  await db
    .update(notes)
    .set({
      ydocState: base64State,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));

  console.log("💾 Saved document:", documentName);
}
// scheduleSave planlægger at gemme dokumentet efter en vis tid, og hvis der allerede er en planlagt gemning, nulstiller den timeren
function scheduleSave(documentName: string, document: Y.Doc) {
  const existing = pendingSaves.get(documentName);

  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(async () => {
    try {
      await saveDocument(documentName, document);
    } catch (error) {
      console.error("❌ Failed to save document:", documentName, error);
    } finally {
      pendingSaves.delete(documentName);
    }
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(documentName, {
    timer,
    document,
  });
}
// flushPendingSaves gemmer alle dokumenter, der venter på at blive gemt, og rydder pendingSaves-kortet, hvilket er nyttigt ved nedlukning af serveren for at sikre, at ingen ændringer går tabt.
async function flushPendingSaves() {
  const saves = Array.from(pendingSaves.entries());

  await Promise.all(
    saves.map(async ([documentName, pending]) => {
      if (pending.timer) {
        clearTimeout(pending.timer);
      }

      await saveDocument(documentName, pending.document);
    }),
  );

  pendingSaves.clear();
}
// Opretter en ny Hocuspocus-server med konfiguration for håndtering af dokumenter og forbindelser
const server = new Server({
  port: 1234,
// onLoadDocument indlæser det eksisterende Yjs-dokument fra databasen, hvis det findes, og anvender det på det nye dokument, når en klient opretter forbindelse. Hvis der ikke findes noget dokument i databasen, starter det med et tomt dokument.
  async onLoadDocument({ documentName, document }) {
    const noteId = documentName.replace("note-", "");

    const note = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
    });

    if (!note?.ydocState) {
      return document;
    }

    try {
      const update = Buffer.from(note.ydocState, "base64");
      Y.applyUpdate(document, update);

      console.log("📥 Loaded document:", documentName);
    } catch (error) {
      console.error("⚠️ Invalid Yjs state:", documentName, error);
    }

    return document;
  },
// onChange kaldes, hver gang der sker en ændring i dokumentet, og den planlægger at gemme dokumentet ved hjælp af scheduleSave-funktionen. Dette sikrer, at dokumentet gemmes i databasen efter en vis tid uden at gemme for ofte under aktive redigeringer.
  async onChange({ documentName, document }) {
    scheduleSave(documentName, document);
  },
// onStoreDocument kaldes, når dokumentet skal gemmes, og den kalder saveDocument-funktionen for at gemme det i databasen.
  async onStoreDocument({ documentName, document }) {
    await saveDocument(documentName, document);
  },
// onConnect og onDisconnect logger, når en klient opretter forbindelse eller afbryder forbindelsen til serveren, hvilket kan være nyttigt til overvågning og fejlfinding.
  async onConnect({ documentName }) {
    console.log("🟢 CONNECT:", documentName);
  },

  async onDisconnect({ documentName }) {
    console.log("🔴 DISCONNECT:", documentName);
  },
});

server.listen();

console.log("🚀 Hocuspocus server kører på ws://localhost:1234");
// shutdown-funktionen håndterer nedlukning af serveren ved at gemme alle ventende dokumenter og derefter stoppe serveren, hvilket sikrer, at ingen ændringer går tabt, når serveren lukkes ned.
async function shutdown() {
  console.log("\n🛑 Shutting down...");

  try {
    await flushPendingSaves();
    await server.destroy();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);