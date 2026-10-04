# InterviewMirror

An adaptive technical-interview practice app that calibrates questions to a selected difficulty, evaluates answers, provides model answers, and uses previous weaknesses to shape future sessions.

**Repository:** [Harini-7228/interviewmirror](https://github.com/Harini-7228/interviewmirror) · [Open an issue](https://github.com/Harini-7228/interviewmirror/issues/new)

## Features

- Interview practice across Java, SQL, DSA, Computer Science, Full Stack, and custom topics.
- Beginner, Intermediate, and Advanced question tiers.
- Adaptive question generation and grounded follow-ups with a configured Gemma-compatible API.
- Demo question and evaluation fallbacks when no AI API is configured.
- Per-answer feedback, model answers, and a question-by-question final report.
- Optional MongoDB Atlas persistence for interview history and weakness tracking.
- Optional ElevenLabs text-to-speech and browser speech recognition.

## Tech stack

Next.js App Router, React, TypeScript, Zod, MongoDB Node.js driver, Vitest, and Render.

## Local development

Requirements: Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The app can run in demo mode without provider credentials. To configure integrations, copy `.env.example` to `.env.local` and fill in only the credentials you need. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Never commit `.env.local` or provider credentials. Local environment files, dependencies, and build output are excluded by `.gitignore`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GEMMA_API_KEY` | API key for the configured Gemma-compatible endpoint |
| `GEMMA_API_URL` | Generate-content endpoint URL |
| `GEMMA_MODEL` | Optional model name shown by the health endpoint |
| `MONGODB_URI` | Optional MongoDB Atlas connection string for persistent history |
| `MONGODB_DB` | Optional database name (defaults to `interviewmirror`) |
| `ELEVENLABS_API_KEY` | Optional ElevenLabs API key for voice output |
| `ELEVENLABS_VOICE_ID` | Optional ElevenLabs voice ID |

Keep all provider keys server-side. Do not use `NEXT_PUBLIC_` prefixes for secrets.

## Deploy to Render

The repository includes a Render Blueprint in `render.yaml`.

1. Push this repository to GitHub.
2. In Render, select **New → Blueprint** and connect the repository.
3. Add the optional service environment values (`GEMMA_API_KEY`, `GEMMA_API_URL`, `MONGODB_URI`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_VOICE_ID`) in the Render dashboard as needed. Never put secret values in `render.yaml`.
4. Deploy. The Blueprint runs `npm ci`, lint, tests, and the production build, then starts the Next.js server.

The app runs without optional integrations in demo mode. Configure MongoDB if interview history should persist across Render restarts.

## Checks

```sh
npm run lint
npm test
npm run build
```

## License

MIT. See [LICENSE](./LICENSE).
