"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  id: string;
  title: string;
  content: string;
  done?: boolean;
  feedback?: "facile" | "ok" | "dur" | "trop_dur";
  completedAt?: string;
};

const FEEDBACK_LABELS: Record<NonNullable<Session["feedback"]>, string> = {
  facile: "Facile",
  ok: "Correcte",
  dur: "Difficile",
  trop_dur: "Trop dure",
};

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
  if (/(renforcement|muscu|gainage|squats|fentes|pompes)/i.test(text))
    return "renfo";
  if (/(mobilit|etirement|souplesse)/i.test(text)) return "mobilite";
  return "mix";
}

export default function SuiviPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("program_sessions");
    if (raw) setSessions(JSON.parse(raw));
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

  const weeklyGoal = 3;
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
    </div>
  );
}
