import { z } from "zod";
import { difficulties, domains } from "@/lib/types";

const interviewModeSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const normalized = value.trim();
  const lookup = normalized.toLowerCase();

  if (lookup === "text" || lookup === "text & voice hybrid" || lookup === "text and voice hybrid" || lookup === "text & voice" || lookup === "text and voice") {
    return "Text";
  }

  if (lookup === "voice interviewer" || lookup === "voice interview" || lookup === "voice" || lookup === "voice interviewer (elevenlabs / webspeech)") {
    return "Voice interviewer";
  }

  return normalized;
}, z.enum(["Text", "Voice interviewer"]));

export const setupSchema = z.object({
  userId: z.string().trim().min(1).max(80).default("demo-user"),
  domain: z.enum(domains),
  difficulty: z.enum(difficulties),
  length: z.enum(["Quick", "Standard", "Deep"]),
  mode: interviewModeSchema,
  role: z.string().trim().max(80).optional(),
  focusArea: z.string().trim().max(120).optional()
});

export const startInterviewRequestSchema = z.object({
  action: z.literal("start"),
  setup: setupSchema
});

export const answerSubmissionRequestSchema = z.object({
  action: z.literal("answer"),
  interviewId: z.string().trim().min(1),
  answer: z.string().trim().min(3, "Answer is too short to evaluate.").max(4000, "Answer is too long for one response."),
  state: z.unknown().optional()
});

export const answerSchema = z.object({
  interviewId: z.string().trim().min(1),
  answer: z.string().trim().min(3, "Answer is too short to evaluate.").max(4000, "Answer is too long for one response."),
  state: z.unknown()
});

export const evaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  technicalScore: z.number().int().min(0).max(100),
  clarityScore: z.number().int().min(0).max(100),
  communicationScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  correctness: z.enum(["incorrect", "partially_correct", "mostly_correct", "correct"]),
  strengths: z.array(z.string().max(120)).max(6),
  weaknesses: z.array(z.string().max(120)).max(6),
  missingConcepts: z.array(z.string().max(80)).max(8),
  followUpNeeded: z.boolean(),
  followUpQuestion: z.string().max(280).nullable(),
  correctAnswer: z.string().max(1200).default(""),
  reason: z.string().max(360)
});
