# FlexiFunnels — Sales Call Intelligence (frontend prototype)

Interactive prototype for the Senior Mentoring Team. **All data is illustrative mock data**; no Callyzer, Whisper, n8n, AI backend or database is connected.

## Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck && npm run lint && npm run build && npm start
```

## Structure
- `src/app` – routes: `/dashboard`, `/calls`, `/calls/[id]`, `/team`, `/team/[id]`, `/analytics`, `/reviews`, `/reports`, `/settings`
- `src/config` – **central provisional config**: rubric categories/weights/checklist (`rubric.ts`), score bands, outcomes, statuses (`ui.ts`)
- `src/data/mock` – deterministic seeded dataset (60 calls, 6 salespeople, 53 evaluations, transcripts in Hindi/English/Hinglish, evidence, reviews)
- `src/services` – repository abstraction (`getCalls`, `getCallById`, `getEvaluations`, `getSalespeople`, `getTeamAnalytics`, `updateManagerReview`, …). UI imports only from here; swap `mockRepository.ts` for Supabase/API calls later.
- `src/lib` – pure metrics/analytics, dates (IST), CSV, review-queue rules
- `src/components`, `src/hooks`, `src/types`

## Notes
- Manager reviews, notes, score corrections and preferences persist in `localStorage` only. Reset via the "Prototype · mock data" menu.
- The same menu simulates slow loading and API errors to demonstrate loading/error states.
- Mock "today" is fixed at 12 Nov 2026 so date presets line up with the dataset.
