# Changelog

## Rebuild to match MRV1.0 Phase 1

### Removed
- Business-outcome tracking and the 2×2 "outcome vs quality" matrix; the outcome donut and trend column.
- The single blended quality score, score bands (Good / Excellent) and all category weights.
- The 12-category provisional rubric, the invented "evaluation confidence / evidence coverage" percentages.
- CRM-style fields: prospect names, fake `CALL-xxxx` IDs, visible phone numbers (now masked, call detail only).
- The separate "Sales process adherence" panel and the salesperson ranking/leaderboard framing.

### Added
- MRV1.0 rubric: 19 categories (70 criteria) in 3 stage groups, plus the separate 22-criterion Sales Psychology & Conduct scorecard.
- 0–3 / N/A / NE outcome scale with reason codes; scores computed by `lib/scoring.ts`; "(provisional)" whenever any criterion is NE.
- 14-section call report with sticky navigation, transcript panel with evidence jump, copy/download as text, criterion filters, absence records, flag-cap explanations.
- Critical flags (10 IDs) with severity, interpretation, verification and human decision; flag count on every call row, header and salesperson card.
- Evaluation readiness gates (recording ≥ 90%, transcript decisions, human-confirmed call type); held calls show only Sections 1 and 14.
- Human Review queues (pending, open flags, gate acknowledgements, call type, failed, NE-heavy, disputed) with mock confirm-call-type and acknowledge actions.
- Human corrections keep the engine outcome (struck through) and require a reason; scores recompute.
- Team heatmap C01–C19 × salesperson, most-missed criteria, flag frequency, objection analysis, N/A / NE rates by reason code, gate outcomes, stage-group averages.
- Exports: call evaluations (Google Sheet layout), criterion-level, flags log, salesperson summary, review log.
- Read-only rubric panel in Settings (approved vs. pending approval).
- Vitest suite: scoring unit tests, dataset invariants, 14 report-section snapshots.

### Mock values (everything)
All figures, names, transcripts, flags, quotes, gate results, reviewer names and review history are fictional and generated from a seeded script (`src/data/mock/generate.ts`). Transcripts are placeholders in English and Hindi; the flagship flagged call (false earnings promise with a C15-03 cap) and the Hindi calls use the realistic dialogue. Salesperson names are fictional. The score-cap table, gate thresholds and flag list follow the brief; the minimum-sample threshold (5 calls) is a prototype default.

### Known limitations
- Lists use `content-visibility: auto` rather than a virtualised list (≤ 100 criteria and ~35 transcript segments per call).
- Hinglish is not represented in the transcripts (English and Hindi only).
- Human actions persist in the browser only.
