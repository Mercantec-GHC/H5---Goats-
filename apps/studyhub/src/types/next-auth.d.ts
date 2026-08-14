import { DefaultSession } from "next-auth";
// Udvider NextAuth-sessionen for at inkludere en bruger-id, hvilket gør det nemmere at få adgang til brugerens id i hele applikationen uden at skulle ændre eksisterende session-typer.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
// Udvider JWT-typen for at inkludere id, hvilket gør det muligt at gemme bruger-id'et i JWT-tokenet, hvis det er nødvendigt for autentificering eller autorisation i applikationen.
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}