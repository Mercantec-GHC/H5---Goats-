// src/lib/auth.ts

import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db, users } from "@studyhub/db";

/**
 * NextAuth configuration.
 * Uses Google OAuth for authentication.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  /**
   * JWT strategy is used instead of database sessions.
   * The session state is stored inside signed tokens.
   */
  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * JWT callback runs during login/session updates.
     * Responsible for connecting Google users
     * with the application's internal database users.
     */
    async jwt({ token, user }) {
      if (!token.email) return token;

      /**
       * Only run database logic on initial login.
       */
      if (user) {
        /**
         * Check if the user already exists
         * in the application's database.
         */
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });

        /**
         * Existing user:
         * store internal database id inside JWT token.
         */
        if (existingUser) {
          token.id = existingUser.id;
          return token;
        }

        /**
         * New user:
         * create database user automatically.
         */
        const insertedUsers = await db
          .insert(users)
          .values({
            name: user.name ?? token.email.split("@")[0],
            email: token.email,
          })
          .returning({ id: users.id });

        /**
         * Store generated database id in token.
         */
        token.id = insertedUsers[0].id;
      }

      return token;
    },

    /**
     * Session callback transfers the internal user id
     * from the JWT token into the session object.
     *
     * This makes session.user.id available
     * throughout the application.
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
};

/**
 * Helper function used in API routes
 * and server components to get the current session.
 */
export function auth() {
  return getServerSession(authOptions);
}