import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
// Denne fil håndterer autentificering ved hjælp af NextAuth, og eksporterer både GET og POST handlers, som NextAuth bruger til at håndtere login og callback routes.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };