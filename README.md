# InterviewMirror

An adaptive AI interviewer that remembers where a candidate struggles.

InterviewMirror is a Hacktoberfest 2026 "Build for a Friend" project for a college student preparing for technical placement interviews. The product focuses on Java, SQL, DSA, Computer Science fundamentals, Full Stack, and custom technical interviews.

## Problem

My friend does not only need more interview questions. They need practice explaining answers clearly, handling follow-up questions, and seeing the same weakness tested again in a new way.

## Why I Built This

Most interview practice tools reset after every session. InterviewMirror is built around a memory loop:

Interview -> weakness detection -> memory -> adaptive next interview -> improvement -> re-evaluation.

## Solution

InterviewMirror simulates a technical interview, evaluates candidate answers, asks grounded follow-up questions, stores recurring weaknesses, and uses that history to shape future interviews.

## Key Features

- Polished landing page and interview setup flow
- Technical interview console instead of a generic chat UI
- Adaptive follow-up generation
- Structured answer evaluation
- Weakness memory and progress dashboard
- Results report with actionable improvement plan
- ElevenLabs interviewer voice route
- Demo fallback when provider credentials are missing

## Architecture

```text
Next.js app
  -> Interview setup and console
  -> /api/interview
      -> Gemma prompt layer
      -> response validation with Zod
      -> MongoDB Atlas persistence
      -> scoring and reports
  -> /api/voice
      -> ElevenLabs TTS
```

## How Gemma Is Used

Gemma is the intended open-weight AI core. The AI layer contains:

- `generateQuestion()`
- `evaluateAnswer()`
- structured JSON validation
- fallback behavior for missing keys, malformed JSON, timeout, and empty responses

The app clearly labels demo fallback behavior and does not claim fallback output came from Gemma.

## Why Open-Source AI Matters

Open-weight AI matters here because technical interview feedback should be inspectable, adjustable, and portable. A student-focused tool benefits from a model strategy that can be improved, self-hosted later, and adapted to local placement needs.

## MongoDB Atlas

MongoDB Atlas stores:

- interviews
- answers
- evaluations
- reports
- recurring weakness history

The application uses connection pooling and environment variables. It avoids storing unnecessary personal information.

## ElevenLabs

ElevenLabs provides the AI interviewer voice through `/api/voice`. API keys stay server-side. If voice is unavailable, text interviews continue to work.

## Render

The app is deployment-ready for Render as a Next.js web service.

## Tech Stack

- Next.js
- React
- TypeScript
- MongoDB Node driver
- Zod
- ElevenLabs API
- Gemma-compatible API route
- Vitest

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values.

```bash
GEMMA_API_KEY=
GEMMA_API_URL=
GEMMA_MODEL=
MONGODB_URI=
MONGODB_DB=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
NEXT_PUBLIC_APP_URL=
```

## Running Locally

Without credentials, InterviewMirror runs in demo mode and labels fallback AI behavior clearly. With credentials, Gemma, MongoDB Atlas, and ElevenLabs power the full experience.

## Deployment

1. Create a Render web service from this repository.
2. Set build command: `npm install && npm run build`.
3. Set start command: `npm run start`.
4. Add all required environment variables.
5. Deploy and test the full interview flow.

## Security

- Server-side API keys only
- Input validation with Zod
- Maximum answer and TTS text length
- Safe error messages
- Security headers in `next.config.ts`
- No raw stack traces shown to users
- No secrets committed

## Limitations

- Candidate speech recognition is not included in the MVP.
- Demo mode uses heuristic fallback and is not represented as Gemma output.
- Real friend feedback must be added only after testing with the friend.
- Real deployment screenshots should be added after Render deployment.

## Future Improvements

- Add candidate speech-to-text
- Add authentication
- Add model provider selection
- Add richer trend charts after more real interviews
- Add exportable interview reports

## Screenshots

Add real screenshots after deployment.

## Demo

Recommended demo flow:

1. Start a Java interview.
2. Answer the first question.
3. Show the adaptive follow-up.
4. Complete the interview.
5. Show weakness report.
6. Start another interview and show memory influence.
7. Play the ElevenLabs interviewer voice.

## Architecture Diagram

```text
Candidate -> Next.js Interview Console -> Gemma Evaluation
                                      -> MongoDB Atlas Memory
                                      -> ElevenLabs Voice
                                      -> Results Dashboard
```

## License

MIT
