import {
  ALL_CRITERIA, CATEGORIES, CATEGORY_BY_ID, EVALUATOR_MODEL, FLAG_BY_ID, MANUAL_EVALUATOR, OBJECTION_LABEL, REASON_LABEL, RUBRIC_VERSION, SP_CRITERIA,
} from "@/config/mrv1";
import { NOW, istDayStart } from "@/lib/dates";
import { computeScores } from "@/lib/scoring";
import type {
  AbsenceRecord, CallMeta, CallRecord, CallType, CoachingPriority, CriterionEval, Dataset, EvidenceBullet, FlagId, FlagItem, GateInfo, Language,
  Mrv1Document, NumericOutcome, Objection, ObjectionType, Outcome, ProfileField, Quote, ReasonCode, ReviewAction, Salesperson, Segment, Severity, Speaker,
} from "@/types";
import { BEATS, CORRUPT_TEXT, FLAG_LINES, OBJECTION_LINES } from "./beats";

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
const rand = mulberry32(5150);
const rint = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a;
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const DAY = 86_400_000;
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const SALESPEOPLE: Salesperson[] = [
  { id: "sp-aarav", name: "Aarav Mehta", role: "Senior Sales Executive", team: "Inbound Team A", avatar: "blue", joinedOn: "2023-02-13" },
  { id: "sp-priya", name: "Priya Nair", role: "Sales Executive", team: "Inbound Team A", avatar: "teal", joinedOn: "2024-06-03" },
  { id: "sp-rohan", name: "Rohan Kulkarni", role: "Sales Executive", team: "Inbound Team B", avatar: "amber", joinedOn: "2024-01-22" },
  { id: "sp-sneha", name: "Sneha Iyer", role: "Senior Sales Executive", team: "Inbound Team B", avatar: "violet", joinedOn: "2022-09-05" },
  { id: "sp-vikram", name: "Vikram Singh", role: "Sales Associate", team: "Inbound Team B", avatar: "rose", joinedOn: "2025-08-18" },
  { id: "sp-ananya", name: "Ananya Das", role: "Sales Associate (new joiner)", team: "Inbound Team A", avatar: "slate", joinedOn: "2026-10-19" },
  { id: "sp-kabir", name: "Kabir Sethi", role: "Sales Associate (new joiner)", team: "Inbound Team B", avatar: "teal", joinedOn: "2026-10-26" },
];
const PROFILE: Record<string, { base: number; count: number; bias: Record<string, number> }> = {
  "sp-aarav": { base: 0.66, count: 12, bias: { "1-6": 0.08, "13-19": -0.03 } },
  "sp-priya": { base: 0.55, count: 11, bias: { "7-12": 0.05, "13-19": -0.1 } },
  "sp-rohan": { base: 0.46, count: 9, bias: { "1-6": -0.08, "13-19": -0.04 } },
  "sp-sneha": { base: 0.59, count: 8, bias: { "7-12": 0.08, "13-19": 0.04 } },
  "sp-vikram": { base: 0.42, count: 6, bias: { "1-6": 0.05, "13-19": -0.08 } },
  "sp-ananya": { base: 0.52, count: 4, bias: {} },
  "sp-kabir": { base: 0.47, count: 4, bias: {} },
};
const PROSPECTS = ["Rahul", "Neha", "Amit", "Pooja", "Suresh", "Kavita", "Manish", "Divya", "Karan", "Ritu", "Sanjay", "Meena", "Arjun", "Shweta", "Deepak", "Isha", "Gaurav", "Nisha"];
const REVIEWERS = ["Kavita Joshi", "Nikhil Rao"];

type Scenario =
  | "normal" | "processing" | "failed" | "recording_blocked" | "transcript_corrupted" | "transcript_ack" | "transcript_needs_ack"
  | "type_unconfirmed" | "no_conversation" | "support" | "continuation" | "midway" | "ne_heavy" | "follow_up" | "renewal" | "manual";
interface FlagSpec { flagId: FlagId; interpretation: "confirmed" | "ambiguous"; verification: "verified" | "needs_audio_check"; cap: boolean; severity?: Severity }

const SCENARIOS: Record<number, Scenario> = {
  5: "continuation", 35: "continuation", 8: "no_conversation", 16: "support", 12: "recording_blocked", 20: "transcript_corrupted",
  27: "transcript_ack", 44: "transcript_needs_ack", 38: "type_unconfirmed", 49: "type_unconfirmed", 24: "midway", 14: "ne_heavy",
  31: "failed", 52: "processing", 53: "processing", 9: "follow_up", 22: "follow_up", 33: "follow_up", 28: "renewal", 11: "manual", 37: "manual",
};
const FLAG_CALLS: Record<number, FlagSpec[]> = {
  6: [{ flagId: "fake_urgency", interpretation: "ambiguous", verification: "needs_audio_check", cap: false }],
  18: [{ flagId: "false_earnings_promise", interpretation: "confirmed", verification: "verified", cap: true }],
  30: [{ flagId: "misleading_product_claim", interpretation: "ambiguous", verification: "verified", cap: false }],
  40: [{ flagId: "financial_pressure", interpretation: "confirmed", verification: "verified", cap: true }, { flagId: "unprofessional_conduct", interpretation: "ambiguous", verification: "needs_audio_check", cap: false }],
  47: [{ flagId: "refusal_not_respected", interpretation: "ambiguous", verification: "needs_audio_check", cap: false }],
};
const HINDI_CALLS = new Set([3, 15, 29, 41]);
const UNCERTAIN_SPEAKER = new Set([4, 13, 19, 25, 34, 42, 46, 50]);
const SP_FLAG_MAP: Partial<Record<FlagId, string>> = {
  misleading_product_claim: "SP-04", false_earnings_promise: "SP-05", fake_urgency: "SP-06", financial_pressure: "SP-07", refusal_not_respected: "SP-08",
  misrepresented_support: "SP-09", fabricated_social_proof: "SP-10", coercive_emotional_pressure: "SP-11", unsupported_customer_fit: "SP-12", unprofessional_conduct: "SP-13",
};

interface Built { segments: Segment[]; sp: Record<string, number>; pr: Record<string, number>; obj: number; flags: Partial<Record<FlagId, number>> }

function buildTranscript(lang: Language, spName: string, pName: string, dur: number, objType: ObjectionType, flags: FlagId[], midway: boolean, uncertain: boolean): Built {
  const key = lang === "hindi" ? "hi" : "en";
  const items: { text: string; speaker: Speaker; tag: string }[] = [];
  const fill = (s: string) => s.replaceAll("{sp}", spName).replaceAll("{p}", pName);
  for (const b of BEATS) {
    if (midway && (b.cat === "C01" || b.cat === "C02")) continue;
    items.push({ text: fill(b[key]), speaker: b.who === "sp" ? "salesperson" : "prospect", tag: `${b.who}:${b.cat}` });
    if (b.cat === "C15" && b.who === "sp") for (const f of flags) items.push({ text: FLAG_LINES[f][key], speaker: "salesperson", tag: `flag:${f}` });
    if (b.cat === "C17" && b.who === "sp") items.push({ text: OBJECTION_LINES[lang][objType], speaker: "prospect", tag: "obj" });
  }
  const total = items.length;
  const segments: Segment[] = items.map((it, i) => {
    const start = Math.round(dur * 0.04 + (dur * 0.92 * i) / total);
    return { n: i + 1, start, end: start + Math.max(4, Math.round((dur * 0.92) / total) - 2), speaker: it.speaker, text: it.text };
  });
  const out: Built = { segments, sp: {}, pr: {}, obj: 0, flags: {} };
  items.forEach((it, i) => {
    const [kind, cat] = it.tag.split(":");
    if (kind === "sp") out.sp[cat] = i + 1; else if (kind === "pr") out.pr[cat] = i + 1; else if (kind === "obj") out.obj = i + 1; else out.flags[cat as FlagId] = i + 1;
  });
  if (uncertain) {
    const cand = segments.map((s) => s.n).filter((n) => n > 3 && !Object.values(out.flags).includes(n) && n !== out.obj);
    for (let k = 0; k < 5 && cand.length; k++) segments[cand.splice(Math.floor(rand() * cand.length), 1)[0] - 1].speaker = "unclear";
  }
  return out;
}

const quoteOf = (s: Segment): Quote => ({ speaker: s.speaker, start: s.start, end: s.end, segments: [s.n], text: s.text });
const ts = (a: number, b: number) => `[${clock(a)}–${clock(b)}]`;

interface Ctx { t: Built; midway: boolean; neCats: Set<string>; naCats: Set<string>; neCount: number; neReason: ReasonCode; heavyNe: boolean }

function describe(score: NumericOutcome, name: string): string {
  const n = name.charAt(0).toLowerCase() + name.slice(1);
  return score === 3 ? `Fully demonstrated: the salesperson's words clearly show they ${n.replace(/^(asks|states|sets|builds|captures|identifies|explores|reflects|connects|secures|summarises|confirms|offers|explains|responds|checks|treats|reframes|reconnects|re-closes|makes|compares|uses|matches|shares|highlights|avoids|differentiates|links|assesses|prioritises|probes|quantifies|reviews|describes|acknowledges|respects)\b/i, (m) => m.toLowerCase())}.`
    : score === 2 ? `Mostly demonstrated: "${n}" is evident, with minor gaps in depth or follow-up.`
    : score === 1 ? `Weakly demonstrated: "${n}" was attempted but remained incomplete or unclear.`
    : `Not demonstrated: no evidence of "${n}" was found in the checked window.`;
}

function genCriterion(def: { id: string; name: string }, catId: string, L: number, ctx: Ctx, idxInCat: number, forced?: Outcome, forcedReason?: ReasonCode): CriterionEval {
  const { t } = ctx;
  let outcome: Outcome;
  let reason: ReasonCode | undefined;
  if (forced !== undefined) { outcome = forced; reason = forcedReason; }
  else if (ctx.naCats.has(catId)) { outcome = "NA"; reason = "call_type_not_covered"; }
  else if (ctx.midway && (catId === "C01" || catId === "C02")) { outcome = "NE"; reason = "recording_starts_midway"; }
  else if (ctx.neCats.has(def.id)) { outcome = "NE"; reason = ctx.neReason; }
  else outcome = clamp(Math.round((L + (rand() - 0.5) * 0.5) * 3), 0, 3) as NumericOutcome;

  const base: CriterionEval = { id: def.id, name: def.name, categoryId: catId, outcome, modelOutcome: outcome, reasonCode: reason, evidenceConfidence: null, quotes: [], explanation: "", review: { status: "pending" } };
  if (outcome === "NA") return { ...base, explanation: `Not applicable (${REASON_LABEL[reason!]}). Excluded from the category percentage.` };
  if (outcome === "NE") return { ...base, explanation: `Not evaluable (${REASON_LABEL[reason!]}). No evidence available; excluded from the score and never counted as zero.` };
  const spN = t.sp[catId], prN = t.pr[catId];
  const segN = idxInCat % 2 === 1 && prN ? prN : spN;
  const seg = t.segments[(segN ?? 1) - 1];
  const out = outcome as NumericOutcome;
  if (out === 0) {
    const a = t.segments[Math.max(0, (spN ?? 1) - 2)], b = t.segments[Math.min(t.segments.length - 1, (prN ?? spN ?? 1))];
    const absence: AbsenceRecord = { start: a.start, end: b.end, note: `Checked ${ts(a.start, b.end)} (segments ${a.n}–${b.n}); no relevant statement found.` };
    return { ...base, evidenceConfidence: rand() < 0.5 ? "high" : "medium", absence, explanation: describe(0, def.name), improvement: `Make sure to ${def.name.charAt(0).toLowerCase() + def.name.slice(1)}, and confirm the prospect's answer before moving on.` };
  }
  const q = quoteOf(seg);
  return {
    ...base, quotes: [q], evidenceConfidence: seg.speaker === "unclear" ? "low" : out === 3 ? "high" : rand() < 0.6 ? "medium" : "high",
    explanation: describe(out, def.name),
    improvement: out < 3 ? `Go one step further: ${def.name.charAt(0).toLowerCase() + def.name.slice(1)}, then check the prospect's reaction.` : undefined,
  };
}

const EXAMPLE_FOR = (cat: string, lang: Language, t: Built) => { const n = t.sp[cat]; return n ? t.segments[n - 1].text : BEATS.find((b) => b.cat === cat && b.who === "sp")![lang === "hindi" ? "hi" : "en"]; };

function makeDoc(i: number, call: CallMeta, spProfile: (typeof PROFILE)[string], scenario: Scenario, flagSpecs: FlagSpec[], t: Built, objType: ObjectionType, cov: number, uncertain: boolean): Mrv1Document {
  const lang = call.language;
  const callL = clamp(spProfile.base + (rand() - 0.5) * 0.18);
  const ctx: Ctx = {
    t, midway: scenario === "midway", naCats: new Set(call.callType === "continuation" ? ["C01", "C02"] : []), neCats: new Set(), neCount: 0,
    neReason: pick(["transcript_unreliable", "speaker_unclear", "insufficient_evidence"] as const), heavyNe: scenario === "ne_heavy",
  };
  const ne = new Set<string>();
  if (scenario === "ne_heavy") { while (ne.size < 12) ne.add(pick(ALL_CRITERIA).id); ctx.neReason = "transcript_unreliable"; }
  else if (rand() < 0.5) { for (let k = rint(1, 4); k > 0; k--) ne.add(pick(ALL_CRITERIA).id); }
  ctx.neCats = ne;

  const sales: CriterionEval[] = CATEGORIES.flatMap((c) => c.criteria.map((k, j) => genCriterion(k, c.id, clamp(callL + (spProfile.bias[c.group] ?? 0)), ctx, j)));

  // Flags + score caps
  const flags: FlagItem[] = flagSpecs.map((f, k) => {
    const def = FLAG_BY_ID[f.flagId];
    const segN = t.flags[f.flagId]!;
    const caps: string[] = [];
    if (f.cap) for (const c of def.caps) {
      const crit = sales.find((x) => x.id === c.criterion);
      if (crit && typeof crit.outcome === "number") {
        // The engine score before the cap must exceed the cap, otherwise the cap would not bite.
        const original = (crit.outcome <= c.cap ? c.cap + 1 : crit.outcome) as NumericOutcome;
        const capped = c.cap as NumericOutcome;
        crit.outcome = capped; crit.modelOutcome = capped; crit.cap = { flagId: f.flagId, originalScore: original };
        crit.explanation += ` Capped at ${capped} because of flag ${f.flagId} (engine score before cap: ${original}).`;
        caps.push(crit.id);
      }
    }
    return {
      id: `${call.id}-F${k + 1}`, flagId: f.flagId, severity: f.severity ?? def.severity, interpretation: f.interpretation, verification: f.verification,
      quote: quoteOf(t.segments[segN - 1]), explanation: `${def.description} The quoted statement appears to match this pattern${f.interpretation === "ambiguous" ? ", but context is ambiguous and needs a human check" : ""}.`,
      decision: "pending", capsCriteria: caps,
    };
  });

  const spL = clamp(callL + 0.05);
  const spSegs = Object.values(t.sp);
  const psych: CriterionEval[] = SP_CRITERIA.map((d, k) => {
    const flagged = flagSpecs.find((f) => SP_FLAG_MAP[f.flagId] === d.id);
    const forced = flagged ? ((rand() < 0.5 ? 0 : 1) as NumericOutcome) : undefined;
    const c = genCriterion(d, "SP", spL, { ...ctx, naCats: new Set(), midway: false }, 0, forced);
    if (c.outcome !== "NA" && c.outcome !== "NE" && c.outcome !== 0 && spSegs.length) {
      const seg = t.segments[spSegs[k % spSegs.length] - 1];
      c.quotes = [quoteOf(seg)]; c.evidenceConfidence = seg.speaker === "unclear" ? "low" : c.evidenceConfidence;
    }
    if (flagged && c.outcome !== "NE") { const fs = t.segments[t.flags[flagged.flagId]! - 1]; c.quotes = [quoteOf(fs)]; c.absence = undefined; c.evidenceConfidence = "high"; c.explanation = `Linked to flag ${flagged.flagId}. ${c.explanation}`; }
    if (c.outcome === 0 && !c.absence && c.quotes.length === 0) c.absence = { start: 0, end: call.durationSec, note: `Checked the whole call ${ts(0, call.durationSec)}; no evidence of this behaviour.` };
    return c;
  });

  const scores = computeScores(sales, psych);
  const cat = (id: string) => scores.categories.find((c) => c.id === id)!;
  const ranked = scores.categories.filter((c) => c.pct !== null).sort((a, b) => b.pct! - a.pct!);
  const segOf = (c: string) => [t.sp[c] ?? t.pr[c]].filter(Boolean) as number[];
  const strengths: EvidenceBullet[] = ranked.filter((c) => c.pct! >= 60).slice(0, 3).map((c) => ({ text: `${CATEGORY_BY_ID[c.id].name} (${c.pct!.toFixed(0)}%): the salesperson handled this stage clearly, with direct evidence in the transcript.`, segments: segOf(c.id) }));
  const weak = [...ranked].reverse().filter((c) => c.pct! < 60).slice(0, 3);
  const missed: EvidenceBullet[] = weak.map((c) => ({ text: `${CATEGORY_BY_ID[c.id].name} (${c.pct!.toFixed(0)}%): the conversation moved on before this stage was explored properly.`, segments: segOf(c.id) }));
  const coaching: CoachingPriority[] = weak.map((c) => {
    const worst = sales.filter((x) => x.categoryId === c.id && typeof x.outcome === "number").sort((a, b) => (a.outcome as number) - (b.outcome as number))[0];
    return { categoryId: c.id, issue: `${CATEGORY_BY_ID[c.id].name} is scoring ${c.pct!.toFixed(0)}% — weakest point: ${worst ? worst.name.toLowerCase() : "coverage"}.`, action: `Practise ${worst ? worst.name.toLowerCase() : CATEGORY_BY_ID[c.id].name.toLowerCase()} in a role-play, then review the next call together.`, example: EXAMPLE_FOR(c.id, lang, t), segments: segOf(c.id) };
  });

  const oc = cat("C18");
  const objOutcome: Objection["outcome"] = oc.pct === null ? "unclear" : oc.pct >= 67 ? "handled_well" : oc.pct >= 34 ? "partially" : "poorly";
  const objections: Objection[] = t.obj ? [{ type: objType, quote: quoteOf(t.segments[t.obj - 1]), outcome: objOutcome, handling: objOutcome === "unclear" ? "Handling could not be assessed from the available evidence." : `The salesperson ${objOutcome === "handled_well" ? "acknowledged the concern, asked what was behind it and offered a relevant option" : objOutcome === "partially" ? "acknowledged the concern but did not fully explore the cause" : "moved on without exploring the concern"}.` }] : [];

  const field = (label: string, cat: string, catIdFirst: string): ProfileField => {
    const c = sales.find((x) => x.id === catIdFirst)!;
    const n = t.pr[cat];
    return n && c.outcome !== 0 && c.outcome !== "NE" && c.outcome !== "NA" ? { label, value: t.segments[n - 1].text, segment: n } : { label, value: null, segment: null };
  };
  const profile: ProfileField[] = [field("Occupation", "C03", "C03-01"), field("Business & offer", "C04", "C04-02"), field("Marketing channels", "C04", "C04-03"), field("Goals", "C05", "C05-01"), field("Challenges", "C09", "C09-01")];

  const verify: string[] = [];
  flags.filter((f) => f.verification === "needs_audio_check").forEach((f) => verify.push(`Listen to the audio around ${clock(f.quote.start)} to check flag "${f.flagId}".`));
  if (ne.size || scenario === "midway") verify.push(`${scores.stage.ne} criteria were Not Evaluable — confirm whether evidence exists in the recording.`);
  if (uncertain) verify.push("Speaker attribution is uncertain in parts of the transcript — verify who said the quoted lines.");
  verify.push("Verify objection responses: the Approved Objection Doc is not yet available.");

  const stagePct = scores.stage.pct, psyPct = scores.psychology.pct;
  const summary = [
    `This ${call.callType === "continuation" ? "continuation" : call.callType === "follow_up" ? "follow-up" : call.callType === "renewal" ? "renewal" : "new webinar prospect"} call lasted ${Math.round(call.durationSec / 60)} minutes in ${lang === "hindi" ? "Hindi" : "English"}.`,
    `The sales-stage score is ${stagePct === null ? "not available" : `${stagePct.toFixed(1)}%${scores.stage.provisional ? " (provisional)" : ""}`} and the separate Sales Psychology & Conduct score is ${psyPct === null ? "not available" : `${psyPct.toFixed(1)}%${scores.psychology.provisional ? " (provisional)" : ""}`}.`,
    ranked.length ? `The strongest stage was ${CATEGORY_BY_ID[ranked[0].id].name} and the weakest was ${CATEGORY_BY_ID[ranked[ranked.length - 1].id].name}.` : "No category could be scored.",
    objections.length ? `The prospect raised a ${OBJECTION_LABEL[objType].toLowerCase()} objection, which was ${objOutcome === "unclear" ? "unclear to assess" : objOutcome.replace("_", " ")}.` : "No objection was raised.",
    flags.length ? `${flags.length} critical flag${flags.length > 1 ? "s were raised and need" : " was raised and needs"} a human decision.` : "No critical flags were raised.",
  ].join(" ");

  const warnings: string[] = [];
  if (uncertain) warnings.push("Speaker attribution is uncertain.");
  if (scenario === "midway") warnings.push("Recording starts midway through the call; C01–C02 are Not Evaluable.");
  if (call.gates.transcript.decision === "requires_human_review") warnings.push("Transcript gate required human review before evaluation.");

  return {
    metadata: { rubricVersion: RUBRIC_VERSION, evaluator: scenario === "manual" ? MANUAL_EVALUATOR : EVALUATOR_MODEL, evaluatedAt: new Date(new Date(call.callDate).getTime() + (call.durationSec + 2400) * 1000).toISOString() },
    call_type: { value: call.callType, confirmedBy: call.callTypeConfirmedBy },
    applicability: { notApplicableCategories: [...ctx.naCats] },
    transcript_quality: { coverage: cov, source: "Whisper transcription (mock)", language: lang, brokenChars: call.gates.transcript.brokenChars, speakerUncertain: uncertain },
    sales_stage: sales, psychology: psych, scores,
    extras: {
      flags, objections, prospect_profile: profile, strengths, missed_opportunities: missed, coaching_priorities: coaching,
      executive_summary: summary,
      final_coaching_note: weak.length ? `Focus the next coaching session on ${weak.map((c) => CATEGORY_BY_ID[c.id].name).join(", ")}. ${flags.length ? "Review the flagged statements together before the next call." : "Keep up the strengths already visible in this call."}` : "Strong, balanced call. Share the highlighted moments as an example for the team.",
      needs_human_verification: verify,
    },
    human_review: { status: "pending", notes: [] },
    validation: { adjustments: scenario === "midway" ? ["C01–C02 set to NE: recording_starts_midway"] : [], warnings, criteriaTotal: sales.length + psych.length },
  };
}

function build(): Dataset {
  const total = Object.values(PROFILE).reduce((a, p) => a + p.count, 0);
  const offsets = [0, 0, 1, ...Array.from({ length: total - 3 }, () => Math.min(59, Math.floor(60 * Math.pow(rand(), 1.05))))].sort((a, b) => b - a);
  // Assign salespeople; new joiners only on recent dates.
  const recentIdx = offsets.map((o, i) => ({ o, i })).filter((x) => x.o <= 25 && x.o > 1).map((x) => x.i);
  const owner: string[] = new Array(total).fill("");
  const take = (id: string) => { for (let k = 0; k < PROFILE[id].count; k++) { const j = recentIdx.splice(Math.floor(rand() * recentIdx.length), 1)[0]; owner[j] = id; } };
  take("sp-ananya"); take("sp-kabir");
  const pool: string[] = [];
  for (const id of Object.keys(PROFILE).slice(0, 5)) for (let k = 0; k < PROFILE[id].count; k++) pool.push(id);
  pool.sort(() => rand() - 0.5);
  let pi = 0;
  for (let i = 0; i < total; i++) if (!owner[i]) owner[i] = pool[pi++];

  const today = istDayStart(NOW);
  const records: CallRecord[] = [];
  const actions: ReviewAction[] = [];
  let seq = 0;
  const act = (a: Omit<ReviewAction, "id">) => actions.push({ id: `ACT-S${String(++seq).padStart(3, "0")}`, ...a });

  for (let i = 0; i < total; i++) {
    const scenario = SCENARIOS[i] ?? "normal";
    const sp = SALESPEOPLE.find((s) => s.id === owner[i])!;
    const offset = offsets[i];
    const date = new Date(today - offset * DAY + (offset === 0 ? rint(10, 14) : rint(10, 18)) * 3_600_000 + rint(0, 59) * 60_000).toISOString();
    const language: Language = HINDI_CALLS.has(i) ? "hindi" : "english";
    const dur = scenario === "recording_blocked" ? 1693 : rint(540, 2700);
    const callType: CallType = scenario === "continuation" ? "continuation" : scenario === "follow_up" ? "follow_up" : scenario === "renewal" ? "renewal" : scenario === "support" ? "support_existing_customer" : scenario === "no_conversation" ? "no_conversation" : "new_webinar_prospect";
    const unconfirmed = scenario === "type_unconfirmed";
    const confirmedBy = unconfirmed ? null : pick(REVIEWERS);
    const flagSpecs = FLAG_CALLS[i] ?? [];
    const midway = scenario === "midway";
    const cov = scenario === "transcript_corrupted" ? 0.31 : scenario === "transcript_ack" || scenario === "transcript_needs_ack" ? 0.74 : midway ? 0.62 : Number((0.92 + rand() * 0.07).toFixed(2));
    const tDecision = scenario === "transcript_corrupted" ? "corrupted_transcript" : scenario === "transcript_ack" || scenario === "transcript_needs_ack" ? "requires_human_review" : scenario === "no_conversation" ? "insufficient_speech" : "eligible";
    const audioSec = scenario === "recording_blocked" ? 335 : dur;
    const gates: GateInfo = {
      recording: { status: audioSec >= dur * 0.9 ? "pass" : "blocked", audioSec, loggedSec: dur },
      transcript: {
        decision: tDecision, status: tDecision === "eligible" ? "pass" : tDecision === "requires_human_review" ? "review" : "blocked",
        reason: tDecision === "eligible" ? "Transcript is complete and in the expected language." : tDecision === "requires_human_review" ? `Coverage ${(cov * 100).toFixed(0)}% — some passages may be missing; a human must acknowledge before evaluation.` : tDecision === "corrupted_transcript" ? "Many broken characters; transcript unusable." : "Too little speech to evaluate.",
        brokenChars: tDecision === "corrupted_transcript" ? 412 : tDecision === "requires_human_review" ? 36 : 0, coverage: cov,
      },
      callType: { status: unconfirmed ? "blocked" : "pass" },
    };
    const phoneMasked = `+91 9${rint(1, 9)}••• ••${rint(100, 999)}`;
    const id = `CLZ-${5_200_000 + i * 37 + rint(1, 30)}`;
    const meta: CallMeta = { id, salespersonId: sp.id, callDate: date, durationSec: dur, language, callType, callTypeConfirmedBy: confirmedBy, phoneMasked, status: "evaluated", gates };

    if (scenario === "processing") { meta.status = "processing"; records.push({ call: meta, doc: null, transcript: null }); continue; }
    if (scenario === "failed") { meta.status = "failed"; meta.heldReason = "Evaluation engine returned invalid output (schema validation failed)."; records.push({ call: meta, doc: null, transcript: null }); continue; }
    if (scenario === "recording_blocked") { meta.status = "held"; meta.heldReason = `Recording gate blocked: ${audioSec} s of ${dur} s (below 90% of logged duration).`; records.push({ call: meta, doc: null, transcript: null }); continue; }
    if (scenario === "transcript_corrupted") {
      meta.status = "held"; meta.heldReason = "Transcript gate blocked: corrupted transcript.";
      records.push({ call: meta, doc: null, transcript: { source: "Whisper transcription (mock)", language, segments: [{ n: 1, start: 0, end: 20, speaker: "unclear", text: CORRUPT_TEXT }] } }); continue;
    }
    if (scenario === "no_conversation" || scenario === "support") { meta.status = "held"; meta.heldReason = "Call type is not scored by the sales rubric."; records.push({ call: meta, doc: null, transcript: null }); continue; }

    const objType = pick(["financial", "financial", "financial", "consult", "consult", "trust", "time", "suitability", "decision_maker", "other"] as ObjectionType[]);
    const pName = pick(PROSPECTS);
    const uncertain = UNCERTAIN_SPEAKER.has(i);
    const t = buildTranscript(language, sp.name.split(" ")[0], pName, dur, objType, flagSpecs.map((f) => f.flagId), midway, uncertain);
    const doc = makeDoc(i, meta, PROFILE[sp.id], scenario, flagSpecs, t, objType, cov, uncertain);
    if (scenario === "transcript_needs_ack") { meta.status = "held"; meta.heldReason = "Transcript gate: requires human review — acknowledge to proceed."; }
    else if (unconfirmed) { meta.status = "held"; meta.heldReason = "Held — call type needs confirmation."; }
    if (scenario === "transcript_ack") { gates.transcript.ackBy = "Kavita Joshi"; gates.transcript.ackAt = new Date(new Date(date).getTime() + 5 * 3_600_000).toISOString(); gates.transcript.status = "pass"; }
    records.push({ call: meta, doc, transcript: { source: "Whisper transcription (mock)", language, segments: t.segments } });

    const when = (h: number) => new Date(Math.min(NOW - 3_600_000, new Date(date).getTime() + dur * 1000 + h * 3_600_000)).toISOString();
    if ([2, 10, 19, 26].includes(i)) act({ callId: id, at: when(6), by: pick(REVIEWERS), kind: "approve", notes: "Checked evidence quotes against the recording. Approved." });
    if (i === 14) act({ callId: id, at: when(8), by: "Kavita Joshi", kind: "dispute", notes: "Too many criteria are NE; the transcript looks unreliable around the middle of the call." });
    for (const f of doc.extras.flags) if (flagSpecs.find((x) => x.flagId === f.flagId)?.interpretation === "confirmed" && i === 18) act({ callId: id, at: when(5), by: "Kavita Joshi", kind: "flag_decision", flagId: f.id, decision: "confirmed", notes: "Confirmed from the recording." });
  }
  return { salespeople: SALESPEOPLE, records, actions };
}

export const BASE: Dataset = build();
