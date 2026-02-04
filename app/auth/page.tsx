"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";
import { useLanguage } from "../lib/useLanguage";

type Profile = {
  name: string;
  birthDate: string;
  weightKg: number;
  sex: string;
  goal: string;
  level: string;
  location: string;
  equipment: string;
  injuries: string;
};

const sexOptions = ["Homme", "Femme", "Autre"];

export default function AuthPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({
    name: "",
    birthDate: "",
    weightKg: 70,
    sex: "Homme",
    goal: "Remise en forme",
    level: "Débutant",
    location: "Maison",
    equipment: "Tapis, élastiques",
    injuries: "Aucune",
  });

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email || "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email || "");
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const buttonStyle: React.CSSProperties = useMemo(
    () => ({
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
      color: "white",
      fontWeight: 700,
      cursor: "pointer",
    }),
    []
  );

  async function upsertProfile(userId: string) {
    const payload = {
      id: userId,
      name: profile.name,
      birth_date: profile.birthDate || null,
      weight_kg: profile.weightKg,
      sex: profile.sex,
      goal: profile.goal,
      level: profile.level,
      location: profile.location,
      equipment: profile.equipment,
      injuries: profile.injuries,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("profiles").upsert(payload);
    localStorage.setItem(
      "user_profile",
      JSON.stringify({
        name: profile.name,
        birthDate: profile.birthDate || "",
        weightKg: profile.weightKg,
        sex: profile.sex,
        goal: profile.goal,
        level: profile.level,
        location: profile.location,
        equipment: profile.equipment,
        injuries: profile.injuries,
      })
    );
  }

  async function handleSignup() {
    if (!supabaseConfigured) {
      setStatus("Configuration Supabase manquante (variables d'environnement).");
      return;
    }
    setStatus("Création du compte...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      await upsertProfile(userId);
      setStatus("Compte créé ✅");
    } else {
      setStatus("Compte créé. Confirme ton email pour activer le profil.");
    }
  }

  async function handleLogin() {
    if (!supabaseConfigured) {
      setStatus("Configuration Supabase manquante (variables d'environnement).");
      return;
    }
    setStatus("Connexion...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select(
          "name, birth_date, weight_kg, sex, goal, level, location, equipment, injuries, updated_at"
        )
        .eq("id", userId)
        .single();
      if (profileRow) {
        localStorage.setItem(
          "user_profile",
          JSON.stringify({
            name: profileRow.name || "",
            birthDate: profileRow.birth_date || "",
            weightKg: profileRow.weight_kg ?? 70,
            sex: profileRow.sex || "Homme",
            goal: profileRow.goal || "Remise en forme",
            level: profileRow.level || "Débutant",
            location: profileRow.location || "Maison",
            equipment: profileRow.equipment || "Tapis, élastiques",
            injuries: profileRow.injuries || "Aucune",
          })
        );
        if (profileRow.updated_at) {
          localStorage.setItem("user_profile_updated_at", profileRow.updated_at);
        }
      }
    }
    setStatus("Connecté ✅");
    setSessionEmail(data.user?.email || "");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSessionEmail("");
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
        display: "grid",
        gap: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
          padding: 20,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 20 }}>{t.account}</div>
        <div style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>
          {t.account} · {t.signup}
        </div>
        {!supabaseConfigured && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              color: "#92400e",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Supabase n'est pas configuré sur ce déploiement. Ajoute
            `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans
            Vercel puis redeploie.
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {(["signup", "login"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #c7d2fe",
                background: mode === value ? "#3C46B8" : "#eef2ff",
                color: mode === value ? "white" : "#3730a3",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {value === "signup" ? "Créer un compte" : "Se connecter"}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
          padding: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
          {t.email}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@email.com"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #cbd5f5",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #cbd5f5",
            }}
          />
        </label>

        {mode === "signup" && (
          <>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{t.profile}</div>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              {t.firstName}
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5f5",
                }}
              />
            </label>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                {t.birthDate}
                <input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, birthDate: e.target.value }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                {t.weight}
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={profile.weightKg}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      weightKg: Number(e.target.value || 0),
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
                {t.sex}
                <select
                  value={profile.sex}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, sex: e.target.value }))
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5f5",
                  }}
                >
                  {sexOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {mode === "signup" ? (
            <button onClick={handleSignup} style={buttonStyle}>
              {t.signup}
            </button>
          ) : (
            <button onClick={handleLogin} style={buttonStyle}>
              {t.login}
            </button>
          )}
          {sessionEmail && (
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Se déconnecter
            </button>
          )}
        </div>
        {status && <div style={{ color: "#0f172a" }}>{status}</div>}
        {sessionEmail && (
          <div style={{ fontSize: 12, color: "#475569" }}>
            Connecté en tant que {sessionEmail}
          </div>
        )}
      </div>
    </div>
  );
}
