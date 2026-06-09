import { NextResponse } from "next/server";
import { getWorkoutSteps, WorkoutSession } from "@/lib/workout";

const workoutResponseSchema = {
  name: "coach_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: {
        type: "string",
        description:
          "Réponse conversationnelle chaleureuse et naturelle en français. Courte si pas de séance générée, plus riche sinon.",
      },
      suggestions: {
        type: "array",
        description:
          "2 à 3 suggestions courtes de réponse rapide pour l'utilisateur. Phrases très courtes, naturelles. Vide si la conversation est déjà bien orientée.",
        items: { type: "string" },
      },
      sessions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            objective: { type: "string" },
            level: { type: "string" },
            durationSeconds: { type: "integer" },
            equipment: { type: "array", items: { type: "string" } },
            steps: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  duration: { type: "integer" },
                  reps: {
                    type: "integer",
                    description: "Nombre de répétitions si basé sur les reps (ex: 12). Mettre 0 si l'exercice est basé sur le temps.",
                  },
                  kind: { type: "string", enum: ["warmup", "work", "recovery", "cooldown"] },
                  exerciseType: {
                    type: "string",
                    enum: ["cardio", "lower_body", "upper_body", "core", "mobility", "recovery"],
                  },
                  instruction: { type: "string" },
                  setup: { type: "string" },
                  movement: { type: "string" },
                  breathing: { type: "string" },
                  focus: { type: "string" },
                  coachCue: { type: "string" },
                },
                required: ["title", "duration", "reps", "kind", "exerciseType", "instruction", "setup", "movement", "breathing", "focus", "coachCue"],
              },
            },
          },
          required: ["title", "objective", "level", "durationSeconds", "equipment", "steps"],
        },
      },
    },
    required: ["reply", "suggestions", "sessions"],
  },
};

function extractReplyProgress(accumulated: string): string {
  const match = accumulated.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)(?:")?/);
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
}

export async function POST(req: Request) {
  const { messages, feedbackSummary, profileContext } = await req.json();

  const nameMatch = (profileContext as string | undefined)?.match(/Prénom\s*:\s*(.+)/);
  const userName = nameMatch?.[1]?.trim();
  const levelMatch = (profileContext as string | undefined)?.match(/Niveau\s*:\s*(.+)/);
  const userLevel = levelMatch?.[1]?.trim();

  const system = `Tu es Alex, coach sportif personnel Decathlon — chaleureux, direct et humain.
Tu parles toujours en français, tu tutoies, comme un ami qui s'y connaît vraiment en sport.
${userName ? `Tu parles avec ${userName}.` : ""}
${userLevel ? `Son niveau : ${userLevel}.` : ""}

Profil complet :
${profileContext || "non renseigné — pose des questions pour le découvrir"}

Retours sur ses dernières séances :
${feedbackSummary || "aucun retour pour l'instant"}

Ta personnalité :
- Tu t'intéresses à la personne, pas juste à la séance. Tu poses des questions.
- Tu utilises le prénom de temps en temps (pas à chaque phrase).
- Formules naturelles : "C'est noté", "Écoute...", "Je te propose...", "Vas-y !", "Top !", "Tu vois ce que je veux dire ?", "Honnêtement...", "Voilà ce qu'on va faire".
- Sois bref si l'utilisateur est bref. Développe quand il partage.
- Reconnais la fatigue, la frustration, les petites victoires — avant de proposer quoi que ce soit.
- Donne des conseils réels : récupération, hydratation, sommeil, échauffement, technique.
- Challenge les sportifs expérimentés, rassure les débutants.
- Fais des liens entre les séances : si la dernière était difficile, adapte.

Règles séances :
- Ne génère des séances QUE si l'utilisateur le demande explicitement.
- Si le niveau, la durée ou l'objectif manque : pose UNE question courte, renvoie sessions: [].
- Chaque séance : échauffement → exercices avec récupérations → retour au calme.
- Chaque étape = une action concrète et immédiate.
- Pas de Markdown dans les champs (ni #, *, listes décoratives).
- TOUS les champs JSON DOIVENT être en français. Jamais d'anglais.
- Coache l'effort : donne des repères techniques et des encouragements naturels dans coachCue.

Durée et structure :
- IMPORTANT : la somme de toutes les durées (en secondes) doit être très proche de durationSeconds. Génère suffisamment d'étapes pour remplir tout le temps demandé.
- Exercices basés sur le TEMPS (planche, cardio continu, gainage…) : reps = 0, duration = durée réelle en secondes.
- Exercices basés sur des RÉPÉTITIONS (squats, pompes, fentes…) : reps = nombre de reps (ex: 12), duration = estimation (reps × 3 à 4 secondes).
- Pour les circuits multi-séries : génère une étape "work" + une étape "recovery" PAR série (ex : Squats série 1 → Récupération → Squats série 2 → Récupération → Squats série 3). Ne regroupe jamais 3 séries en une seule étape.
- Les étapes recovery durent 20 à 60 secondes. Ne génère pas de recovery > 60s.

Suggestions :
- Propose 2-3 réponses rapides courtes et utiles quand c'est naturel (ex: après avoir posé une question, après une séance générée).
- Phrases courtes, tapables sur mobile. Pas de suggestions si la conversation est déjà bien lancée.`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.72,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
        response_format: { type: "json_schema", json_schema: workoutResponseSchema },
      }),
    });

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      console.error("OpenAI coach error", openaiRes.status, detail);
      const enc = new TextEncoder();
      const errStream = new ReadableStream({
        start(c) {
          c.enqueue(enc.encode(`data: ${JSON.stringify({ type: "apierror", status: openaiRes.status, detail })}\n\n`));
          c.close();
        },
      });
      return new Response(errStream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!openaiRes.body) { controller.close(); return; }
        const reader = openaiRes.body.getReader();
        let accumulated = "";
        let replyDisplayed = 0;
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (!delta) continue;
                accumulated += delta;

                const currentReply = extractReplyProgress(accumulated);
                if (currentReply.length > replyDisplayed) {
                  const newText = currentReply.slice(replyDisplayed);
                  replyDisplayed = currentReply.length;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "delta", text: newText })}\n\n`)
                  );
                }
              } catch {
                // ignore individual chunk parse errors
              }
            }
          }
        } catch (err) {
          console.error("Stream read error", err);
        }

        // Parse full response and send sessions + suggestions
        try {
          const fullParsed = JSON.parse(accumulated) as {
            reply: string;
            suggestions: string[];
            sessions: Array<Omit<WorkoutSession, "id">>;
          };

          const sessions = (fullParsed.sessions || []).map((session, index) => {
            const normalized: WorkoutSession = { ...session, id: `generated_${index}` };
            return { ...session, steps: getWorkoutSteps(normalized) };
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                reply: fullParsed.reply,
                suggestions: fullParsed.suggestions || [],
                sessions,
              })}\n\n`
            )
          );
        } catch (err) {
          console.error("Final parse error", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Erreur de parsing" })}\n\n`
            )
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Coach route failed", error);
    return NextResponse.json({ error: "Impossible de préparer une réponse." }, { status: 503 });
  }
}
