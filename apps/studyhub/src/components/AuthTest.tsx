/*
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthTest() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div>
        <p>Ikke logget ind</p>
        <button onClick={() => signIn("google")}>Log ind med Google</button>
      </div>
    );
  }

  return (
    <div>
      <p>Logget ind som: {session.user?.email}</p>
      <p>User ID: {session.user?.id}</p> 
      <button onClick={() => signOut()}>Log ud</button>
    </div>
  );
}
*/
