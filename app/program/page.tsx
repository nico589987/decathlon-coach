"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { products as allProducts } from "../data/decathlon_products";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

type Session = {
  id: string;
  title: string;
  content: string;
  done?: boolean;
  feedback?: "facile" | "ok" | "dur" | "trop_dur";
  completedAt?: string;
  plannedAt?: string;
  products?: string[];
  sections?: { label: string; items: string[] }[];
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function parseSessionLines(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines
    .map((line) => line.replace(/^(?:-|•)\s?/, "").trim())
    .filter((line) => line.length > 0);
}

function emojiForItem(_text: string) {
  return "•";
}

const PROGRAM_UPDATED_KEY = "program_sessions_updated_at";

type UserSex = "female" | "male" | "unknown";

function normalizeUserSex(value?: string): UserSex {
  const normalized = normalizeText(value || "");
  if (
    normalized.includes("femme") ||
    normalized.includes("women") ||
    normalized.includes("female")
  ) {
    return "female";
  }
  if (
    normalized.includes("homme") ||
    normalized.includes("men") ||
    normalized.includes("male")
  ) {
    return "male";
  }
  return "unknown";
}

function detectProductGender(product: (typeof allProducts)[number]) {
  const hay = normalizeText(
    `${product.name} ${product.description} ${product.categoryLabel} ${product.badge}`
  );
  const isFemale =
    hay.includes("femme") ||
    hay.includes("women") ||
    hay.includes("woman") ||
    hay.includes("female") ||
    hay.includes("girls");
  const isMale =
    hay.includes("homme") ||
    hay.includes("men") ||
    hay.includes("man") ||
    hay.includes("male") ||
    hay.includes("boys");
  if (isFemale && !isMale) return "female";
  if (isMale && !isFemale) return "male";
  return "unisex";
}

function allowBySex(product: (typeof allProducts)[number], userSex: UserSex) {
  if (userSex === "female") return detectProductGender(product) !== "male";
  if (userSex === "male") return detectProductGender(product) !== "female";
  return true;
}
const SECTION_ORDER = [
  "Échauffement",
  "Exercices",
  "Course à pied",
  "Retour au calme",
  "Étirements",
  "Conseils",
];

const SECTION_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  "Échauffement": { label: "Échauffement", color: "#f59e0b", bg: "#fef3c7" },
  "Exercices": { label: "Exercices", color: "#1d4ed8", bg: "#dbeafe" },
  "Course à pied": { label: "Course à pied", color: "#16a34a", bg: "#dcfce7" },
  "Retour au calme": { label: "Retour au calme", color: "#0f766e", bg: "#ccfbf1" },
  "Étirements": { label: "Étirements", color: "#0891b2", bg: "#cffafe" },
  "Conseils": { label: "Conseils", color: "#7c3aed", bg: "#ede9fe" },
};

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
  if (t.includes("gourde") || t.includes("bouteille") || t.includes("hydrat")) {
    addCategory("Hydratation");
  }
  if (t.includes("montre") || t.includes("watch")) {
    addCategory("Montres");
  }
  if (t.includes("gants") || t.includes("gloves")) {
    addCategory("Gants");
  }

  return categories;
}

function detectSection(normalized: string) {
  if (normalized.includes("echauffement")) return "Échauffement";
  if (normalized.includes("retour au calme")) return "Retour au calme";
  if (normalized.includes("etirements")) return "Étirements";
  if (
    normalized.includes("course") ||
    normalized.includes("running") ||
    normalized.includes("footing") ||
    normalized.includes("fractionne") ||
    normalized.includes("endurance")
  ) {
    return "Course à pied";
  }
  if (
    normalized.includes("exercices") ||
    normalized.includes("circuit") ||
    normalized.includes("series") ||
    normalized.includes("renforcement") ||
    normalized.includes("cardio")
  ) {
    return "Exercices";
  }
  if (
    normalized.includes("conseils") ||
    normalized.includes("astuce") ||
    normalized.includes("note")
  ) {
    return "Conseils";
  }
  return null;
}

function groupSessionItems(lines: string[]) {
  const groups: {
    key: string;
    label: string;
    color: string;
    bg: string;
    items: string[];
  }[] = [];
  let currentLabel: string = "Exercices";

  lines.forEach((item) => {
    const cleaned = item.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
    if (!cleaned || cleaned === "--" || cleaned === "-") return;
    const normalized = normalizeText(cleaned);
    const detected = detectSection(normalized);
    if (detected) {
      currentLabel = detected;
      const isExerciseHeader =
        normalized.includes("circuit") ||
        normalized.includes("series") ||
        normalized.includes("exercices");
      const splitIndex = cleaned.indexOf(":");
      const trailing =
        splitIndex >= 0 ? cleaned.slice(splitIndex + 1).trim() : "";
      if (trailing) {
        const style =
          SECTION_STYLES[currentLabel] || SECTION_STYLES["Exercices"];
        let group = groups.find((g) => g.label === style.label);
        if (!group) {
          group = {
            key: style.label.toLowerCase().replace(/\s+/g, "_"),
            label: style.label,
            color: style.color,
            bg: style.bg,
            items: [],
          };
          groups.push(group);
        }
        group.items.push(trailing);
      }
      if (!isExerciseHeader && !trailing) return;
    }

    const style = SECTION_STYLES[currentLabel] || SECTION_STYLES["Exercices"];
    let group = groups.find((g) => g.label === style.label);
    if (!group) {
      group = {
        key: style.label.toLowerCase().replace(/\s+/g, "_"),
        label: style.label,
        color: style.color,
        bg: style.bg,
        items: [],
      };
      groups.push(group);
    }
    if (normalizeText(cleaned) === normalizeText(style.label)) return;
    group.items.push(cleaned);
  });

  return groups.sort(
    (a, b) => SECTION_ORDER.indexOf(a.label) - SECTION_ORDER.indexOf(b.label)
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

function cleanSessionTitle(title: string) {
  return title
    .replace(/^\s*(?:Séance|Seance)\s*\d+\s*:\s*/i, "")
    .replace(/^\s*(?:Séance|Seance)\s*:\s*/i, "");
}
function extractDuration(title: string, content: string) {
  const combined = `${title} ${content}`;
  const match = combined.match(/(\d+\s*(?:min|minutes))/i);
  if (!match) return null;
  return match[1];
}

export default function ProgramPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbackTarget, setFeedbackTarget] = useState<Session | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [profileInfo, setProfileInfo] = useState<{
    name: string;
    goal: string;
    level: string;
    location: string;
  }>({ name: "", goal: "", level: "", location: "" });
  const [userSex, setUserSex] = useState<UserSex>("unknown");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("program_sessions");
    const localUpdatedRaw = localStorage.getItem(PROGRAM_UPDATED_KEY);
    const localUpdatedAt = localUpdatedRaw ? Date.parse(localUpdatedRaw) : 0;
    if (raw) {
      const parsed: Session[] = JSON.parse(raw);
      setSessions(parsed);
      setCollapsedMap((prev) => {
        const next = { ...prev };
        parsed.forEach((s) => {
          if (s.done && next[s.id] === undefined) next[s.id] = true;
        });
        return next;
      });
    }

    if (!supabaseConfigured) return;

    const syncFromSupabase = async (userId: string) => {
      const { data: row } = await supabase
        .from("user_programs")
        .select("sessions, updated_at")
        .eq("id", userId)
        .maybeSingle();
      if (!row) return;
      const remoteUpdatedAt = row.updated_at ? Date.parse(row.updated_at) : 0;
      if (remoteUpdatedAt > localUpdatedAt) {
        const remoteSessions = Array.isArray(row.sessions) ? row.sessions : [];
        setSessions(remoteSessions as Session[]);
        localStorage.setItem("program_sessions", JSON.stringify(remoteSessions));
        localStorage.setItem(PROGRAM_UPDATED_KEY, row.updated_at);
      }
    };

    let activeUserId: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id || null;
      activeUserId = userId;
      setSessionUserId(userId);
      if (!userId) return;
      syncFromSupabase(userId);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || null;
      activeUserId = userId;
      setSessionUserId(userId);
      if (!userId) return;
      syncFromSupabase(userId);
    });

    const interval = setInterval(() => {
      if (!activeUserId) return;
      syncFromSupabase(activeUserId);
    }, 15000);

    const handleFocus = () => {
      if (!activeUserId) return;
      syncFromSupabase(activeUserId);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user_profile");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        name?: string;
        goal?: string;
        level?: string;
        location?: string;
      };
      setProfileInfo({
        name: parsed.name || "",
        goal: parsed.goal || "",
        level: parsed.level || "",
        location: parsed.location || "",
      });
    } catch {
      setProfileInfo({ name: "", goal: "", level: "", location: "" });
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user_profile");
    if (!raw) return;
    try {
      const profile = JSON.parse(raw) as { sex?: string };
      setUserSex(normalizeUserSex(profile.sex));
    } catch {
      setUserSex("unknown");
    }
  }, []);

  function save(list: Session[]) {
    setSessions(list);
    localStorage.setItem("program_sessions", JSON.stringify(list));
    const updatedAt = new Date().toISOString();
    localStorage.setItem(PROGRAM_UPDATED_KEY, updatedAt);
    if (!supabaseConfigured || !sessionUserId) return;
    supabase
      .from("user_programs")
      .upsert({
        id: sessionUserId,
        sessions: list,
        updated_at: updatedAt,
      })
      .then(() => {
        // silent: local storage remains source of truth
      });
  }

  function markDone(s: Session) {
    setFeedbackTarget(s);
  }

  function applyFeedback(level: Session["feedback"]) {
    if (!feedbackTarget) return;

    const updated = sessions.map((s) =>
      s.id === feedbackTarget.id
        ? {
            ...s,
            done: true,
            feedback: level,
            completedAt: new Date().toISOString(),
          }
        : s
    );

    save(updated);
    setCollapsedMap((prev) => ({ ...prev, [feedbackTarget.id]: true }));
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
    setCollapsedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    save(updated);
    setCollapsedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function getProductLinks(items: string[]) {
    const byId = new Map(allProducts.map((p) => [normalizeText(p.id), p]));
    const byName = new Map(allProducts.map((p) => [normalizeText(p.name), p]));
    const byCategory = new Map(
      allProducts.map((p) => [normalizeText(p.categoryLabel), p])
    );
    const results: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    function add(p: (typeof allProducts)[number] | undefined) {
      if (!p || seen.has(p.id)) return;
      if (!allowBySex(p, userSex)) return;
      seen.add(p.id);
      results.push({ id: p.id, label: p.name });
    }

    items.forEach((item) => {
      const key = normalizeText(item);
      add(byId.get(key));
      add(byName.get(key));
      add(byCategory.get(key));
      const partial = allProducts.find(
        (p) =>
          normalizeText(p.name).includes(key) ||
          normalizeText(p.categoryLabel).includes(key)
      );
      add(partial);
    });

    return results;
  }

  const doneCount = sessions.filter((s) => s.done).length;
  const totalCount = sessions.length;
  const orderMap = new Map(sessions.map((s, index) => [s.id, index]));

  return (
    <div
      className="page-program"
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
          {"📘"}
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
      {(profileInfo.name || profileInfo.goal || profileInfo.level || profileInfo.location) && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)",
            border: "1px solid #c7d2fe",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>
            {profileInfo.name ? `Bon retour, ${profileInfo.name} 👋` : "Ton objectif en un coup d'œil"}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            {profileInfo.goal ? `Objectif : ${profileInfo.goal}. ` : ""}
            {profileInfo.level ? `Niveau : ${profileInfo.level}. ` : ""}
            {profileInfo.location ? `Lieu : ${profileInfo.location}.` : ""}
          </div>
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
        .program-moved {
          animation: moveDown 520ms ease;
        }
        @keyframes donePulse {
          0% {
            transform: scale(0.98);
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }
          60% {
            transform: scale(1.01);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        @keyframes moveDown {
          0% {
            transform: translateY(-6px);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      {sessions.length === 0 && (
        <p style={{ opacity: 0.6 }}>Aucune séance ajoutée pour l’instant.</p>
      )}

      {(() => {
        const pending = sessions.filter((s) => !s.done);
        const completed = sessions.filter((s) => s.done);
        const renderCard = (
          s: Session,
          moved?: boolean,
          showDate?: boolean
        ) => {
          const completedLabel =
            s.completedAt && s.done && showDate
              ? new Date(s.completedAt).toLocaleDateString("fr-FR")
              : null;
          const isCollapsed = Boolean(collapsedMap[s.id]);
          const durationLabel = extractDuration(s.title, s.content);
          const displayIndex = orderMap.has(s.id)
            ? (orderMap.get(s.id) as number)
            : undefined;
          return (
          <div
            key={s.id}
            className={`program-card${moved ? " program-moved" : ""}`}
            onClick={() => {
              if (isCollapsed) {
                setCollapsedMap((prev) => ({ ...prev, [s.id]: false }));
              }
            }}
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
            <button
              className="program-delete"
              onClick={(event) => {
                event.stopPropagation();
                deleteSession(s.id);
              }}
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10,
                marginTop: 4,
              }}
            >
          <h3 style={{ margin: 0 }}>
            {typeof displayIndex === "number"
              ? `Séance ${displayIndex + 1} : `
              : ""}
            {cleanSessionTitle(s.title)}
          </h3>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCollapsedMap((prev) => ({
                    ...prev,
                    [s.id]: !prev[s.id],
                  }));
                }}
                style={{
                  marginLeft: 6,
                  borderRadius: 999,
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                {isCollapsed ? "Afficher" : "Réduire"}
              </button>
              {completedLabel && !isCollapsed && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0f172a",
                    background: "#e2e8f0",
                    border: "1px solid #cbd5f5",
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  Fait le {completedLabel}
                </span>
              )}
            </div>
            {isCollapsed ? (
              <div style={{ marginTop: 8, color: "#475569", fontSize: 14 }}>
                {durationLabel && (
                  <div style={{ marginBottom: 4 }}>
                    Durée : <strong>{durationLabel}</strong>
                  </div>
                )}
                {completedLabel && <div>Fait le {completedLabel}</div>}
              </div>
            ) : (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  lineHeight: 1.5,
                  color: "#111827",
                }}
              >
                {(s.sections && s.sections.length > 0
                  ? s.sections.map((section) => {
                      const style =
                        SECTION_STYLES[section.label] ||
                        SECTION_STYLES["Exercices"];
                      return {
                        key: section.label.toLowerCase().replace(/\s+/g, "_"),
                        label: section.label,
                        items: section.items,
                        color: style.color,
                        bg: style.bg,
                      };
                    })
                  : groupSessionItems(parseSessionLines(s.content))
                ).map((group) => (
                  <li
                    key={`${s.id}-${group.label
                      .toLowerCase()
                      .replace(/\s+/g, "_")}`}
                    style={{ marginBottom: 12 }}
                  >
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
                    {group.label === "Conseils" ? (
                      <div
                        style={{
                          marginTop: 4,
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "rgba(124,58,237,0.08)",
                          border: "1px solid rgba(124,58,237,0.2)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 700,
                            color: "#5b21b6",
                            marginBottom: 6,
                          }}
                        >
                          💡 Conseils du coach
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
                              <span style={{ width: 20 }}>•</span>
                              <span style={{ lineHeight: 1.5 }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
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
                            <span style={{ width: 20 }}>
                              {emojiForItem(item)}
                            </span>
                            <span style={{ lineHeight: 1.5 }}>
                              {highlightItem(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!isCollapsed &&
              getProductLinks(
                s.products && s.products.length > 0
                  ? s.products
                  : suggestProducts(s.content)
              ).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Produits recommandés
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {getProductLinks(
                    s.products && s.products.length > 0
                      ? s.products
                      : suggestProducts(s.content)
                  ).map((p) => (
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

            {!isCollapsed && !s.done && (
              <button
                onClick={() => markDone(s)}
                style={{
                  marginTop: 12,
                  background:
                    "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
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

            {!isCollapsed && s.done && (
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
        );
        };

        return (
          <>
            {pending.map((s) => renderCard(s, false, false))}
            {completed.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    marginTop: 4,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>
                    Séances effectuées
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      background: "#e2e8f0",
                      border: "1px solid #cbd5f5",
                      borderRadius: 999,
                      padding: "3px 10px",
                    }}
                  >
                    {completed.length}
                  </span>
                </div>
                {completed.map((s) =>
                  renderCard(s, s.id === lastCompletedId, true)
                )}
              </div>
            )}
          </>
        );
      })()}

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
                onClick={() => applyFeedback(k as Session["feedback"])}
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







