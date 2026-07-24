import React from "react";
import { Document, Font, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";

// ─── Font registration ─────────────────────────────────────────────────────────

const FD = path.join(process.cwd(), "node_modules/@fontsource/nunito/files");

Font.register({
  family: "Nunito",
  fonts: [
    { src: `${FD}/nunito-latin-400-normal.woff`, fontWeight: 400 },
    { src: `${FD}/nunito-latin-400-italic.woff`, fontStyle: "italic", fontWeight: 400 },
    { src: `${FD}/nunito-latin-600-normal.woff`, fontWeight: 600 },
    { src: `${FD}/nunito-latin-600-italic.woff`, fontStyle: "italic", fontWeight: 600 },
    { src: `${FD}/nunito-latin-700-normal.woff`, fontWeight: 700 },
    { src: `${FD}/nunito-latin-700-italic.woff`, fontStyle: "italic", fontWeight: 700 },
  ],
});

// ─── Palette ──────────────────────────────────────────────────────────────────

const NAVY   = "#1e3a5f";
const BODY   = "#334155";
const MUTED  = "#64748b";
const BORDER = "#c8d4e0";
const BG_TINT = "#f8fafc";

// Per-section-type top accent color
const TYPE_ACCENT: Record<string, string> = {
  warmup_box:              "#7c3aed",
  fill_blank:              "#2563eb",
  numbered_response:       "#059669",
  content_box:             "#d97706",
  two_column_box:          "#db2777",
  drawing_box:             "#ea580c",
  three_column_box:        "#0284c7",
  structured_concept_box:  "#0f766e",
  graph_box:               "#b45309",
  acronym_scaffold:        "#7c3aed",
  labeled_comparison_table:"#1d4ed8",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Nunito",
    fontWeight: 400,
    fontSize: 10,
    color: BODY,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 46,
    paddingRight: 46,
    backgroundColor: "#ffffff",
  },

  // ── Top meta row ────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  metaCourse: {
    fontSize: 8,
    letterSpacing: 0.4,
    color: MUTED,
    fontWeight: 400,
  },
  metaNameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  metaNameLabel: {
    fontWeight: 600,
    fontSize: 8.5,
    color: NAVY,
    paddingBottom: 2,
  },
  metaNameLine: {
    width: 110,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    height: 13,
  },

  // ── Title ────────────────────────────────────────────────────────────────────
  titleBlock: {
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    borderBottomStyle: "solid",
    paddingBottom: 6,
    marginBottom: 10,
    alignItems: "center",
  },
  titleText: {
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.3,
    color: NAVY,
    textAlign: "center",
  },

  // ── Essential question ───────────────────────────────────────────────────────
  eqBox: {
    borderWidth: 0.75,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 5,
    backgroundColor: BG_TINT,
  },
  eqLabel: {
    fontWeight: 600,
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: NAVY,
    marginBottom: 3,
  },
  eqText: {
    fontWeight: 400,
    fontStyle: "italic",
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.45,
  },

  // ── Learning objective ───────────────────────────────────────────────────────
  loRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 9,
    paddingLeft: 2,
  },
  loLabel: {
    fontWeight: 600,
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 0.5,
    paddingTop: 0.5,
  },
  loText: {
    fontWeight: 400,
    fontSize: 8.5,
    color: MUTED,
    lineHeight: 1.4,
    flex: 1,
  },

  // ── Section box ──────────────────────────────────────────────────────────────
  section: {
    borderWidth: 0.75,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 8,
    overflow: "hidden",
  },
  sectionPaired: {
    borderWidth: 0.75,
    borderColor: BORDER,
    borderStyle: "solid",
    flex: 1,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
    marginBottom: 0,
  },
  sectionInner: {
    padding: 10,
  },
  sectionLabel: {
    fontWeight: 600,
    fontSize: 8.5,
    color: NAVY,
    letterSpacing: 0.2,
    marginBottom: 5,
  },
  bodyText: {
    fontWeight: 400,
    fontSize: 9.5,
    color: BODY,
    lineHeight: 1.45,
    marginBottom: 6,
  },

  // ── Writing lines ─────────────────────────────────────────────────────────────
  blankLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER,
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
    fontWeight: 400,
    fontSize: 9.5,
    color: MUTED,
    width: 18,
    paddingBottom: 2,
  },
  numberLine: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    height: 24,
  },

  // ── Table ─────────────────────────────────────────────────────────────────────
  tableWrap: {
    borderWidth: 0.75,
    borderColor: BORDER,
    borderStyle: "solid",
    marginTop: 5,
  },
  tableHeadRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    backgroundColor: BG_TINT,
  },
  tableBodyRow: {
    flexDirection: "row",
    height: 34,
  },

  // ── Drawing area ──────────────────────────────────────────────────────────────
  drawArea: {
    borderWidth: 0.75,
    borderColor: BORDER,
    borderStyle: "dashed",
    height: 110,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  drawHint: {
    fontWeight: 400,
    fontStyle: "italic",
    fontSize: 8,
    color: BORDER,
  },

  // ── Answer key ────────────────────────────────────────────────────────────────
  answerKey: {
    backgroundColor: "#f1f5f9",
    borderLeftWidth: 2,
    borderLeftColor: MUTED,
    borderLeftStyle: "solid",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 7,
  },
  answerKeyLabel: {
    fontWeight: 700,
    fontSize: 7.5,
    color: MUTED,
  },
  answerKeyText: {
    fontWeight: 400,
    fontSize: 9,
    color: BODY,
    lineHeight: 1.35,
  },

  // ── Pair row ──────────────────────────────────────────────────────────────────
  pairRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
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
        paddingTop: isHeader ? 5 : 0,
        paddingBottom: isHeader ? 5 : 0,
        paddingLeft: 7,
        paddingRight: 7,
        borderRightWidth: isLast ? 0 : 0.75,
        borderRightColor: BORDER,
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

    case "fill_blank": {
      // Expand each ___ to a wide visual blank so students have room to write
      const expandedPrompt = section.student_prompt.replace(/___/g, "________________");
      return (
        <View>
          <Text style={S.bodyText}>{expandedPrompt}</Text>
          {isTeacher ? <AnswerKey notes={section.answer_key_notes} /> : null}
        </View>
      );
    }

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
      const ROWS = Math.max(2, section.num_lines ?? 5);
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHeadRow}>
              {cols.map((col, i) => (
                <TCell key={i} widthPct={col.width_pct} isLast={i === cols.length - 1} isHeader>
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: NAVY, letterSpacing: 0.3 }}>
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
                    ? { borderBottomWidth: 0.5, borderBottomColor: BORDER, borderBottomStyle: "solid" }
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
      const ROWS = Math.max(2, section.num_lines ?? 4);
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHeadRow}>
              {cols.map((col, i) => (
                <TCell key={i} widthPct={col.width_pct} isLast={i === cols.length - 1} isHeader>
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: NAVY, letterSpacing: 0.3 }}>
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
                    ? { borderBottomWidth: 0.5, borderBottomColor: BORDER, borderBottomStyle: "solid" }
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

    case "structured_concept_box": {
      const fields = section.fields ?? ["Definition:", "Key Relationship:", "Example:"];
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 5, borderWidth: 0.75, borderColor: BORDER, borderStyle: "solid" }}>
              <View style={{ backgroundColor: NAVY, paddingTop: 6, paddingBottom: 6, alignItems: "center" }}>
                <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 10, color: "#ffffff", letterSpacing: 0.3 }}>
                  {section.heading ?? section.content ?? "Key Concept"}
                </Text>
              </View>
              {fields.map((field, i) => (
                <View
                  key={i}
                  style={[
                    { paddingTop: 7, paddingBottom: 7, paddingLeft: 10, paddingRight: 10 },
                    i > 0 ? { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: "solid" } : {},
                  ]}
                >
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 8, color: MUTED, marginBottom: 4 }}>
                    {field}
                  </Text>
                  <View style={{ borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 22 }} />
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    case "graph_box":
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 6, height: 140 }}>
              {/* Y-axis label */}
              <View style={{ position: "absolute", left: 0, top: 0, bottom: 20, width: 18, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Nunito", fontSize: 7, color: MUTED }}>P{"\n"}r{"\n"}i{"\n"}c{"\n"}e</Text>
              </View>
              {/* L-shaped graph area */}
              <View
                style={{
                  position: "absolute",
                  left: 18,
                  right: 8,
                  top: 6,
                  bottom: 20,
                  borderLeftWidth: 1,
                  borderBottomWidth: 1,
                  borderLeftColor: BODY,
                  borderBottomColor: BODY,
                  borderLeftStyle: "solid",
                  borderBottomStyle: "solid",
                }}
              >
                <Text style={{ position: "absolute", top: -7, left: -3, fontSize: 8, color: BODY }}>↑</Text>
              </View>
              {/* X-axis label */}
              <View style={{ position: "absolute", right: 0, bottom: 0, height: 18 }}>
                <Text style={{ fontFamily: "Nunito", fontSize: 7, color: MUTED }}>Quantity →</Text>
              </View>
            </View>
          )}
        </View>
      );

    case "acronym_scaffold": {
      const letters = (section.acronym ?? "").toUpperCase().split("");
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 6 }}>
              {letters.map((letter, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      backgroundColor: NAVY,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 12, color: "#ffffff" }}>
                      {letter}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      borderBottomWidth: 0.75,
                      borderBottomColor: BORDER,
                      borderBottomStyle: "solid",
                      height: 22,
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    case "labeled_comparison_table": {
      const colLabels = section.col_labels ?? [];
      const rowLabels = section.row_labels ?? [];
      if (colLabels.length === 0 || rowLabels.length === 0) return null;
      const rowLabelWidthPct = 20;
      const dataCellWidthPct = (100 - rowLabelWidthPct) / colLabels.length;
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          <View style={[S.tableWrap, { marginTop: 5 }]}>
            {/* Header row */}
            <View style={S.tableHeadRow}>
              <TCell widthPct={rowLabelWidthPct} isLast={false} isHeader>
                <Text style={{ fontSize: 7 }}> </Text>
              </TCell>
              {colLabels.map((label, i) => (
                <TCell key={i} widthPct={dataCellWidthPct} isLast={i === colLabels.length - 1} isHeader>
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7, color: NAVY, letterSpacing: 0.2 }}>
                    {label.toUpperCase()}
                  </Text>
                </TCell>
              ))}
            </View>
            {/* Data rows */}
            {rowLabels.map((rowLabel, row) => (
              <View
                key={row}
                style={[
                  { flexDirection: "row", minHeight: 32 },
                  row < rowLabels.length - 1
                    ? { borderBottomWidth: 0.5, borderBottomColor: BORDER, borderBottomStyle: "solid" }
                    : {},
                ]}
              >
                <TCell widthPct={rowLabelWidthPct} isLast={false} isHeader={false}>
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 8, color: NAVY }}>
                    {rowLabel}
                  </Text>
                </TCell>
                {colLabels.map((_, ci) => (
                  <TCell key={ci} widthPct={dataCellWidthPct} isLast={ci === colLabels.length - 1} isHeader={false} />
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
  const accent = TYPE_ACCENT[section.type] ?? NAVY;
  return (
    <View style={paired ? S.sectionPaired : S.section} wrap={false}>
      <View style={[S.accentBar, { backgroundColor: accent }]} />
      <View style={S.sectionInner}>
        {section.heading && (
          <Text style={S.sectionLabel}>{section.heading}</Text>
        )}
        <SectionBody section={section} isTeacher={isTeacher} paired={paired} />
      </View>
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
            {plan.subject} · {plan.grade_band}
            {isTeacher ? " · Teacher Key" : ""}
          </Text>
          <View style={S.metaNameRow}>
            <Text style={S.metaNameLabel}>Name:</Text>
            <View style={S.metaNameLine} />
          </View>
        </View>

        {/* Title */}
        <View style={S.titleBlock}>
          <Text style={S.titleText}>{plan.title}</Text>
        </View>

        {/* Essential Question */}
        <View style={S.eqBox}>
          <Text style={S.eqLabel}>Essential Question</Text>
          <Text style={S.eqText}>{plan.essential_question}</Text>
        </View>

        {/* Learning Objective */}
        {plan.learning_objective ? (
          <View style={S.loRow}>
            <Text style={S.loLabel}>Objective:</Text>
            <Text style={S.loText}>{plan.learning_objective}</Text>
          </View>
        ) : null}

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
