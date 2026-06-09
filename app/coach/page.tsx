"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cleanWorkoutText,
  sanitizeWorkoutStep,
  WorkoutSession,
  WorkoutStep,
} from "@/lib/workout";
import { loadProfile, profileToContext } from "@/lib/profile";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

function CoachAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <div className={`coach-avatar ${speaking ? "coach-avatar--speaking" : ""}`} aria-hidden="true">
      <span>A</span>
      {speaking && <i className="voice-ring ring-one" />}
    </div>
  );
}

function buildGreeting(profile: ReturnType<typeof loadProfile>, lastFeedback?: string): string {
  const name = profile.name ? ` ${profile.name}` : "";
  if (lastFeedback === "trop_dur") {
    return `Salut${name} ! J'ai vu que la dernière séance t'a bien mis à l'épreuve. On va ajuster ça. Comment tu te sens aujourd'hui ?`;
  }
  if (lastFeedback === "facile") {
    return `Salut${name} ! La dernière séance était trop facile — c'est bon signe, tu progresses. On monte d'un cran ?`;
  }
  if (lastFeedback === "ok" || lastFeedback === "dur") {
    return `Salut${name} ! Content de te retrouver. Tu veux qu'on attaque une nouvelle séance, ou tu as quelque chose de précis en tête ?`;
  }
  if (profile.name) {
    return `Salut ${profile.name} ! Je suis Alex, ton coach. Dis-moi ce qu'on fait aujourd'hui — objectif, durée, ce que tu as envie de travailler.`;
  }
  return "Salut ! Je suis Alex, ton coach personnel. Dis-moi ton objectif, ton niveau et le temps dont tu disposes — je construis la séance pour toi.";
}

function MessageContent({ content }: { content: string }) {
  return (
    <p>
      {content
        .split(/\r?\n/)
        .map((line) => cleanWorkoutText(line))
        .filter(Boolean)
        .join("\n")}
    </p>
  );
}

export default function CoachPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<WorkoutSession[]>([]);
  const [added, setAdded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("coach_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {
        localStorage.removeItem("coach_messages");
      }
    }

    // Build personalized first message
    const profile = loadProfile();
    const sessions = JSON.parse(localStorage.getItem("program_sessions") || "[]") as Array<{ feedback?: string; done?: boolean }>;
    const lastDone = [...sessions].reverse().find((s) => s.done && s.feedback);
    const greeting = buildGreeting(profile, lastDone?.feedback);

    setMessages([{ role: "assistant", content: greeting }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, streaming, messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function persistFinal(msgs: Msg[]) {
    setMessages(msgs);
    localStorage.setItem("coach_messages", JSON.stringify(msgs));
  }

  async function send(suggestedMessage?: string) {
    const content = (suggestedMessage || input).trim();
    if (!content || loading) return;

    const userMessage: Msg = { role: "user", content };
    const nextMessages = [...messages, userMessage];

    // Show user message + empty assistant bubble immediately
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setAdded(false);
    setSuggestions([]);

    let assistantText = "";

    try {
      let savedSessions: Array<{ feedback?: string; title?: string }> = [];
      try {
        savedSessions = JSON.parse(localStorage.getItem("program_sessions") || "[]");
      } catch {
        savedSessions = [];
      }
      const feedbackSummary = savedSessions
        .filter((s) => s.feedback)
        .slice(-5)
        .map((s) => `${s.title}: ${s.feedback}`)
        .join(", ");

      const profileContext = profileToContext(loadProfile());

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, feedbackSummary, profileContext }),
      });

      if (!response.ok || !response.body) throw new Error("Coach unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data) as {
              type: string;
              text?: string;
              reply?: string;
              suggestions?: string[];
              sessions?: WorkoutSession[];
              status?: number;
              detail?: string;
            };

            if (event.type === "apierror") {
              console.error("OpenAI error", event.status, event.detail);
              const msg = `Erreur du service (${event.status ?? "?"}) : ${event.detail ?? "indisponible"}`;
              persistFinal([...nextMessages, { role: "assistant", content: msg }]);
              return;
            }

            if (event.type === "delta" && event.text) {
              assistantText += event.text;
              setMessages([...nextMessages, { role: "assistant", content: assistantText }]);
            } else if (event.type === "done") {
              const finalText = event.reply || assistantText;
              const finalMessages: Msg[] = [...nextMessages, { role: "assistant", content: finalText }];
              persistFinal(finalMessages);

              if (event.suggestions?.length) {
                setSuggestions(event.suggestions);
              }

              const generatedSessions = ((event.sessions || []) as WorkoutSession[])
                .map((session, sessionIndex) => ({
                  ...session,
                  id: `sess_${Date.now()}_${sessionIndex}`,
                  title: cleanWorkoutText(session.title || "") || `Séance ${sessionIndex + 1}`,
                  objective: cleanWorkoutText(session.objective || ""),
                  level: cleanWorkoutText(session.level || ""),
                  equipment: (session.equipment || []).map(cleanWorkoutText).filter(Boolean),
                  steps: (session.steps || [])
                    .map(sanitizeWorkoutStep)
                    .filter((step): step is WorkoutStep => Boolean(step)),
                }))
                .filter((session) => (session.steps?.length || 0) >= 5);
              setPendingSessions(generatedSessions);
            }
          } catch {
            // ignore individual event parse errors
          }
        }
      }
    } catch (err) {
      console.error("Coach send error:", err);
      const detail = err instanceof Error ? err.message : String(err);
      const errMsg = `Je n'arrive pas à joindre le service pour le moment (${detail}). Réessaie dans un instant.`;
      persistFinal([...nextMessages, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  function addSessions() {
    if (!pendingSessions.length) return;
    const previous = JSON.parse(localStorage.getItem("program_sessions") || "[]");
    localStorage.setItem("program_sessions", JSON.stringify([...previous, ...pendingSessions]));
    setAdded(true);
    setPendingSessions([]);
    setSuggestions([]);
  }

  function newConversation() {
    const profile = loadProfile();
    const firstMessage: Msg = {
      role: "assistant",
      content: profile.name
        ? `On repart de zéro, ${profile.name}. Qu'est-ce qu'on fait aujourd'hui ?`
        : "On repart de zéro. Quel objectif veux-tu travailler aujourd'hui ?",
    };
    localStorage.removeItem("coach_messages");
    setMessages([firstMessage]);
    setPendingSessions([]);
    setAdded(false);
    setSuggestions([]);
  }

  const showQuickPrompts = messages.length === 1 && !loading;
  const isLastMessageAssistant = messages[messages.length - 1]?.role === "assistant";

  return (
    <main className="page-shell coach-page">
      <section className="coach-header">
        <div>
          <span className="eyebrow">Coach personnel</span>
          <h1>Alex, ton coach</h1>
          <p>{"Un échange naturel, puis je te guide à la voix pendant l'effort."}</p>
        </div>
        <button onClick={newConversation} className="new-convo-button">Nouvelle discussion</button>
      </section>

      <section className="chat-panel">
        <div className="chat-status">
          <CoachAvatar />
          <div>
            <strong>Alex — Coach Decathlon</strong>
            <span><i /> Disponible maintenant</span>
          </div>
        </div>

        <div className="messages">
          {messages.map((message, index) => {
            const isStreaming = streaming && index === messages.length - 1 && message.role === "assistant";
            return (
              <div className={`message-row ${message.role}`} key={`${message.role}_${index}`}>
                {message.role === "assistant" && (
                  <CoachAvatar speaking={isStreaming} />
                )}
                <div className={`message-bubble ${isStreaming && !message.content ? "typing" : ""}`}>
                  {isStreaming && !message.content ? (
                    <><i /><i /><i /></>
                  ) : (
                    <>
                      <span>{message.role === "user" ? "Toi" : "Alex"}</span>
                      <MessageContent content={message.content} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {showQuickPrompts && (
          <div className="quick-prompts">
            <button onClick={() => send("Je veux reprendre le sport progressivement, 3 fois par semaine.")}>
              Reprendre doucement
            </button>
            <button onClick={() => send("Prépare-moi une séance cardio de 25 minutes sans matériel.")}>
              Cardio 25 min
            </button>
            <button onClick={() => send("Je veux me renforcer à la maison, niveau débutant.")}>
              Renforcement maison
            </button>
          </div>
        )}

        {suggestions.length > 0 && isLastMessageAssistant && !loading && (
          <div className="coach-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setSuggestions([]); send(s); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="composer">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Dis-moi ce que tu veux travailler…"
            rows={1}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Envoyer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </section>

      {pendingSessions.length > 0 && (
        <section className="generated-sessions">
          <div>
            <span className="eyebrow">Programme prêt</span>
            <h2>{pendingSessions.length} séance{pendingSessions.length > 1 ? "s" : ""} à ajouter</h2>
            <p>
              Chaque exercice comprend une démonstration, des repères techniques,
              un chrono et une consigne vocale naturelle.
            </p>
          </div>
          <button className="primary-button" onClick={addSessions}>
            Ajouter au programme
          </button>
        </section>
      )}

      {added && (
        <section className="added-banner">
          <span>Programme ajouté.</span>
          <button onClick={() => router.push("/program")}>Voir mes séances</button>
        </section>
      )}

      <p className="health-note">
        {"Adapte toujours l'effort à ton état de forme. En cas de douleur inhabituelle, arrête la séance."}
      </p>
    </main>
  );
}
