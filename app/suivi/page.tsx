"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

type Session = {
  id: string;
  title: string;
  content: string;
  done?: boolean;
  feedback?: "facile" | "ok" | "dur" | "trop_dur";
  completedAt?: string;
  plannedAt?: string;
};

type Profile = {
  name: string;
  ageRange: string;
  weightRange: string;
  sex: string;
  goal: string;
  level: string;
  location: string;
  equipment: string;
  injuries: string;
};

const FEEDBACK_LABELS: Record<NonNullable<Session["feedback"]>, string> = {
  facile: "Facile",
  ok: "Correcte",
  dur: "Difficile",
  trop_dur: "Trop dure",
};

const AGE_OPTIONS = ["16-20", "21-29", "30-39", "40-49", "50-59", "60+"];
const WEIGHT_OPTIONS = [
  "<50 kg",
  "50-60 kg",
  "61-70 kg",
  "71-80 kg",
  "81-90 kg",
  "90+ kg",
];
const SEX_OPTIONS = ["Homme", "Femme", "Autre"];

function parseDurationMinutes(title: string, content: string) {
  const combined = `${title} ${content}`;
  const match = combined.match(/(\d+)\s*(?:min|minutes)/i);
  if (!match) return 0;
  return Number(match[1]);
}

function toDayKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getSessionType(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  if (/(course|running|footing|fractionn|endurance)/i.test(text)) return "course";
  if (/(renforcement|muscu|gainage|squats|fentes|pompes)/i.test(text)) {
    return "renfo";
  }
  if (/(mobilit|etirement|souplesse)/i.test(text)) return "mobilite";
  return "mix";
}

const defaultProfile: Profile = {
  name: "",
  ageRange: "21-29",
  weightRange: "61-70 kg",
  sex: "Homme",
  goal: "Remise en forme",
  level: "Débutant",
  location: "Maison",
  equipment: "Tapis, élastiques",
  injuries: "Aucune",
};

export default function SuiviPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);
  const [equipmentChoices, setEquipmentChoices] = useState<string[]>([]);
  const [injuryOther, setInjuryOther] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("program_sessions");
    if (raw) setSessions(JSON.parse(raw));
    const goalRaw = localStorage.getItem("weekly_goal");
    if (goalRaw) setWeeklyGoal(Number(goalRaw));
    const profileRaw = localStorage.getItem("user_profile");
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      setProfile({ ...defaultProfile, ...parsed });
    }
    if (!supabaseConfigured) return;

    const fetchProfile = async (userId: string) => {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select(
          "name, age_range, weight_range, sex, goal, level, location, equipment, injuries"
        )
        .eq("id", userId)
        .maybeSingle();
      if (!profileRow) return;
      const nextProfile = {
        ...defaultProfile,
        name: profileRow.name || "",
        ageRange: profileRow.age_range || defaultProfile.ageRange,
        weightRange: profileRow.weight_range || defaultProfile.weightRange,
        sex: profileRow.sex || defaultProfile.sex,
        goal: profileRow.goal || defaultProfile.goal,
        level: profileRow.level || defaultProfile.level,
        location: profileRow.location || defaultProfile.location,
        equipment: profileRow.equipment || defaultProfile.equipment,
        injuries: profileRow.injuries || defaultProfile.injuries,
      };
      setProfile(nextProfile);
      localStorage.setItem("user_profile", JSON.stringify(nextProfile));
    };

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;
      fetchProfile(userId);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (!userId) return;
      fetchProfile(userId);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const done = sessions.filter((s) => s.done);
    const pending = sessions.filter((s) => !s.done);
    const doneCount = done.length;
    const completion = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const totalMinutes = done.reduce(
      (acc, s) => acc + parseDurationMinutes(s.title, s.content),
      0
    );
    const lastDone = done
      .filter((s) => s.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt as string).getTime() -
          new Date(a.completedAt as string).getTime()
      )[0];

    const weekBuckets = Array.from({ length: 6 }).map((_, idx) => {
      const weekStart = startOfWeek(
        new Date(Date.now() - (5 - idx) * 7 * 24 * 60 * 60 * 1000)
      );
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        label: `S${idx + 1}`,
        start: weekStart,
        end: weekEnd,
        count: 0,
      };
    });

    done.forEach((s) => {
      if (!s.completedAt) return;
      const date = new Date(s.completedAt);
      weekBuckets.forEach((bucket) => {
        if (date >= bucket.start && date <= bucket.end) {
          bucket.count += 1;
        }
      });
    });

    const maxWeek = Math.max(1, ...weekBuckets.map((b) => b.count));

    const feedbackCounts: Record<string, number> = {
      facile: 0,
      ok: 0,
      dur: 0,
      trop_dur: 0,
    };
    done.forEach((s) => {
      if (s.feedback) feedbackCounts[s.feedback] += 1;
    });

    const doneDayKeys = new Set(
      done
        .filter((s) => s.completedAt)
        .map((s) => toDayKey(new Date(s.completedAt as string)))
    );
    let streak = 0;
    const cursor = new Date();
    for (;;) {
      if (!doneDayKeys.has(toDayKey(cursor))) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      total,
      doneCount,
      pendingCount: pending.length,
      completion,
      totalMinutes,
      lastDone,
      weekBuckets,
      maxWeek,
      feedbackCounts,
      nextSession: pending[0],
      streak,
      doneDayKeys,
      done,
    };
  }, [sessions]);

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const doneThisWeek = stats.done.filter((s) => {
    if (!s.completedAt) return false;
    const date = new Date(s.completedAt);
    return date >= weekStart && date <= weekEnd;
  });
  const weeklyProgress = Math.min(
    100,
    Math.round((doneThisWeek.length / weeklyGoal) * 100)
  );

  const last14Days = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    return d;
  });

  const typeCounts = stats.done.reduce(
    (acc, s) => {
      const type = getSessionType(s.title, s.content);
      acc[type] += 1;
      return acc;
    },
    { course: 0, renfo: 0, mobilite: 0, mix: 0 }
  );

  const plannedDayKeys = new Set(
    sessions
      .filter((s) => s.plannedAt)
      .map((s) => toDayKey(new Date(s.plannedAt as string)))
  );

  const achievements = [
    { label: "Première séance", done: stats.doneCount >= 1 },
    { label: "3 séances réalisées", done: stats.doneCount >= 3 },
    { label: "7 séances réalisées", done: stats.doneCount >= 7 },
    { label: "Streak 5 jours", done: stats.streak >= 5 },
  ];

  const trend = (() => {
    const now = new Date();
    const last2Start = new Date(now);
    last2Start.setDate(now.getDate() - 13);
    const prev2Start = new Date(now);
    prev2Start.setDate(now.getDate() - 27);
    const prev2End = new Date(now);
    prev2End.setDate(now.getDate() - 14);
    const last2 = stats.done.filter((s) => {
      if (!s.completedAt) return false;
      const d = new Date(s.completedAt);
      return d >= last2Start;
    }).length;
    const prev2 = stats.done.filter((s) => {
      if (!s.completedAt) return false;
      const d = new Date(s.completedAt);
      return d >= prev2Start && d <= prev2End;
    }).length;
    return last2 - prev2;
  })();

  function saveWeeklyGoal(value: number) {
    setWeeklyGoal(value);
    localStorage.setItem("weekly_goal", String(value));
  }

  function saveProfile(next: Profile) {
    setProfile(next);
    localStorage.setItem("user_profile", JSON.stringify(next));
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;
      await supabase.from("profiles").upsert({
        id: userId,
        name: next.name,
        age_range: next.ageRange,
        weight_range: next.weightRange,
        sex: next.sex,
        goal: next.goal,
        level: next.level,
        location: next.location,
        equipment: next.equipment,
        injuries: next.injuries,
        updated_at: new Date().toISOString(),
      });
    });
  }


  return (
    <div
      className="page-suivi"
      style={{
        padding: "28px 24px 40px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            background: "linear-gradient(140deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 18px 36px rgba(15,23,42,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            Tableau de bord
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
            Suivi d’activité
          </div>
          <div style={{ color: "#475569", marginTop: 6, fontSize: 14 }}>
            Tes progrès en un coup d’œil, clairs et motivants.
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            background: "linear-gradient(120deg, #3C46B8 0%, #2563eb 70%)",
            color: "white",
            boxShadow: "0 18px 32px rgba(37,99,235,0.3)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 600 }}>
            Taux de complétion
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {stats.completion}%
          </div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
            {stats.doneCount} séances faites / {stats.total} prévues
          </div>
          <div
            style={{
              marginTop: 12,
              height: 8,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${stats.completion}%`,
                height: "100%",
                background: "white",
              }}
            />
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: "1px solid #fcd34d",
          }}
        >
          <div style={{ fontSize: 12, color: "#92400e", fontWeight: 700 }}>
            Streak en cours
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {stats.streak} jours
          </div>
          <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>
            Garde le rythme, tu es sur une belle lancée.
          </div>
        </div>
        <div
          className="suivi-goal"
          style={{
            padding: 20,
            borderRadius: 18,
            background: "linear-gradient(135deg, #ecfdf3 0%, #dcfce7 100%)",
            border: "1px solid #86efac",
          }}
        >
          <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>
            Objectif hebdo
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {doneThisWeek.length}/{weeklyGoal}
          </div>
          <div style={{ fontSize: 13, color: "#166534", marginTop: 6 }}>
            Séances réalisées cette semaine
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {[2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => saveWeeklyGoal(value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #86efac",
                  background: value === weeklyGoal ? "#16a34a" : "white",
                  color: value === weeklyGoal ? "white" : "#166534",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {value}/sem
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              height: 8,
              background: "rgba(22,101,52,0.15)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${weeklyProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Activité sur 6 semaines
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-end",
              height: 180,
              padding: "10px 6px 0",
            }}
          >
            {stats.weekBuckets.map((bucket) => (
              <div
                key={bucket.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${(bucket.count / stats.maxWeek) * 120 + 12}px`,
                    background:
                      "linear-gradient(180deg, rgba(60,70,184,0.95) 0%, rgba(37,99,235,0.7) 100%)",
                    borderRadius: 10,
                    boxShadow: "0 10px 18px rgba(37,99,235,0.25)",
                  }}
                />
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {bucket.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "#475569" }}>
            Total minutes effectuées : <strong>{stats.totalMinutes} min</strong>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800 }}>Ressenti des séances</div>
          {Object.entries(stats.feedbackCounts).map(([key, value]) => (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                <span>
                  {FEEDBACK_LABELS[key as keyof typeof FEEDBACK_LABELS]}
                </span>
                <strong>{value}</strong>
              </div>
              <div
                style={{
                  height: 8,
                  background: "#e2e8f0",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: stats.doneCount
                      ? `${(value / stats.doneCount) * 100}%`
                      : "0%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #3C46B8 0%, #2563eb 60%, #0ea5e9 100%)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Rythme sur 14 jours
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(14, 1fr)",
              gap: 6,
            }}
          >
            {last14Days.map((day) => {
              const key = toDayKey(day);
              const active = stats.doneDayKeys.has(key);
              return (
                <div
                  key={key}
                  title={day.toLocaleDateString("fr-FR")}
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    borderRadius: 6,
                    background: active
                      ? "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)"
                      : "#e2e8f0",
                    boxShadow: active
                      ? "0 6px 12px rgba(37,99,235,0.3)"
                      : "none",
                  }}
                />
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
            Chaque carré correspond à une journée (plein = séance réalisée).
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Tendance</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {trend >= 0 ? "+" : ""}
            {trend}
          </div>
          <div style={{ color: "#475569", fontSize: 13 }}>
            séances sur les 2 dernières semaines
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "#1e293b" }}>
            {trend >= 0
              ? "Ton rythme progresse. Continue comme ça !"
              : "Ralentissement détecté, reprends doucement."}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Prochaine séance
          </div>
          {stats.nextSession ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {stats.nextSession.title}
              </div>
              <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
                {stats.nextSession.content.split("\n")[0]}
              </div>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Aucune séance planifiée pour l’instant.
            </div>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Dernière séance effectuée
          </div>
          {stats.lastDone ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {stats.lastDone.title}
              </div>
              <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
                Fait le{" "}
                {stats.lastDone.completedAt
                  ? new Date(stats.lastDone.completedAt).toLocaleDateString(
                      "fr-FR"
                    )
                  : "—"}
              </div>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Pas encore de séance effectuée.
            </div>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Répartition des séances
          </div>
          {(
            [
              ["course", "Course à pied", "#16a34a"],
              ["renfo", "Renforcement", "#2563eb"],
              ["mobilite", "Mobilité", "#f59e0b"],
              ["mix", "Mix", "#7c3aed"],
            ] as const
          ).map(([key, label, color]) => {
            const count = typeCounts[key];
            const width = stats.doneCount
              ? Math.round((count / stats.doneCount) * 100)
              : 0;
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#e2e8f0",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>
            Dernières séances
          </div>
          {[...stats.done]
            .sort(
              (a, b) =>
                new Date(b.completedAt as string).getTime() -
                new Date(a.completedAt as string).getTime()
            )
            .slice(0, 4)
            .map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  marginBottom: 8,
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {s.completedAt
                    ? new Date(s.completedAt).toLocaleDateString("fr-FR")
                    : "—"}
                </div>
              </div>
            ))}
          {stats.done.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Aucune séance réalisée pour l’instant.
            </div>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Succès</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {achievements.map((badge) => (
              <span
                key={badge.label}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: badge.done ? "#dbeafe" : "#e2e8f0",
                  color: badge.done ? "#1e40af" : "#475569",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {badge.done ? "✅" : "⏳"} {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Calendrier</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              fontSize: 11,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            {"L M M J V S D".split(" ").map((d, idx) => (
              <div key={`${d}-${idx}`} style={{ textAlign: "center" }}>
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {(() => {
              const now = new Date();
              const first = new Date(now.getFullYear(), now.getMonth(), 1);
              const daysInMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
              ).getDate();
              const startOffset = (first.getDay() + 6) % 7;
              const cells = [];
              for (let i = 0; i < startOffset; i += 1) {
                cells.push(<div key={`spacer-${i}`} />);
              }
              for (let day = 1; day <= daysInMonth; day += 1) {
                const d = new Date(now.getFullYear(), now.getMonth(), day);
                const key = toDayKey(d);
                const doneDay = stats.doneDayKeys.has(key);
                const plannedDay = plannedDayKeys.has(key);
                cells.push(
                  <div
                    key={key}
                    style={{
                      height: 30,
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 11,
                      background: doneDay
                        ? "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)"
                        : plannedDay
                        ? "#e2e8f0"
                        : "#f8fafc",
                      color: doneDay ? "white" : "#475569",
                      border: plannedDay ? "1px dashed #94a3b8" : "1px solid #e2e8f0",
                    }}
                  >
                    {day}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
            Bleu = séance faite, gris pointillé = planifiée.
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Profil</div>
          {editingProfile ? (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Prénom
                <input
                  value={(profileDraft || profile).name}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      name: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Âge
                <select
                  value={(profileDraft || profile).ageRange}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      ageRange: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {AGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Poids
                <select
                  value={(profileDraft || profile).weightRange}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      weightRange: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {WEIGHT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Sexe
                <select
                  value={(profileDraft || profile).sex}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      sex: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {SEX_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Objectif
                <select
                  value={(profileDraft || profile).goal}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      goal: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {[
                    "Perte de poids",
                    "Remise en forme",
                    "Performance",
                    "Bien-être",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Niveau
                <select
                  value={(profileDraft || profile).level}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      level: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {["Débutant", "Intermédiaire", "Avancé"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                Lieu
                <select
                  value={(profileDraft || profile).location}
                  onChange={(e) =>
                    setProfileDraft((prev) => ({
                      ...(prev || profile),
                      location: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {["Maison", "Salle", "Extérieur", "Mix"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ fontSize: 12 }}>
                Matériel
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {[
                    "Tapis",
                    "Élastiques",
                    "Haltères",
                    "Corde à sauter",
                    "Aucun",
                  ].map((opt) => {
                    const selected = equipmentChoices.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setEquipmentChoices((prev) =>
                            selected
                              ? prev.filter((i) => i !== opt)
                              : [...prev, opt]
                          );
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid #c7d2fe",
                          background: selected ? "#3C46B8" : "#eef2ff",
                          color: selected ? "white" : "#3730a3",
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ fontSize: 12 }}>
                Blessures
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {["Aucune", "Genou", "Dos", "Épaules", "Autre"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() =>
                        setProfileDraft((prev) => ({
                          ...(prev || profile),
                          injuries: opt,
                        }))
                      }
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #c7d2fe",
                        background:
                          (profileDraft || profile).injuries === opt
                            ? "#3C46B8"
                            : "#eef2ff",
                        color:
                          (profileDraft || profile).injuries === opt
                            ? "white"
                            : "#3730a3",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {(profileDraft || profile).injuries === "Autre" && (
                  <input
                    value={injuryOther}
                    onChange={(e) => setInjuryOther(e.target.value)}
                    placeholder="Précise la blessure..."
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #cbd5f5",
                      width: "100%",
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    const next = profileDraft || profile;
                    const equipment =
                      equipmentChoices.length > 0
                        ? equipmentChoices.join(", ")
                        : next.equipment;
                    const injuries =
                      next.injuries === "Autre" && injuryOther
                        ? injuryOther
                        : next.injuries;
                    saveProfile({ ...next, equipment, injuries });
                    setEditingProfile(false);
                    setProfileDraft(null);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#3C46B8",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileDraft(null);
                    setEquipmentChoices([]);
                    setInjuryOther("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <div>
                Prénom : <strong>{profile.name || "—"}</strong>
              </div>
              <div>
                Âge : <strong>{profile.ageRange}</strong>
              </div>
              <div>
                Poids : <strong>{profile.weightRange}</strong>
              </div>
              <div>
                Sexe : <strong>{profile.sex}</strong>
              </div>
              <div>
                Objectif : <strong>{profile.goal}</strong>
              </div>
              <div>
                Niveau : <strong>{profile.level}</strong>
              </div>
              <div>
                Lieu : <strong>{profile.location}</strong>
              </div>
              <div>
                Matériel : <strong>{profile.equipment}</strong>
              </div>
              <div>
                Blessures : <strong>{profile.injuries}</strong>
              </div>
              <button
                onClick={() => {
                  setEditingProfile(true);
                  setProfileDraft(profile);
                  setEquipmentChoices(
                    profile.equipment ? profile.equipment.split(", ") : []
                  );
                  setInjuryOther("");
                }}
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Modifier
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
