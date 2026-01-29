"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type SessionBlock = {
  id: string;
  title: string;
  content: string;
};

function isTrainingContent(text: string) {
  const t = text.toLowerCase();

  const markers = [
    "échauffement",
    "circuit",
    "séries",
    "répétitions",
    "tours",
    "repos",
    "retour au calme",
  ];

  return markers.filter(m => t.includes(m)).length >= 2;
}

function extractRealSessions(text: string): SessionBlock[] {
  const parts = text.split(/Séance\s+\d+/i);

  const matches = text.match(/Séance\s+\d+/gi) || [];

  const sessions: SessionBlock[] = [];

  for (let i = 1; i < parts.length; i++) {
    const body = parts[i].trim();

    if (!isTrainingContent(body)) continue; // ✅ filtre critique

    sessions.push({
      id: `sess_${Date.now()}_${i}`,
      title: matches[i - 1],
      content: body,
    });
  }

  return sessions;
}

export default function CoachPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessionBlock[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("coach_messages");
    if (saved) setMessages(JSON.parse(saved));
    else
      setMessages([
        {
          role: "assistant",
          content: "Salut 👋 Quel est ton objectif ?",
        },
      ]);
  }, []);

  function persist(msgs: Msg[]) {
    setMessages(msgs);
    localStorage.setItem("coach_messages", JSON.stringify(msgs));
  }

  async function send() {
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: "user", content: input }];
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
      const reply = data.content;

      const updated = [...newMsgs, { role: "assistant", content: reply }];
      persist(updated);

      // ✅ extraction robuste
      const sessions = extractRealSessions(reply);
      setPendingSessions(sessions);

    } catch {
      persist([
        ...newMsgs,
        { role: "assistant", content: "Erreur IA." },
      ]);
    }

    setLoading(false);
  }

  function addSessions() {
    if (pendingSessions.length === 0) return;

    const prev = JSON.parse(localStorage.getItem("program_sessions") || "[]");

    localStorage.setItem(
      "program_sessions",
      JSON.stringify([...prev, ...pendingSessions])
    );

    alert("Séances ajoutées ✅");
    setPendingSessions([]);
  }

  function newConversation() {
    localStorage.removeItem("coach_messages");
    setMessages([
      { role: "assistant", content: "Nouvelle discussion 👋 Objectif ?" },
    ]);
    setPendingSessions([]);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Coach IA</h1>
        <button
          onClick={newConversation}
          style={{
            background: "#e5e7eb",
            border: "none",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Nouvelle conversation
        </button>
      </div>

      <div style={{
        border: "1px solid #ddd",
        borderRadius: 16,
        padding: 20,
        height: 500,
        overflowY: "auto",
        background: "#f7f8fb",
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 14,
          }}>
            <div style={{
              padding: 14,
              borderRadius: 14,
              maxWidth: "70%",
              background: m.role === "user" ? "#4f46e5" : "#e5e7eb",
              color: m.role === "user" ? "white" : "black",
              whiteSpace: "pre-wrap",
            }}>
              <b>{m.role === "user" ? "Toi" : "Coach"}</b><br />
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div>Coach écrit…</div>}
      </div>

      {pendingSessions.length > 0 && (
        <button
          onClick={addSessions}
          style={{
            marginTop: 16,
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ajouter ces séances au programme
        </button>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Écris ton message..."
          style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid #ccc" }}
        />
        <button onClick={send}
          style={{
            padding: "14px 20px",
            borderRadius: 12,
            background: "#4f46e5",
            color: "white",
            border: "none",
          }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
