import { describe, expect, it } from "vitest";
import { buildReport, buildWeaknesses } from "@/lib/scoring";
import type { Evaluation } from "@/lib/types";

const evaluations: Evaluation[] = [
  {
    score: 60,
    technicalScore: 62,
    clarityScore: 58,
    communicationScore: 65,
    confidenceScore: 55,
    correctness: "partially_correct",
    strengths: ["Basic Java knowledge"],
    weaknesses: ["HashMap collision handling"],
    missingConcepts: ["tree bins"],
    followUpNeeded: true,
    followUpQuestion: "How does Java 8 improve heavily-collided buckets?",
    correctAnswer: "Java 8 can treeify heavily-collided buckets when the table is large enough.",
    reason: "The answer misses internals."
  },
  {
    score: 74,
    technicalScore: 78,
    clarityScore: 72,
    communicationScore: 73,
    confidenceScore: 68,
    correctness: "mostly_correct",
    strengths: ["Clear example"],
    weaknesses: ["HashMap collision handling"],
    missingConcepts: [],
    followUpNeeded: false,
    followUpQuestion: null,
    correctAnswer: "A strong answer includes a clear example.",
    reason: "The answer improved."
  }
];

describe("scoring", () => {
  it("groups recurring weaknesses", () => {
    const weaknesses = buildWeaknesses(evaluations);
    expect(weaknesses[0].concept).toBe("HashMap collision handling");
    expect(weaknesses[0].occurrenceCount).toBe(2);
  });

  it("builds an honest report", () => {
    const report = buildReport("demo-user:test", evaluations, "demo");
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.provider).toBe("demo");
    expect(report.improvementPlan[0]).toContain("HashMap collision handling");
  });

  it("includes question-by-question model answers in the final report", () => {
    const answers = evaluations.map((evaluation, index) => ({
      question: `Question ${index + 1}`,
      answer: `Candidate answer ${index + 1}`,
      evaluation,
      askedAt: "2026-01-01T00:00:00.000Z"
    }));
    const report = buildReport("demo-user:test", evaluations, "demo", answers);

    expect(report.questionReviews).toHaveLength(2);
    expect(report.questionReviews[0].correctAnswer).toContain("treeify");
    expect(report.questionReviews[1].candidateAnswer).toBe("Candidate answer 2");
  });
});
