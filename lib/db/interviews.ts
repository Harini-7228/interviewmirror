import type { AnswerRecord, InterviewReport, InterviewSetup, InterviewState, Weakness } from "@/lib/types";
import { buildReport } from "@/lib/scoring";
import { getDb } from "@/lib/db/mongodb";

const memoryStore = new Map<string, InterviewState>();
const reportStore = new Map<string, InterviewReport>();

export async function getHistoricalWeaknesses(userId: string): Promise<Weakness[]> {
  const db = await getDb();
  if (!db) {
    const reports = Array.from(reportStore.values()).filter((report) => report.interviewId.startsWith(`${userId}:`));
    return reports.flatMap((report) => report.needsAttention).slice(0, 5);
  }

  return db
    .collection<Weakness & { userId: string }>("weaknesses")
    .find({ userId })
    .sort({ occurrenceCount: -1, lastDetected: -1 })
    .limit(5)
    .toArray();
}

export async function saveInterview(state: InterviewState) {
  const db = await getDb();
  memoryStore.set(state.id, state);
  if (!db) return;
  await db.collection("interviews").updateOne({ id: state.id }, { $set: state }, { upsert: true });
}

export async function appendAnswer(state: InterviewState, answer: AnswerRecord) {
  const nextState = { ...state, answers: [...state.answers, answer] };
  await saveInterview(nextState);
  return nextState;
}

export async function completeInterview(state: InterviewState, provider: "gemma" | "demo") {
  const completed = { ...state, completedAt: new Date().toISOString() };
  const report = buildReport(completed.id, completed.answers.map((item) => item.evaluation), provider, completed.answers);
  const db = await getDb();

  memoryStore.set(completed.id, completed);
  reportStore.set(completed.id, report);

  if (db) {
    await db.collection("interviews").updateOne({ id: completed.id }, { $set: completed }, { upsert: true });
    await db.collection("reports").updateOne({ interviewId: report.interviewId }, { $set: report }, { upsert: true });
    if (report.needsAttention.length) {
      await Promise.all(
        report.needsAttention.map((weakness) =>
          db.collection("weaknesses").updateOne(
            { userId: completed.setup.userId, concept: weakness.concept },
            {
              $set: {
                concept: weakness.concept,
                category: weakness.category,
                severity: weakness.severity,
                userId: completed.setup.userId,
                lastDetected: new Date()
              },
              $setOnInsert: { firstDetected: new Date() },
              $inc: { occurrenceCount: 1 }
            },
            { upsert: true }
          )
        )
      );
    }
  }

  return { completed, report };
}

export async function getHistory(userId: string) {
  const db = await getDb();
  if (!db) {
    return Array.from(reportStore.values())
      .filter((report) => report.interviewId.startsWith(`${userId}:`))
      .slice(-20);
  }
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return db
    .collection<InterviewReport>("reports")
    .find({ interviewId: { $regex: `^${escaped}:` } })
    .sort({ _id: -1 })
    .limit(20)
    .toArray();
}

export async function clearUserHistory(userId: string): Promise<void> {
  const db = await getDb();
  // Clear in-memory maps
  for (const key of Array.from(memoryStore.keys())) {
    if (key.startsWith(`${userId}:`)) memoryStore.delete(key);
  }
  for (const key of Array.from(reportStore.keys())) {
    if (key.startsWith(`${userId}:`)) reportStore.delete(key);
  }

  if (db) {
    const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await Promise.all([
      db.collection("interviews").deleteMany({ id: { $regex: `^${escaped}:` } }),
      db.collection("reports").deleteMany({ interviewId: { $regex: `^${escaped}:` } }),
      db.collection("weaknesses").deleteMany({ userId })
    ]);
  }
}

export function createInterviewId(setup: InterviewSetup) {
  return `${setup.userId}:${crypto.randomUUID()}`;
}
