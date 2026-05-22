import styles from "./page.module.css";
// LandingPage er en React-komponent, der repræsenterer landingssiden for applikationen. Komponenten viser en simpel velkomstbesked med titlen "StudyHub" og en kort beskrivelse "Organisér og samarbejd på dine noter". Denne side fungerer som den første introduktion til applikationen, hvor brugerne kan få en idé om, hvad StudyHub handler om, før de logger ind eller navigerer videre til andre dele af applikationen.
export default function LandingPage() {
  return (
    <main>
      <h1>StudyHub</h1>
      <p>Organisér og samarbejd på dine noter</p>
    </main>
  );
}
