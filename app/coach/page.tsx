"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { products as allProducts } from "../data/decathlon_products";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Role = "user" | "assistant";

type Msg = {
  role: Role;
  content: string;
};

type Section = {
  label: string;
  items: string[];
};

type SessionDraft = {
  id: string;
  title: string;
  content: string;
  products: string[];
  sections?: Section[];
  plannedAt?: string;
};

const STORAGE_KEY = "coach_messages_v1";
const PENDING_KEY = "coach_pending_sessions_v1";
const COACH_UPDATED_KEY = "coach_messages_updated_at";
const PROGRAM_UPDATED_KEY = "program_sessions_updated_at";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeUserSex(value?: string): "female" | "male" | "unknown" {
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

function getProfileSummary() {
  const raw = localStorage.getItem("user_profile");
  if (!raw) return "profil non défini";
  try {
    const profile = JSON.parse(raw) as {
      name?: string;
      birthDate?: string;
      weightKg?: number;
      ageRange?: string;
      weightRange?: string;
      sex?: string;
      goal?: string;
      level?: string;
      location?: string;
      equipment?: string;
      injuries?: string;
    };
    const legacyWeight =
      typeof profile.weightKg === "number"
        ? profile.weightKg
        : (() => {
            if (!profile.weightRange) return undefined;
            const match = profile.weightRange.match(/(\d+)\s*kg/);
            return match ? Number(match[1]) : undefined;
          })();
    return [
      `Prénom: ${profile.name || "?"}`,
      `Date de naissance: ${profile.birthDate || profile.ageRange || "?"}`,
      `Poids (kg): ${legacyWeight ?? "?"}`,
      `Sexe: ${profile.sex || "?"}`,
      `Objectif: ${profile.goal || "?"}`,
      `Niveau: ${profile.level || "?"}`,
      `Lieu: ${profile.location || "?"}`,
      `Matériel: ${profile.equipment || "?"}`,
      `Blessures: ${profile.injuries || "?"}`,
    ].join(" | ");
  } catch {
    return "profil non défini";
  }
}

function getProfileName() {
  const raw = localStorage.getItem("user_profile");
  if (!raw) return "";
  try {
    const profile = JSON.parse(raw) as { name?: string };
    return profile.name?.trim() || "";
  } catch {
    return "";
  }
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessionDraft[]>([]);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [userSex, setUserSex] = useState<"female" | "male" | "unknown">("unknown");
  const [injuryDetail, setInjuryDetail] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [onboardingDone, setOnboardingDone] = useState(false);
  const router = useRouter();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const lastCoachRef = useRef<HTMLDivElement | null>(null);

  // ======================
  // Load saved conversation
  // ======================
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const pendingRaw = localStorage.getItem(PENDING_KEY);
    const doneFlag = localStorage.getItem("coach_onboarding_done");

    if (raw) {
      const parsed = JSON.parse(raw) as Msg[];
      setMessages(parsed);
      if (pendingRaw) {
        try {
          setPendingSessions(JSON.parse(pendingRaw));
        } catch {
          setPendingSessions([]);
        }
      }
      if (doneFlag === "true") {
        setOnboardingDone(true);
        setOnboardingStep(onboardingQuestions.length);
      } else if (
        parsed.some((m) => m.role === "user" && m.content.includes("Résumé des infos"))
      ) {
        setOnboardingDone(true);
        setOnboardingStep(onboardingQuestions.length);
        localStorage.setItem("coach_onboarding_done", "true");
      }
      return;
    }

    const init: Msg[] = [
      {
        role: "assistant",
        content:
          `Salut${getProfileName() ? ` ${getProfileName()}` : ""} 👋 Je suis ton coach.\nOn va d'abord préciser quelques infos pour que je puisse te proposer un programme vraiment adapté.`,
      },
    ];

    setMessages(init);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    localStorage.setItem(PENDING_KEY, JSON.stringify([]));
    localStorage.setItem("coach_onboarding_done", "false");
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

  useEffect(() => {
    let isMounted = true;
    const syncProfileFromSupabase = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data: profileRow } = await supabase
        .from("profiles")
        .select(
          "name, birth_date, weight_kg, sex, goal, level, location, equipment, injuries"
        )
        .eq("id", userId)
        .maybeSingle();

      if (!profileRow || !isMounted) return;

      const existingRaw = localStorage.getItem("user_profile");
      let existing: Record<string, string> = {};
      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw) as Record<string, string>;
        } catch {
          existing = {};
        }
      }

      const merged = {
        ...existing,
        ...(profileRow.name ? { name: profileRow.name } : {}),
        ...(profileRow.birth_date ? { birthDate: profileRow.birth_date } : {}),
        ...(typeof profileRow.weight_kg === "number"
          ? { weightKg: profileRow.weight_kg }
          : {}),
        ...(profileRow.sex ? { sex: profileRow.sex } : {}),
        ...(profileRow.goal ? { goal: profileRow.goal } : {}),
        ...(profileRow.level ? { level: profileRow.level } : {}),
        ...(profileRow.location ? { location: profileRow.location } : {}),
        ...(profileRow.equipment ? { equipment: profileRow.equipment } : {}),
        ...(profileRow.injuries ? { injuries: profileRow.injuries } : {}),
      };

      localStorage.setItem("user_profile", JSON.stringify(merged));
    };

    syncProfileFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  function persist(list: Msg[]) {
    setMessages(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(PENDING_KEY, JSON.stringify(pendingSessions));
    const updatedAt = new Date().toISOString();
    localStorage.setItem(COACH_UPDATED_KEY, updatedAt);
    if (!supabaseConfigured || !sessionUserId) return;
    supabase
      .from("user_conversations")
      .upsert({
        id: sessionUserId,
        messages: list,
        pending_sessions: pendingSessions,
        onboarding_done: onboardingDone,
        updated_at: updatedAt,
      })
      .then(() => {
        // silent: keep local storage as source of truth if network fails
      });
  }

  function newConversation() {
    const name = getProfileName();
    const init: Msg[] = [
      {
        role: "assistant",
        content:
          `Nouvelle discussion 👍${name ? ` Content de te revoir, ${name}.` : ""} On commence par quelques questions rapides.`,
      },
    ];
    setPendingSessions([]);
    setOnboardingStep(0);
    setOnboardingAnswers({});
    setInjuryDetail("");
    setCustomAnswer("");
    setOnboardingDone(false);
    localStorage.setItem("coach_onboarding_done", "false");
    localStorage.setItem(PENDING_KEY, JSON.stringify([]));
    persist(init);
  }

  useEffect(() => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pendingSessions));
    const updatedAt = new Date().toISOString();
    localStorage.setItem(COACH_UPDATED_KEY, updatedAt);
    if (!supabaseConfigured || !sessionUserId) return;
    supabase
      .from("user_conversations")
      .upsert({
        id: sessionUserId,
        messages,
        pending_sessions: pendingSessions,
        onboarding_done: onboardingDone,
        updated_at: updatedAt,
      })
      .then(() => {
        // silent
      });
  }, [pendingSessions, onboardingDone, sessionUserId, messages]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const fetchConversation = async (userId: string) => {
      const { data: row } = await supabase
        .from("user_conversations")
        .select("messages, pending_sessions, onboarding_done, updated_at")
        .eq("id", userId)
        .maybeSingle();

      const localUpdatedRaw = localStorage.getItem(COACH_UPDATED_KEY);
      const localUpdatedAt = localUpdatedRaw ? Date.parse(localUpdatedRaw) : 0;
      const remoteUpdatedAt = row?.updated_at ? Date.parse(row.updated_at) : 0;

      if (row && remoteUpdatedAt > localUpdatedAt) {
        const remoteMessages = Array.isArray(row.messages) ? row.messages : [];
        const remotePending = Array.isArray(row.pending_sessions)
          ? row.pending_sessions
          : [];
        setMessages(remoteMessages as Msg[]);
        setPendingSessions(remotePending as SessionDraft[]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteMessages));
        localStorage.setItem(PENDING_KEY, JSON.stringify(remotePending));
        localStorage.setItem(COACH_UPDATED_KEY, row.updated_at);
        if (row.onboarding_done) {
          setOnboardingDone(true);
          setOnboardingStep(onboardingQuestions.length);
          localStorage.setItem("coach_onboarding_done", "true");
        }
      }
    };

    let activeUserId: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id || null;
      activeUserId = userId;
      setSessionUserId(userId);
      if (!userId) return;
      fetchConversation(userId);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || null;
      activeUserId = userId;
      setSessionUserId(userId);
      if (!userId) return;
      fetchConversation(userId);
    });

    const interval = setInterval(() => {
      if (!activeUserId) return;
      fetchConversation(activeUserId);
    }, 15000);

    const handleFocus = () => {
      if (!activeUserId) return;
      fetchConversation(activeUserId);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // ======================
  // Onboarding questions
  // ======================
  const onboardingQuestions = [
    {
      id: "objectif",
      label: "Quel est ton objectif principal ?",
      options: [
        "Perte de poids",
        "Remise en forme",
        "Performance",
        "Bien-être",
        "Autre",
      ],
    },
    {
      id: "experience",
      label: "Quel est ton niveau actuel ?",
      options: ["Débutant", "Intermédiaire", "Avancé", "Retour après pause"],
    },
    {
      id: "injuries",
      label: "As-tu des blessures ou antécédents médicaux à signaler ?",
      options: ["Non", "Oui"],
    },
    {
      id: "lieu",
      label: "Où t'entraînes-tu le plus souvent ?",
      options: ["Maison", "Salle", "Extérieur", "Mixte", "Autre"],
    },
    {
      id: "materiel",
      label: "Quel matériel as-tu à disposition ?",
      options: [
        "Aucun",
        "Tapis / élastiques",
        "Haltères",
        "Vélo / tapis de course",
        "Mixte",
        "Autre",
      ],
    },
    {
      id: "rythme",
      label: "Combien de séances par semaine veux-tu faire ?",
      options: ["1", "2", "3", "4+", "Variable"],
    },
  ];

  const activeQuestion = onboardingQuestions[onboardingStep];
  const multiSelectIds = new Set(["materiel"]);
  const isMultiSelect = activeQuestion && multiSelectIds.has(activeQuestion.id);
  const needsInjuryDetail =
    activeQuestion?.id === "injuries" &&
    onboardingAnswers.injuries === "Oui" &&
    !onboardingAnswers.injuries_detail;

  function recordAnswer(value: string) {
    if (!activeQuestion) return;
    if (multiSelectIds.has(activeQuestion.id)) {
      const current = onboardingAnswers[activeQuestion.id];
      const list = Array.isArray(current) ? current : [];
      const exists = list.includes(value);
      const nextList = exists
        ? list.filter((item) => item !== value)
        : [...list, value];
      setOnboardingAnswers({ ...onboardingAnswers, [activeQuestion.id]: nextList });
      setCustomAnswer("");
      return;
    }
    const next = { ...onboardingAnswers, [activeQuestion.id]: value };
    setOnboardingAnswers(next);
    setCustomAnswer("");
    if (activeQuestion.id === "injuries") {
      if (value === "Oui") {
        setInjuryDetail("");
        const cleared = { ...next };
        delete cleared.injuries_detail;
        setOnboardingAnswers(cleared);
        return;
      }
    }
    if (value === "Autre") return;
    setOnboardingStep((prev) => prev + 1);
  }

  function submitInjuryDetail() {
    if (!injuryDetail.trim()) return;
    const next = {
      ...onboardingAnswers,
      injuries_detail: injuryDetail.trim(),
    };
    setOnboardingAnswers(next);
    setOnboardingStep((prev) => prev + 1);
  }

  function submitCustomAnswer() {
    if (!customAnswer.trim()) return;
    if (activeQuestion && multiSelectIds.has(activeQuestion.id)) {
      const current = onboardingAnswers[activeQuestion.id];
      const list = Array.isArray(current) ? current : [];
      const nextList = list.filter((item) => item !== "Autre");
      setOnboardingAnswers({
        ...onboardingAnswers,
        [activeQuestion.id]: [...nextList, customAnswer.trim()],
      });
      setCustomAnswer("");
      return;
    }
    recordAnswer(customAnswer.trim());
  }

  function getAnswerDisplay(value: string | string[] | undefined) {
    if (!value) return "?";
    if (Array.isArray(value)) return value.join(", ");
    return value;
  }

  function goNextFromMultiSelect() {
    if (!activeQuestion) return;
    const value = onboardingAnswers[activeQuestion.id];
    if (Array.isArray(value) && value.length === 0) return;
    setOnboardingStep((prev) => prev + 1);
  }

  async function finishOnboarding() {
    const summary = [
      "Résumé des infos :",
      `- Objectif : ${getAnswerDisplay(onboardingAnswers.objectif)}`,
      `- Niveau : ${getAnswerDisplay(onboardingAnswers.experience)}`,
      `- Blessures : ${getAnswerDisplay(onboardingAnswers.injuries)}`,
      onboardingAnswers.injuries === "Oui"
        ? `- Détails blessures : ${onboardingAnswers.injuries_detail || "non précisé"}`
        : null,
      `- Lieu : ${getAnswerDisplay(onboardingAnswers.lieu)}`,
      `- Matériel : ${getAnswerDisplay(onboardingAnswers.materiel)}`,
      `- Rythme : ${getAnswerDisplay(onboardingAnswers.rythme)} séances/sem`,
    ]
      .filter(Boolean)
      .join("\n");
    const existingRaw = localStorage.getItem("user_profile");
    let existingProfile: {
      name?: string;
      birthDate?: string;
      weightKg?: number;
      sex?: string;
    } = {};
    if (existingRaw) {
      try {
        existingProfile = JSON.parse(existingRaw) as {
          name?: string;
          birthDate?: string;
          weightKg?: number;
          sex?: string;
        };
      } catch {
        existingProfile = {};
      }
    }
    const profileFromAnswers = {
      name: existingProfile.name || "",
      birthDate: existingProfile.birthDate || "",
      weightKg: existingProfile.weightKg ?? 70,
      sex: existingProfile.sex || "Homme",
      goal: String(getAnswerDisplay(onboardingAnswers.objectif)),
      level: String(getAnswerDisplay(onboardingAnswers.experience)),
      location: String(getAnswerDisplay(onboardingAnswers.lieu)),
      equipment: String(getAnswerDisplay(onboardingAnswers.materiel)),
      injuries:
        onboardingAnswers.injuries === "Oui"
          ? String(onboardingAnswers.injuries_detail || "Blessure non précisée")
          : "Aucune",
    };
    localStorage.setItem("user_profile", JSON.stringify(profileFromAnswers));
    setUserSex(normalizeUserSex(profileFromAnswers.sex));
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        name: profileFromAnswers.name,
        birth_date: profileFromAnswers.birthDate || null,
        weight_kg: profileFromAnswers.weightKg,
        sex: profileFromAnswers.sex,
        goal: profileFromAnswers.goal,
        level: profileFromAnswers.level,
        location: profileFromAnswers.location,
        equipment: profileFromAnswers.equipment,
        injuries: profileFromAnswers.injuries,
        updated_at: new Date().toISOString(),
      });
    }
    const userMsg: Msg = { role: "user", content: summary };
    const newMsgs: Msg[] = [...messages, userMsg];
    persist(newMsgs);
    setOnboardingDone(true);
    localStorage.setItem("coach_onboarding_done", "true");

    try {
      const programRaw = localStorage.getItem("program_sessions");
      const programSessions: {
        title: string;
        done?: boolean;
        feedback?: "facile" | "ok" | "dur" | "trop_dur";
        completedAt?: string;
      }[] = programRaw ? JSON.parse(programRaw) : [];
      const completed = programSessions.filter((s) => s.done);
      const feedbackOrder: Record<string, number> = {
        facile: 1,
        ok: 2,
        dur: 3,
        trop_dur: 4,
      };
      const sorted = completed
        .slice()
        .sort((a, b) => {
          const aTime = a.completedAt ? Date.parse(a.completedAt) : 0;
          const bTime = b.completedAt ? Date.parse(b.completedAt) : 0;
          return aTime - bTime;
        });
      const lastTen = sorted.slice(-10);
      const formatDate = (value?: string) => {
        if (!value) return "date inconnue";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "date inconnue";
        return d.toLocaleDateString("fr-FR");
      };
      const trendBase = lastTen
        .filter((s) => s.feedback)
        .slice(-3)
        .map((s) => feedbackOrder[s.feedback as string])
        .filter((v) => typeof v === "number");
      let trendNote = "";
      if (trendBase.length === 3) {
        if (trendBase[2] < trendBase[0]) {
          trendNote = "Tendance récente: amélioration (effort perçu en baisse).";
        } else if (trendBase[2] > trendBase[0]) {
          trendNote = "Tendance récente: séance perçue plus difficile.";
        } else {
          trendNote = "Tendance récente: stable.";
        }
      }
      const feedbackSummary =
        lastTen.length === 0
          ? "aucune séance effectuée"
          : lastTen
              .map(
                (s) =>
                  `${formatDate(s.completedAt)} — ${s.title} → ${
                    s.feedback || "non notée"
                  }`
              )
              .join(" | ");
      const feedbackContext = trendNote
        ? `${feedbackSummary} | ${trendNote}`
        : feedbackSummary;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          feedbackSummary: feedbackContext,
          profileSummary: getProfileSummary(),
        }),
      });
      const data = await res.json();
      const reply: string = data.content || "";
      const assistantMsg: Msg = { role: "assistant", content: reply };
      const updated: Msg[] = [...newMsgs, assistantMsg];
      persist(updated);
      const sessions = extractRealSessions(reply);
      setPendingSessions(sessions);
    } catch {
      const errMsg: Msg = {
        role: "assistant",
        content: "Oups — erreur IA.",
      };
      persist([...newMsgs, errMsg]);
    }
  }
  // ======================
  // Extract sessions safely
  // ======================
  function trimSessionContent(block: string) {
    return block.trim();
  }

  function extractSectionsFromBlock(block: string): Section[] {
    const lines = block.split("\n").map((line) => line.trim());
    const allowed = [
      "Échauffement",
      "Exercices",
      "Course à pied",
      "Retour au calme",
      "Étirements",
      "Conseils",
    ];
    const normalizeLabel = (value: string) => {
      const cleaned = value
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/:$/, "")
        .trim();
      const normalized = normalizeText(cleaned);
      if (normalized.startsWith("echauffement")) return "Échauffement";
      if (normalized.startsWith("exercices")) return "Exercices";
      if (
        normalized.startsWith("course a pied") ||
        normalized.startsWith("course") ||
        normalized.startsWith("running")
      ) {
        return "Course à pied";
      }
      if (normalized.startsWith("retour au calme")) return "Retour au calme";
      if (normalized.startsWith("etirements")) return "Étirements";
      if (normalized.startsWith("conseils")) return "Conseils";
      return null;
    };
    const sections: Section[] = [];
    let current: Section | null = null;
    const hasItems = (value: Section | null): value is Section =>
      Boolean(value && value.items.length > 0);

    lines.forEach((line, idx) => {
      if (!line) return;
      if (idx === 0 && /^(?:\*\*)?(?:Séance|Seance)\b/i.test(line)) return;
      const label = normalizeLabel(line);
      if (label) {
        if (hasItems(current)) sections.push(current);
        current = { label, items: [] };
        return;
      }
      if (!current) return;
      const cleaned = line.replace(/^[-•]\s?/, "").trim();
      if (!cleaned || cleaned === "--" || cleaned === "-") return;
      current.items.push(cleaned);
    });

    if (hasItems(current)) sections.push(current);
    return sections.filter((s) => allowed.includes(s.label));
  }

  function extractRealSessions(text: string): SessionDraft[] {
    const blocks = text
      .split(/\n(?=(?:\*\*)?(?:Séance|Seance)\s*:?)/i)
      .map((block) => block.trim())
      .filter(Boolean);
    const sessions: SessionDraft[] = [];
    for (const block of blocks) {
      if (!/^(?:\*\*)?(?:Séance|Seance)\s*:?/i.test(block)) continue;
      const lines = block.split("\n").map((line) => line.trim());
      const firstLine = lines[0]
        ?.replace(/^\*\*/, "")
        .replace(/\*\*$/, "")
        .replace(/^Séance\s*:\s*/i, "") ?? "";
      const normalizedTitle = normalizeText(firstLine);
      const sectionTitles = [
        "echauffement",
        "exercices",
        "course a pied",
        "retour au calme",
        "etirements",
        "conseils",
      ];
      if (sectionTitles.includes(normalizedTitle)) continue;
      if (block.length < 60) continue;
      const sections = extractSectionsFromBlock(block);
      if (sections.length === 0) continue;
      sessions.push({
        id: crypto.randomUUID(),
        title: firstLine.replace(/\*\*/g, ""),
        content: trimSessionContent(block),
        products: suggestProducts(block),
        sections: sections.length > 0 ? sections : undefined,
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
    if (
      t.includes("chaussure") ||
      t.includes("chaussures") ||
      t.includes("sneaker")
    ) {
      addCategory("Chaussures");
    }
    if (t.includes("chaussette") || t.includes("socks")) {
      addCategory("Chaussettes");
    }
    if (t.includes("tapis") || t.includes("yoga")) {
      addCategory("Récupération");
    }
    if (t.includes("elastique") || t.includes("elastic") || t.includes("bandes")) {
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
    if (t.includes("casquette") || t.includes("cap")) {
      addCategory("Casquettes");
    }
    if (t.includes("bandeau") || t.includes("headband")) {
      addCategory("Bandeaux");
    }
    if (t.includes("brassard")) {
      addCategory("Sécurité");
    }

    const detectProductGender = (product: typeof allProducts[number]) => {
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
    };

    const allowBySex = (product: typeof allProducts[number]) => {
      if (userSex === "female") return detectProductGender(product) !== "male";
      if (userSex === "male") return detectProductGender(product) !== "female";
      return true;
    };

    const picks: string[] = [];
    const seen = new Set<string>();
    categories.forEach((label) => {
      allProducts
        .filter((p) => normalizeText(p.categoryLabel) === normalizeText(label))
        .filter(allowBySex)
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
    if (!onboardingDone) return;

    const userMsg: Msg = {
      role: "user",
      content: input,
    };

    const newMsgs: Msg[] = [...messages, userMsg];

    persist(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const programRaw = localStorage.getItem("program_sessions");
      const programSessions: {
        title: string;
        done?: boolean;
        feedback?: "facile" | "ok" | "dur" | "trop_dur";
        completedAt?: string;
      }[] = programRaw ? JSON.parse(programRaw) : [];
      const completed = programSessions.filter((s) => s.done);
      const feedbackOrder: Record<string, number> = {
        facile: 1,
        ok: 2,
        dur: 3,
        trop_dur: 4,
      };
      const sorted = completed
        .slice()
        .sort((a, b) => {
          const aTime = a.completedAt ? Date.parse(a.completedAt) : 0;
          const bTime = b.completedAt ? Date.parse(b.completedAt) : 0;
          return aTime - bTime;
        });
      const lastTen = sorted.slice(-10);
      const formatDate = (value?: string) => {
        if (!value) return "date inconnue";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "date inconnue";
        return d.toLocaleDateString("fr-FR");
      };
      const trendBase = lastTen
        .filter((s) => s.feedback)
        .slice(-3)
        .map((s) => feedbackOrder[s.feedback as string])
        .filter((v) => typeof v === "number");
      let trendNote = "";
      if (trendBase.length === 3) {
        if (trendBase[2] < trendBase[0]) {
          trendNote = "Tendance récente: amélioration (effort perçu en baisse).";
        } else if (trendBase[2] > trendBase[0]) {
          trendNote = "Tendance récente: séance perçue plus difficile.";
        } else {
          trendNote = "Tendance récente: stable.";
        }
      }
      const feedbackSummary =
        lastTen.length === 0
          ? "aucune séance effectuée"
          : lastTen
              .map(
                (s) =>
                  `${formatDate(s.completedAt)} — ${s.title} → ${
                    s.feedback || "non notée"
                  }`
              )
              .join(" | ");
      const feedbackContext = trendNote
        ? `${feedbackSummary} | ${trendNote}`
        : feedbackSummary;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          feedbackSummary: feedbackContext,
          profileSummary: getProfileSummary(),
        }),
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

  useEffect(() => {
    if (!lastCoachRef.current) return;
    lastCoachRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [messages, loading]);

  useEffect(() => {
    if (onboardingDone) return;
    if (onboardingStep >= onboardingQuestions.length) {
      finishOnboarding();
    }
  }, [onboardingDone, onboardingStep]);

  // ======================
  // Add to program
  // ======================
  function syncProgramSessions(list: SessionDraft[]) {
    const updatedAt = new Date().toISOString();
    localStorage.setItem("program_sessions", JSON.stringify(list));
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
        // silent
      });
  }

  function addSessionsToProgram() {
    const raw = localStorage.getItem("program_sessions");
    const existing = raw ? JSON.parse(raw) : [];

    const formatted = pendingSessions.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      done: false,
      plannedAt: s.plannedAt,
      products: s.products,
      sections: s.sections,
    }));

    const nextList = [...existing, ...formatted];
    syncProgramSessions(nextList);
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
        plannedAt: session.plannedAt,
        products: session.products,
        sections: session.sections,
      },
    ];
    syncProgramSessions(next);
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
      const cleanLine = line.replace(/^\-\s*/, "");
      const displayLine = cleanLine.replace(/^#+\s*/, "");
      const titleMatch = displayLine.match(/^\*\*(.+)\*\*$/);
      const sessionMatch = displayLine.match(/^(?:\*\*)?(?:Séance|Seance)\b/i);

      if (titleMatch && sessionMatch) {
        if (current) sessions.push(current);
        current = { title: titleMatch[1], items: [] };
        seenSession = true;
        return;
      }

      if (sessionMatch) {
        if (current) sessions.push(current);
        current = { title: displayLine.replace(/\*\*/g, ""), items: [] };
        seenSession = true;
        return;
      }

      if (current) {
        if (/^[-•]/.test(line)) {
          current.items.push(line.replace(/^[-•]\s?/, ""));
          return;
        }
        const normalized = normalizeText(displayLine.replace(/\*\*/g, ""));
        const looksLikeSection =
          displayLine.endsWith(":") ||
          normalized.includes("echauffement") ||
          normalized.includes("retour au calme") ||
          normalized.includes("fractionne") ||
          normalized.includes("exercices");
        if (looksLikeSection) {
          current.items.push(displayLine.replace(/\*\*/g, ""));
        }
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

    const inferredProducts = resolveProducts(suggestProducts(content));
    if (parsed.sessions.length === 0 && inferredProducts.length > 0) {
      nodes.push(
        <div
          key="coach-suggestions"
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Suggestions boutique
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {inferredProducts.map((p) => (
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
      );
    }

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
    <div className="page-coach" style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 18,
              fontWeight: 800,
              boxShadow: "0 10px 22px rgba(60,70,184,0.35)",
            }}
          >
            🧠
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Coach IA</div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              Ton assistant sportif personnalisé
            </div>
          </div>
        </div>

        <button
          onClick={newConversation}
          style={{
            background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
            border: "none",
            borderRadius: 999,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            color: "white",
            boxShadow: "0 8px 16px rgba(60,70,184,0.3)",
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
          marginTop: 14,
        }}
        ref={threadRef}
      >
        {!onboardingDone && activeQuestion && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <div
              className="coach-question-card"
              style={{
                padding: 14,
                borderRadius: 14,
                maxWidth: "80%",
                background: "white",
                border: "1px solid #e2e8f0",
                boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                {activeQuestion.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeQuestion.options.map((option) => {
                  const answer = onboardingAnswers[activeQuestion.id];
                  const selected = Array.isArray(answer)
                    ? answer.includes(option)
                    : answer === option;
                  return (
                    <button
                      key={option}
                      onClick={() => recordAnswer(option)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid #c7d2fe",
                        background: selected
                          ? "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)"
                          : "#eef2ff",
                        color: selected ? "white" : "#3730a3",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {activeQuestion.options.includes("Autre") &&
                (Array.isArray(onboardingAnswers[activeQuestion.id])
                  ? onboardingAnswers[activeQuestion.id]?.includes("Autre")
                  : onboardingAnswers[activeQuestion.id] === "Autre") && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <input
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      placeholder="Précise ici..."
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5f5",
                      }}
                    />
                    <button
                      onClick={submitCustomAnswer}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "none",
                        background: "#3C46B8",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Valider
                    </button>
                  </div>
                )}

              {needsInjuryDetail && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    Peux-tu préciser la blessure ou la gêne ?
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={injuryDetail}
                      onChange={(e) => setInjuryDetail(e.target.value)}
                      placeholder="Ex: genou gauche, épaule..."
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5f5",
                      }}
                    />
                    <button
                      onClick={submitInjuryDetail}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "none",
                        background: "#3C46B8",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )}

              {isMultiSelect && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={goNextFromMultiSelect}
                    disabled={
                      Array.isArray(onboardingAnswers[activeQuestion.id])
                        ? onboardingAnswers[activeQuestion.id].length === 0
                        : true
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background:
                        Array.isArray(onboardingAnswers[activeQuestion.id]) &&
                        onboardingAnswers[activeQuestion.id].length > 0
                          ? "#3C46B8"
                          : "#94a3b8",
                      color: "white",
                      fontWeight: 700,
                      cursor:
                        Array.isArray(onboardingAnswers[activeQuestion.id]) &&
                        onboardingAnswers[activeQuestion.id].length > 0
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    Suivant
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastCoach =
            m.role === "assistant" &&
            messages.slice(i + 1).every((next) => next.role !== "assistant");
          return (
            <div
              key={i}
              ref={isLastCoach ? lastCoachRef : undefined}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 14,
              }}
            >
              <div
                className="coach-message-bubble"
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
          );
        })}

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

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          paddingBottom: 90,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={
            onboardingDone
              ? "Écris ton message..."
              : "Réponds d'abord aux questions ci-dessus..."
          }
          disabled={!onboardingDone}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            border: "1px solid #ccc",
            background: onboardingDone ? "white" : "#f1f5f9",
          }}
        />
        <button
          onClick={send}
          disabled={!onboardingDone}
          style={{
            padding: "14px 20px",
            borderRadius: 12,
            background: onboardingDone ? "#4f46e5" : "#94a3b8",
            color: "white",
            border: "none",
            cursor: onboardingDone ? "pointer" : "not-allowed",
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
