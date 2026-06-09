"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  cleanWorkoutText,
  formatTime,
  getSessionDuration,
  getWorkoutSteps,
  SessionFeedback,
  WorkoutSession,
} from "@/lib/workout";
import { loadProfile } from "@/lib/profile";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

const feedbackLabels: Record<SessionFeedback, string> = {
  facile: "Facile",
  ok: "Bien dosée",
  dur: "Difficile",
  trop_dur: "Trop difficile",
};

export default function ProgramPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const raw = localStorage.getItem("program_sessions");
      if (!raw) return;

      try {
        setSessions(JSON.parse(raw));
      } catch {
        setSessions([]);
      }
    }, 0);

    return () => window.clearTimeout(hydration);
  }, []);

  const [profile, setProfile] = useState<ReturnType<typeof loadProfile> | null>(null);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    setProfile(loadProfile());
    setHasProfile(Boolean(localStorage.getItem("user_profile")));
  }, []);

  const completedCount = sessions.filter((session) => session.done).length;

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    return sessions.filter(
      (s) => s.done && s.completedAt && new Date(s.completedAt) >= weekStart
    ).length;
  }, [sessions]);

  const totalMinutes = useMemo(
    () =>
      sessions.reduce(
        (total, session) => total + getSessionDuration(session),
        0
      ),
    [sessions]
  );

  function save(list: WorkoutSession[]) {
    setSessions(list);
    localStorage.setItem("program_sessions", JSON.stringify(list));
  }

  function resetSession(id: string) {
    save(
      sessions.map((session) =>
        session.id === id
          ? { ...session, done: false, feedback: undefined, completedAt: undefined }
          : session
      )
    );
  }

  function deleteSession(id: string) {
    save(sessions.filter((session) => session.id !== id));
  }

  function startDemoSession() {
    const demo: WorkoutSession = {
      id: `demo_${Date.now()}`,
      title: "Réveil énergie - 6 minutes",
      content: [
        "DUREE: 6 minutes",
        "NIVEAU: Tous niveaux",
        "MATERIEL: Aucun matériel",
        "OBJECTIF: Remettre le corps en mouvement",
        "ETAPE: Mise en route | 60 | Marche sur place en balançant doucement les bras | Commence tranquillement, laisse ton corps se réveiller.",
        "ETAPE: Squats contrôlés | 40 | Pieds largeur des épaules, pousse les hanches vers l'arrière et garde le dos droit | Descends à ton amplitude, la qualité avant la vitesse.",
        "ETAPE: Récupération | 25 | Marche lentement et prends deux grandes respirations | Très bien, relâche les épaules.",
        "ETAPE: Montées de genoux | 40 | Monte les genoux en alternance, buste grand et appuis légers | Trouve ton rythme et reste régulier.",
        "ETAPE: Récupération | 25 | Ralentis et souffle profondément | Tu avances très bien, profite de cette pause.",
        "ETAPE: Fentes arrière alternées | 45 | Recule un pied, fléchis les deux jambes puis reviens au centre | Garde le genou avant stable et contrôle chaque retour.",
        "ETAPE: Gainage debout | 40 | Debout, serre légèrement les abdos et monte les bras au-dessus de la tête | Respire sans relâcher ta posture.",
        "ETAPE: Retour au calme | 75 | Marche lentement puis étire doucement les bras et les jambes | La séance est presque terminée, fais redescendre le rythme.",
      ].join("\n"),
    };

    save([demo]);
    router.push(`/session/${demo.id}`);
  }

  return (
    <main className="page-shell program-page">
      <section className="program-hero">
        <div>
          <span className="eyebrow">Ton entraînement</span>
          <h1>Prêt à bouger ?</h1>
          <p>{"Choisis une séance. Le coach s'occupe du rythme et des consignes."}</p>
        </div>
        <div className="week-score">
          <strong>{thisWeekCount}</strong>
          <span>/ {profile?.sessionsPerWeek ?? 3} cette semaine</span>
        </div>
      </section>

      {sessions.length > 0 && (
        <div className="program-summary">
          <div>
            <span>Au programme</span>
            <strong>{sessions.length} séances</strong>
          </div>
          <div>
            <span>Temps total</span>
            <strong>{Math.max(1, Math.round(totalMinutes / 60))} min</strong>
          </div>
          <div>
            <span>Coach vocal</span>
            <strong>Inclus</strong>
          </div>
        </div>
      )}

      {!hasProfile && (
        <div className="profile-nudge">
          <div>
            <strong>Personnalise ton coaching</strong>
            <span>Renseigne ton niveau et tes objectifs pour des séances vraiment adaptées.</span>
          </div>
          <Link href="/profile">Configurer</Link>
        </div>
      )}

      {sessions.length === 0 ? (
        <section className="empty-program">
          <div className="empty-illustration">
            <CalendarIcon />
          </div>
          <h2>Ton programme est encore vide</h2>
          <p>
            Discute avec le coach pour créer des séances adaptées à ton objectif,
            ton niveau et ton matériel.
          </p>
          <div className="empty-actions">
            <Link href="/coach" className="primary-button">
              Créer mon programme
            </Link>
            <button onClick={startDemoSession}>Essayer une séance guidée</button>
          </div>
        </section>
      ) : (
        <section className="session-list">
          <div className="section-heading">
            <div>
              <span className="eyebrow">À venir</span>
              <h2>Mes séances</h2>
            </div>
            <Link href="/coach">Adapter avec le coach</Link>
          </div>

          {sessions.map((session, index) => {
            const steps = getWorkoutSteps(session);
            const duration = getSessionDuration(session);
            const preview = steps
              .filter((step) => step.kind !== "recovery")
              .slice(0, 3);
            const exerciseCount = steps.filter(
              (step) => step.kind === "work"
            ).length;

            return (
              <article
                className={`program-card ${session.done ? "is-done" : ""}`}
                key={session.id}
              >
                <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="card-main">
                  <div className="card-meta">
                    <span>{session.done ? "Terminée" : "Prochaine séance"}</span>
                    <span>{formatTime(duration)}</span>
                    <span>{exerciseCount} exercices</span>
                  </div>
                  <h3>
                    {cleanWorkoutText(session.title || "") ||
                      `Séance ${index + 1}`}
                  </h3>
                  <div className="step-preview">
                    {preview.map((step) => (
                      <span key={step.id}>{step.title}</span>
                    ))}
                  </div>

                  {session.done ? (
                    <div className="done-actions">
                      <div className="done-label">
                        <span className="mini-check">✓</span>
                        {session.feedback
                          ? `Ressenti : ${feedbackLabels[session.feedback]}`
                          : "Séance terminée"}
                      </div>
                      <button onClick={() => resetSession(session.id)}>Refaire</button>
                    </div>
                  ) : (
                    <Link href={`/session/${session.id}`} className="launch-button">
                      <span>
                        <PlayIcon />
                      </span>
                      Démarrer avec le coach
                    </Link>
                  )}
                </div>
                <button
                  className="delete-session"
                  onClick={() => deleteSession(session.id)}
                  aria-label={`Supprimer ${session.title}`}
                >
                  ×
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
