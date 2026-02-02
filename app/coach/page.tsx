"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
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
          "Salut 👋 Je suis ton coach.\nOn construit ton programme ensemble.\n\n🎯 Quel est ton objectif ?",
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
    const blocks = text.split(/\n(?=(?:\*\*)?(?:S\u00e9ance|Seance)\s*\d+)/i);
    const sessions: SessionDraft[] = [];

    for (const block of blocks) {
      if (!/^(?:\*\*)?(?:S\u00e9ance|Seance)\s*\d+/i.test(block.trim())) continue;
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
    const t = text.toLowerCase();
    const out: string[] = [];

    if (t.includes("gainage")) out.push("Tapis fitness");
    if (t.includes("halt")) out.push("Haltères");
    if (t.includes("élastique")) out.push("Bandes élastiques");
    if (t.includes("corde")) out.push("Corde à sauter");
    if (t.includes("course")) out.push("Chaussures running");

    return out;
  }

  // ======================
  // SEND MESSAGE (TS FIX HERE)
  // ======================

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg: Msg = {
      role: "user",
      content: input,
    };

    const newMsgs: Msg[] = [...messages, userMsg]; // ✅ typed array

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

      const updated: Msg[] = [...newMsgs, assistantMsg]; // ✅ typed array

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

  // ======================
  // UI
  // ======================

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
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
                background: m.role === "user" ? "#4f46e5" : "#e5e7eb",
                color: m.role === "user" ? "white" : "black",
                whiteSpace: "pre-wrap",
              }}
            >
              <b>{m.role === "user" ? "Toi" : "Coach"}</b>
              <br />
              {m.content}
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




