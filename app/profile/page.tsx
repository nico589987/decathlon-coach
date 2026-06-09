"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_PROFILE,
  EQUIPMENT_OPTIONS,
  FitnessGoal,
  FitnessLevel,
  GOAL_LABELS,
  LEVEL_LABELS,
  loadProfile,
  saveProfile,
  UserProfile,
} from "@/lib/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function toggleGoal(goal: FitnessGoal) {
    const goals = profile.goals.includes(goal)
      ? profile.goals.filter((g) => g !== goal)
      : [...profile.goals, goal];
    if (goals.length > 0) set("goals", goals);
  }

  function toggleEquipment(item: string) {
    const equipment = profile.equipment.includes(item)
      ? profile.equipment.filter((e) => e !== item)
      : [...profile.equipment, item];
    set("equipment", equipment);
  }

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="page-shell profile-page">
      <section className="profile-hero">
        <div>
          <span className="eyebrow">Mon profil</span>
          <h1>Personnalise ton coaching</h1>
          <p>Le coach utilise ces informations pour adapter chaque séance.</p>
        </div>
      </section>

      <div className="profile-form">
        <section className="profile-card">
          <h2>Informations générales</h2>
          <div className="field-row">
            <label htmlFor="name">Prénom (optionnel)</label>
            <input
              id="name"
              type="text"
              value={profile.name || ""}
              onChange={(e) => set("name", e.target.value || undefined)}
              placeholder="Ex. Alex"
              maxLength={40}
            />
          </div>
          <div className="field-row">
            <label htmlFor="age">Âge (optionnel)</label>
            <input
              id="age"
              type="number"
              value={profile.age || ""}
              onChange={(e) =>
                set("age", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Ex. 28"
              min={10}
              max={99}
            />
          </div>
          <div className="field-row">
            <label>Séances par semaine</label>
            <div className="chip-group">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`chip ${profile.sessionsPerWeek === n ? "active" : ""}`}
                  onClick={() => set("sessionsPerWeek", n)}
                  type="button"
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h2>Niveau et objectifs</h2>
          <div className="field-row">
            <label>Niveau actuel</label>
            <div className="chip-group">
              {(Object.keys(LEVEL_LABELS) as FitnessLevel[]).map((level) => (
                <button
                  key={level}
                  className={`chip ${profile.level === level ? "active" : ""}`}
                  onClick={() => set("level", level)}
                  type="button"
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
          <div className="field-row">
            <label>Objectifs (plusieurs possibles)</label>
            <div className="chip-group wrap">
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((goal) => (
                <button
                  key={goal}
                  className={`chip ${profile.goals.includes(goal) ? "active" : ""}`}
                  onClick={() => toggleGoal(goal)}
                  type="button"
                >
                  {GOAL_LABELS[goal]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h2>Matériel disponible</h2>
          <p className="field-hint">Sélectionne ce que tu as chez toi ou en salle.</p>
          <div className="chip-group wrap">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                key={item}
                className={`chip ${profile.equipment.includes(item) ? "active" : ""}`}
                onClick={() => toggleEquipment(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <h2>Limitations physiques</h2>
          <p className="field-hint">
            Douleurs, blessures, zones à éviter… Le coach en tiendra compte.
          </p>
          <textarea
            value={profile.limitations || ""}
            onChange={(e) => set("limitations", e.target.value || undefined)}
            placeholder="Ex. Genou droit fragile, pas de sauts, douleur lombaire légère..."
            rows={3}
          />
        </section>

        <div className="profile-actions">
          <button className="primary-button" onClick={handleSave}>
            {saved ? "Profil enregistré ✓" : "Enregistrer le profil"}
          </button>
          <button className="ghost-button" onClick={() => router.push("/coach")}>
            Discuter avec le coach
          </button>
        </div>
      </div>
    </main>
  );
}
