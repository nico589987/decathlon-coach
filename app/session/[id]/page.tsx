"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExerciseType,
  cleanWorkoutText,
  formatTime,
  getSessionEquipment,
  getSessionLevel,
  getWorkoutSteps,
  SessionFeedback,
  WorkoutSession,
  WorkoutStep,
} from "@/lib/workout";

type Stage = "ready" | "active" | "complete";
type VoiceMode = "natural" | "browser";

const feedbackOptions: Array<{
  value: SessionFeedback;
  label: string;
  detail: string;
}> = [
  { value: "facile", label: "Facile", detail: "J'avais encore de la marge" },
  { value: "ok", label: "Bien dosée", detail: "Le bon niveau pour moi" },
  { value: "dur", label: "Difficile", detail: "Exigeante, mais terminée" },
  { value: "trop_dur", label: "Trop dure", detail: "À alléger la prochaine fois" },
];

const focusLabels: Record<ExerciseType, string> = {
  cardio: "Cardio et coordination",
  lower_body: "Jambes et fessiers",
  upper_body: "Haut du corps",
  core: "Sangle abdominale",
  mobility: "Mobilité",
  recovery: "Récupération",
};

function Icon({
  name,
  size = 22,
}: {
  name:
    | "back"
    | "sound"
    | "mute"
    | "play"
    | "pause"
    | "skip"
    | "repeat"
    | "check";
  size?: number;
}) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    sound: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ),
    mute: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="m16 9 5 5M21 9l-5 5" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7V5Z" />,
    pause: (
      <>
        <path d="M8 5v14" />
        <path d="M16 5v14" />
      </>
    ),
    skip: (
      <>
        <path d="m5 5 10 7-10 7V5Z" />
        <path d="M19 5v14" />
      </>
    ),
    repeat: (
      <>
        <path d="m3 12 3-3 3 3" />
        <path d="M6 9v4a6 6 0 0 0 6 6 6 6 0 0 0 5.7-4" />
        <path d="M21 12 18 9l-3 3" />
        <path d="M18 9V7a6 6 0 0 0-11.7-2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function ExerciseFigure({ type }: { type: ExerciseType }) {
  return (
    <svg
      className={`exercise-figure figure-${type}`}
      viewBox="0 0 220 250"
      role="img"
      aria-label={`Zone sollicitée : ${focusLabels[type]}`}
    >
      <circle className="figure-head" cx="110" cy="35" r="19" />
      <path className="figure-body" d="M110 58v76" />
      <path className="figure-body" d="m110 76-49 42" />
      <path className="figure-body" d="m110 76 49 42" />
      <path className="figure-body" d="m110 134-35 79" />
      <path className="figure-body" d="m110 134 35 79" />
      <path className="figure-body faint" d="M82 72q28 18 56 0M88 128q22-14 44 0" />
      <circle className="muscle muscle-upper" cx="110" cy="83" r="30" />
      <ellipse className="muscle muscle-core" cx="110" cy="119" rx="24" ry="35" />
      <ellipse className="muscle muscle-left-leg" cx="87" cy="165" rx="16" ry="38" />
      <ellipse className="muscle muscle-right-leg" cx="133" cy="165" rx="16" ry="38" />
      <path className="motion motion-left" d="M42 86q-21 28 1 55" />
      <path className="motion motion-right" d="M178 86q21 28-1 55" />
      <path className="motion motion-up" d="m110 232-9-14m9 14 9-14" />
    </svg>
  );
}

const WORK_INTROS = [
  "Super, on enchaîne.",
  "À toi de jouer.",
  "Prêt ? On y va.",
  "Exercice suivant.",
  "Accroche-toi, c'est parti.",
  "Voilà le prochain.",
];

const RECOVERY_INTROS = [
  "Bien joué. Récupère maintenant.",
  "Très bien. Souffle un coup.",
  "Beau travail. Place à la pause.",
  "C'est bien. Profite de la récupération.",
];

const HALFWAY_CUES: Record<string, string[]> = {
  cardio: [
    "Mi-chemin, tu gères ! Garde le rythme.",
    "À mi-parcours — continue comme ça !",
    "Très bien, moitié faite. On continue.",
  ],
  lower_body: [
    "Moitié faite — garde les hanches stables.",
    "Mi-chemin. Serre les fessiers à chaque rep.",
    "À mi-parcours, contrôle bien la descente.",
  ],
  upper_body: [
    "Moitié faite. Garde les épaules basses.",
    "Mi-chemin — respire, reste solide.",
    "À mi-parcours. Contrôle bien le mouvement.",
  ],
  core: [
    "Mi-chemin. Tiens bon, ne lâche pas le gainage.",
    "Moitié faite. Continue de respirer.",
    "À mi-parcours — reste stable, c'est bien.",
  ],
  mobility: [
    "Mi-chemin. Relâche sur l'expiration.",
    "Moitié faite, continue doucement.",
  ],
  recovery: [
    "Profite bien de cette pause.",
    "Reprends ton souffle.",
  ],
};

const PUSH_CUES = [
  "Plus que quelques secondes. Pousse !",
  "Dernier effort — vas-y !",
  "T'y es presque, accroche-toi !",
  "Encore un peu, tu assures !",
  "Les dernières secondes sont les plus importantes !",
];

function pickCue(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

function buildStepSpeech(step: WorkoutStep, index: number): string {
  let intro: string;
  if (index === 0) {
    intro = "C'est parti ! On commence ensemble.";
  } else if (step.kind === "recovery" || step.kind === "cooldown") {
    intro = pickCue(RECOVERY_INTROS, index);
  } else if (step.kind === "warmup") {
    intro = index === 0 ? "C'est parti !" : "On continue l'échauffement.";
  } else {
    intro = pickCue(WORK_INTROS, index);
  }

  const duration =
    step.duration >= 60
      ? `${Math.round(step.duration / 60)} minute${step.duration >= 120 ? "s" : ""}`
      : `${step.duration} secondes`;

  const isWorkStep = step.kind === "work";
  const countdown = isWorkStep ? " Prêt ? 3... 2... 1... c'est parti !" : "";

  if (step.kind === "recovery") {
    return `${intro} ${step.duration} secondes pour récupérer. ${step.coachCue}`;
  }

  const effortText = step.reps
    ? `Fais ${step.reps} répétitions.`
    : `Tu as ${duration}.`;

  return `${intro} ${step.title}. Position de départ : ${step.setup}. Mouvement : ${step.movement}. Respiration : ${step.breathing}. Point clé : ${step.focus}. ${effortText}${countdown}`;
}

function buildHalfwayCue(step: WorkoutStep, index: number): string {
  const pool = HALFWAY_CUES[step.exerciseType] || HALFWAY_CUES.cardio;
  const cue = pickCue(pool, index);
  return step.coachCue && step.coachCue.length < 80
    ? `${cue} ${step.coachCue}`
    : cue;
}

function buildPushCue(index: number): string {
  return pickCue(PUSH_CUES, index * 3 + 1);
}

function buildFinishSpeech(exerciseCount: number, totalMinutes: number): string {
  const mins = Math.max(1, Math.round(totalMinutes / 60));
  const options = [
    `Séance terminée ! ${mins} minutes, ${exerciseCount} exercices. Bravo, tu t'es donné à fond. Prends le temps de souffler — tu l'as vraiment mérité.`,
    `C'est fini ! Beau travail aujourd'hui. ${mins} minutes d'effort, ${exerciseCount} exercices. Tu peux être fier de toi. Récupère bien.`,
    `Terminé ! Tu as tenu jusqu'au bout — c'est ce qui compte. ${mins} minutes de travail. Maintenant, souffle et hydrate-toi.`,
  ];
  return pickCue(options, exerciseCount);
}

export default function GuidedSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>();
  const [stage, setStage] = useState<Stage>("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("natural");
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const announcedRef = useRef(new Set<string>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const coachAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef(new Map<string, string>());
  const voiceRequestRef = useRef(0);
  const naturalVoiceRef = useRef(true);
  const stageRef = useRef<Stage>("ready");
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const raw = localStorage.getItem("program_sessions");
      if (!raw) {
        setSession(null);
        return;
      }

      try {
        const sessions = JSON.parse(raw) as WorkoutSession[];
        setSession(sessions.find((item) => item.id === params.id) || null);
      } catch {
        setSession(null);
      }
    }, 0);

    return () => window.clearTimeout(hydration);
  }, [params.id]);

  const steps = useMemo(
    () => (session ? getWorkoutSteps(session) : []),
    [session]
  );
  const currentStep = steps[currentIndex];
  const totalDuration = useMemo(
    () => steps.reduce((total, step) => total + step.duration, 0),
    [steps]
  );
  const exerciseCount = useMemo(
    () => steps.filter((step) => step.kind === "work").length,
    [steps]
  );
  const completedDuration = useMemo(
    () =>
      steps
        .slice(0, currentIndex)
        .reduce((total, step) => total + step.duration, 0) +
      Math.max(0, (currentStep?.duration || 0) - secondsLeft),
    [currentIndex, currentStep, secondsLeft, steps]
  );
  const progress = totalDuration ? (completedDuration / totalDuration) * 100 : 0;

  const stopCoachVoice = useCallback(() => {
    voiceRequestRef.current += 1;
    if (coachAudioRef.current) {
      coachAudioRef.current.pause();
      coachAudioRef.current.currentTime = 0;
      coachAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsCoachSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.98;
      utterance.pitch = 1.03;
      const frenchVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("fr"));
      utterance.voice =
        frenchVoices.find((voice) => /natural|online/i.test(voice.name)) ||
        frenchVoices[0] ||
        null;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const fetchSpeechUrl = useCallback(async (text: string) => {
    const cached = audioCacheRef.current.get(text);
    if (cached) return cached;

    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Natural voice unavailable");

    const url = URL.createObjectURL(await response.blob());
    audioCacheRef.current.set(text, url);
    return url;
  }, []);

  const preloadVoice = useCallback(
    async (text: string) => {
      if (!audioEnabled || !naturalVoiceRef.current) return;
      try {
        await fetchSpeechUrl(text);
      } catch {
        naturalVoiceRef.current = false;
        setVoiceMode("browser");
      }
    },
    [audioEnabled, fetchSpeechUrl]
  );

  const playCoachVoice = useCallback(
    async (text: string, interrupt = true) => {
      if (!audioEnabled) return;
      if (!interrupt && coachAudioRef.current && !coachAudioRef.current.paused) {
        return;
      }

      if (interrupt) stopCoachVoice();
      const requestId = voiceRequestRef.current;
      setIsCoachSpeaking(true);

      try {
        if (!naturalVoiceRef.current) {
          await speakWithBrowser(text);
          return;
        }

        const url = await fetchSpeechUrl(text);
        if (requestId !== voiceRequestRef.current) return;

        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          coachAudioRef.current = audio;
          audio.onended = () => {
            coachAudioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            coachAudioRef.current = null;
            resolve();
          };
          audio.play().catch(resolve);
        });
      } catch {
        naturalVoiceRef.current = false;
        setVoiceMode("browser");
        if (requestId === voiceRequestRef.current) {
          await speakWithBrowser(text);
        }
      } finally {
        if (requestId === voiceRequestRef.current) {
          setIsCoachSpeaking(false);
        }
      }
    },
    [audioEnabled, fetchSpeechUrl, speakWithBrowser, stopCoachVoice]
  );

  const beep = useCallback((frequency = 700, duration = 0.08) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.11, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Visual guidance remains fully usable if sound feedback is unavailable.
    }
  }, []);

  const announceStep = useCallback(
    async (index: number) => {
      const step = steps[index];
      if (!step) return;
      await playCoachVoice(buildStepSpeech(step, index), true);
    },
    [playCoachVoice, steps]
  );

  const finishWorkout = useCallback(async () => {
    setIsRunning(false);
    stageRef.current = "complete";
    setStage("complete");
    stopCoachVoice();
    beep(880, 0.16);
    window.setTimeout(() => beep(1040, 0.2), 180);
    window.setTimeout(() => beep(1220, 0.22), 380);
    void playCoachVoice(buildFinishSpeech(exerciseCount, totalDuration), true);
    wakeLockRef.current?.release().catch(() => undefined);
  }, [beep, exerciseCount, playCoachVoice, stopCoachVoice, totalDuration]);

  const goToStep = useCallback(
    async (index: number) => {
      setIsRunning(false);
      if (index >= steps.length) {
        await finishWorkout();
        return;
      }

      setCurrentIndex(index);
      setSecondsLeft(steps[index].duration);
      announcedRef.current.clear();
      await announceStep(index);
      if (stageRef.current === "active") {
        beep(720, 0.1);
        setIsRunning(true);
      }
    },
    [announceStep, beep, finishWorkout, steps]
  );

  useEffect(() => {
    if (stage !== "active" || !isRunning || !currentStep) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (!currentStep?.reps) {
            beep(900, 0.12);
            window.setTimeout(() => void goToStep(currentIndex + 1), 250);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [beep, currentIndex, currentStep, goToStep, isRunning, stage]);

  useEffect(() => {
    if (stage !== "active" || !isRunning || !currentStep) return;

    // 3-2-1 countdown beeps
    if (secondsLeft <= 3 && secondsLeft > 0) {
      const key = `count_${currentIndex}_${secondsLeft}`;
      if (!announcedRef.current.has(key)) {
        announcedRef.current.add(key);
        beep(730 + secondsLeft * 55, 0.1);
      }
    }

    // 10-second final push for time-based work steps > 30s
    if (
      secondsLeft === 10 &&
      currentStep.kind === "work" &&
      currentStep.duration > 30 &&
      !currentStep.reps
    ) {
      const key = `push_${currentIndex}`;
      if (!announcedRef.current.has(key)) {
        announcedRef.current.add(key);
        void playCoachVoice(buildPushCue(currentIndex), false);
      }
    }

    // Halfway cue (time-based only)
    const halfway = Math.floor(currentStep.duration / 2);
    if (secondsLeft === halfway && currentStep.duration >= 40 && !currentStep.reps) {
      const key = `half_${currentIndex}`;
      if (!announcedRef.current.has(key)) {
        announcedRef.current.add(key);
        void playCoachVoice(buildHalfwayCue(currentStep, currentIndex), false);
      }
    }

    // 75% through cue (25% time remaining) for long time-based work steps
    const quarterLeft = Math.floor(currentStep.duration / 4);
    if (
      secondsLeft === quarterLeft &&
      currentStep.kind === "work" &&
      currentStep.duration >= 60 &&
      !currentStep.reps
    ) {
      const key = `three_quarter_${currentIndex}`;
      if (!announcedRef.current.has(key)) {
        announcedRef.current.add(key);
        // Only if we didn't already play the 10s cue
        if (quarterLeft > 12) {
          void playCoachVoice(buildPushCue(currentIndex + 1), false);
        }
      }
    }
  }, [
    beep,
    currentIndex,
    currentStep,
    isRunning,
    playCoachVoice,
    secondsLeft,
    stage,
  ]);

  useEffect(() => {
    if (!steps.length || !audioEnabled) return;
    const nextIndex = stage === "ready" ? 0 : currentIndex + 1;
    const nextStep = steps[nextIndex];
    if (nextStep) {
      void preloadVoice(buildStepSpeech(nextStep, nextIndex));
    }
    if (stage === "active" && currentStep) {
      void preloadVoice(buildHalfwayCue(currentStep, currentIndex));
      if (currentStep.kind === "work" && currentStep.duration > 30) {
        void preloadVoice(buildPushCue(currentIndex));
      }
    }
  }, [
    audioEnabled,
    currentIndex,
    currentStep,
    preloadVoice,
    stage,
    steps,
  ]);

  useEffect(() => {
    const audioCache = audioCacheRef.current;
    return () => {
      stopCoachVoice();
      wakeLockRef.current?.release().catch(() => undefined);
      audioContextRef.current?.close().catch(() => undefined);
      audioCache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stopCoachVoice]);

  async function startWorkout() {
    if (!steps.length) return;
    stageRef.current = "active";
    setStage("active");
    setCurrentIndex(0);
    setSecondsLeft(steps[0].duration);
    setIsRunning(false);
    beep(620, 0.1);

    try {
      const nav = navigator as Navigator & {
        wakeLock?: {
          request: (
            type: "screen"
          ) => Promise<{ release: () => Promise<void> }>;
        };
      };
      wakeLockRef.current = (await nav.wakeLock?.request("screen")) || null;
    } catch {
      wakeLockRef.current = null;
    }

    await announceStep(0);
    if (stageRef.current === "active") {
      beep(720, 0.1);
      setIsRunning(true);
    }
  }

  async function togglePause() {
    if (isRunning) {
      setIsRunning(false);
      stopCoachVoice();
      await playCoachVoice(
        "Pause. Relâche les épaules et respire tranquillement. Reprends quand tu es prêt.",
        true
      );
      return;
    }

    await playCoachVoice("On reprend. Replace-toi correctement. C'est parti.", true);
    if (stageRef.current === "active") setIsRunning(true);
  }

  async function replayInstruction() {
    const wasRunning = isRunning;
    setIsRunning(false);
    await announceStep(currentIndex);
    if (wasRunning && stageRef.current === "active") setIsRunning(true);
  }

  function toggleAudio() {
    setAudioEnabled((enabled) => {
      if (enabled) stopCoachVoice();
      return !enabled;
    });
  }

  function saveFeedback(value: SessionFeedback) {
    const raw = localStorage.getItem("program_sessions");
    if (raw && session) {
      const sessions = JSON.parse(raw) as WorkoutSession[];
      localStorage.setItem(
        "program_sessions",
        JSON.stringify(
          sessions.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  done: true,
                  feedback: value,
                  completedAt: new Date().toISOString(),
                }
              : item
          )
        )
      );
    }
    setFeedback(value);
  }

  if (session === undefined) {
    return (
      <main className="session-shell session-empty">
        <div className="session-loader" aria-label="Chargement de la séance" />
      </main>
    );
  }

  if (session === null) {
    return (
      <main className="session-shell session-empty">
        <div className="empty-card">
          <span className="eyebrow">Séance introuvable</span>
          <h1>{"Cette séance n'est plus dans ton programme."}</h1>
          <Link href="/program" className="primary-button">
            Retour au programme
          </Link>
        </div>
      </main>
    );
  }

  if (stage === "ready") {
    return (
      <main className="session-shell ready-screen">
        <div className="session-topbar">
          <Link
            href="/program"
            className="icon-button"
            aria-label="Retour au programme"
          >
            <Icon name="back" />
          </Link>
          <span>Préparation de la séance</span>
          <button
            className="icon-button"
            onClick={toggleAudio}
            aria-label={
              audioEnabled ? "Couper le coach vocal" : "Activer le coach vocal"
            }
          >
            <Icon name={audioEnabled ? "sound" : "mute"} />
          </button>
        </div>

        <section className="ready-card">
          <div className="coach-avatar large" aria-hidden="true">
            <span>C</span>
            <i className="voice-ring ring-one" />
            <i className="voice-ring ring-two" />
          </div>
          <span className="eyebrow">Ton coach est avec toi</span>
          <h1>{cleanWorkoutText(session.title)}</h1>
          <p className="ready-intro">
            Je présente chaque exercice avant de lancer le chrono. Tu verras la
            position, le mouvement, la respiration et le point technique à
            surveiller.
          </p>

          <div className="session-facts">
            <div>
              <span>Durée réelle</span>
              <strong>{Math.max(1, Math.round(totalDuration / 60))} min</strong>
            </div>
            <div>
              <span>Exercices</span>
              <strong>{exerciseCount}</strong>
            </div>
            <div>
              <span>Niveau</span>
              <strong>{getSessionLevel(session)}</strong>
            </div>
          </div>

          <div className="exercise-preview-list">
            {steps
              .filter((step) => step.kind !== "recovery")
              .slice(0, 4)
              .map((step, index) => (
                <div key={step.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                  <small>{formatTime(step.duration)}</small>
                </div>
              ))}
          </div>

          <div className="equipment-note">
            <span>À préparer</span>
            <strong>{getSessionEquipment(session)}</strong>
          </div>

          <button className="start-button" onClick={startWorkout}>
            <span className="start-icon">
              <Icon name="play" size={24} />
            </span>
            Commencer avec le coach
          </button>
          <p className="audio-note">
            {audioEnabled
              ? voiceMode === "natural"
                ? "Voix naturelle activée. Cette voix est générée par IA."
                : "Voix de secours du navigateur activée."
              : "Coach vocal coupé. Toutes les consignes restent visibles."}
          </p>
        </section>
      </main>
    );
  }

  if (stage === "complete") {
    return (
      <main className="session-shell complete-screen">
        <section className="complete-card">
          <div className="completion-mark">
            <Icon name="check" size={38} />
          </div>
          <span className="eyebrow">Séance terminée</span>
          <h1>Beau travail.</h1>
          <p>
            Tu as bougé pendant environ{" "}
            {Math.max(1, Math.round(totalDuration / 60))} minutes et complété{" "}
            {exerciseCount} exercices.
          </p>

          {!feedback ? (
            <>
              <h2>Comment tu te sens ?</h2>
              <div className="feedback-grid">
                {feedbackOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => saveFeedback(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.detail}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="saved-feedback">
              <Icon name="check" />
              Ressenti enregistré. Le coach pourra adapter la suite.
            </div>
          )}

          <button
            className="primary-button wide"
            onClick={() => router.push("/program")}
          >
            Retour au programme
          </button>
        </section>
      </main>
    );
  }

  const timerProgress = currentStep
    ? ((currentStep.duration - secondsLeft) / currentStep.duration) * 100
    : 0;

  return (
    <main
      className={`session-shell active-screen kind-${currentStep?.kind || "work"}`}
    >
      <div className="session-topbar active-topbar">
        <button
          className="icon-button"
          onClick={() => {
            stageRef.current = "ready";
            stopCoachVoice();
            router.push("/program");
          }}
          aria-label="Quitter"
        >
          <Icon name="back" />
        </button>
        <div className="step-position">
          Étape {currentIndex + 1} sur {steps.length}
        </div>
        <button
          className="icon-button"
          onClick={toggleAudio}
          aria-label={
            audioEnabled ? "Couper le coach vocal" : "Activer le coach vocal"
          }
        >
          <Icon name={audioEnabled ? "sound" : "mute"} />
        </button>
      </div>

      <div
        className="workout-progress"
        aria-label={`${Math.round(progress)}% de la séance`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="active-content exercise-layout">
        <div
          className={`coach-live ${isCoachSpeaking && audioEnabled ? "speaking" : ""}`}
        >
          <div className="coach-avatar">
            <span>C</span>
          </div>
          <div>
            <span>Coach vocal</span>
            <strong>
              {isCoachSpeaking
                ? "Je t'explique le mouvement"
                : isRunning
                  ? "Je suis ton rythme"
                  : "Chrono en attente"}
            </strong>
          </div>
          <div className="voice-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="exercise-stage">
          <aside className="exercise-demo-card">
            <div className="exercise-visual">
              <ExerciseFigure type={currentStep.exerciseType} />
              <span>{focusLabels[currentStep.exerciseType]}</span>
            </div>
            <div className="form-focus">
              <span>Repère essentiel</span>
              <strong>{currentStep.focus}</strong>
            </div>
          </aside>

          <div className="exercise-guidance">
            <span className="phase-label">
              {currentStep.kind === "warmup" && "Échauffement"}
              {currentStep.kind === "work" && "Exercice"}
              {currentStep.kind === "recovery" && "Récupération"}
              {currentStep.kind === "cooldown" && "Retour au calme"}
            </span>
            <h1>{currentStep.title}</h1>
            <p className="current-instruction">{currentStep.instruction}</p>

            <div className="technique-list">
              <div>
                <span>1</span>
                <p>
                  <small>Position</small>
                  <strong>{currentStep.setup}</strong>
                </p>
              </div>
              <div>
                <span>2</span>
                <p>
                  <small>Mouvement</small>
                  <strong>{currentStep.movement}</strong>
                </p>
              </div>
              <div>
                <span>3</span>
                <p>
                  <small>Respiration</small>
                  <strong>{currentStep.breathing}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="exercise-timing">
            {currentStep.reps ? (
              <div className="reps-display">
                <strong>{currentStep.reps}</strong>
                <span>répétitions</span>
              </div>
            ) : (
              <div
                className="timer-ring"
                style={
                  {
                    "--timer-progress": `${timerProgress * 3.6}deg`,
                  } as CSSProperties
                }
              >
                <div>
                  <strong>{formatTime(secondsLeft)}</strong>
                  <span>
                    {isCoachSpeaking
                      ? "écoute"
                      : isRunning
                        ? "reste"
                        : "en pause"}
                  </span>
                </div>
              </div>
            )}

            <p className="coach-tip">{currentStep.coachCue}</p>

            <div className="session-controls">
              <button onClick={() => void replayInstruction()}>
                <Icon name="repeat" />
                <span>Réexpliquer</span>
              </button>
              <button
                className="main-control"
                onClick={() =>
                  currentStep.reps
                    ? void goToStep(currentIndex + 1)
                    : void togglePause()
                }
              >
                {currentStep.reps ? (
                  <>
                    <Icon name="check" size={30} />
                    <span>Terminé</span>
                  </>
                ) : (
                  <>
                    <Icon name={isRunning ? "pause" : "play"} size={30} />
                    <span>{isRunning ? "Pause" : "Reprendre"}</span>
                  </>
                )}
              </button>
              <button onClick={() => void goToStep(currentIndex + 1)}>
                <Icon name="skip" />
                <span>Suivant</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="next-step">
        <span>Ensuite</span>
        <strong>{steps[currentIndex + 1]?.title || "Fin de la séance"}</strong>
        <small>
          {steps[currentIndex + 1]
            ? formatTime(steps[currentIndex + 1].duration)
            : "Bravo !"}
        </small>
      </div>
    </main>
  );
}
