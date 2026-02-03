"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import { products as allProducts } from "../data/decathlon_products";
import { useRouter } from "next/navigation";

type Role = "user" | "assistant";

type Msg = {
  role: Role;
  content: string;
};

type SessionDraft = {
  id: string;
  title: string;
  content: string;
  products: string[];
};

const STORAGE_KEY = "coach_messages_v1";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessionDraft[]>([]);
  const router = useRouter();

  // ======================
  // Load saved conversation
  // ======================
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      setMessages(JSON.parse(raw));
      return;
    }

    const init: Msg[] = [
      {
        role: "assistant",
        content:
          "Salut 👋 Je suis ton coach.\nOn construit ton programme ensemble.\n🎯 Quel est ton objectif ?",
      },
    ];

    setMessages(init);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  }, []);

  function persist(list: Msg[]) {
    setMessages(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function newConversation() {
    const init: Msg[] = [
      {
        role: "assistant",
        content: "Nouvelle discussion 👍 Quel est ton objectif sportif ?",
      },
    ];
    setPendingSessions([]);
    persist(init);
  }

  // ======================
  // Extract sessions safely
  // ======================
  function trimSessionContent(block: string) {
    const lines = block.split("\n");
    const items: string[] = [];
    let started = false;
    for (let i = 1; i < lines.length; i += 1) {
      const raw = lines[i].trim();
      if (!raw) continue;
      if (/^[-•]/.test(raw)) {
        started = true;
        items.push(raw.replace(/^[-•]\s?/, "- "));
        continue;
      }
      if (started) break;
    }
    if (items.length === 0) return block.trim();
    return items.join("\n");
  }

  function extractRealSessions(text: string): SessionDraft[] {
    const blocks = text.split(/\n(?=(?:\*\*)?(?:Séance|Seance)\s*\d+)/i);
    const sessions: SessionDraft[] = [];
    for (const block of blocks) {
      if (!/^(?:\*\*)?(?:Séance|Seance)\s*\d+/i.test(block.trim())) continue;
      if (block.length < 60) continue;
      sessions.push({
        id: crypto.randomUUID(),
        title: block.split("\n")[0].replace(/\*\*/g, ""),
        content: trimSessionContent(block),
        products: suggestProducts(block),
      });
    }
    return sessions;
  }

  function suggestProducts(text: string): string[] {
    const t = normalizeText(text);
    const categories: string[] = [];
    const addCategory = (label: string) => {
      if (!categories.includes(label)) categories.push(label);
    };

    if (t.includes("course") || t.includes("running") || t.includes("footing")) {
      addCategory("Chaussures");
      addCategory("Chaussettes");
    }
    if (t.includes("fractionne") || t.includes("cardio")) {
      addCategory("Chaussures");
    }
    if (t.includes("etirement") || t.includes("retour au calme")) {
      addCategory("Récupération");
    }
    if (
      t.includes("froid") ||
      t.includes("hiver") ||
      t.includes("vent") ||
      t.includes("pluie")
    ) {
      addCategory("Vestes");
      addCategory("Collants");
      addCategory("Gants");
      addCategory("Bandeaux");
    }
    if (t.includes("chaleur") || t.includes("ete")) {
      addCategory("Casquettes");
    }
    if (t.includes("long") || t.includes("hydrat")) {
      addCategory("Hydratation");
    }
    if (t.includes("nuit") || t.includes("securite")) {
      addCategory("Sécurité");
    }
    if (t.includes("musique")) {
      addCategory("Audio");
    }

    const picks: string[] = [];
    const seen = new Set<string>();
    categories.forEach((label) => {
      allProducts
        .filter((p) => normalizeText(p.categoryLabel) === normalizeText(label))
        .slice(0, 2)
        .forEach((p) => {
          if (seen.has(p.id)) return;
          seen.add(p.id);
          picks.push(p.id);
        });
    });
    return picks.slice(0, 4);
  }

  // ======================
  // SEND MESSAGE
  // ======================
  async function send() {
    if (!input.trim() || loading) return;

    const userMsg: Msg = {
      role: "user",
      content: input,
    };

    const newMsgs: Msg[] = [...messages, userMsg];

    persist(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });

      const data = await res.json();
      const reply: string = data.content || "";

      const assistantMsg: Msg = {
        role: "assistant",
        content: reply,
      };

      const updated: Msg[] = [...newMsgs, assistantMsg];

      persist(updated);

      const sessions = extractRealSessions(reply);
      setPendingSessions(sessions);
    } catch {
      const errMsg: Msg = {
        role: "assistant",
        content: "Oups — erreur IA.",
      };

      const updated: Msg[] = [...newMsgs, errMsg];
      persist(updated);
    }

    setLoading(false);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") send();
  }

  // ======================
  // Add to program
  // ======================
  function addSessionsToProgram() {
    const raw = localStorage.getItem("program_sessions");
    const existing = raw ? JSON.parse(raw) : [];

    const formatted = pendingSessions.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      done: false,
      products: s.products,
    }));

    localStorage.setItem(
      "program_sessions",
      JSON.stringify([...existing, ...formatted])
    );
    setPendingSessions([]);
    router.push("/program");
  }

  function addSingleSessionToProgram(session: SessionDraft) {
    const raw = localStorage.getItem("program_sessions");
    const existing = raw ? JSON.parse(raw) : [];
    const next = [
      ...existing.filter((s: SessionDraft) => s.id !== session.id),
      {
        id: session.id,
        title: session.title,
        content: session.content,
        done: false,
        products: session.products,
      },
    ];
    localStorage.setItem("program_sessions", JSON.stringify(next));
    setPendingSessions((prev) => prev.filter((s) => s.id !== session.id));
  }

  // ======================
  // UI helpers
  // ======================
  function emojiForLine(text: string) {
    const t = normalizeText(text);
    if (t.includes("echauffement")) return "🔥";
    if (t.includes("retour au calme") || t.includes("etirements")) return "🧘";
    if (t.includes("series")) return "🔁";
    if (t.includes("course")) return "🏃";
    if (t.includes("renforcement")) return "🏋️";
    return "•";
  }

  function lineAccent(text: string) {
    const t = normalizeText(text);
    if (t.includes("echauffement")) return "#f59e0b";
    if (t.includes("retour au calme") || t.includes("etirements")) {
      return "#14b8a6";
    }
    if (t.includes("course") || t.includes("cardio")) return "#22c55e";
    if (t.includes("series") || t.includes("renforcement") || t.includes("gainage")) {
      return "#3C46B8";
    }
    return "#94a3b8";
  }

  function normalizeSessionTitle(value: string) {
    return value
      .replace(/\*\*/g, "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function parseCoachMessage(content: string) {
    const lines = content.split("\n");
    const intro: string[] = [];
    const outro: string[] = [];
    const sessions: { title: string; items: string[] }[] = [];
    let current: { title: string; items: string[] } | null = null;
    let seenSession = false;

    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      const titleMatch = line.match(/^\*\*(.+)\*\*$/);
      const sessionMatch = line.match(/^(?:\*\*)?(?:Séance|Seance)\s*\d+/i);

      if (titleMatch && sessionMatch) {
        if (current) sessions.push(current);
        current = { title: titleMatch[1], items: [] };
        seenSession = true;
        return;
      }

      if (current) {
        if (/^[-•]/.test(line)) {
          current.items.push(line.replace(/^[-•]\s?/, ""));
          return;
        }
        sessions.push(current);
        current = null;
        outro.push(line);
        return;
      }

      if (seenSession) outro.push(line);
      else intro.push(line);
    });

    if (current) sessions.push(current);
    return { intro, sessions, outro };
  }

  function resolveProducts(ids: string[]) {
    const byId = new Map(allProducts.map((p) => [normalizeText(p.id), p]));
    const byName = new Map(allProducts.map((p) => [normalizeText(p.name), p]));
    const byCategory = new Map(
      allProducts.map((p) => [normalizeText(p.categoryLabel), p])
    );
    const results: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    ids.forEach((item) => {
      const key = normalizeText(item);
      const direct = byId.get(key) || byName.get(key) || byCategory.get(key);
      const fallback = allProducts.find(
        (p) =>
          normalizeText(p.name).includes(key) ||
          normalizeText(p.categoryLabel).includes(key)
      );
      const product = direct || fallback;
      if (!product || seen.has(product.id)) return;
      seen.add(product.id);
      results.push({ id: product.id, name: product.name });
    });

    return results;
  }

  function renderCoachContent(content: string) {
    const parsed = parseCoachMessage(content);
    const nodes: ReactNode[] = [];
    const titleTextStyle: CSSProperties = {
      fontWeight: 700,
      marginTop: 12,
      marginBottom: 6,
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
    };
    const badgeStyle: CSSProperties = {
      background: "#eef2ff",
      color: "#3730a3",
      border: "1px solid #c7d2fe",
      borderRadius: 999,
      padding: "2px 10px",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.2,
    };
    const pendingMap = new Map(
      pendingSessions.map((s) => [normalizeSessionTitle(s.title), s])
    );

    parsed.intro.forEach((line, idx) => {
      nodes.push(
        <div key={`intro-${idx}`} style={{ marginTop: 6, lineHeight: 1.5 }}>
          {line}
        </div>
      );
    });

    parsed.sessions.forEach((session, idx) => {
      const titleText = session.title;
      const parts = titleText.split(":");
      const sessionLabel = parts[0]?.trim();
      const sessionTitle = parts.slice(1).join(":").trim();
      const matched = pendingMap.get(normalizeSessionTitle(session.title));

      nodes.push(
        <div
          key={`card-${idx}`}
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #e2e8f0",
            boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
            borderLeft: "4px solid #3C46B8",
            animation: "coachCardIn 420ms ease-out both",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "linear-gradient(90deg, #3C46B8 0%, #2563eb 100%)",
              marginBottom: 10,
            }}
          />
          <div style={titleTextStyle}>
            <span style={{ fontSize: 18 }}>🏁</span>
            {sessionLabel && <span style={badgeStyle}>{sessionLabel}</span>}
            <span>{sessionTitle || titleText}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {session.items.map((item, itemIdx) => (
              <div
                key={`card-item-${idx}-${itemIdx}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <span style={{ width: 20, color: lineAccent(item) }}>
                  {emojiForLine(item)}
                </span>
                <span style={{ lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          {matched?.products?.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Produits suggérés
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {resolveProducts(matched.products).map((p) => (
                  <a
                    key={p.id}
                    href={`/shop/${p.id}`}
                    style={{
                      textDecoration: "none",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1e40af",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {matched && (
            <button
              onClick={() => addSingleSessionToProgram(matched)}
              style={{
                marginTop: 10,
                background: "#3C46B8",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Ajouter cette séance
            </button>
          )}
        </div>
      );
    });

    parsed.outro.forEach((line, idx) => {
      nodes.push(
        <div key={`outro-${idx}`} style={{ marginTop: 8, lineHeight: 1.5 }}>
          {line}
        </div>
      );
    });

    return nodes;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <style jsx global>{`
        @keyframes coachCardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Coach IA</h1>

        <button
          onClick={newConversation}
          style={{
            background: "#e5e7eb",
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Nouvelle conversation
        </button>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 20,
          height: 520,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                maxWidth: "75%",
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                    : "linear-gradient(180deg, #f1f5f9 0%, #eef2ff 100%)",
                color: m.role === "user" ? "white" : "black",
                whiteSpace: "pre-wrap",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                boxShadow:
                  m.role === "user"
                    ? "0 6px 16px rgba(79,70,229,0.25)"
                    : "0 6px 16px rgba(15,23,42,0.08)",
              }}
            >
              <b style={{ letterSpacing: 0.2 }}>
                {m.role === "user" ? "Toi" : "Coach"}
              </b>
              <br />
              {m.role === "assistant" ? (
                <div style={{ marginTop: 6 }}>{renderCoachContent(m.content)}</div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && <div>Coach écrit…</div>}
      </div>

      {pendingSessions.length > 0 && (
        <button
          onClick={addSessionsToProgram}
          style={{
            marginTop: 16,
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Ajouter ces séances
        </button>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Écris ton message..."
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={send}
          style={{
            padding: "14px 20px",
            borderRadius: 12,
            background: "#4f46e5",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
