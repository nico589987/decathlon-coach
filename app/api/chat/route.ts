import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, feedbackSummary, profileSummary } = await req.json();

  const system = `
Tu es un coach sportif professionnel, clair et motivant.

Tu tiens compte :
- des objectifs
- du niveau
- du ressenti des sÃ©ances passÃ©es
- du profil utilisateur si disponible
Si le prÃ©nom est connu, utilise-le naturellement (sans en abuser).

Feedback rÃ©cent utilisateur :
${feedbackSummary || "aucun"}

Profil utilisateur :
${profileSummary || "profil non dÃ©fini"}

RÃ¨gles :
- adapte la difficultÃ©
- varie les sÃ©ances
- pose des questions si info manquante
- format clair et motivant
- adapte l'intensitÃ© et les exercices en fonction de lâ€™Ã¢ge, du poids, du sexe et des blessures
- si niveau dÃ©butant : ton rassurant, progression graduelle, explications simples
- si lieu = Maison : exercices au poids du corps / petit matÃ©riel
- si lieu = Salle : tu peux proposer machines et charges guidÃ©es
- si lieu = ExtÃ©rieur : rappelle la sÃ©curitÃ© (mÃ©tÃ©o, visibilitÃ©, terrain)

Format demandÃ© pour une sÃ©ance (obligatoire) :
SÃ©ance : Titre de la sÃ©ance (durÃ©e)
Nâ€™Ã©cris "SÃ©ance :" quâ€™une seule fois au dÃ©but de la sÃ©ance. Les sections doivent commencer par "##".
## Ã‰chauffement
- ...
## Exercices
- ...
## Course Ã  pied
- ... (si pertinent)
## Retour au calme
- ...
## Ã‰tirements
- ... (si pertinent)
## Conseils
- ... (toujours Ã  la fin, 1 Ã  3 puces)

Chaque section doit contenir des puces. Si une section ne sâ€™applique pas, ne lâ€™Ã©cris pas,
sauf Conseils qui doit toujours apparaÃ®tre en derniÃ¨re section.
Si tu proposes une sÃ©ance, respecte ce format pour permettre l'ajout au programme.

Si tu donnes des conseils matÃ©riel/Ã©quipement, ajoute une section :
Produits suggÃ©rÃ©s :
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

