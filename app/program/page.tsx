"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

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

function parseSessionItems(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) => /^[-•]/.test(line));
  const source = bulletLines.length > 0 ? bulletLines : lines;

  return source
    .map((line) => line.replace(/^[-•]\s?/, ""))
    .filter((line) => line.length > 0);
}


function emojiForItem(text: string) {
  return "•";
}

function tagForItem(text: string) {
  const t = text.toLowerCase();
  if (t.includes("échauffement")) {
    return { label: "Échauffement", color: "#f59e0b", bg: "#fef3c7" };
  }
  if (t.includes("retour au calme") || t.includes("étirements")) {
    return { label: "Retour au calme", color: "#0f766e", bg: "#ccfbf1" };
  }
  return {
    label: "Exercices",
    color: "#1d4ed8",
    bg: "#dbeafe",
  };
}

function groupSessionItems(items: string[]) {
  const groups: {
    key: string;
    label: string;
    color: string;
    bg: string;
    items: string[];
  }[] = [];

  const order = ["Échauffement", "Exercices", "Retour au calme"];

  items.forEach((item) => {
    const tag = tagForItem(item);
    let group = groups.find((g) => g.label === tag.label);
    if (!group) {
      group = {
        key: tag.label.toLowerCase().replace(/\s+/g, "_"),
        label: tag.label,
        color: tag.color,
        bg: tag.bg,
        items: [],
      };
      groups.push(group);
    }
    group.items.push(item);
  });

  return groups.sort(
    (a, b) => order.indexOf(a.label) - order.indexOf(b.label)
  );
}

function highlightItem(text: string) {
  const parts: ReactNode[] = [];
  const regex =
    /(\b\d+\s*(?:min|minutes|sec|secondes)\b|\b\d+\s*(?:séries?|reps?)\b|\b(?:échauffement|retour au calme|étirements|gainage|squats?|fentes?|pompes?|crunchs?|course)\b)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const value = match[0];
    parts.push(
      <span
        key={`${match.index}-${value}`}
        style={{ fontWeight: 700, color: "#1e293b" }}
      >
        {value}
      </span>
    );
    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function ProgramPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbackTarget, setFeedbackTarget] = useState<Session | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

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
    setLastCompletedId(feedbackTarget.id);
  }

  useEffect(() => {
    if (!lastCompletedId) return;
    const timer = setTimeout(() => setLastCompletedId(null), 700);
    return () => clearTimeout(timer);
  }, [lastCompletedId]);

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

  const doneCount = sessions.filter((s) => s.done).length;
  const totalCount = sessions.length;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 980,
        margin: "auto",
        background:
          "radial-gradient(1200px 400px at 10% -10%, rgba(60,70,184,0.12) 0%, rgba(248,250,252,0) 70%), radial-gradient(900px 400px at 90% -20%, rgba(37,99,235,0.12) 0%, rgba(248,250,252,0) 70%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 700,
            boxShadow: "0 8px 18px rgba(60,70,184,0.35)",
          }}
        >
          {"\uD83D\uDCD8"}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Mon Programme</h1>
          <div style={{ color: "#475569", fontSize: 13 }}>
            Tes séances planifiées et suivies
          </div>
        </div>
        {totalCount > 0 && (
          <div
            style={{
              marginLeft: "auto",
              background: "#eef2ff",
              color: "#3730a3",
              border: "1px solid #c7d2fe",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {doneCount}/{totalCount} séances faites
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "#e2e8f0",
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((doneCount / totalCount) * 100)}%`,
              background:
                "linear-gradient(90deg, #3C46B8 0%, #2563eb 60%, #0ea5e9 100%)",
              transition: "width 300ms ease",
            }}
          />
        </div>
      )}

      <style jsx global>{`
        .program-card {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .program-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
        }
        .program-chip {
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .program-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(30, 64, 175, 0.2);
        }
        .program-done {
          animation: donePulse 600ms ease;
        }
        @keyframes donePulse {
          0% {
            transform: scale(0.98);
            box-shadow: 0 0 0 rgba(34, 197, 94, 0.0);
          }
          60% {
            transform: scale(1.01);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(34, 197, 94, 0.0);
          }
        }
      `}</style>

      {sessions.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          Aucune séance ajoutée pour l’instant.
        </p>
      )}

      {sessions.map((s) => (
        <div
          key={s.id}
          className="program-card"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
            position: "relative",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 6,
              background:
                "linear-gradient(90deg, #3C46B8 0%, #2563eb 45%, #0ea5e9 100%)",
            }}
          />
          {/* bouton supprimer */}
          <button
            onClick={() => deleteSession(s.id)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#ffe4e6",
              color: "#be123c",
              border: "none",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>

          <h3 style={{ marginBottom: 10, marginTop: 4 }}>{s.title}</h3>

          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              lineHeight: 1.5,
              color: "#111827",
            }}
          >
            {groupSessionItems(parseSessionItems(s.content)).map((group) => (
              <li key={`${s.id}-${group.key}`} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                    background: group.bg,
                    color: group.color,
                    border: `1px solid ${group.color}33`,
                  }}
                >
                  {group.label}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {group.items.map((item, idx) => (
                    <li
                      key={`${s.id}-${group.key}-${idx}`}
                      style={{
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ width: 20 }}>{emojiForItem(item)}</span>
                      <span style={{ lineHeight: 1.5 }}>
                        {highlightItem(item)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {s.products && s.products.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Produits recommandes
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {getProductLinks(s.products).map((p) => (
                  <a
                    key={p.id}
                    href={`/shop/${p.id}`}
                    className="program-chip"
                    style={{
                      textDecoration: "none",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1e40af",
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
                background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 6px 12px rgba(60,70,184,0.3)",
              }}
            >
              OK Marquer effectuée
            </button>
          )}

          {s.done && (
            <div style={{ marginTop: 10 }}>
              <span
                className={s.id === lastCompletedId ? "program-done" : undefined}
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                OK Fait - ressenti : {s.feedback}
              </span>

              <button
                onClick={() => resetSession(s.id)}
                style={{
                  marginLeft: 12,
                  background: "#e2e8f0",
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
              boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Comment était la séance ?</h3>

            {[
              ["facile", "Facile"],
              ["ok", "Correcte"],
              ["dur", "Difficile"],
              ["trop_dur", "Trop dure"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => applyFeedback(k as any)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
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















