import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
