import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Decathlon Coach",
  description: "Ton coach sportif personnalisé Decathlon",
};

function NavIcon({ name }: { name: "coach" | "program" | "progress" | "shop" }) {
  const paths = {
    coach: (
      <>
        <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    program: (
      <>
        <path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
        <path d="m8 14 2 2 5-5" />
      </>
    ),
    progress: (
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </>
    ),
    shop: (
      <>
        <path d="M3 4h2l2 11h10l2-8H6" />
        <path d="M9 20h.01M17 20h.01" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="app-header">
          <Link href="/program" className="brand">
            <Image src="/decathlon-logo.png" alt="Decathlon" width={128} height={32} priority />
            <span>COACH</span>
          </Link>
          <div className="header-right">
            <div className="header-coach-status">
              <i />
              Coach disponible
            </div>
            <Link href="/profile" className="profile-link" aria-label="Mon profil">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </Link>
          </div>
        </header>

        {children}

        <nav className="bottom-nav" aria-label="Navigation principale">
          <Link href="/coach">
            <NavIcon name="coach" />
            <span>Coach</span>
          </Link>
          <Link href="/program">
            <NavIcon name="program" />
            <span>Programme</span>
          </Link>
          <Link href="/progress">
            <NavIcon name="progress" />
            <span>Progrès</span>
          </Link>
          <Link href="/shop">
            <NavIcon name="shop" />
            <span>Équipement</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
