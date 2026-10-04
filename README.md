# InterviewMirror

> **An AI interviewer that remembers where you struggle.**

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026-orange)](https://hacktoberfest.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Gemma](https://img.shields.io/badge/AI-Gemma-blue)](https://ai.google.dev)
[![MongoDB Atlas](https://img.shields.io/badge/DB-MongoDB_Atlas-green)](https://www.mongodb.com/atlas)
[![ElevenLabs](https://img.shields.io/badge/Voice-ElevenLabs-purple)](https://elevenlabs.io)
[![Render](https://img.shields.io/badge/Deploy-Render-teal)](https://render.com)

**GitHub:** [Harini-7228/interviewmirror](https://github.com/Harini-7228/interviewmirror) · [Report an issue](https://github.com/Harini-7228/interviewmirror/issues/new)

---

## Problem

My friend is preparing for technical placement interviews. She knows the material. She's studied HashMap internals, SQL joins, recursion — all of it. But every mock interview ends the same way: she answers direct questions reasonably well, then completely falls apart when the interviewer asks *why* or *what happens internally?*

The problem isn't lack of knowledge. It's that existing interview practice tools don't remember what she struggled with last time. Each session starts fresh. No context. No adaptation. No memory.

---

## Solution

InterviewMirror is an adaptive technical interviewer powered by open-weight AI that:

1. **Interviews** — asks realistic placement-level questions in Java, SQL, DSA, CS, and Full Stack
2. **Evaluates** — assesses technical correctness, clarity, and follow-up handling
3. **Generates follow-ups** — dynamically based on what you just said, not a fixed script
4. **Remembers** — stores recurring weaknesses in MongoDB Atlas
5. **Adapts** — uses your weakness history to shape the *next* interview with different questions testing the same concepts

The defining feature: **Your previous interview changes your next interview.**

---

## Key Features

- 🧠 **Gemma-powered adaptive questioning** — open-weight AI at the core (not a closed model wrapper)
- 🔄 **Contextual follow-up engine** — follow-ups are grounded in the candidate's actual answer
- 💾 **MongoDB Atlas memory** — weaknesses stored and retrieved across sessions
- 🎙️ **ElevenLabs voice interviewer** — hear the question, don't just read it
- 📊 **Detailed interview reports** — score breakdown across 5 dimensions
- 🔁 **Weakness memory loop** — next session deliberately re-tests weak concepts from a fresh angle
- ✅ **Graceful degradation** — text interview works without any API key configured
- 🛡️ **Security first** — no secrets in client code, input validation on all routes, rate-limit handling

---

## Architecture

```
┌─────────────────────────────────────────────┐
│               Next.js App (App Router)       │
│                                             │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ page.tsx │  │    /api/interview         │ │
│  │ (Client) │◄─┤    POST  → Start/Answer   │ │
│  │          │  │    PATCH → Answer API     │ │
│  └──────────┘  │    GET   → History       │ │
│                └────────────┬─────────────┘ │
│                             │               │
│  ┌──────────────────────────▼─────────────┐ │
│  │              lib/ai/gemma.ts            │ │
│  │  generateQuestion() evaluateAnswer()    │ │
│  │  → Configured Gemma endpoint            │ │
│  │  → Fallback: demo questions/evaluation  │ │
│  └──────────────────────────┬─────────────┘ │
│                             │               │
│  ┌──────────────────────────▼─────────────┐ │
│  │           lib/db/interviews.ts          │ │
│  │  saveInterview() completeInterview()    │ │
│  │  getHistory() getHistoricalWeaknesses() │ │
│  └──────────────────────────┬─────────────┘ │
│                             │               │
│  ┌──────────────────────────▼─────────────┐ │
│  │           MongoDB Atlas                 │ │
│  │  collections: interviews, reports,      │ │
│  │               weaknesses               │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │           /api/voice                    │ │
│  │   ElevenLabs TTS → MP3 stream           │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## How Gemma Is Used

The AI provider is configured with `GEMMA_API_URL` and `GEMMA_API_KEY`; the checked-in example uses the Google AI endpoint for Gemma 4 26B. The model can be changed by pointing the URL at a compatible Gemma generate-content endpoint.

It powers three core functions in [`lib/ai/gemma.ts`](./lib/ai/gemma.ts):

**`generateQuestion(setup, weaknesses)`**
Generates one interview question calibrated to domain, difficulty, and historical weaknesses. If weaknesses exist, it varies the scenario rather than repeating old phrasing.

**`evaluateAnswer(setup, question, answer, history)`**
Returns structured JSON including scoring, feedback, follow-up guidance, and a model answer for learning:
```json
{
  "score": 72,
  "technicalScore": 81,
  "clarityScore": 68,
  "communicationScore": 70,
  "confidenceScore": 61,
  "correctness": "mostly_correct",
  "strengths": ["Mentions hashing mechanism"],
  "weaknesses": ["collision handling"],
  "missingConcepts": ["tree bins in Java 8"],
  "followUpNeeded": true,
  "followUpQuestion": "You mentioned hashing — what happens when two different keys map to the same bucket?",
  "correctAnswer": "A concise, technically correct answer to the question...",
  "reason": "The answer is directionally correct but doesn't address collision resolution."
}
```

All responses are validated with Zod. Malformed JSON, timeouts, empty responses, and rate limits fall back to clearly labeled demo evaluation. Without the AI provider, questions come from a domain- and difficulty-specific demo bank. Beginner, Intermediate, and Advanced selections are calibrated separately. At the end of an interview, the report includes a review of every question, the candidate's answer, feedback, and model answer.

---

## Why Open-Source AI Matters

Using Gemma (an open-weight model) instead of a proprietary closed API means:

- The model weights are publicly auditable — no black box
- The system can be self-hosted for privacy-sensitive use cases
- Inference providers can be swapped without lock-in
- The model's behavior can be understood and improved by the community

For a tool that evaluates your performance, auditability matters.

---

## MongoDB Atlas

MongoDB Atlas stores interview state and weakness history across sessions.

**Collections:**

| Collection | Purpose |
|------------|---------|
| `interviews` | Full interview state including all Q&A pairs |
| `reports` | Completed interview report with all scores |
| `weaknesses` | Recurring weakness concepts per user, with occurrence count |

The weakness query retrieves the top 5 most-occurring weaknesses sorted by `occurrenceCount` descending before each interview, feeding them to the question generator.

When MongoDB is not configured, the app falls back to an in-process `Map` store — the UI continues to work, but data doesn't persist across restarts.

---

## ElevenLabs

ElevenLabs converts the AI-generated interview questions to natural speech via server-side API route [`app/api/voice/route.ts`](./app/api/voice/route.ts).

The API key is never exposed to the browser. The route streams MP3 audio to the client only when both `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set.

If ElevenLabs is unavailable, the text interview remains fully functional — the voice feature degrades gracefully.

---

## Render

This project is configured for Render deployment via [`render.yaml`](./render.yaml).

The application is a Node.js web service running `npm start` (Next.js production server).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 |
| AI | Configurable Gemma-compatible endpoint |
| Database | MongoDB Atlas (Driver 7) |
| Voice | ElevenLabs TTS |
| Validation | Zod 4 |
| Icons | Lucide React |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Testing | Vitest |
| Deployment | Render |

---

## Local Development

### Prerequisites

- Node.js 20.9+
- npm 10+
- (Optional) MongoDB Atlas account
- (Optional) Gemma provider API key and endpoint
- (Optional) ElevenLabs account

### Install

```bash
npm install
```

### Configure environment

Copy the example file and fill in your optional provider credentials. In Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
# Fill in your API keys
```

Never commit `.env.local` or provider credentials. `.gitignore` excludes local environment files; configure production secrets in Render's environment settings.

### Run

```bash
npm run dev
# Open http://localhost:3000
```

The application works **without any API keys** in demo mode — AI responses fall back to local heuristics, clearly labeled in the UI.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMMA_API_KEY` | For AI | Google AI API key |
| `GEMMA_API_URL` | For AI | Gemma endpoint (see `.env.example`) |
| `MONGODB_URI` | For persistence | MongoDB Atlas connection string |
| `MONGODB_DB` | Optional | Database name (default: `interviewmirror`) |
| `ELEVENLABS_API_KEY` | For voice | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | For voice | Voice ID from your ElevenLabs account |

---

## Deployment

### Render

1. Push this project to [Harini-7228/interviewmirror](https://github.com/Harini-7228/interviewmirror).
2. In Render, select **New → Blueprint** and connect that repository. Render will read `render.yaml` to create the web service.
3. Add optional provider secrets in the service environment settings: `GEMMA_API_KEY` and `GEMMA_API_URL` for AI, `MONGODB_URI` for persistent history, and `ELEVENLABS_API_KEY` plus `ELEVENLABS_VOICE_ID` for voice.
4. Deploy. The configured build runs `npm ci`, lint, tests, and a production build; Render starts the app with `npm run start`.

The app can start without provider keys in demo mode. For interview history to survive restarts, configure MongoDB; the in-memory fallback is temporary and Render instances may restart or sleep.

---

## Running Tests

```bash
npm run test
# Tests covering validation, scoring, and interview behavior
```

---

## Security

Implemented in this project:

- Server-side API key handling — keys never reach the browser
- Input validation with Zod on all API routes
- Output validation — Gemma responses are Zod-parsed before use
- Answer length limits (4000 characters max)
- Request timeout (50 seconds) on Gemma calls
- Rate limit detection with user-facing error messages
- Safe error messages — no stack traces exposed to users
- Security headers (CSP-adjacent) via `next.config.ts`
- MongoDB userId regex escaping to prevent injection

Not claimed: "enterprise-grade security" — this is an open-source demo project.

---

## Limitations

- No authentication — `userId` is a plain string. In production, add proper auth.
- Browser-based speech recognition for candidate answers depends on browser support and microphone permission
- Gemma API quota limits may slow response during heavy use
- MongoDB in-memory fallback does not persist across process restarts
- No rate limiting on the interview API route itself (Render can add this at the edge)

---

## Future Improvements

- [ ] Authentication (NextAuth or Clerk)
- [ ] Candidate speech-to-text input (Web Speech API or Whisper)
- [ ] Multi-user support with proper user management
- [ ] Interview replay — review any past session in detail
- [ ] Score trend visualization with charts
- [ ] Export interview report as PDF
- [ ] Scheduled practice reminders

---

## Screenshots

> See the deployed demo for live screenshots.

---

## License

MIT — see [LICENSE](./LICENSE).

---

*Built for Hacktoberfest 2026 "Build for a Friend" challenge.*
