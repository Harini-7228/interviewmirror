import { NextResponse } from "next/server";
import { generateQuestion, evaluateAnswer } from "@/lib/ai/gemma";
import { appendAnswer, clearUserHistory, completeInterview, createInterviewId, getHistoricalWeaknesses, getHistory, saveInterview } from "@/lib/db/interviews";
import { interviewLengths, type InterviewState } from "@/lib/types";
import { answerSchema, answerSubmissionRequestSchema, setupSchema, startInterviewRequestSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "demo-user";
  const history = await getHistory(userId);
  const weaknesses = await getHistoricalWeaknesses(userId);
  return NextResponse.json({ history, weaknesses });
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "demo-user";
    await clearUserHistory(userId);
    return NextResponse.json({ success: true, message: `History cleared for ${userId}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not clear history." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body?.action === "answer") {
      const payload = answerSubmissionRequestSchema.parse(body);
      const state = payload.state as InterviewState | undefined;
      if (!state) {
        throw new Error("Missing interview state. Please restart the interview.");
      }

      const answerText = payload.answer;
      const { evaluation, provider } = await evaluateAnswer(state.setup, state.currentQuestion.text, answerText, state.answers);
      const answeredState = await appendAnswer(state, {
        question: state.currentQuestion.text,
        answer: answerText,
        evaluation,
        askedAt: new Date().toISOString()
      });

      const shouldFinish = answeredState.answers.length >= state.totalQuestions;
      if (shouldFinish) {
        const { completed, report } = await completeInterview(answeredState, provider);
        return NextResponse.json({ state: completed, evaluation, report, finished: true, provider });
      }

      const followUp = evaluation.followUpNeeded && evaluation.followUpQuestion
        ? {
            id: crypto.randomUUID(),
            text: evaluation.followUpQuestion,
            concept: evaluation.missingConcepts[0] || evaluation.weaknesses[0] || state.currentQuestion.concept,
            source: provider
          }
        : await generateQuestion(state.setup, answeredState.historicalWeaknesses);

      const nextState: InterviewState = {
        ...answeredState,
        currentQuestion: followUp,
        questionNumber: answeredState.questionNumber + 1
      };

      await saveInterview(nextState);
      return NextResponse.json({ state: nextState, evaluation, finished: false, provider });
    }

    if (body?.action === "start") {
      const payload = startInterviewRequestSchema.parse(body);
      const setup = payload.setup;
      const historicalWeaknesses = await getHistoricalWeaknesses(setup.userId);
      const currentQuestion = await generateQuestion(setup, historicalWeaknesses);
      const state: InterviewState = {
        id: createInterviewId(setup),
        setup,
        startedAt: new Date().toISOString(),
        currentQuestion,
        questionNumber: 1,
        totalQuestions: interviewLengths[setup.length],
        answers: [],
        historicalWeaknesses
      };
      await saveInterview(state);
      return NextResponse.json({ state, demoMode: currentQuestion.source === "demo" });
    }

    const setup = setupSchema.parse(body);
    const historicalWeaknesses = await getHistoricalWeaknesses(setup.userId);
    const currentQuestion = await generateQuestion(setup, historicalWeaknesses);
    const state: InterviewState = {
      id: createInterviewId(setup),
      setup,
      startedAt: new Date().toISOString(),
      currentQuestion,
      questionNumber: 1,
      totalQuestions: interviewLengths[setup.length],
      answers: [],
      historicalWeaknesses
    };
    await saveInterview(state);
    return NextResponse.json({ state, demoMode: currentQuestion.source === "demo" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start interview." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const payload = body?.action === "answer" ? answerSubmissionRequestSchema.parse(body) : answerSchema.parse(body);

    const state = payload.state as InterviewState | undefined;
    if (!state) {
      throw new Error("Missing interview state. Please restart the interview.");
    }

    const answerText = payload.answer;
    const { evaluation, provider } = await evaluateAnswer(state.setup, state.currentQuestion.text, answerText, state.answers);
    const answeredState = await appendAnswer(state, {
      question: state.currentQuestion.text,
      answer: answerText,
      evaluation,
      askedAt: new Date().toISOString()
    });

    const shouldFinish = answeredState.answers.length >= state.totalQuestions;
    if (shouldFinish) {
      const { completed, report } = await completeInterview(answeredState, provider);
      return NextResponse.json({ state: completed, evaluation, report, finished: true, provider });
    }

    const followUp = evaluation.followUpNeeded && evaluation.followUpQuestion
      ? {
          id: crypto.randomUUID(),
          text: evaluation.followUpQuestion,
          concept: evaluation.missingConcepts[0] || evaluation.weaknesses[0] || state.currentQuestion.concept,
          source: provider
        }
      : await generateQuestion(state.setup, answeredState.historicalWeaknesses);

    const nextState: InterviewState = {
      ...answeredState,
      currentQuestion: followUp,
      questionNumber: answeredState.questionNumber + 1
    };

    await saveInterview(nextState);
    return NextResponse.json({ state: nextState, evaluation, finished: false, provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not evaluate answer." }, { status: 400 });
  }
}
