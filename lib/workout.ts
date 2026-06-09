export type SessionFeedback = "facile" | "ok" | "dur" | "trop_dur";

export type WorkoutKind = "warmup" | "work" | "recovery" | "cooldown";

export type ExerciseType =
  | "cardio"
  | "lower_body"
  | "upper_body"
  | "core"
  | "mobility"
  | "recovery";

export type WorkoutStep = {
  id: string;
  title: string;
  instruction: string;
  duration: number;
  reps?: number;
  kind: WorkoutKind;
  coachCue: string;
  setup: string;
  movement: string;
  breathing: string;
  focus: string;
  exerciseType: ExerciseType;
};

export type WorkoutSession = {
  id: string;
  title: string;
  content?: string;
  objective?: string;
  level?: string;
  equipment?: string[];
  durationSeconds?: number;
  steps?: WorkoutStep[];
  done?: boolean;
  feedback?: SessionFeedback;
  completedAt?: string;
};

const SECTION_RULES: Array<{
  pattern: RegExp;
  kind: WorkoutKind;
  title: string;
}> = [
  {
    pattern: /(?:echauffement|warm.?up|activation|mise en route)/i,
    kind: "warmup",
    title: "Échauffement",
  },
  {
    pattern: /(?:repos|recuperation|pause|souffle)/i,
    kind: "recovery",
    title: "Récupération",
  },
  {
    pattern: /(?:retour au calme|cool.?down|etirement|relaxation)/i,
    kind: "cooldown",
    title: "Retour au calme",
  },
  {
    pattern: /(?:circuit|bloc|serie|effort|exercice|renforcement)/i,
    kind: "work",
    title: "Bloc principal",
  },
];

const MOVEMENT_RULES: Array<{ pattern: RegExp; type: ExerciseType }> = [
  {
    pattern:
      /(?:marche|course|jog|genou|jump|saut|burpee|cardio|talon.?fesse|mountain climber|step)/i,
    type: "cardio",
  },
  {
    pattern:
      /(?:squat|fente|chaise|mollet|jambe|hanche|pont fessier|hip thrust|deadlift|souleve)/i,
    type: "lower_body",
  },
  {
    pattern:
      /(?:pompe|push.?up|epaule|bras|triceps|biceps|rowing|tirage|developpe|dips)/i,
    type: "upper_body",
  },
  {
    pattern:
      /(?:gainage|planche|abdo|crunch|core|russian twist|dead bug|bird dog)/i,
    type: "core",
  },
  {
    pattern:
      /(?:mobilite|rotation|etire|respiration|cercle|balancement|ouverture)/i,
    type: "mobility",
  },
  {
    pattern: /(?:repos|recuperation|pause|souffle|relache)/i,
    type: "recovery",
  },
];

const NON_EXERCISE_RULES = [
  /^(?:seance|programme|duree|niveau|materiel|objectif|frequence)\s*:/i,
  /^(?:conseil|consigne generale|note|important|attention)\s*:/i,
  /^(?:seance|programme)\b.*\b\d+\s*(?:min|minute)/i,
  /^(?:jour|semaine)\s+\d+/i,
];

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function cleanWorkoutText(value: string) {
  return value
    .replace(/^\s{0,3}#{1,6}\s*/g, "")
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[(.+?)]\(.+?\)/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/^[—–:|\s]+|[—–:|\s]+$/g, "")
    .trim();
}

function clampDuration(duration: number, kind: WorkoutKind) {
  const minimum = kind === "recovery" ? 15 : 20;
  const maximum = kind === "recovery" ? 120 : kind === "warmup" || kind === "cooldown" ? 900 : 600;
  return Math.min(maximum, Math.max(minimum, Math.round(duration)));
}

function inferDuration(text: string, kind: WorkoutKind) {
  const normalized = normalizeForMatch(text);
  const minuteMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minute)/i);
  if (minuteMatch) {
    return clampDuration(
      Number(minuteMatch[1].replace(",", ".")) * 60,
      kind
    );
  }

  const timedSetMatch = normalized.match(
    /(\d+)\s*[x×]\s*(\d+)\s*(?:s|sec|seconde)/
  );
  if (timedSetMatch) {
    return clampDuration(
      Number(timedSetMatch[1]) * Number(timedSetMatch[2]),
      kind
    );
  }

  const secondMatch = normalized.match(/(\d+)\s*(?:s|sec|seconde)/i);
  if (secondMatch) return clampDuration(Number(secondMatch[1]), kind);

  const repMatch = normalized.match(
    /(?:(\d+)\s*[x×]\s*)?(\d+)\s*(?:rep|repetition|fois)/
  );
  if (repMatch) {
    const sets = Number(repMatch[1] || 1);
    const repetitions = Number(repMatch[2]);
    return clampDuration(sets * repetitions * 3, kind);
  }

  if (kind === "recovery") return 30;
  if (kind === "warmup" || kind === "cooldown") return 45;
  return 40;
}

function detectSection(line: string) {
  const normalized = normalizeForMatch(line);
  return SECTION_RULES.find(({ pattern }) => pattern.test(normalized));
}

function detectExerciseType(text: string, kind: WorkoutKind): ExerciseType {
  if (kind === "recovery") return "recovery";
  const normalized = normalizeForMatch(text);
  return (
    MOVEMENT_RULES.find(({ pattern }) => pattern.test(normalized))?.type ||
    (kind === "warmup" || kind === "cooldown" ? "mobility" : "core")
  );
}

function containsMovement(text: string, kind: WorkoutKind) {
  if (kind === "recovery" || kind === "cooldown") return true;
  const normalized = normalizeForMatch(text);
  return MOVEMENT_RULES.some(({ pattern }) => pattern.test(normalized));
}

function makeTitle(text: string, fallback: string) {
  const cleaned = cleanWorkoutText(text)
    .replace(/^(?:pendant\s+)?\d+(?:[.,]\d+)?\s*(?:min(?:ute)?s?|s|sec(?:onde)?s?)\s*(?:de\s+)?/i, "")
    .replace(/^(?:de|du|des|d')\s*/i, "")
    .replace(
      /\s+\d+\s*[x×]\s*\d+\s*(?:rep(?:etition)?s?|fois|s|sec(?:onde)?s?)?.*$/i,
      ""
    )
    .replace(/\s*[-–—:]\s*(?:\d+.*)$/i, "")
    .replace(/\s*\((?:\d+.*)\)$/i, "")
    .replace(/\b(?:pendant|durant)\s+\d+.*$/i, "")
    .trim();

  if (!cleaned || cleaned.length > 70) return fallback;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function defaultTechnique(
  title: string,
  instruction: string,
  kind: WorkoutKind,
  exerciseType: ExerciseType
) {
  if (kind === "recovery") {
    return {
      setup: "Reste debout ou marche lentement.",
      movement: instruction,
      breathing: "Inspire par le nez, expire lentement par la bouche.",
      focus: "Relâche les épaules et fais redescendre le rythme.",
    };
  }

  if (exerciseType === "lower_body") {
    return {
      setup: "Pieds stables, buste grand et abdominaux légèrement engagés.",
      movement: instruction,
      breathing: "Inspire sur la descente, expire pendant l'effort.",
      focus: "Garde les genoux alignés avec les pieds.",
    };
  }

  if (exerciseType === "upper_body") {
    return {
      setup: "Place les épaules basses et garde le corps bien aligné.",
      movement: instruction,
      breathing: "Expire quand tu pousses ou tires, inspire au retour.",
      focus: "Bouge avec contrôle sans crisper la nuque.",
    };
  }

  if (exerciseType === "core") {
    return {
      setup: "Allonge la colonne et engage doucement la sangle abdominale.",
      movement: instruction,
      breathing: "Respire régulièrement sans bloquer l'air.",
      focus: "Privilégie une posture stable à la vitesse.",
    };
  }

  return {
    setup: "Tiens-toi grand, épaules relâchées et appuis légers.",
    movement: instruction,
    breathing: "Garde une respiration fluide et régulière.",
    focus: "Commence doucement puis trouve un rythme confortable.",
  };
}

function makeCue(kind: WorkoutKind, title: string) {
  if (kind === "warmup") {
    return "Mets progressivement le corps en route. Aucun besoin d'aller vite.";
  }
  if (kind === "recovery") {
    return "Profite de cette récupération. Reprends ton souffle, tu gères.";
  }
  if (kind === "cooldown") {
    return "Fais redescendre le rythme doucement. Beau travail aujourd'hui.";
  }
  return `Reste propre et régulier sur ${title.toLowerCase()}. Tu es capable.`;
}

export function sanitizeWorkoutStep(
  step: Partial<WorkoutStep>,
  index: number
): WorkoutStep | null {
  const title = cleanWorkoutText(step.title || "");
  const instruction = cleanWorkoutText(step.instruction || "");
  const kind = step.kind || "work";

  if (!title || !instruction || !containsMovement(`${title} ${instruction}`, kind)) {
    return null;
  }

  const exerciseType =
    step.exerciseType || detectExerciseType(`${title} ${instruction}`, kind);
  const technique = defaultTechnique(title, instruction, kind, exerciseType);

  return {
    id: step.id || `step_${index}`,
    title,
    instruction,
    duration: clampDuration(
      Number(step.duration) || inferDuration(`${title} ${instruction}`, kind),
      kind
    ),
    reps: step.reps != null && Number(step.reps) > 0 ? Number(step.reps) : undefined,
    kind,
    coachCue: cleanWorkoutText(step.coachCue || makeCue(kind, title)),
    setup: cleanWorkoutText(step.setup || technique.setup),
    movement: cleanWorkoutText(step.movement || technique.movement),
    breathing: cleanWorkoutText(step.breathing || technique.breathing),
    focus: cleanWorkoutText(step.focus || technique.focus),
    exerciseType,
  };
}

function parseStructuredSteps(content: string): WorkoutStep[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^ETAPE\s*:/i.test(line))
    .map((line, index) => {
      const parts = line
        .replace(/^ETAPE\s*:/i, "")
        .split("|")
        .map(cleanWorkoutText);
      const title = parts[0] || `Exercice ${index + 1}`;
      const instruction = parts[2] || title;
      const detected = detectSection(`${title} ${instruction}`);
      const kind = detected?.kind || "work";

      return sanitizeWorkoutStep(
        {
          id: `step_${index}`,
          title,
          duration: Number(parts[1]),
          instruction,
          kind,
          coachCue: parts[3],
          setup: parts[4],
          breathing: parts[5],
          focus: parts[6],
        },
        index
      );
    })
    .filter((step): step is WorkoutStep => Boolean(step));
}

function isHeading(rawLine: string, cleanLine: string) {
  return (
    /^\s{0,3}#{1,6}\s+/.test(rawLine) ||
    (/^[A-ZÀ-ÖØ-Ý\s]{4,}$/.test(cleanLine) && cleanLine.length < 55)
  );
}

function isNonExercise(line: string) {
  const normalized = normalizeForMatch(line);
  return NON_EXERCISE_RULES.some((rule) => rule.test(normalized));
}

function parseLegacySteps(content: string): WorkoutStep[] {
  const rawLines = content.split(/\r?\n/);
  let currentKind: WorkoutKind = "work";
  let currentSection = "Exercice";
  const steps: WorkoutStep[] = [];

  for (const rawLine of rawLines) {
    const line = cleanWorkoutText(rawLine);
    if (!line || isNonExercise(line)) continue;

    const section = detectSection(line);
    const sectionHasMeasure =
      /\d+(?:[.,]\d+)?\s*(?:min|minute|s|sec|seconde|rep|repetition|fois|x\b)/i.test(
        normalizeForMatch(line)
      );
    if (
      section &&
      (isHeading(rawLine, line) ||
        (!sectionHasMeasure && line.length < 70))
    ) {
      currentKind = section.kind;
      currentSection = section.title;
      continue;
    }

    if (isHeading(rawLine, line)) continue;

    const kind = section?.kind || currentKind;
    const hasMeasure = sectionHasMeasure;
    if (!containsMovement(line, kind) || (!hasMeasure && rawLine.length > 150)) {
      continue;
    }

    const title = makeTitle(line, currentSection);
    const sanitized = sanitizeWorkoutStep(
      {
        id: `step_${steps.length}`,
        title,
        instruction: line,
        duration: inferDuration(line, kind),
        kind,
      },
      steps.length
    );
    if (sanitized) steps.push(sanitized);
  }

  return steps;
}

function fallbackWorkout(): WorkoutStep[] {
  const fallback: Array<Partial<WorkoutStep>> = [
    {
      title: "Marche active",
      instruction: "Marche sur place en laissant les bras accompagner le mouvement.",
      duration: 60,
      kind: "warmup",
      exerciseType: "cardio",
    },
    {
      title: "Squats contrôlés",
      instruction: "Recule les hanches comme pour t'asseoir, puis pousse dans les pieds pour remonter.",
      duration: 40,
      kind: "work",
      exerciseType: "lower_body",
    },
    {
      title: "Récupération",
      instruction: "Marche lentement et relâche les épaules.",
      duration: 30,
      kind: "recovery",
      exerciseType: "recovery",
    },
    {
      title: "Montées de genoux",
      instruction: "Monte les genoux en alternance avec des appuis légers.",
      duration: 40,
      kind: "work",
      exerciseType: "cardio",
    },
    {
      title: "Retour au calme",
      instruction: "Marche doucement puis prends trois grandes respirations.",
      duration: 60,
      kind: "cooldown",
      exerciseType: "mobility",
    },
  ];

  return fallback
    .map(sanitizeWorkoutStep)
    .filter((step): step is WorkoutStep => Boolean(step));
}

export function parseWorkoutSteps(content = ""): WorkoutStep[] {
  const structured = parseStructuredSteps(content);
  if (structured.length >= 2) return structured;

  const legacy = parseLegacySteps(content);
  return legacy.length >= 2 ? legacy : fallbackWorkout();
}

export function getWorkoutSteps(session: WorkoutSession): WorkoutStep[] {
  const embedded = (session.steps || [])
    .map(sanitizeWorkoutStep)
    .filter((step): step is WorkoutStep => Boolean(step));
  const steps =
    embedded.length >= 2 ? embedded : parseWorkoutSteps(session.content);
  return fitStepsToSessionDuration(steps, getRequestedDuration(session));
}

export function getSessionDuration(session: WorkoutSession) {
  return getWorkoutSteps(session).reduce(
    (total, step) => total + step.duration,
    0
  );
}

export function getSessionEquipment(session: WorkoutSession) {
  if (session.equipment?.length) return session.equipment.join(", ");
  return getSessionMeta(session.content || "", "MATERIEL") || "Aucun matériel";
}

export function getSessionLevel(session: WorkoutSession) {
  return (
    cleanWorkoutText(session.level || "") ||
    getSessionMeta(session.content || "", "NIVEAU") ||
    "Adapté à ton niveau"
  );
}

function getRequestedDuration(session: WorkoutSession) {
  if (session.durationSeconds && session.durationSeconds >= 180) {
    return session.durationSeconds;
  }

  const source = `${getSessionMeta(session.content || "", "DUREE") || ""} ${session.title}`;
  const minutes = source.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minute)/i);
  if (!minutes) return undefined;

  const duration = Number(minutes[1].replace(",", ".")) * 60;
  return duration >= 180 && duration <= 10800 ? duration : undefined;
}

function fitStepsToSessionDuration(
  steps: WorkoutStep[],
  requestedDuration?: number
) {
  if (!requestedDuration || steps.length < 2) return steps;

  const actualDuration = steps.reduce(
    (total, step) => total + step.duration,
    0
  );
  const ratio = requestedDuration / actualDuration;
  if (ratio < 0.4 || ratio > 2.5) return steps;

  const fitted = steps.map((step) => ({
    ...step,
    duration: clampDuration(Math.round((step.duration * ratio) / 5) * 5, step.kind),
  }));
  let difference =
    requestedDuration -
    fitted.reduce((total, step) => total + step.duration, 0);
  let cursor = 0;

  while (Math.abs(difference) >= 5 && cursor < fitted.length * 50) {
    const step = fitted[cursor % fitted.length];
    const adjustment = difference > 0 ? 5 : -5;
    const nextDuration = clampDuration(
      step.duration + adjustment,
      step.kind
    );
    if (nextDuration !== step.duration) {
      step.duration = nextDuration;
      difference -= adjustment;
    }
    cursor += 1;
  }

  return fitted;
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getSessionMeta(content: string, key: string) {
  const match = content.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "im"));
  return match?.[1] ? cleanWorkoutText(match[1]) : undefined;
}
