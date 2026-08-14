import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyHub",
  description: "Collaborative note-taking app",
};
// RootLayout er en React-komponent, der fungerer som det overordnede layout for applikationen. Den omslutter hele applikationen med HTML- og body-tags og inkluderer SessionProviderWrapper for at sikre, at alle komponenter i applikationen har adgang til autentificeringssessionen. Derudover anvender den de importerede skrifttyper fra Google Fonts ved at tilføje de relevante CSS-variabler til HTML-elementet.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
