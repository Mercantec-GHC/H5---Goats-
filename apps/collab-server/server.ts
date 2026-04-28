import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { db, notes } from "@studyhub/db";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const server = new Server({
  port: 1234,

  async onLoadDocument({ documentName, document }) {
    const noteId = documentName.replace("note-", "");

    const note = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
    });

    if (!note?.ydocState) {
      return document;
    }

    const update = Buffer.from(note.ydocState, "base64");
    Y.applyUpdate(document, update);

    console.log("📥 Loaded document:", documentName);

    return document;
  },

  async onStoreDocument({ documentName, document }) {
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

    console.log("💾 Stored document:", documentName);
  },

  async onConnect({ documentName }) {
    console.log("🟢 CONNECT:", documentName);
  },

  async onDisconnect({ documentName }) {
    console.log("🔴 DISCONNECT:", documentName);
  },
});

server.listen();

console.log("🚀 Hocuspocus server kører på ws://localhost:1234");