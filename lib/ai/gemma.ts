import { evaluationSchema } from "@/lib/validation";
import type { AnswerRecord, Evaluation, InterviewQuestion, InterviewSetup, Weakness } from "@/lib/types";
import { evaluationPrompt, fallbackAnswerForQuestion, fallbackQuestion, questionPrompt } from "@/lib/ai/prompts";

/* ─── Types ──────────────────────────────────────────── */
type GemmaResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

/* ─── JSON extraction ────────────────────────────────── */
function extractJson(text: string): unknown {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text.trim();

  // Try direct parse first
  try {
    return JSON.parse(candidate);
  } catch {
    // Try slice from first { to last }
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        // Find balanced JSON object if text contains trailing thoughts
        let depth = 0;
        let startIdx = -1;
        for (let i = 0; i < candidate.length; i++) {
          if (candidate[i] === "{") {
            if (depth === 0) startIdx = i;
            depth++;
          } else if (candidate[i] === "}") {
            depth--;
            if (depth === 0 && startIdx !== -1) {
              try {
                return JSON.parse(candidate.slice(startIdx, i + 1));
              } catch {
                // keep scanning
              }
            }
          }
        }
      }
    }
    throw new Error("No valid JSON object found in Gemma model response.");
  }
}

export function isGemmaConfigured(): boolean {
  return Boolean(process.env.GEMMA_API_KEY && process.env.GEMMA_API_URL);
}

/* ─── Core Gemma call ────────────────────────────────── */
async function callGemma(prompt: string): Promise<string> {
  const apiKey = process.env.GEMMA_API_KEY;
  const apiUrl = process.env.GEMMA_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("Gemma provider is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);

  try {
    const response = await fetch(`${apiUrl}${apiUrl.includes("?") ? "&" : "?"}key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          maxOutputTokens: 3072,
          responseMimeType: "application/json"
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      }),
      signal: controller.signal
    });

    if (response.status === 429) {
      throw new Error("Gemma rate limit reached. Please wait a moment and try again.");
    }

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as GemmaResponse;
      throw new Error(`Gemma request failed (${response.status}): ${errBody.error?.message ?? "unknown error"}`);
    }

    const data = (await response.json()) as GemmaResponse;

    // Check if the candidate was blocked (finishReason = SAFETY / RECITATION / OTHER)
    const candidate = data.candidates?.[0] as {
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      finishReason?: string;
    } | undefined;
    if (candidate?.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
      throw new Error(`Gemma response blocked (finishReason: ${candidate.finishReason}). Using fallback.`);
    }

    const parts = candidate?.content?.parts ?? [];
    // Prefer non-thought parts (direct answer); fallback to full parts if thoughts contain the JSON
    const nonThoughtParts = parts.filter((p) => !p.thought);
    const nonThoughtText = nonThoughtParts.map((p) => p.text ?? "").join("").trim();
    const allText = parts.map((p) => p.text ?? "").join("").trim();

    const text = (nonThoughtText.includes("{") && nonThoughtText.includes("}"))
      ? nonThoughtText
      : allText;

    if (!text.trim()) {
      throw new Error("Gemma returned an empty response.");
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Gemma request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

/* ─── generateQuestion ───────────────────────────────── */
export async function generateQuestion(
  setup: InterviewSetup,
  weaknesses: Weakness[]
): Promise<InterviewQuestion> {
  try {
    const raw = await callGemma(questionPrompt(setup, weaknesses));
    const parsed = extractJson(raw) as { question?: unknown; concept?: unknown };
    if (typeof parsed.question !== "string" || typeof parsed.concept !== "string") {
      throw new Error("Question response missing required string fields.");
    }
    return {
      id: crypto.randomUUID(),
      text: parsed.question.trim().slice(0, 400),
      concept: parsed.concept.trim().slice(0, 80),
      source: "gemma"
    };
  } catch (err) {
    // Log the real error so we can diagnose it
    console.error("[generateQuestion] Gemma call failed:", err);
    // Graceful fallback — clearly labeled as demo
    const fallback = fallbackQuestion(setup);
    const concept = fallback.concept || setup.focusArea?.trim() || weaknesses[0]?.concept || `${setup.domain} core concepts`;

    return {
      id: crypto.randomUUID(),
      text: fallback.question,
      concept,
      source: "demo"
    };
  }
}

/* ─── evaluateAnswer ─────────────────────────────────── */
export async function evaluateAnswer(
  setup: InterviewSetup,
  question: string,
  answer: string,
  history: AnswerRecord[]
): Promise<{ evaluation: Evaluation; provider: "gemma" | "demo" }> {
  try {
    const raw = await callGemma(evaluationPrompt(setup, question, answer, history));
    const evaluation = evaluationSchema.parse(extractJson(raw));
    if (!evaluation.correctAnswer.trim()) {
      evaluation.correctAnswer = fallbackAnswerForQuestion(question, setup);
    }
    return { evaluation, provider: "gemma" };
  } catch {
    // Local heuristic fallback — clearly labeled
    const answerLower = answer.toLowerCase();
    const hasExample = /example|for instance|such as|because|therefore|this means/.test(answerLower);
    const hasTechnical = /hash|index|bucket|tree|complexity|join|index|stack|heap|api|state|pointer|cache|queue|graph|node|algorithm/.test(answerLower);
    const hasDepth = answer.length > 200;
    const hedging = /maybe|i think|not sure|i guess|probably|i believe/.test(answerLower);

    const base = Math.min(40, Math.round(answer.trim().length / 15));
    const score = Math.min(82, base + (hasExample ? 14 : 0) + (hasTechnical ? 16 : 0) + (hasDepth ? 10 : 0) - (hedging ? 8 : 0));
    const missing: string[] = [];
    if (!hasExample) missing.push("concrete example");
    if (!hasTechnical) missing.push("internal mechanism or technical detail");
    if (!hasDepth) missing.push("in-depth explanation");

    return {
      provider: "demo",
      evaluation: {
        score,
        technicalScore: Math.min(90, score + (hasTechnical ? 8 : -8)),
        clarityScore: Math.min(88, score + (hasExample ? 6 : -5)),
        communicationScore: Math.min(88, score + (answer.length > 150 ? 5 : -6)),
        confidenceScore: Math.min(85, score + (hedging ? -12 : 4)),
        correctness:
          score >= 75 ? "mostly_correct" : score >= 55 ? "partially_correct" : "incorrect",
        strengths: hasTechnical
          ? ["Mentions a relevant technical detail"]
          : hasExample
            ? ["Provides an example"]
            : ["Engages with the question"],
        weaknesses: missing.length ? missing : ["follow-up depth"],
        missingConcepts: missing,
        followUpNeeded: score < 80,
        followUpQuestion:
          score < 80
            ? `You mentioned aspects of ${question.split(" ").slice(0, 5).join(" ")}. What would happen in a worst-case or edge-case scenario? Walk through it step by step.`
            : null,
        correctAnswer: fallbackAnswerForQuestion(question, setup),
        reason:
          "Demo evaluation — Gemma is not configured or returned an invalid response. This score is a local heuristic, not AI output."
      }
    };
  }
}
