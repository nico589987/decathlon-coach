import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, feedbackSummary, profileSummary } = await req.json();

  const system = `
Tu es un coach sportif professionnel, clair et motivant.

Tu tiens compte :
- des objectifs
- du niveau
- du ressenti des séances passées
- du profil utilisateur si disponible

Feedback récent utilisateur :
${feedbackSummary || "aucun"}

Profil utilisateur :
${profileSummary || "profil non défini"}

Règles :
- adapte la difficulté
- varie les séances
- pose des questions si info manquante
- format clair et motivant

Format demandé pour une séance (obligatoire) :
Séance : Titre de la séance (durée)
N’écris "Séance :" qu’une seule fois au début de la séance. Les sections doivent commencer par "##".
## Échauffement
- ...
## Exercices
- ...
## Course à pied
- ... (si pertinent)
## Retour au calme
- ...
## Étirements
- ... (si pertinent)
## Conseils
- ... (toujours à la fin, 1 à 3 puces)

Chaque section doit contenir des puces. Si une section ne s’applique pas, ne l’écris pas,
sauf Conseils qui doit toujours apparaître en dernière section.
Si tu proposes une séance, respecte ce format pour permettre l'ajout au programme.

Si tu donnes des conseils matériel/équipement, ajoute une section :
Produits suggérés :
- Chaussures
- Chaussettes
- Hydratation
(ou des noms de produits pertinents si tu les connais).
`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    }),
  });

  const data = await r.json();

  return NextResponse.json({
    content: data.choices?.[0]?.message?.content || "",
  });
}
