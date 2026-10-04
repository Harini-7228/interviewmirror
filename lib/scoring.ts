import type { AnswerRecord, Evaluation, InterviewReport, Weakness } from "@/lib/types";

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildWeaknesses(evaluations: Evaluation[]): Weakness[] {
  const counts = new Map<string, { count: number; severity: Weakness["severity"] }>();

  for (const evaluation of evaluations) {
    for (const concept of [...evaluation.weaknesses, ...evaluation.missingConcepts]) {
      const key = concept.trim();
      if (!key) continue;
      const severity: Weakness["severity"] = evaluation.score < 45 ? "high" : evaluation.score < 70 ? "medium" : "low";
      const current = counts.get(key);
      counts.set(key, {
        count: (current?.count ?? 0) + 1,
        severity: current?.severity === "high" || severity === "high" ? "high" : severity
      });
    }
  }

  return Array.from(counts.entries())
    .map(([concept, value]) => ({
      category: concept.toLowerCase().includes("clar") ? "communication" : "technical",
      concept,
      severity: value.severity,
      occurrenceCount: value.count
    }))
    .sort((a, b) => (b.occurrenceCount ?? 0) - (a.occurrenceCount ?? 0));
}

export function buildReport(interviewId: string, evaluations: Evaluation[], provider: "gemma" | "demo", answers: AnswerRecord[] = []): InterviewReport {
  const weaknesses = buildWeaknesses(evaluations);
  const technicalScore = average(evaluations.map((item) => item.technicalScore));
  const communicationScore = average(evaluations.map((item) => item.communicationScore));
  const clarityScore = average(evaluations.map((item) => item.clarityScore));
  const confidenceScore = average(evaluations.map((item) => item.confidenceScore));
  const followUpScore = average(evaluations.map((item) => (item.followUpNeeded ? Math.max(30, item.score - 12) : item.score)));
  const overallScore = average([technicalScore, communicationScore, clarityScore, confidenceScore, followUpScore]);
  const strongAreas = Array.from(new Set(evaluations.flatMap((item) => item.strengths))).slice(0, 4);
  const mostImportantWeakness = weaknesses[0] ?? null;

  return {
    interviewId,
    overallScore,
    technicalScore,
    communicationScore,
    clarityScore,
    confidenceScore,
    followUpScore,
    strongAreas: strongAreas.length ? strongAreas : ["Completed the interview loop"],
    needsAttention: weaknesses.slice(0, 5),
    mostImportantWeakness,
    improvementPlan: weaknesses.slice(0, 3).map((weakness) => `Practice explaining ${weakness.concept} with one example and one follow-up question.`),
    nextInterviewFocus: mostImportantWeakness
      ? `Next interview will revisit ${mostImportantWeakness.concept} using a different scenario.`
      : "Next interview can increase difficulty and test transfer of knowledge.",
    questionReviews: answers.map((item) => ({
      question: item.question,
      candidateAnswer: item.answer,
      correctAnswer: item.evaluation.correctAnswer,
      score: item.evaluation.score,
      correctness: item.evaluation.correctness,
      feedback: item.evaluation.reason
    })),
    provider
  };
}
