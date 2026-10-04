import { NextResponse } from "next/server";
import { z } from "zod";

const voiceSchema = z.object({
  text: z.string().trim().min(1).max(800)
});

export async function POST(request: Request) {
  try {
    const { text } = voiceSchema.parse(await request.json());
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json(
        { error: "Voice is unavailable because ElevenLabs is not configured.", demoMode: true },
        { status: 503 }
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.46,
          similarity_boost: 0.74,
          style: 0.18,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Voice service is temporarily unavailable." }, { status: response.status });
    }

    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate voice." }, { status: 400 });
  }
}
