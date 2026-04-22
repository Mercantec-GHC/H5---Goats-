// src/lib/auth.ts
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db, users } from "@studyhub/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!token.email) return token;

      if (user) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });

        if (existingUser) {
          token.id = existingUser.id;
          return token;
        }

        const insertedUsers = await db
          .insert(users)
          .values({
            name: user.name ?? token.email.split("@")[0],
            email: token.email,
          })
          .returning({ id: users.id });

        token.id = insertedUsers[0].id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}