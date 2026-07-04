import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";

// ─── Palette ──────────────────────────────────────────────────────────────────

const BK = "#000000";
const DK = "#1a1a1a";
const MD = "#666666";
const LT = "#cccccc";

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DK,
    paddingTop: 38,
    paddingBottom: 38,
    paddingLeft: 46,
    paddingRight: 46,
    backgroundColor: "#ffffff",
  },

  // ── Top meta row ────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 7,
  },
  metaCourse: {
    fontSize: 8,
    letterSpacing: 0.5,
    color: MD,
  },
  metaNameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  metaNameLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingBottom: 2,
  },
  metaNameLine: {
    width: 110,
    borderBottomWidth: 0.75,
    borderBottomColor: BK,
    borderBottomStyle: "solid",
    height: 13,
  },

  // ── Title ────────────────────────────────────────────────────────────────────
  titleBlock: {
    borderBottomWidth: 2,
    borderBottomColor: BK,
    borderBottomStyle: "solid",
    paddingBottom: 5,
    marginBottom: 9,
    alignItems: "center",
  },
  titleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    letterSpacing: 1.5,
    textAlign: "center",
  },

  // ── Essential question ───────────────────────────────────────────────────────
  eqBox: {
    borderWidth: 1,
    borderColor: BK,
    borderStyle: "solid",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 9,
    paddingRight: 9,
    marginBottom: 7,
  },
  eqLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  eqText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9.5,
    lineHeight: 1.4,
  },

  // ── Section box ──────────────────────────────────────────────────────────────
  section: {
    borderWidth: 1,
    borderColor: BK,
    borderStyle: "solid",
    padding: 9,
    marginBottom: 7,
  },
  sectionPaired: {
    borderWidth: 1,
    borderColor: BK,
    borderStyle: "solid",
    padding: 9,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.4,
    marginBottom: 5,
  },

  // ── Writing lines ─────────────────────────────────────────────────────────────
  blankLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: BK,
    borderBottomStyle: "solid",
    height: 24,
    marginBottom: 3,
  },
  numberedRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  numberLabel: {
    fontSize: 9.5,
    width: 18,
    paddingBottom: 2,
  },
  numberLine: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: BK,
    borderBottomStyle: "solid",
    height: 24,
  },

  // ── Table ─────────────────────────────────────────────────────────────────────
  tableWrap: {
    borderWidth: 1,
    borderColor: BK,
    borderStyle: "solid",
    marginTop: 5,
  },
  tableHeadRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BK,
    borderBottomStyle: "solid",
  },
  tableBodyRow: {
    flexDirection: "row",
    height: 34,
  },

  // ── Drawing area ──────────────────────────────────────────────────────────────
  drawArea: {
    borderWidth: 1,
    borderColor: LT,
    borderStyle: "dashed",
    height: 90,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  drawHint: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8,
    color: LT,
  },

  // ── Answer key ────────────────────────────────────────────────────────────────
  answerKey: {
    backgroundColor: "#f8f8f6",
    borderLeftWidth: 2,
    borderLeftColor: MD,
    borderLeftStyle: "solid",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 7,
  },
  answerKeyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: MD,
  },
  answerKeyText: {
    fontSize: 9,
    lineHeight: 1.35,
  },

  // ── Pair row ──────────────────────────────────────────────────────────────────
  pairRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 7,
  },
});

// ─── Small-section detection ──────────────────────────────────────────────────

function isSmall(s: NotesheetSection): boolean {
  if (s.type === "warmup_box" || s.type === "fill_blank") return true;
  if (s.type === "numbered_response") return (s.num_lines ?? 5) <= 4;
  return false;
}

// ─── Layout algorithm ─────────────────────────────────────────────────────────

type LayoutRow =
  | { kind: "single"; section: NotesheetSection }
  | { kind: "pair"; left: NotesheetSection; right: NotesheetSection };

function buildLayout(sections: NotesheetSection[]): LayoutRow[] {
  const rows: LayoutRow[] = [];
  let i = 0;
  while (i < sections.length) {
    const curr = sections[i];
    const next = sections[i + 1];
    if (isSmall(curr) && next && isSmall(next)) {
      rows.push({ kind: "pair", left: curr, right: next });
      i += 2;
    } else {
      rows.push({ kind: "single", section: curr });
      i++;
    }
  }
  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BlankLines({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={S.blankLine} />
      ))}
    </>
  );
}

function AnswerKey({ notes }: { notes: string }) {
  return (
    <View style={S.answerKey}>
      <Text style={S.answerKeyText}>
        <Text style={S.answerKeyLabel}>KEY: </Text>
        {notes}
      </Text>
    </View>
  );
}

// Renders a single column header or body cell with right-border on non-last cells
function TCell({
  widthPct,
  isLast,
  isHeader,
  children,
}: {
  widthPct: number;
  isLast: boolean;
  isHeader: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: `${widthPct}%`,
        paddingTop: isHeader ? 4 : 0,
        paddingBottom: isHeader ? 4 : 0,
        paddingLeft: 6,
        paddingRight: 6,
        borderRightWidth: isLast ? 0 : 1,
        borderRightColor: isHeader ? BK : LT,
        borderRightStyle: "solid",
      }}
    >
      {children}
    </View>
  );
}

// ─── Section body ─────────────────────────────────────────────────────────────

function SectionBody({
  section,
  isTeacher,
  paired,
}: {
  section: NotesheetSection;
  isTeacher: boolean;
  paired: boolean;
}) {
  switch (section.type) {
    case "warmup_box":
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? <AnswerKey notes={section.answer_key_notes} /> : <BlankLines n={paired ? 5 : 7} />}
        </View>
      );

    case "fill_blank":
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? <AnswerKey notes={section.answer_key_notes} /> : <BlankLines n={paired ? 3 : 5} />}
        </View>
      );

    case "numbered_response": {
      const n = Math.max(1, section.num_lines ?? 5);
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            Array.from({ length: n }).map((_, i) => (
              <View key={i} style={S.numberedRow}>
                <Text style={S.numberLabel}>{i + 1}.</Text>
                <View style={S.numberLine} />
              </View>
            ))
          )}
        </View>
      );
    }

    case "content_box":
      return (
        <View>
          <Text style={S.bodyText}>{section.content}</Text>
          {isTeacher && <AnswerKey notes={section.answer_key_notes} />}
        </View>
      );

    case "two_column_box": {
      const cols = section.columns ?? [
        { header: "Term", width_pct: 40, prefilled: true },
        { header: "Definition", width_pct: 60, prefilled: false },
      ];
      const ROWS = 5;
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          <View style={S.tableWrap}>
            {/* Header row */}
            <View style={S.tableHeadRow}>
              {cols.map((col, i) => (
                <TCell key={i} widthPct={col.width_pct} isLast={i === cols.length - 1} isHeader>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 0.3 }}>
                    {col.header.toUpperCase()}
                  </Text>
                </TCell>
              ))}
            </View>
            {/* Body rows */}
            {Array.from({ length: ROWS }).map((_, row) => (
              <View
                key={row}
                style={[
                  S.tableBodyRow,
                  row < ROWS - 1
                    ? { borderBottomWidth: 0.5, borderBottomColor: LT, borderBottomStyle: "solid" }
                    : {},
                ]}
              >
                {cols.map((col, ci) => (
                  <TCell key={ci} widthPct={col.width_pct} isLast={ci === cols.length - 1} isHeader={false} />
                ))}
              </View>
            ))}
          </View>
          {isTeacher && <AnswerKey notes={section.answer_key_notes} />}
        </View>
      );
    }

    case "drawing_box":
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={S.drawArea}>
              <Text style={S.drawHint}>Draw here</Text>
            </View>
          )}
        </View>
      );

    case "three_column_box": {
      const cols = section.columns ?? [
        { header: "Concept", width_pct: 33, prefilled: false },
        { header: "Example", width_pct: 34, prefilled: false },
        { header: "Why It Works", width_pct: 33, prefilled: false },
      ];
      const ROWS = 4;
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHeadRow}>
              {cols.map((col, i) => (
                <TCell key={i} widthPct={col.width_pct} isLast={i === cols.length - 1} isHeader>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 0.3 }}>
                    {col.header.toUpperCase()}
                  </Text>
                </TCell>
              ))}
            </View>
            {Array.from({ length: ROWS }).map((_, row) => (
              <View
                key={row}
                style={[
                  S.tableBodyRow,
                  row < ROWS - 1
                    ? { borderBottomWidth: 0.5, borderBottomColor: LT, borderBottomStyle: "solid" }
                    : {},
                ]}
              >
                {cols.map((col, ci) => (
                  <TCell key={ci} widthPct={col.width_pct} isLast={ci === cols.length - 1} isHeader={false} />
                ))}
              </View>
            ))}
          </View>
          {isTeacher && <AnswerKey notes={section.answer_key_notes} />}
        </View>
      );
    }

    default:
      return null;
  }
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  isTeacher,
  paired = false,
}: {
  section: NotesheetSection;
  isTeacher: boolean;
  paired?: boolean;
}) {
  return (
    <View style={paired ? S.sectionPaired : S.section} wrap={false}>
      {section.heading && (
        <Text style={S.sectionLabel}>{section.heading.toUpperCase()}</Text>
      )}
      <SectionBody section={section} isTeacher={isTeacher} paired={paired} />
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export default function NotesheetDocument({
  plan,
  mode,
}: {
  plan: NotesheetPlan;
  mode: "student" | "teacher_key";
}) {
  const isTeacher = mode === "teacher_key";
  const layout = buildLayout(plan.sections);

  return (
    <Document>
      <Page size="LETTER" style={S.page}>

        {/* Course info | NAME: ___ */}
        <View style={S.metaRow}>
          <Text style={S.metaCourse}>
            {plan.subject.toUpperCase()} · {plan.grade_band.toUpperCase()}
            {isTeacher ? " · TEACHER KEY" : ""}
          </Text>
          <View style={S.metaNameRow}>
            <Text style={S.metaNameLabel}>NAME:</Text>
            <View style={S.metaNameLine} />
          </View>
        </View>

        {/* Title */}
        <View style={S.titleBlock}>
          <Text style={S.titleText}>{plan.title.toUpperCase()}</Text>
        </View>

        {/* Essential Question */}
        <View style={S.eqBox}>
          <Text style={S.eqLabel}>ESSENTIAL QUESTION</Text>
          <Text style={S.eqText}>{plan.essential_question}</Text>
        </View>

        {/* Sections */}
        {layout.map((row, idx) => {
          if (row.kind === "single") {
            return (
              <SectionCard
                key={row.section.id}
                section={row.section}
                isTeacher={isTeacher}
              />
            );
          }
          return (
            <View key={`pair-${idx}`} style={S.pairRow} wrap={false}>
              <SectionCard section={row.left} isTeacher={isTeacher} paired />
              <SectionCard section={row.right} isTeacher={isTeacher} paired />
            </View>
          );
        })}

      </Page>
    </Document>
  );
}
