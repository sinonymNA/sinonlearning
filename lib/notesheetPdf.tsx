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
  frayer_model:            "#0891b2",
  t_chart:                 "#16a34a",
  sequence_box:            "#9333ea",
  cause_effect_box:        "#dc2626",
  timeline_box:            "#0369a1",
  exit_ticket:             "#d97706",
  spectrum_bar:            "#0284c7",
  mind_map_box:            "#7c3aed",
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

    case "frayer_model": {
      const term = section.content || section.heading || "Term";
      const quadrants = ["Definition", "Characteristics", "Examples", "Non-Examples"];
      const cellStyle = {
        flex: 1,
        borderWidth: 0.75,
        borderColor: BORDER,
        borderStyle: "solid" as const,
        padding: 8,
        minHeight: 60,
      };
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 5 }}>
              {/* Top two quadrants */}
              <View style={{ flexDirection: "row", gap: 0 }}>
                {quadrants.slice(0, 2).map((q, i) => (
                  <View key={i} style={[cellStyle, i === 0 ? { marginRight: 0, borderRightWidth: 0 } : {}]}>
                    <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: MUTED, marginBottom: 5, letterSpacing: 0.3 }}>
                      {q.toUpperCase()}
                    </Text>
                    <View style={S.blankLine} />
                    <View style={S.blankLine} />
                  </View>
                ))}
              </View>
              {/* Center term */}
              <View style={{ backgroundColor: NAVY, paddingTop: 6, paddingBottom: 6, alignItems: "center", borderTopWidth: 0, borderBottomWidth: 0 }}>
                <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 11, color: "#ffffff", letterSpacing: 0.3 }}>
                  {term}
                </Text>
              </View>
              {/* Bottom two quadrants */}
              <View style={{ flexDirection: "row" }}>
                {quadrants.slice(2).map((q, i) => (
                  <View key={i} style={[cellStyle, i === 0 ? { marginRight: 0, borderRightWidth: 0, borderTopWidth: 0 } : { borderTopWidth: 0 }]}>
                    <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: MUTED, marginBottom: 5, letterSpacing: 0.3 }}>
                      {q.toUpperCase()}
                    </Text>
                    <View style={S.blankLine} />
                    <View style={S.blankLine} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }

    case "t_chart": {
      const cols = section.col_labels ?? ["Side A", "Side B"];
      const ROWS = Math.max(2, section.num_lines ?? 4);
      const colWidthPct = 50;
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={[S.tableWrap, { marginTop: 5 }]}>
              <View style={S.tableHeadRow}>
                {cols.slice(0, 2).map((label, i) => (
                  <TCell key={i} widthPct={colWidthPct} isLast={i === 1} isHeader>
                    <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 8.5, color: NAVY, letterSpacing: 0.2 }}>
                      {label.toUpperCase()}
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
                  <TCell widthPct={colWidthPct} isLast={false} isHeader={false} />
                  <TCell widthPct={colWidthPct} isLast isHeader={false} />
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    case "sequence_box": {
      const steps = Math.max(2, Math.min(6, section.num_lines ?? 4));
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 6 }}>
              {Array.from({ length: steps }).map((_, i) => (
                <View key={i}>
                  <View
                    style={{
                      borderWidth: 0.75,
                      borderColor: BORDER,
                      borderStyle: "solid",
                      padding: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View style={{ width: 20, height: 20, backgroundColor: NAVY, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 9, color: "#fff" }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 22 }} />
                  </View>
                  {i < steps - 1 && (
                    <View style={{ alignItems: "center", paddingTop: 2, paddingBottom: 2 }}>
                      <Text style={{ fontSize: 10, color: MUTED }}>↓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    case "cause_effect_box": {
      const dir = section.direction ?? "one_to_many";
      const knownLabel = section.content || (dir === "one_to_many" ? "Cause" : "Effect");
      const blanks = Math.max(2, Math.min(4, section.num_lines ?? 3));
      const blankHeading = dir === "one_to_many" ? "Effect" : "Cause";
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              {/* Known side */}
              <View
                style={{
                  flex: 2,
                  borderWidth: 0.75,
                  borderColor: BORDER,
                  borderStyle: "solid",
                  padding: 8,
                  backgroundColor: BG_TINT,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: blanks * 28,
                }}
              >
                <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: MUTED, marginBottom: 5, letterSpacing: 0.3 }}>
                  {dir === "one_to_many" ? "CAUSE" : "EFFECT"}
                </Text>
                <Text style={{ fontFamily: "Nunito", fontWeight: 600, fontSize: 9, color: BODY, textAlign: "center", lineHeight: 1.4 }}>
                  {knownLabel}
                </Text>
              </View>
              {/* Arrow */}
              <Text style={{ fontSize: 14, color: MUTED }}>→</Text>
              {/* Blank side */}
              <View style={{ flex: 3, gap: 5 }}>
                {Array.from({ length: blanks }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      borderWidth: 0.75,
                      borderColor: BORDER,
                      borderStyle: "solid",
                      padding: 6,
                    }}
                  >
                    <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7, color: MUTED, marginBottom: 3 }}>
                      {blankHeading.toUpperCase()} {i + 1}
                    </Text>
                    <View style={{ borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 16 }} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }

    case "timeline_box": {
      const events = Math.max(2, Math.min(6, section.num_lines ?? 4));
      const widthPct = Math.floor(100 / events);
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 10 }}>
              {/* The horizontal line with tick marks */}
              <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 0, paddingLeft: 4, paddingRight: 4 }}>
                {Array.from({ length: events }).map((_, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <View style={{ width: 1, height: 10, backgroundColor: BODY }} />
                  </View>
                ))}
              </View>
              {/* The timeline bar */}
              <View style={{ height: 3, backgroundColor: NAVY, marginLeft: 4, marginRight: 4 }} />
              {/* Date blanks below the line */}
              <View style={{ flexDirection: "row", paddingLeft: 4, paddingRight: 4, marginTop: 4, marginBottom: 6 }}>
                {Array.from({ length: events }).map((_, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <View style={{ width: "80%", borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 16 }} />
                    <Text style={{ fontFamily: "Nunito", fontSize: 6.5, color: MUTED, marginTop: 2 }}>date</Text>
                  </View>
                ))}
              </View>
              {/* Event blanks */}
              <View style={{ flexDirection: "row", paddingLeft: 4, paddingRight: 4, gap: 4 }}>
                {Array.from({ length: events }).map((_, i) => (
                  <View key={i} style={{ flex: 1, borderWidth: 0.75, borderColor: BORDER, borderStyle: "solid", minHeight: 36, padding: 4 }} />
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }

    case "exit_ticket": {
      const questions = section.student_prompt.split(/\n/).filter(Boolean);
      return (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <View style={{ flex: 1, height: 0.75, backgroundColor: BORDER }} />
            <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 7.5, color: "#d97706", letterSpacing: 0.8 }}>
              EXIT TICKET
            </Text>
            <View style={{ flex: 1, height: 0.75, backgroundColor: BORDER }} />
          </View>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            questions.map((q, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: "Nunito", fontSize: 9.5, color: BODY, lineHeight: 1.4, marginBottom: 5 }}>
                  {i + 1}. {q.trim()}
                </Text>
                <View style={S.blankLine} />
                <View style={S.blankLine} />
              </View>
            ))
          )}
        </View>
      );
    }

    case "spectrum_bar": {
      const ends = section.col_labels ?? ["←", "→"];
      const slots = Math.max(2, Math.min(5, section.num_lines ?? 3));
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 8 }}>
              {/* End labels + arrow bar */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 8, color: NAVY }}>{ends[0]}</Text>
                <View style={{ flex: 1, height: 3, backgroundColor: NAVY }} />
                <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 8, color: NAVY }}>{ends[1]}</Text>
              </View>
              {/* Slot boxes evenly spaced */}
              <View style={{ flexDirection: "row", gap: 5 }}>
                {Array.from({ length: slots }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      borderWidth: 0.75,
                      borderColor: BORDER,
                      borderStyle: "solid",
                      minHeight: 34,
                      padding: 5,
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }

    case "mind_map_box": {
      const central = section.content || section.heading || "Central Concept";
      const n = Math.max(4, Math.min(8, section.num_lines ?? 6));
      const top = Math.ceil(n / 2);
      const bottom = Math.floor(n / 2);
      const branchStyle = {
        flex: 1,
        borderWidth: 0.75,
        borderColor: BORDER,
        borderStyle: "solid" as const,
        padding: 6,
        minHeight: 32,
      };
      return (
        <View>
          <Text style={S.bodyText}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey notes={section.answer_key_notes} />
          ) : (
            <View style={{ marginTop: 6 }}>
              {/* Top branches — no bottom border so they flow into center */}
              <View style={{ flexDirection: "row", gap: 4 }}>
                {Array.from({ length: top }).map((_, i) => (
                  <View key={i} style={[branchStyle, { borderBottomWidth: 0 }]}>
                    <View style={{ borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 20 }} />
                  </View>
                ))}
              </View>
              {/* Center row: line — TERM — line */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
                <View
                  style={{
                    backgroundColor: NAVY,
                    paddingTop: 5,
                    paddingBottom: 5,
                    paddingLeft: 14,
                    paddingRight: 14,
                  }}
                >
                  <Text style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 9, color: "#ffffff" }}>
                    {central}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
              </View>
              {/* Bottom branches — no top border */}
              <View style={{ flexDirection: "row", gap: 4 }}>
                {Array.from({ length: bottom }).map((_, i) => (
                  <View key={i} style={[branchStyle, { borderTopWidth: 0 }]}>
                    <View style={{ borderBottomWidth: 0.75, borderBottomColor: BORDER, borderBottomStyle: "solid", height: 20 }} />
                  </View>
                ))}
              </View>
            </View>
          )}
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
