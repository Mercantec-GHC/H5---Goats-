// HocuspocusProvider er en klasse fra @hocuspocus/provider, der bruges til at oprette en forbindelse mellem et Yjs-dokument og en Hocuspocus-server, hvilket muliggør realtids-samarbejde mellem klienter. Yjs er et bibliotek til håndtering af delte data i realtid, og det bruges ofte sammen med Hocuspocus for at skabe kollaborative applikationer. I dette tilfælde importeres både HocuspocusProvider og Yjs for at kunne oprette en provider, der synkroniserer et Yjs-dokument med en Hocuspocus-server.
import { HocuspocusProvider } from "@hocuspocus/provider";
// Y er et bibliotek til håndtering af delte data i realtid, og det bruges ofte sammen med Hocuspocus for at skabe kollaborative applikationer. I dette tilfælde importeres både HocuspocusProvider og Yjs for at kunne oprette en provider, der synkroniserer et Yjs-dokument med en Hocuspocus-server.
import * as Y from "yjs";
// Definerer URL'en til Hocuspocus-serveren, som klienterne vil oprette forbindelse til for at synkronisere Yjs-dokumenter i realtid. I dette tilfælde kører serveren lokalt på port 1234.
const COLLAB_SERVER_URL = "ws://localhost:1234";
// createProvider er en funktion, der opretter og returnerer en ny HocuspocusProvider, som bruges til at forbinde et Yjs-dokument til en Hocuspocus-server for realtids-samarbejde. Funktionen tager et noteId og et Yjs-dokument som argumenter og konfigurerer provider'en med den korrekte URL, dokumentnavn og det Yjs-dokument, der skal synkroniseres.
export function createProvider(noteId: string, doc: Y.Doc) {
  return new HocuspocusProvider({
    url: COLLAB_SERVER_URL,
    name: `note-${noteId}`,
    document: doc,
  });
}