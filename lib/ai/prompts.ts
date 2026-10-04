import type { AnswerRecord, InterviewSetup, Weakness } from "@/lib/types";

const fallbackQuestionBank: Record<InterviewSetup["domain"], Record<InterviewSetup["difficulty"], { question: string; concept: string; answer: string }>> = {
  Java: {
    Beginner: { question: "What is a Java HashMap, and how would you use it to look up a value by its key?", concept: "HashMap basics", answer: "A HashMap stores key-value pairs and uses a key's hash to find a bucket for the value. For example, a map from usernames to user records can retrieve a record by username. Keys should have stable equals and hashCode implementations; lookup is typically constant time but can degrade with collisions." },
    Intermediate: { question: "Explain how a Java HashMap handles collisions and how its bucket structure changes when collisions become frequent.", concept: "HashMap collision handling", answer: "A HashMap hashes the key to select a bucket. Colliding entries are stored together; Java 8+ uses a linked structure and can treeify a sufficiently large bucket when the table is also large enough. Resizing redistributes entries as capacity grows. Good hashCode and equals implementations are essential; typical lookup is O(1), with tree bins improving heavily-collided lookups toward O(log n)." },
    Advanced: { question: "Analyze how low-entropy hashCode implementations affect Java HashMap performance, including resizing and treeification thresholds.", concept: "HashMap performance internals", answer: "Low-entropy hashes concentrate keys into a small number of buckets, increasing collision-chain traversal and degrading lookup from expected O(1). In Java 8+, a bucket may treeify at TREEIFY_THRESHOLD (8) only when table capacity is at least MIN_TREEIFY_CAPACITY (64); otherwise the table resizes. Tree bins improve worst-case lookup toward O(log n), subject to key comparability/tie-breaking. A correct, well-distributed hashCode and consistent equals reduce collisions." }
  },
  SQL: {
    Beginner: { question: "What does a SELECT query do, and how would you retrieve only rows matching a condition?", concept: "SELECT and WHERE", answer: "SELECT retrieves columns from a table. A WHERE clause filters rows, for example SELECT name FROM users WHERE active = true. SELECT chooses the output columns, while WHERE chooses which rows appear." },
    Intermediate: { question: "Given customers and orders tables, explain how you would return each customer with their total order count, including customers with no orders.", concept: "SQL joins and aggregation", answer: "Use a LEFT JOIN from customers to orders so customers without orders remain, then GROUP BY the customer key and selected customer columns and COUNT the order key. COUNT(order.id) returns zero for unmatched rows; COUNT(*) would count the null-extended row. The join key and grouping preserve one result per customer." },
    Advanced: { question: "A query joining several large tables is slow despite indexes. How would you diagnose and improve it without changing its results?", concept: "Query plans and optimization", answer: "Inspect the execution plan for scans, join order, cardinality-estimation errors, spills, and expensive sorts. Compare estimated and actual row counts, ensure predicates and join columns have suitable indexes, avoid non-sargable predicates, and select only needed columns. Update statistics and test candidate indexes or rewrites against representative data, verifying semantics and measuring the plan/runtime." }
  },
  DSA: {
    Beginner: { question: "How would you find the largest number in an unsorted array? Explain the basic steps.", concept: "Array traversal", answer: "Initialize a variable with the first element, scan the remaining elements once, and update the variable whenever a larger value is found. This takes O(n) time and O(1) extra space; an empty array needs explicit handling." },
    Intermediate: { question: "How would you find a target in a sorted array efficiently, and what invariant makes the method correct?", concept: "Binary search", answer: "Binary search compares the target with the middle element and discards the half that cannot contain it. The invariant is that if the target exists, it remains within the current inclusive search interval. Each step halves the interval, yielding O(log n) time and O(1) iterative space; sorted input is required." },
    Advanced: { question: "Design an approach to find shortest paths in a weighted directed graph with nonnegative edge weights, and analyze its complexity.", concept: "Dijkstra shortest paths", answer: "Use Dijkstra's algorithm: initialize source distance to zero, repeatedly extract the unsettled vertex with minimum tentative distance, then relax its outgoing edges. A min-priority queue implementation is O((V+E) log V) with adjacency lists. Nonnegative weights are required; negative edges invalidate the greedy finalization step." }
  },
  "Computer Science": {
    Beginner: { question: "What is the difference between a process and a thread?", concept: "Processes and threads", answer: "A process is an executing program with its own address space and resources. Threads are execution paths within a process; they share that process's memory and resources but have their own stacks and registers. Threads can communicate cheaply through shared memory but require synchronization." },
    Intermediate: { question: "What conditions can cause a deadlock, and name one practical way to prevent it.", concept: "Deadlocks", answer: "Deadlock requires mutual exclusion, hold-and-wait, no preemption, and circular wait. Preventing one condition breaks the cycle; for example, acquiring locks in a consistent global order prevents circular wait. Timeouts and deadlock detection are alternative mitigation strategies." },
    Advanced: { question: "In a distributed system, how do consistency and availability trade-offs appear during a network partition?", concept: "Distributed consistency", answer: "During a partition, nodes cannot reliably coordinate. A system that remains available may accept operations on both sides and later reconcile, risking temporarily inconsistent reads; a strongly consistent system may reject or delay operations until coordination is possible. The choice depends on operation semantics, failure model, and recovery strategy." }
  },
  "Full Stack": {
    Beginner: { question: "Describe what happens from the moment a user clicks a button in a web page to when updated content appears.", concept: "Web request flow", answer: "The browser handles the click event, runs client-side code, and may send an HTTP request to a server. The server processes it and returns a response, often JSON. The client then updates application state and renders the changed UI; errors and loading states should also be handled." },
    Intermediate: { question: "In React, how can state updates cause rendering, and why should state not be mutated directly?", concept: "React state and rendering", answer: "A state setter schedules an update; React renders the component again using the new state and reconciles the resulting UI. Direct mutation may preserve the same object identity and does not notify React reliably, leading to stale UI and side effects. Create a new object or array when updating state." },
    Advanced: { question: "How would you diagnose and reduce hydration mismatches and slow rendering in a server-rendered React application?", concept: "SSR hydration and performance", answer: "Hydration mismatches occur when server and initial client renders differ, often due to time/random/browser-only data or inconsistent state. Make the initial output deterministic, defer browser-only work until effects, and inspect console warnings. Profile rendering, reduce unnecessary work, split or defer noncritical code, and use caching/streaming appropriately while preserving server-client consistency." }
  },
  Custom: {
    Beginner: { question: "Explain the basic purpose of the selected topic and give a simple example of how it is used.", concept: "Core concept", answer: "A strong answer should define the topic in plain language, describe its basic purpose, and give a correct, concrete example of its use. It should distinguish the concept from closely related ideas." },
    Intermediate: { question: "Explain how the selected topic works in practice, and discuss one important trade-off or limitation.", concept: "Mechanism and trade-offs", answer: "A strong answer should explain the mechanism step by step, connect it to a practical use case, and identify a meaningful trade-off or limitation with its consequences." },
    Advanced: { question: "Analyze a difficult real-world scenario involving the selected topic, including edge cases and design trade-offs.", concept: "Advanced application", answer: "A strong answer should state assumptions, analyze the underlying mechanism and edge cases, compare viable approaches, justify a choice against constraints, and discuss failure modes and trade-offs." }
  }
};

export function fallbackQuestion(setup: InterviewSetup) {
  const item = fallbackQuestionBank[setup.domain][setup.difficulty];
  if (setup.domain === "Custom" && setup.focusArea?.trim()) {
    return {
      ...item,
      question: item.question.replace("selected topic", setup.focusArea.trim()),
      concept: setup.focusArea.trim().slice(0, 80)
    };
  }
  return item;
}

export function fallbackAnswerForQuestion(question: string, setup: InterviewSetup): string {
  const entry = Object.values(fallbackQuestionBank)
    .flatMap((byDifficulty) => Object.values(byDifficulty))
    .find((item) => item.question === question);
  if (entry) return entry.answer;

  return `A strong answer should directly address the question: “${question}” State the relevant principle, explain the mechanism step by step, apply it to a concrete example, and mention important edge cases or trade-offs for ${setup.difficulty.toLowerCase()} level.`;
}

export function questionPrompt(setup: InterviewSetup, weaknesses: Weakness[]): string {
  const weaknessContext =
    weaknesses.length > 0
      ? `Prior weakness areas to deliberately re-test using DIFFERENT wording, scenario, or angle (do NOT repeat old phrasing):
${weaknesses.map((w) => `• ${w.concept} (severity: ${w.severity}, category: ${w.category})`).join("\n")}`
      : "No prior weaknesses recorded. Begin with a solid foundational question appropriate for the stated difficulty.";

  const lengthHint =
    setup.difficulty === "Advanced"
      ? "DIFFICULT/ADVANCED: probe edge cases, architecture, implementation internals, or rigorous analysis; assume strong foundational knowledge. Do not ask a basic definition question."
      : setup.difficulty === "Beginner"
        ? "EASY/BEGINNER: test a foundational concept, simple definition, or straightforward use case; avoid hidden edge cases and advanced internals."
        : "MEDIUM/INTERMEDIATE: require explaining a mechanism and applying it to a realistic example or trade-off; avoid both introductory-only and expert-only questions.";

  return `You are a senior technical interviewer conducting a placement interview. Your task is to generate ONE focused, realistic interview question.

CONTEXT:
- Domain: ${setup.domain}
- Difficulty: ${setup.difficulty}
- Target role: ${setup.role || "Software Engineer Intern"}
- Focus area: ${setup.focusArea || "not specified"}

${weaknessContext}

QUESTION REQUIREMENTS:
- ${lengthHint}
- Be concise but specific — avoid vague or ambiguous questions
- Ask about ONE clear concept, not a list
- The question must feel like it comes from a real interviewer, not a quiz app
- If re-testing a weakness, approach from a fresh angle (e.g., apply-it-in-a-scenario vs. what-is-it), but NEVER change the requested difficulty tier
- The requested difficulty tier is authoritative: ${setup.difficulty}. Do not let historical weaknesses make the question easier or harder
- Do NOT ask "List 5 things about X" — instead ask the candidate to explain, justify, or apply a concept

Respond with ONLY valid JSON, no markdown, no preamble:
{"question":"<the interview question>","concept":"<the core concept being tested, max 60 chars>"}`;
}

export function evaluationPrompt(
  setup: InterviewSetup,
  question: string,
  answer: string,
  history: AnswerRecord[]
): string {
  const recentContext =
    history.length > 0
      ? `Recent exchange context (last ${Math.min(history.length, 3)} answers):
${history
  .slice(-3)
  .map(
    (h, i) =>
      `[Q${i + 1}] ${h.question}\nScore: ${h.evaluation.score}/100 — Weaknesses: ${h.evaluation.weaknesses.join(", ") || "none"}`
  )
  .join("\n\n")}`
      : "This is the first answer in this interview session.";

  return `You are evaluating a candidate's answer in a technical placement interview. Be rigorous, specific, and fair.

EVALUATION CONTEXT:
- Domain: ${setup.domain}
- Difficulty: ${setup.difficulty}
- Target role: ${setup.role || "Software Engineer Intern"}

QUESTION ASKED:
${question}

CANDIDATE ANSWER:
${answer}

${recentContext}

EVALUATION RULES:
1. Distinguish technical correctness from completeness — a correct but shallow answer is not the same as a strong answer
2. Score 0-100: 0-39 incorrect/fundamental gaps, 40-64 partially correct, 65-79 mostly correct, 80-100 correct and thorough
3. Identify concrete missing concepts by name — not vague feedback like "needs improvement"
4. The followUpQuestion must be GROUNDED in the candidate's actual answer — quote or reference what they said
5. Keep the score explanation concise; put the actual model answer only in the separate correctAnswer field
6. Do not judge personality, tone, or sensitive traits
7. Strengths and weaknesses must be specific to THIS answer, not generic praise
8. If the answer is very short or off-topic, reflect that in the score and reason
9. Include a concise, technically correct model answer to the question so the candidate can learn after submitting
10. Calibrate expectations to ${setup.difficulty}: beginner answers should demonstrate fundamentals; intermediate answers should explain mechanism/application; advanced answers should address edge cases and trade-offs
11. Any follow-up question must stay at the same ${setup.difficulty} tier as the main question

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "score": <0-100 integer>,
  "technicalScore": <0-100 integer>,
  "clarityScore": <0-100 integer>,
  "communicationScore": <0-100 integer>,
  "confidenceScore": <0-100 integer>,
  "correctness": "incorrect" | "partially_correct" | "mostly_correct" | "correct",
  "strengths": ["<specific strength>"],
  "weaknesses": ["<specific weakness>"],
  "missingConcepts": ["<concept name>"],
  "followUpNeeded": true | false,
  "followUpQuestion": "<grounded follow-up based on candidate's answer, or null>",
  "correctAnswer": "<concise technically correct model answer to the question>",
  "reason": "<one clear sentence summarizing the evaluation>"
}`;
}
