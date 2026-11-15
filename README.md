# FlexiFunnels — Call Intelligence (MRV1.0 Phase 1 prototype)

Front-end-only prototype that shows what the MRV1.0 evaluation engine produces. **All data is illustrative mock data**; no API, database, Google Sheet, auth or live service is connected.

## Run
```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unit + snapshot tests (vitest)
npm run typecheck && npm run lint && npm run build && npm start
```

## Structure
- `src/types` – MRV1 types (`Mrv1Document`: metadata, call_type, applicability, transcript_quality, sales_stage[], psychology[], scores, extras{…}, human_review, validation)
- `src/config/mrv1.ts` – rubric: 19 categories / 70 criteria, 22 SP criteria, 0–3/N/A/NE scale, flags + score-cap table, call types, gates, tooltip definitions
- `src/lib/scoring.ts` – **all scores are computed here** from criterion outcomes (category %, stage score, psychology score, provisional logic)
- `src/data/mock` – seeded mock dataset (54 calls, 7 salespeople, transcripts in English/Hindi) and `generate.ts`
- `src/lib/effective.ts` – applies human review actions on top of engine output (engine outcome is never overwritten)
- `src/services` – repository abstraction (`getCalls`, `getCallById`, `getEvaluations`, `getSalespeople`, `getTeamAnalytics`, `updateManagerReview`, `getDataset`). UI imports only from here; replace `mockRepository.ts` to connect real data.
- `src/components/report` – the 14-section call report; `src/app` – routes
- `tests/` – scoring, dataset and 14-section snapshot tests

Human review actions (approve, dispute, flag decisions, corrections, call-type confirmation, gate acknowledgement) are stored in `localStorage` only. Use the "Prototype · mock data" menu to simulate slow loading / API errors or reset local state.
