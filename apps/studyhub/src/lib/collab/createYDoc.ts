import * as Y from "yjs";
// createYDoc er en simpel funktion, der opretter og returnerer et nyt Yjs-dokument. Dette dokument kan bruges til at håndtere realtids-samarbejde i applikationen ved at dele og synkronisere data mellem klienter og serveren.
export function createYDoc() {
  return new Y.Doc();
}