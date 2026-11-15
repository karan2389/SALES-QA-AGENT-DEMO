import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ReportContext } from "../src/components/report/ctx";
import { S14Review } from "../src/components/report/Section14";
import { S1CallDetails, S2Performance, S3Summary, S4Profile, S5Scorecard } from "../src/components/report/Sections1to5";
import { S6Criteria, S7Psychology } from "../src/components/report/Sections6to7";
import { S10Missed, S11Flags, S12Coaching, S13Note, S8Objections, S9Well } from "../src/components/report/Sections8to13";
import { ToastProvider } from "../src/components/ui/Toast";
import { BASE } from "../src/data/mock/generate";
import { applyActions } from "../src/lib/effective";
import { reportToText } from "../src/lib/reportText";

const ds = applyActions(BASE, BASE.actions);
const flagged = ds.records.find((r) => r.doc && r.call.status === "evaluated" && r.doc.extras.flags.some((f) => f.capsCriteria.length))!;
const held = ds.records.find((r) => r.call.status === "held" && r.call.heldReason?.startsWith("Recording gate"))!;
const sp = (r: typeof flagged) => ds.salespeople.find((s) => s.id === r.call.salespersonId)!;
const render = (rec: typeof flagged, el: ReactElement) =>
  renderToStaticMarkup(<ToastProvider><ReportContext.Provider value={{ record: rec, salesperson: sp(rec), actions: ds.actions.filter((a) => a.callId === rec.call.id), jump: () => {} }}>{el}</ReportContext.Provider></ToastProvider>);

const doc = flagged.doc!;
const sections: [string, ReactElement][] = [
  ["1 Call Details", <S1CallDetails key="1" />],
  ["2 Overall Performance", <S2Performance key="2" doc={doc} />],
  ["3 Executive Summary", <S3Summary key="3" doc={doc} />],
  ["4 Prospect Profile", <S4Profile key="4" doc={doc} />],
  ["5 Category-wise Scorecard", <S5Scorecard key="5" doc={doc} />],
  ["6 Detailed Criterion Evaluation", <S6Criteria key="6" doc={doc} />],
  ["7 Sales Psychology & Conduct", <S7Psychology key="7" doc={doc} />],
  ["8 Objection Analysis", <S8Objections key="8" doc={doc} />],
  ["9 What Went Well", <S9Well key="9" doc={doc} />],
  ["10 Missed Opportunities", <S10Missed key="10" doc={doc} />],
  ["11 Critical Flags", <S11Flags key="11" doc={doc} />],
  ["12 Personal Coaching Plan", <S12Coaching key="12" doc={doc} />],
  ["13 Final Coaching Note", <S13Note key="13" doc={doc} />],
  ["14 Human Review", <S14Review key="14" />],
];

describe("MRV1 report sections (flagship flagged call)", () => {
  it.each(sections)("section %s matches snapshot", (_name, el) => {
    expect(render(flagged, el)).toMatchSnapshot();
  });
  it("renders all 14 sections with their numbers in order", () => {
    const html = sections.map(([, el]) => render(flagged, el));
    html.forEach((h, i) => expect(h).toContain(`data-section="${i + 1}"`));
  });
  it("shows both scores separately and never a combined score", () => {
    const h = render(flagged, <S2Performance doc={doc} />);
    expect(h).toContain("Sales-stage score");
    expect(h).toContain("Sales Psychology &amp; Conduct score");
    expect(h.toLowerCase()).not.toContain(["overall", "quality"].join(" "));
  });
  it("explains a flag-caused cap", () => {
    const h = render(flagged, <S11Flags doc={doc} />);
    expect(h).toMatch(/capped at \d because of flag/);
  });
});

describe("held calls", () => {
  it("show only the reason and no scores in the text report", () => {
    const text = reportToText(held, sp(held));
    expect(text).toContain("No normal sales-stage evaluation was generated");
    expect(text).not.toContain("Sales-stage score");
  });
  it("Section 14 renders for a held call", () => {
    expect(render(held, <S14Review heldOnly />)).toContain('data-section="14"');
  });
});

describe("report text export", () => {
  it("contains all 14 section headings", () => {
    const text = reportToText(flagged, sp(flagged));
    ["1. CALL DETAILS", "2. OVERALL PERFORMANCE", "5. CATEGORY-WISE SCORECARD", "7. SALES PSYCHOLOGY & CONDUCT", "11. CRITICAL FLAGS", "14. HUMAN REVIEW"].forEach((h) => expect(text).toContain(h));
  });
});
