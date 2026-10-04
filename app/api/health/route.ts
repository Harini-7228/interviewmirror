import { NextResponse } from "next/server";
import { isGemmaConfigured } from "@/lib/ai/gemma";
import { isMongoConfigured, getDb } from "@/lib/db/mongodb";

export async function GET() {
  let mongoStatus = "not_configured";
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        await db.command({ ping: 1 });
        mongoStatus = "connected";
      } else {
        mongoStatus = "fallback_in_memory";
      }
    } catch {
      mongoStatus = "connection_error";
    }
  } else {
    mongoStatus = "in_memory_fallback";
  }

  const gemmaStatus = isGemmaConfigured() ? "live_api" : "demo_fallback";
  const elevenLabsStatus = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)
    ? "configured"
    : "browser_speech_fallback";

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      ai_engine: {
        provider: "Google Gemma",
        status: gemmaStatus,
        model: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it"
      },
      database: {
        provider: "MongoDB Atlas",
        status: mongoStatus
      },
      voice_synthesizer: {
        provider: "ElevenLabs",
        status: elevenLabsStatus
      }
    },
    version: "1.0.0"
  });
}
