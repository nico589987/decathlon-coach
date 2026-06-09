import { NextResponse } from "next/server";

const MAX_SPEECH_LENGTH = 900;

const VOICE_INSTRUCTIONS: Record<string, string> = {
  announce:
    "Tu es Alex, une coach sportive française, chaleureuse et professionnelle. Parle naturellement, avec énergie et bienveillance — comme si tu étais physiquement à côté de l'utilisateur. Voix claire, rythme vivant. Marque de courtes pauses entre les consignes techniques. Donne envie de commencer.",
  push:
    "Tu es une coach sportive française, très encourageante. Parle avec énergie et enthousiasme, phrase courte et percutante. Ton dynamisé, motivant, comme un dernier coup de boost. Pas trop fort, mais présent.",
  recovery:
    "Tu es une coach sportive française. Voix douce, apaisante, rythme lent. Laisse l'utilisateur souffler. Parle comme si tu posais une main sur l'épaule de quelqu'un qui vient de finir un effort.",
  finish:
    "Tu es une coach sportive française. Voix chaleureuse, fière et sincère. Célèbre l'effort accompli avec naturel — pas excessif, mais vraiment touché. Comme si tu félicitais personnellement quelqu'un que tu coaches depuis des mois.",
  default:
    "Tu es Alex, une coach sportive française, chaleureuse et motivante. Parle naturellement comme si tu étais à côté de l'utilisateur. Varie ton ton selon le contenu : dynamique pour lancer les exercices, calme pour la récupération, chaleureux pour les encouragements. Utilise des pauses naturelles. Donne l'impression d'être humaine.",
};

function detectMood(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("séance terminée") ||
    lower.includes("bravo") ||
    lower.includes("félicitations") ||
    lower.includes("tu l'as fait") ||
    lower.includes("tu peux être fier")
  )
    return "finish";
  if (
    lower.includes("récupér") ||
    lower.includes("souffle") ||
    lower.includes("pause") ||
    lower.includes("relâche") ||
    lower.includes("reprends")
  )
    return "recovery";
  if (
    lower.includes("pousse") ||
    lower.includes("dernier effort") ||
    lower.includes("plus que") ||
    lower.includes("accroche") ||
    lower.includes("allez") ||
    lower.includes("10 secondes") ||
    lower.includes("mi-chemin") ||
    lower.includes("moitié")
  )
    return "push";
  if (
    lower.includes("position de départ") ||
    lower.includes("mouvement") ||
    lower.includes("respiration") ||
    lower.includes("c'est parti")
  )
    return "announce";
  return "default";
}

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    const input = text?.trim();

    if (!input || input.length > MAX_SPEECH_LENGTH) {
      return NextResponse.json({ error: "Texte audio invalide." }, { status: 400 });
    }

    const mood = detectMood(input);
    const instructions = VOICE_INSTRUCTIONS[mood];

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "marin",
        input,
        instructions,
        response_format: "mp3",
        speed: mood === "push" ? 1.08 : mood === "recovery" ? 0.96 : 1.02,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI speech error", response.status, detail);
      return NextResponse.json({ error: "Voix naturelle indisponible." }, { status: response.status });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Speech route failed", error);
    return NextResponse.json({ error: "Impossible de générer la voix." }, { status: 503 });
  }
}
