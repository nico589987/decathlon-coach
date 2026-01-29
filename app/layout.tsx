import "./globals.css";

export const metadata = {
  title: "Decathlon Coach",
  description: "Ton coach sportif personnalisé Decathlon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: "#3C46B8",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="/decathlon-logo.png"
            alt="Decathlon"
            style={{ height: 28 }}
          />
          <span
            style={{
              color: "white",
              fontWeight: 600,
              marginLeft: 12,
              fontSize: 16,
            }}
          >
            Coach
          </span>
        </header>

        {/* Contenu */}
        <main style={{ paddingBottom: 70 }}>{children}</main>

        {/* Navigation bottom */}
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-around",
            padding: "10px 0",
          }}
        >
          <a
            href="/coach"
            style={{
              textDecoration: "none",
              color: "#3C46B8",
              fontWeight: 600,
            }}
          >
            🧠 Coach
          </a>
          <a
            href="/program"
            style={{
              textDecoration: "none",
              color: "#3C46B8",
              fontWeight: 600,
            }}
          >
            📅 Programme
          </a>
          <a
            href="/shop"
            style={{
              textDecoration: "none",
              color: "#3C46B8",
              fontWeight: 600,
            }}
          >
            🛒 Shop
          </a>
        </nav>
      </body>
    </html>
  );
}
