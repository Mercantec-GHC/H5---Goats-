// src/app/homepage/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DebugCreateSubject from "@/components/DebugCreateSubject";
export default async function Homepage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Homepage</h1>
      <p>Velkommen {session.user.email}</p>
      <p>Velkommen {session.user.id}</p>
    </main>
  );
}
