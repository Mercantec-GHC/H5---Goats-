import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const features = [
  {
    icon: "folder",
    title: "Organize with ease",
    description:
      "Create hubs, sections, and pages to keep all your notes and resources in one place.",
  },
  {
    icon: "users",
    title: "Collaborate in real-time",
    description:
      "Work together seamlessly with your peers—edit, comment, and stay in sync.",
  },
  {
    icon: "cloud",
    title: "Access anywhere",
    description:
      "Your notes are always with you. Access them from any device, anytime.",
  },
  {
    icon: "lock",
    title: "Secure & private",
    description:
      "Your data is encrypted and secure. We keep your studies safe.",
  },
];

function FeatureIcon({ type }: { type: string }) {
  if (type === "folder") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 7.5h6l2-2h9a2 2 0 0 1 2 2v2H3.5v-2Z" />
        <path d="M3 9.5h19l-2.2 9a2 2 0 0 1-2 1.5H5.2a2 2 0 0 1-2-1.6L3 9.5Z" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3.2" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M3.5 19c.2-4 2.4-6 5.5-6s5.3 2 5.5 6H3.5Z" />
        <path d="M14 18.5c.2-2.8 1.7-4.3 4-4.3 2.1 0 3.5 1.5 3.8 4.3H14Z" />
      </svg>
    );
  }

  if (type === "cloud") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 18.5h10.3a4.2 4.2 0 0 0 .7-8.3A6.2 6.2 0 0 0 6.3 9a4.8 4.8 0 0 0 .7 9.5Z" />
        <path
          className={styles.iconCutout}
          d="M12 10v5m0 0-2-2m2 2 2-2"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle className={styles.iconCutout} cx="12" cy="15" r="1.2" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/images/studydocslogo.png"
            alt="StudyDocs"
            width={320}
            height={120}
            className={styles.headerLogo}
            priority
          />
        </Link>

        <nav className={styles.navigation} aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginLink}>
            Log in
          </Link>

          <Link href="/login" className={styles.headerButton}>
            Get started
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <span>✦</span>
            Study smarter. Together.
          </div>

          <h1>
            <span>Organize</span> everything.
            <br />
            <span>Collaborate</span> anywhere.
          </h1>

          <p className={styles.heroDescription}>
            StudyDocs is the perfect blend of OneNote&apos;s organization and
            Google Docs&apos; collaboration. Built for students, by students.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryButton}>
              Get started for free
              <span aria-hidden="true">→</span>
            </Link>

            <a href="#features" className={styles.secondaryButton}>
              See how it works
              <span className={styles.playIcon}>▶</span>
            </a>
          </div>

          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              <div className={styles.avatar}>A</div>
              <div className={styles.avatar}>M</div>
              <div className={styles.avatar}>O</div>
              <div className={styles.avatar}>S</div>
              <div className={styles.avatarMore}>+2K</div>
            </div>

            <div>
              <div className={styles.stars}>★★★★★</div>
              <p>Loved by 2,000+ students</p>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroBlob} />

          <div className={styles.sidebarMockup}>
            <div className={styles.mockupBrand}>
              <span>♙</span>
              StudyDocs
            </div>

            <button type="button" className={styles.newButton}>
              ＋ New
            </button>

            <div className={styles.mockupMenu}>
              <p>▧ &nbsp; My Docs</p>
              <p className={styles.menuTitle}>▾ &nbsp; 📚 Courses</p>
              <p>▾ &nbsp; Computer Science</p>
              <p className={styles.activeMenuItem}>▸ &nbsp; Notes</p>
              <p>□ &nbsp; Assignments</p>
              <p>□ &nbsp; Exams</p>
              <p>□ &nbsp; Projects</p>
              <p>▸ &nbsp; Economics</p>
              <p>▸ &nbsp; Biology</p>
              <p>📚 &nbsp; Group Projects</p>
              <p>▧ &nbsp; Templates</p>
            </div>
          </div>

          <div className={styles.editorMockup}>
            <div className={styles.editorHeader}>
              <strong>Operating Systems – Lecture Notes</strong>

              <div className={styles.editorPeople}>
                <span>A</span>
                <span>M</span>
                <span>O</span>

                <button type="button">♟ Share</button>
              </div>
            </div>

            <div className={styles.toolbar}>
              <b>B</b>
              <i>I</i>
              <u>U</u>
              <s>S</s>
              <span>⌘</span>
              <span>☰</span>
              <span>▤</span>
              <span>▧</span>
            </div>

            <div className={styles.editorBody}>
              <h3>1. What is an Operating System?</h3>

              <p>
                An operating system (OS) is{" "}
                <mark>
                  system software that manages computer hardware and software
                  resources and provides common services for computer programs.
                </mark>
              </p>

              <h3>2. Key Components</h3>

              <ul>
                <li>Process Management</li>
                <li>Memory Management</li>
                <li>File System</li>
                <li>I/O Management</li>
              </ul>
            </div>
          </div>

          <div className={styles.commentBubble}>
            <strong>👩 Anna</strong>
            <span>Great explanation!</span>
          </div>

          <Image
            src="/images/studydocsmascot.png"
            width={700}
            height={700}
            alt="StudyDocs mascot studying"
            className={styles.mascot}
            priority
          />

          <div className={styles.cup}>🦆</div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        {features.map((feature) => (
          <article key={feature.title} className={styles.feature}>
            <div className={styles.featureIcon}>
              <FeatureIcon type={feature.icon} />
            </div>

            <div>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.closingMessage}>
        <Image
          src="/images/studydocslogo.png"
          width={240}
          height={90}
          alt="StudyDocs"
          className={styles.closingLogo}
        />

        <div>
          <p>StudyDocs is more than a tool. It&apos;s your learning hub.</p>
          <strong>Stay organized. Stay productive. Stay in the hub.</strong>
        </div>
      </section>
    </main>
  );
}