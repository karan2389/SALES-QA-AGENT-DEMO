import { CATEGORIES, CATEGORY_BY_ID, CHECKLIST, GOOD_EXAMPLE_THRESHOLD, OBJECTION_CATEGORIES, RUBRIC_VERSION, SKILL_VERSION } from "@/config/rubric";
import { NOW, istDayStart } from "@/lib/dates";
import type {
  Call, CategoryId, ConfidenceLabel, Dataset, Evaluation, Evidence, Language, ManagerReview, ObjectionCategory,
  ObjectionRecord, Outcome, Salesperson, Transcript, TranscriptSegment,
} from "@/types";
import { OBJECTION_LINES, TEMPLATES } from "./transcriptTemplates";

/** Deterministic PRNG so the mock dataset is identical on server, client and between sessions. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261112);
const rint = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const DAY = 86_400_000;

interface Profile {
  base: number;
  slope: number;
  bias: Partial<Record<CategoryId, number>>;
  count: number;
}

export const SALESPEOPLE: Salesperson[] = [
  { id: "sp-aarav", name: "Aarav Mehta", role: "Senior Sales Executive", team: "Inbound Team A", avatar: "blue", joinedOn: "2023-02-13", email: "aarav.mehta@example.com" },
  { id: "sp-priya", name: "Priya Nair", role: "Sales Executive", team: "Inbound Team A", avatar: "teal", joinedOn: "2024-06-03", email: "priya.nair@example.com" },
  { id: "sp-rohan", name: "Rohan Kulkarni", role: "Sales Executive", team: "Inbound Team B", avatar: "amber", joinedOn: "2024-01-22", email: "rohan.kulkarni@example.com" },
  { id: "sp-sneha", name: "Sneha Iyer", role: "Senior Sales Executive", team: "Inbound Team B", avatar: "violet", joinedOn: "2022-09-05", email: "sneha.iyer@example.com" },
  { id: "sp-vikram", name: "Vikram Singh", role: "Sales Associate", team: "Inbound Team B", avatar: "rose", joinedOn: "2025-08-18", email: "vikram.singh@example.com" },
  { id: "sp-ananya", name: "Ananya Das", role: "Sales Associate (New joiner)", team: "Inbound Team A", avatar: "slate", joinedOn: "2026-10-19", email: "ananya.das@example.com" },
];

const PROFILES: Record<string, Profile> = {
  "sp-aarav": { base: 83, slope: -3, count: 17, bias: { intro: 8, solution: 6, closing: 7, ethics: -8, motivation: -4 } },
  "sp-priya": { base: 74, slope: 10, count: 15, bias: { communication: 9, motivation: 7, objection: -10, closing: -8, testimonials: 3 } },
  "sp-rohan": { base: 62, slope: 1, count: 12, bias: { intro: 9, persona: -12, goals: -10, motivation: -9, challenges: -8, closing: -8, ethics: -6 } },
  "sp-sneha": { base: 79, slope: 3, count: 8, bias: { persona: 8, challenges: 8, objection: 8, testimonials: -12, intro: -4 } },
  "sp-vikram": { base: 47, slope: 8, count: 5, bias: { intro: 12, communication: -6, objection: -10, closing: -6, ethics: -4 } },
  "sp-ananya": { base: 63, slope: 0, count: 3, bias: { communication: 6, goals: -8, closing: -8 } },
};

const FIRST = ["Rahul", "Neha", "Amit", "Pooja", "Suresh", "Kavita", "Manish", "Divya", "Karan", "Ritu", "Sanjay", "Meena", "Arjun", "Shweta", "Deepak", "Isha", "Gaurav", "Nisha", "Tarun", "Anjali"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Reddy", "Joshi", "Malhotra", "Bansal", "Chopra", "Desai", "Menon", "Saxena", "Bhatt", "Kapoor", "Pillai"];
const OBJECTION_WEIGHTS: ObjectionCategory[] = [
  "financial", "financial", "financial", "financial", "consult", "consult", "trust", "trust",
  "time", "time", "suitability", "suitability", "decision_maker", "other",
];
const REVIEW_NOTES_APPROVED = [
  "Evaluation matches the transcript. Good evidence coverage.",
  "Scores are fair. Coaching points are accurate.",
  "Verified evidence timestamps against the recording. Approved.",
  "Agree with the objection-handling assessment.",
];
const REVIEW_NOTES_DISPUTED = [
  "Prospect stated a budget earlier in the call; closing score seems too low.",
  "Transcript looks incomplete around the objection — please re-run the evaluation.",
  "Speaker attribution is wrong in the middle of the call, which affects the listening score.",
];

const confidenceLabel = (c: number): ConfidenceLabel => (c >= 0.75 ? "high" : c >= 0.6 ? "medium" : "low");

interface Plan { sp: Salesperson; offset: number }

function planCalls(): Plan[] {
  const total = Object.values(PROFILES).reduce((a, p) => a + p.count, 0);
  const offsets: number[] = [0, 0, 1, 1];
  while (offsets.length < total) offsets.push(Math.min(59, Math.floor(60 * Math.pow(rand(), 1.1))));
  const ananya = SALESPEOPLE[5];
  const recent = shuffle(offsets.map((o, i) => ({ o, i })).filter((x) => x.o <= 20 && x.o > 1)).slice(0, PROFILES["sp-ananya"].count);
  const ananyaIdx = new Set(recent.map((x) => x.i));
  const pool: Salesperson[] = [];
  for (const sp of SALESPEOPLE.slice(0, 5)) for (let i = 0; i < PROFILES[sp.id].count; i++) pool.push(sp);
  const shuffled = shuffle(pool);
  let k = 0;
  return offsets.map((offset, i) => ({ offset, sp: ananyaIdx.has(i) ? ananya : shuffled[k++] }));
}

export interface BaseDataset extends Dataset { evidence: Evidence[] }

function build(): BaseDataset {
  const plans = planCalls().sort((a, b) => b.offset - a.offset);
  const today = istDayStart(NOW);
  const n = plans.length;

  // Which calls get special processing states.
  const indices = Array.from({ length: n }, (_, i) => i);
  const processing = new Set([n - 1, n - 2, n - 3]);
  const failedEval = new Set([22, 41]); // transcript exists, evaluation failed
  const failedTranscript = new Set([9, 33]); // transcription itself failed
  const eligible = indices.filter((i) => !processing.has(i) && !failedEval.has(i) && !failedTranscript.has(i));
  const flaggedPool = shuffle(eligible);
  const lowConf = new Set(flaggedPool.slice(0, 6));
  const uncertain = new Set(flaggedPool.slice(3, 10));
  const needsReview = new Set(flaggedPool.slice(0, 6));
  const disputed = new Set(flaggedPool.slice(10, 13));
  const approved = new Set(flaggedPool.slice(13, 29));
  const pendingReview = new Set(flaggedPool.slice(29, 34));
  for (const i of disputed) { lowConf.delete(i); needsReview.delete(i); }

  const calls: Call[] = [];
  const evaluations: Evaluation[] = [];
  const transcripts: Transcript[] = [];
  const evidence: Evidence[] = [];
  const reviews: ManagerReview[] = [];
  const usedNames = new Set<string>();
  let reviewSeq = 1;

  plans.forEach((plan, i) => {
    const prof = PROFILES[plan.sp.id];
    const id = `CALL-${1001 + i}`;
    const hour = plan.offset === 0 ? rint(10, 14) : rint(10, 18);
    const ts = today - plan.offset * DAY + hour * 3_600_000 + rint(0, 59) * 60_000 + 330 * 0; // IST day start already
    const callDate = new Date(ts).toISOString().replace("Z", "+00:00");
    let name = "";
    do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (usedNames.has(name));
    usedNames.add(name);
    const language: Language = (() => { const r = rand(); return r < 0.25 ? "hindi" : r < 0.5 ? "english" : "hinglish"; })();
    const duration = rint(190, 2050);

    // Category scores: persona profile + trend over time + noise.
    const drift = prof.slope * (1 - plan.offset / 60) - prof.slope / 2;
    const scores = {} as Record<CategoryId, number>;
    for (const c of CATEGORIES) scores[c.id] = Math.round(clamp(prof.base + (prof.bias[c.id] ?? 0) + drift + (rand() - 0.5) * 22, 18, 98));
    const overall = Math.round(CATEGORIES.reduce((a, c) => a + (scores[c.id] * c.weight) / 100, 0));

    // Outcome is only loosely related to quality on purpose.
    const pendingChance = plan.offset <= 3 ? 0.5 : plan.offset <= 8 ? 0.15 : 0.03;
    const r = rand();
    const pConv = clamp(0.4 + (overall - 70) * 0.004, 0.15, 0.6);
    const outcome: Outcome = processing.has(i) ? "pending"
      : r < pendingChance ? "pending"
      : rand() < pConv ? "converted"
      : rand() < 0.5 ? "unsuccessful" : "follow_up";

    const isFailedEval = failedEval.has(i);
    const isFailedTr = failedTranscript.has(i);
    const isProcessing = processing.has(i);
    const hasEval = !isFailedEval && !isFailedTr && !isProcessing;
    const evalStatus = isProcessing ? "processing" : isFailedEval || isFailedTr ? "failed" : needsReview.has(i) ? "needs_review" : "completed";
    const reviewStatus = !hasEval ? "not_reviewed"
      : disputed.has(i) ? "disputed"
      : approved.has(i) ? "approved"
      : needsReview.has(i) || pendingReview.has(i) ? "pending_review"
      : "not_reviewed";

    const call: Call = {
      id,
      callyzerCallId: `CLZ-${rint(100000, 999999)}`,
      salespersonId: plan.sp.id,
      prospectName: name,
      phoneNumber: `+91 9${rint(1000, 9999)} ${rint(10000, 99999)}`,
      callDate,
      durationSeconds: duration,
      outcome,
      language,
      recordingAvailable: !isFailedTr,
      evaluationStatus: evalStatus,
      reviewStatus,
    };
    calls.push(call);

    // ---- Objection, checklist, evidence
    const objCat = pick(OBJECTION_WEIGHTS);
    const objScore = scores.objection;
    const objection: ObjectionRecord = { category: objCat, handling: objScore >= 75 ? "well" : objScore >= 55 ? "partial" : "poor" };
    const checklist: Record<string, boolean> = {};
    for (const item of CHECKLIST) checklist[item.id] = rand() < clamp((scores[item.category] - 25) / 65, 0.04, 0.97);

    // ---- Transcript
    const isLow = lowConf.has(i);
    const turns = TEMPLATES[language];
    const segs: TranscriptSegment[] = turns.map((t, k) => {
      const base = t.slot === "objection" ? OBJECTION_LINES[language][objCat]
        : t.cat ? (scores[t.cat] >= GOOD_EXAMPLE_THRESHOLD ? t.good : t.weak) : t.good;
      return {
        id: `${id}-s${k + 1}`,
        timestamp: k === 0 ? 2 : Math.round((duration * 0.97 * k) / turns.length + rint(0, 12)),
        speaker: t.who === "sp" ? "salesperson" : "prospect",
        text: base.replaceAll("{sp}", plan.sp.name.split(" ")[0]).replaceAll("{prospect}", name.split(" ")[0]),
        speakerConfidence: Number((0.9 + rand() * 0.09).toFixed(2)),
        category: t.cat,
      };
    });
    if (uncertain.has(i)) {
      for (const k of shuffle(segs.map((_, idx) => idx).filter((x) => x > 1)).slice(0, rint(3, 5))) {
        segs[k].speaker = "uncertain";
        segs[k].speakerConfidence = Number((0.4 + rand() * 0.18).toFixed(2));
      }
    }
    const trConf = Number((isLow ? 0.55 + rand() * 0.12 : 0.88 + rand() * 0.09).toFixed(2));
    transcripts.push({
      id: `TR-${id}`,
      callId: id,
      language,
      segments: isProcessing || isFailedTr ? [] : segs,
      transcriptionStatus: isProcessing ? "processing" : isFailedTr ? "failed" : "completed",
      transcriptionConfidence: isProcessing || isFailedTr ? 0 : trConf,
    });

    if (!hasEval) return;

    // ---- Evaluation + evidence
    const evalId = `EV-${id}`;
    const confidence = Number((isLow ? 0.45 + rand() * 0.13 : uncertain.has(i) ? 0.62 + rand() * 0.12 : 0.78 + rand() * 0.17).toFixed(2));
    const ordered = [...CATEGORIES].sort((a, b) => scores[b.id] - scores[a.id]);
    const strengthCats = ordered.filter((c) => scores[c.id] >= GOOD_EXAMPLE_THRESHOLD).slice(0, 3);
    const gapCats = [...ordered].reverse().filter((c) => scores[c.id] < GOOD_EXAMPLE_THRESHOLD).slice(0, 3);
    const segFor = (cat: CategoryId) => segs.find((s) => s.category === cat)!;
    const strengths = strengthCats.map((c) => {
      const seg = segFor(c.id);
      const ev: Evidence = { id: `EVD-${id}-${c.id}`, evaluationId: evalId, callId: id, kind: "strength", category: c.id, timestamp: seg.timestamp, segmentId: seg.id, excerpt: seg.text, observation: c.strength, recommendation: "Keep doing this — consider sharing the call as a coaching example." };
      evidence.push(ev);
      return { category: c.id, observation: c.strength, evidenceId: ev.id };
    });
    const improvementAreas = gapCats.map((c) => {
      const seg = segFor(c.id);
      const ev: Evidence = { id: `EVD-${id}-${c.id}`, evaluationId: evalId, callId: id, kind: "gap", category: c.id, timestamp: seg.timestamp, segmentId: seg.id, excerpt: seg.text, observation: c.missed, recommendation: c.coachingAction };
      evidence.push(ev);
      return { category: c.id, missed: c.missed, whyItMatters: c.whyItMatters, shouldHaveDone: c.shouldHaveDone, coachingAction: c.coachingAction, evidenceId: ev.id };
    });

    evaluations.push({
      id: evalId,
      callId: id,
      overallScore: overall,
      originalOverallScore: overall,
      categoryScores: Object.fromEntries(CATEGORIES.map((c) => [c.id, { score: scores[c.id] }])) as Evaluation["categoryScores"],
      strengths,
      improvementAreas,
      evidenceCoverage: Number(clamp((isLow ? 0.5 : 0.72) + rand() * 0.22, 0, 0.97).toFixed(2)),
      confidence,
      confidenceLevel: confidenceLabel(confidence),
      checklist,
      objections: [objection],
      rubricVersion: RUBRIC_VERSION,
      skillVersion: SKILL_VERSION,
      evaluatedAt: new Date(ts + (duration + rint(20, 90) * 60) * 1000).toISOString().replace("Z", "+00:00"),
    });

    // ---- Seeded manager reviews for approved / disputed calls
    const evaluatedMs = ts + (duration + 3600) * 1000;
    const mkReview = (status: "approved" | "disputed", notes: string, reviewer: string): ManagerReview => ({
      id: `REV-${String(reviewSeq++).padStart(3, "0")}`,
      callId: id, reviewer, status, notes,
      reviewedAt: new Date(Math.min(NOW - 3_600_000, evaluatedMs + rint(2, 20) * 3_600_000)).toISOString().replace("Z", "+00:00"),
    });
    if (approved.has(i)) reviews.push(mkReview("approved", pick(REVIEW_NOTES_APPROVED), pick(["Nikhil Rao", "Kavita Joshi"])));
    if (disputed.has(i)) reviews.push(mkReview("disputed", pick(REVIEW_NOTES_DISPUTED), "Kavita Joshi"));
  });

  return { calls, evaluations, salespeople: SALESPEOPLE, transcripts, reviews, evidence };
}

export const BASE: BaseDataset = build();
export const OBJECTION_IDS = OBJECTION_CATEGORIES.map((o) => o.id);
export { CATEGORY_BY_ID };
