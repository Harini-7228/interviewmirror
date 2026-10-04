import { describe, expect, it } from "vitest";
import { evaluationSchema, setupSchema, answerSchema, startInterviewRequestSchema, answerSubmissionRequestSchema } from "@/lib/validation";
import { fallbackQuestion } from "@/lib/ai/prompts";

describe("AI response validation — evaluationSchema", () => {
  const validEval = {
    score: 72,
    technicalScore: 80,
    clarityScore: 70,
    communicationScore: 68,
    confidenceScore: 66,
    correctness: "mostly_correct",
    strengths: ["Explains hashing mechanism"],
    weaknesses: ["collision handling depth"],
    missingConcepts: ["tree bins in Java 8"],
    followUpNeeded: true,
    followUpQuestion: "What happens when two keys map to the same bucket?",
    reason: "The answer is directionally correct but misses collision details."
  };

  it("accepts a well-formed evaluation", () => {
    const result = evaluationSchema.parse(validEval);
    expect(result.score).toBe(72);
    expect(result.correctness).toBe("mostly_correct");
  });

  it("rejects score above 100", () => {
    expect(() => evaluationSchema.parse({ ...validEval, score: 140 })).toThrow();
  });

  it("rejects score below 0", () => {
    expect(() => evaluationSchema.parse({ ...validEval, score: -5 })).toThrow();
  });

  it("rejects invalid correctness enum", () => {
    expect(() => evaluationSchema.parse({ ...validEval, correctness: "great" })).toThrow();
  });

  it("rejects missing required fields", () => {
    const { score: _score, ...without } = validEval;
    expect(() => evaluationSchema.parse(without)).toThrow();
  });

  it("accepts all valid correctness values", () => {
    for (const correctness of ["incorrect", "partially_correct", "mostly_correct", "correct"]) {
      expect(() => evaluationSchema.parse({ ...validEval, correctness })).not.toThrow();
    }
  });

  it("allows followUpQuestion to be null", () => {
    const result = evaluationSchema.parse({ ...validEval, followUpNeeded: false, followUpQuestion: null });
    expect(result.followUpQuestion).toBeNull();
  });

  it("defaults a missing correct answer to an empty string", () => {
    expect(evaluationSchema.parse(validEval).correctAnswer).toBe("");
  });

  it("rejects followUpQuestion longer than 280 chars", () => {
    const tooLong = "a".repeat(281);
    expect(() => evaluationSchema.parse({ ...validEval, followUpQuestion: tooLong })).toThrow();
  });

  it("rejects too many strengths", () => {
    const tooMany = Array.from({ length: 10 }, (_, i) => `strength ${i}`);
    expect(() => evaluationSchema.parse({ ...validEval, strengths: tooMany })).toThrow();
  });
});

describe("setup validation — setupSchema", () => {
  const validSetup = {
    userId: "friend-user",
    domain: "Java",
    difficulty: "Intermediate",
    length: "Quick",
    mode: "Text",
    role: "Software Engineer Intern",
    focusArea: "HashMap internals"
  };

  it("accepts a valid setup", () => {
    const setup = setupSchema.parse(validSetup);
    expect(setup.domain).toBe("Java");
    expect(setup.difficulty).toBe("Intermediate");
  });

  it("accepts all valid domains", () => {
    for (const domain of ["Java", "SQL", "DSA", "Computer Science", "Full Stack", "Custom"]) {
      expect(() => setupSchema.parse({ ...validSetup, domain })).not.toThrow();
    }
  });

  it("accepts UI-friendly mode labels", () => {
    expect(() => setupSchema.parse({ ...validSetup, mode: "Text & Voice Hybrid" })).not.toThrow();
    expect(() => setupSchema.parse({ ...validSetup, mode: "Voice Interviewer" })).not.toThrow();
  });

  it("rejects unknown domain", () => {
    expect(() => setupSchema.parse({ ...validSetup, domain: "PHP" })).toThrow();
  });

  it("rejects unknown difficulty", () => {
    expect(() => setupSchema.parse({ ...validSetup, difficulty: "Expert" })).toThrow();
  });

  it("allows optional fields to be absent", () => {
    const { role: _r, focusArea: _f, ...minimal } = validSetup;
    expect(() => setupSchema.parse(minimal)).not.toThrow();
  });

  it("defaults userId to demo-user when missing", () => {
    const { userId: _id, ...withoutId } = validSetup;
    const result = setupSchema.parse(withoutId);
    expect(result.userId).toBe("demo-user");
  });
});

describe("request validation — start/answer payloads", () => {
  const validSetup = {
    userId: "friend-user",
    domain: "Java",
    difficulty: "Intermediate",
    length: "Quick",
    mode: "Text",
    role: "Software Engineer Intern",
    focusArea: "HashMap internals"
  } as const;

  it("accepts the start payload sent by the browser", () => {
    expect(() => startInterviewRequestSchema.parse({ action: "start", setup: validSetup })).not.toThrow();
  });

  it("accepts the answer payload sent by the browser", () => {
    const state = {
      id: "demo-user:abc-123",
      setup: validSetup,
      startedAt: "2026-01-01T00:00:00.000Z",
      currentQuestion: { id: "q1", text: "Explain HashMap internals.", concept: "HashMap", source: "demo" },
      questionNumber: 1,
      totalQuestions: 5,
      answers: [],
      historicalWeaknesses: []
    };

    expect(() => answerSubmissionRequestSchema.parse({
      action: "answer",
      interviewId: "demo-user:abc-123",
      answer: "HashMap stores entries in buckets and resolves collisions through chaining and treeification.",
      state
    })).not.toThrow();
  });
});

describe("difficulty-calibrated demo questions", () => {
  const baseSetup = {
    userId: "demo-user",
    domain: "Java" as const,
    length: "Quick" as const,
    mode: "Text" as const
  };

  it("generates distinct beginner, intermediate, and advanced questions", () => {
    const beginner = fallbackQuestion({ ...baseSetup, difficulty: "Beginner" });
    const intermediate = fallbackQuestion({ ...baseSetup, difficulty: "Intermediate" });
    const advanced = fallbackQuestion({ ...baseSetup, difficulty: "Advanced" });

    expect(beginner.question).toContain("What is a Java HashMap");
    expect(intermediate.question).toContain("handles collisions");
    expect(advanced.question).toContain("low-entropy");
    expect(new Set([beginner.question, intermediate.question, advanced.question]).size).toBe(3);
  });
});

describe("answer validation — answerSchema", () => {
  const validAnswer = {
    interviewId: "demo-user:abc-123",
    answer: "A HashMap uses hashing to store key-value pairs in buckets.",
    state: {}
  };

  it("accepts a valid answer", () => {
    expect(() => answerSchema.parse(validAnswer)).not.toThrow();
  });

  it("rejects answer shorter than 3 characters", () => {
    expect(() => answerSchema.parse({ ...validAnswer, answer: "ab" })).toThrow();
  });

  it("rejects answer longer than 4000 characters", () => {
    expect(() => answerSchema.parse({ ...validAnswer, answer: "x".repeat(4001) })).toThrow();
  });

  it("rejects empty answer", () => {
    expect(() => answerSchema.parse({ ...validAnswer, answer: "" })).toThrow();
  });

  it("rejects whitespace-only answer", () => {
    expect(() => answerSchema.parse({ ...validAnswer, answer: "   " })).toThrow();
  });
});
