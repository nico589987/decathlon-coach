export type FitnessLevel = "debutant" | "intermediaire" | "avance";
export type FitnessGoal =
  | "forme_generale"
  | "perte_poids"
  | "renforcement"
  | "endurance"
  | "souplesse";

export type UserProfile = {
  name?: string;
  age?: number;
  level: FitnessLevel;
  goals: FitnessGoal[];
  equipment: string[];
  limitations?: string;
  sessionsPerWeek: number;
};

export const DEFAULT_PROFILE: UserProfile = {
  level: "debutant",
  goals: ["forme_generale"],
  equipment: [],
  sessionsPerWeek: 3,
};

export const LEVEL_LABELS: Record<FitnessLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  forme_generale: "Forme générale",
  perte_poids: "Perte de poids",
  renforcement: "Renforcement musculaire",
  endurance: "Endurance cardio",
  souplesse: "Souplesse et mobilité",
};

export const EQUIPMENT_OPTIONS = [
  "Tapis de sol",
  "Haltères",
  "Bandes de résistance",
  "Corde à sauter",
  "Kettlebell",
  "Barre de traction",
  "Chaise / banc",
];

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem("user_profile");
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      goals:
        Array.isArray(parsed.goals) && parsed.goals.length
          ? parsed.goals
          : DEFAULT_PROFILE.goals,
      equipment: Array.isArray(parsed.equipment) ? parsed.equipment : DEFAULT_PROFILE.equipment,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem("user_profile", JSON.stringify(profile));
}

export function profileToContext(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.name) parts.push(`Prénom : ${profile.name}`);
  parts.push(`Niveau : ${LEVEL_LABELS[profile.level]}`);
  if (profile.age) parts.push(`Âge : ${profile.age} ans`);
  parts.push(
    `Objectifs : ${profile.goals.map((g) => GOAL_LABELS[g]).join(", ")}`
  );
  parts.push(
    `Matériel disponible : ${profile.equipment.length ? profile.equipment.join(", ") : "aucun"}`
  );
  parts.push(`Séances souhaitées par semaine : ${profile.sessionsPerWeek}`);
  if (profile.limitations?.trim()) {
    parts.push(`Limitations / douleurs : ${profile.limitations}`);
  }
  return parts.join("\n");
}
