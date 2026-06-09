"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatTime,
  getSessionDuration,
  WorkoutSession,
} from "@/lib/workout";
import { SessionFeedback } from "@/lib/workout";

type WeekBucket = { label: string; minutes: number; count: number };

const feedbackColors: Record<SessionFeedback, string> = {
  facile: "#20bf78",
  ok: "#3643d9",
  dur: "#f59e0b",
  trop_dur: "#ef4444",
};

const feedbackLabels: Record<SessionFeedback, string> = {
  facile: "Facile",
  ok: "Bien dosée",
  dur: "Difficile",
  trop_dur: "Trop dure",
};

function getWeekKey(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function getWeekLabel(isoMonday: string) {
  const date = new Date(isoMonday);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getCurrentStreak(sessions: WorkoutSession[]): number {
  const done = sessions
    .filter((s) => s.done && s.completedAt)
    .map((s) => new Date(s.completedAt!).toISOString().slice(0, 10))
    .sort()
    .reverse();

  if (!done.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (done[0] !== today && done[0] !== yesterday) return 0;

  const unique = [...new Set(done)];
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getBestStreak(sessions: WorkoutSession[]): number {
  const dates = [
    ...new Set(
      sessions
        .filter((s) => s.done && s.completedAt)
        .map((s) => new Date(s.completedAt!).toISOString().slice(0, 10))
        .sort()
    ),
  ];

  if (!dates.length) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setSessions(JSON.parse(localStorage.getItem("program_sessions") || "[]"));
      } catch {
        setSessions([]);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const done = useMemo(
    () => sessions.filter((s) => s.done && s.completedAt),
    [sessions]
  );

  const totalSeconds = useMemo(
    () => done.reduce((sum, s) => sum + getSessionDuration(s), 0),
    [done]
  );

  const streak = useMemo(() => getCurrentStreak(sessions), [sessions]);
  const bestStreak = useMemo(() => getBestStreak(sessions), [sessions]);

  const weekBuckets = useMemo<WeekBucket[]>(() => {
    const map = new Map<string, WeekBucket>();
    for (const s of done) {
      const key = getWeekKey(s.completedAt!);
      const existing = map.get(key) || { label: getWeekLabel(key), minutes: 0, count: 0 };
      existing.minutes += Math.round(getSessionDuration(s) / 60);
      existing.count += 1;
      map.set(key, existing);
    }
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8);
    return sorted.map(([, v]) => v);
  }, [done]);

  const maxMinutes = Math.max(...weekBuckets.map((b) => b.minutes), 1);

  const feedbackCounts = useMemo(() => {
    const counts: Partial<Record<SessionFeedback, number>> = {};
    for (const s of done) {
      if (s.feedback) counts[s.feedback] = (counts[s.feedback] || 0) + 1;
    }
    return counts;
  }, [done]);

  const recent = useMemo(
    () =>
      [...done]
        .sort((a, b) =>
          (b.completedAt || "").localeCompare(a.completedAt || "")
        )
        .slice(0, 10),
    [done]
  );

  if (done.length === 0) {
    return (
      <main className="page-shell progress-page">
        <section className="progress-hero">
          <div>
            <span className="eyebrow">Mes progrès</span>
            <h1>Ton historique</h1>
            <p>Toutes tes séances terminées apparaîtront ici.</p>
          </div>
        </section>
        <section className="empty-program" style={{ marginTop: 60 }}>
          <div className="empty-illustration">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2>Aucune séance terminée</h2>
          <p>Lance ta première séance pour commencer à suivre tes progrès.</p>
          <Link href="/program" className="primary-button">
            Voir mon programme
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell progress-page">
      <section className="progress-hero">
        <div>
          <span className="eyebrow">Mes progrès</span>
          <h1>Continue comme ça.</h1>
          <p>
            {done.length} séance{done.length > 1 ? "s" : ""} terminée{done.length > 1 ? "s" : ""} — keep going.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Séances</span>
          <strong>{done.length}</strong>
          <small>terminées</small>
        </div>
        <div className="stat-card">
          <span>Temps total</span>
          <strong>{Math.round(totalSeconds / 60)}</strong>
          <small>minutes</small>
        </div>
        <div className="stat-card">
          <span>Série actuelle</span>
          <strong>{streak}</strong>
          <small>jour{streak > 1 ? "s" : ""} d&apos;affilée</small>
        </div>
        <div className="stat-card">
          <span>Meilleure série</span>
          <strong>{bestStreak}</strong>
          <small>jours</small>
        </div>
      </div>

      {weekBuckets.length > 0 && (
        <section className="chart-card">
          <h2>Activité par semaine</h2>
          <div className="bar-chart">
            {weekBuckets.map((bucket, i) => (
              <div key={i} className="bar-col">
                <div className="bar-wrap">
                  <div
                    className="bar-fill"
                    style={{ height: `${(bucket.minutes / maxMinutes) * 100}%` }}
                    title={`${bucket.minutes} min`}
                  />
                </div>
                <span className="bar-label">{bucket.label}</span>
                <small>{bucket.minutes} min</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(feedbackCounts).length > 0 && (
        <section className="chart-card">
          <h2>Ressenti sur les séances</h2>
          <div className="feedback-breakdown">
            {(Object.entries(feedbackCounts) as [SessionFeedback, number][]).map(
              ([key, count]) => (
                <div key={key} className="fb-row">
                  <span
                    className="fb-dot"
                    style={{ background: feedbackColors[key] }}
                  />
                  <span className="fb-label">{feedbackLabels[key]}</span>
                  <div className="fb-bar-wrap">
                    <div
                      className="fb-bar"
                      style={{
                        width: `${(count / done.length) * 100}%`,
                        background: feedbackColors[key],
                      }}
                    />
                  </div>
                  <span className="fb-count">{count}</span>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="chart-card">
        <h2>Historique récent</h2>
        <div className="history-list">
          {recent.map((s) => (
            <div key={s.id} className="history-row">
              <div className="history-check">✓</div>
              <div className="history-info">
                <strong>{s.title || "Séance"}</strong>
                <span>
                  {s.completedAt
                    ? new Date(s.completedAt).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    : ""}
                </span>
              </div>
              <div className="history-meta">
                <strong>{formatTime(getSessionDuration(s))}</strong>
                {s.feedback && (
                  <span
                    className="history-badge"
                    style={{ color: feedbackColors[s.feedback] }}
                  >
                    {feedbackLabels[s.feedback]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
