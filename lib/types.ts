export const domains = ["Java", "SQL", "DSA", "Computer Science", "Full Stack", "Custom"] as const;
export const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
export const interviewLengths = {
  Quick: 5,
  Standard: 10,
  Deep: 15
} as const;

export type Domain = (typeof domains)[number];
export type Difficulty = (typeof difficulties)[number];
export type InterviewLength = keyof typeof interviewLengths;
export type InterviewMode = "Text" | "Voice interviewer";

export type Weakness = {
  category: string;
  concept: string;
  severity: "low" | "medium" | "high";
  occurrenceCount?: number;
  improvementScore?: number;
};

export type InterviewSetup = {
  userId: string;
  domain: Domain;
  difficulty: Difficulty;
  length: InterviewLength;
  mode: InterviewMode;
  role?: string;
  focusArea?: string;
};

export type InterviewQuestion = {
  id: string;
  text: string;
  concept: string;
  source: "gemma" | "demo";
};

export type Evaluation = {
  score: number;
  technicalScore: number;
  clarityScore: number;
  communicationScore: number;
  confidenceScore: number;
  correctness: "incorrect" | "partially_correct" | "mostly_correct" | "correct";
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  followUpNeeded: boolean;
  followUpQuestion: string | null;
  correctAnswer: string;
  reason: string;
};

export type AnswerRecord = {
  question: string;
  answer: string;
  evaluation: Evaluation;
  askedAt: string;
};

export type InterviewState = {
  id: string;
  setup: InterviewSetup;
  startedAt: string;
  completedAt?: string;
  currentQuestion: InterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
  answers: AnswerRecord[];
  historicalWeaknesses: Weakness[];
};

export type InterviewReport = {
  interviewId: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  clarityScore: number;
  confidenceScore: number;
  followUpScore: number;
  strongAreas: string[];
  needsAttention: Weakness[];
  mostImportantWeakness: Weakness | null;
  improvementPlan: string[];
  nextInterviewFocus: string;
  questionReviews: Array<{
    question: string;
    candidateAnswer: string;
    correctAnswer: string;
    score: number;
    correctness: Evaluation["correctness"];
    feedback: string;
  }>;
  provider: "gemma" | "demo";
};
