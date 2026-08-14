// HocuspocusProvider er en klasse fra @hocuspocus/provider, der bruges til at oprette en forbindelse mellem et Yjs-dokument og en Hocuspocus-server, hvilket muliggør realtids-samarbejde mellem klienter. Yjs er et bibliotek til håndtering af delte data i realtid, og det bruges ofte sammen med Hocuspocus for at skabe kollaborative applikationer. I dette tilfælde importeres både HocuspocusProvider og Yjs for at kunne oprette en provider, der synkroniserer et Yjs-dokument med en Hocuspocus-server.
import { HocuspocusProvider } from "@hocuspocus/provider";
// Y er et bibliotek til håndtering af delte data i realtid, og det bruges ofte sammen med Hocuspocus for at skabe kollaborative applikationer. I dette tilfælde importeres både HocuspocusProvider og Yjs for at kunne oprette en provider, der synkroniserer et Yjs-dokument med en Hocuspocus-server.
import * as Y from "yjs";

const COLLAB_SERVER_URL =
  process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? "ws://localhost:1234";

export function createProvider(noteId: string, doc: Y.Doc) {
  return new HocuspocusProvider({
    url: COLLAB_SERVER_URL,
    name: `note-${noteId}`,
    document: doc,
  });
}