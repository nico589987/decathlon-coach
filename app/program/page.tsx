"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  content: string;
  done?: boolean;
  feedback?: "facile" | "ok" | "dur" | "trop_dur";
  products?: string[];
};

const PRODUCT_CATALOG = [
  {
    id: "running-shoes",
    label: "Chaussures de running",
    aliases: ["chaussures running", "chaussures de running"],
  },
  {
    id: "fitness-mat",
    label: "Tapis de fitness",
    aliases: ["tapis fitness", "tapis de fitness"],
  },
  {
    id: "resistance-bands",
    label: "Bandes de resistance",
    aliases: ["bandes elastiques", "bandes de resistance"],
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function ProgramPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbackTarget, setFeedbackTarget] = useState<Session | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("program_sessions");
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  function save(list: Session[]) {
    setSessions(list);
    localStorage.setItem("program_sessions", JSON.stringify(list));
  }

  function markDone(s: Session) {
    setFeedbackTarget(s);
  }

  function applyFeedback(level: Session["feedback"]) {
    if (!feedbackTarget) return;

    const updated = sessions.map((s) =>
      s.id === feedbackTarget.id
        ? { ...s, done: true, feedback: level }
        : s
    );

    save(updated);
    setFeedbackTarget(null);
  }

  function resetSession(id: string) {
    const updated = sessions.map((s) =>
      s.id === id ? { ...s, done: false, feedback: undefined } : s
    );
    save(updated);
  }

  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    save(updated);
  }

  function getProductLinks(products: string[]) {
    const index = new Map(
      PRODUCT_CATALOG.flatMap((p) =>
        p.aliases.map((a) => [normalizeText(a), p])
      )
    );

    return products
      .map((p) => {
        const match = index.get(normalizeText(p));
        return match ? { id: match.id, label: match.label } : null;
      })
      .filter(Boolean) as { id: string; label: string }[];
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>📅 Mon Programme</h1>

      {sessions.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          Aucune séance ajoutée pour l’instant.
        </p>
      )}

      {sessions.map((s) => (
        <div
          key={s.id}
          style={{
            background: "#eef2ff",
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            position: "relative",
          }}
        >
          {/* bouton supprimer */}
          <button
            onClick={() => deleteSession(s.id)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#fee2e2",
              color: "#b91c1c",
              border: "none",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>

          <h3 style={{ marginBottom: 8 }}>{s.title}</h3>

          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {s.content}
          </div>

          {s.products && s.products.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Produits recommandes
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {getProductLinks(s.products).map((p) => (
                  <a
                    key={p.id}
                    href={`/shop/${p.id}`}
                    style={{
                      textDecoration: "none",
                      background: "#ecfeff",
                      border: "1px solid #a5f3fc",
                      color: "#0e7490",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!s.done && (
            <button
              onClick={() => markDone(s)}
              style={{
                marginTop: 12,
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              ✓ Marquer effectuée
            </button>
          )}

          {s.done && (
            <div style={{ marginTop: 10 }}>
              <span style={{ fontWeight: 600 }}>
                ✅ Fait — ressenti : {s.feedback}
              </span>

              <button
                onClick={() => resetSession(s.id)}
                style={{
                  marginLeft: 12,
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      ))}

      {/* modal feedback */}
      {feedbackTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              width: 320,
            }}
          >
            <h3>Comment était la séance ?</h3>

            {[
              ["facile", "🙂 Facile"],
              ["ok", "😐 Correcte"],
              ["dur", "😵 Difficile"],
              ["trop_dur", "🔥 Trop dure"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => applyFeedback(k as any)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => setFeedbackTarget(null)}
              style={{ marginTop: 12, opacity: 0.6 }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
