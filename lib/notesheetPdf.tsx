import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";

// ─── Per-section-type design tokens ──────────────────────────────────────────

const SECTION_TOKENS: Record<
  NotesheetSection["type"],
  { stripe: string; bg: string }
> = {
  warmup_box:        { stripe: "#a78bfa", bg: "#faf5ff" },
  fill_blank:        { stripe: "#60a5fa", bg: "#eff6ff" },
  numbered_response: { stripe: "#34d399", bg: "#f0fdf4" },
  content_box:       { stripe: "#fbbf24", bg: "#fffbeb" },
  two_column_box:    { stripe: "#f472b6", bg: "#fdf2f8" },
  drawing_box:       { stripe: "#fb923c", bg: "#fff7ed" },
  three_column_box:  { stripe: "#38bdf8", bg: "#f0f9ff" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: "#1a1a1a",
    paddingTop: 42,
    paddingBottom: 42,
    paddingLeft: 46,
    paddingRight: 46,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2.5,
    borderBottomColor: "#6d28d9",
    borderBottomStyle: "solid",
    paddingBottom: 6,
    marginBottom: 9,
  },
  headerTitle: {
    fontFamily: "Times-Bold",
    fontSize: 15,
  },
  headerMeta: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    color: "#555555",
    marginTop: 2,
  },
  essentialQuestion: {
    backgroundColor: "#f5f3ee",
    borderLeftWidth: 3,
    borderLeftColor: "#333333",
    borderLeftStyle: "solid",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 9,
    paddingRight: 9,
    marginBottom: 9,
  },
  eqLabel: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
    color: "#333333",
    marginBottom: 2,
    letterSpacing: 0.8,
  },
  eqText: {
    fontFamily: "Times-Italic",
    fontSize: 10.5,
    lineHeight: 1.35,
  },
  // Base section style — no border; stripe and bg applied dynamically
  section: {
    borderRadius: 3,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 8,
    marginBottom: 7,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    // borderLeftColor set per-type at render time
  },
  sectionPaired: {
    borderRadius: 3,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 8,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    flex: 1,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 8.5,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  prompt: {
    fontSize: 10.5,
    lineHeight: 1.35,
    marginBottom: 5,
  },
  contentText: {
    fontSize: 10.5,
    lineHeight: 1.4,
  },
  blankLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
    height: 17,
    marginBottom: 2,
  },
  numberedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  numberLabel: {
    fontSize: 9.5,
    width: 16,
    color: "#555555",
  },
  numberLine: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
    height: 17,
  },
  drawArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    height: 95,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  drawLabel: {
    color: "#aaaaaa",
    fontSize: 8.5,
    fontFamily: "Times-Italic",
  },
  tableHeaderRow: { flexDirection: "row" },
  tableHeaderCell: {
    backgroundColor: "#f3f4f6",
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    borderStyle: "solid",
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 5,
    paddingRight: 5,
  },
  tableHeaderText: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
    letterSpacing: 0.4,
  },
  tableRow: { flexDirection: "row" },
  tableCell: {
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderStyle: "solid",
    height: 22,
    backgroundColor: "#fafafa",
  },
  answerKey: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 2,
    borderLeftColor: "#fbbf24",
    borderLeftStyle: "solid",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 6,
  },
  answerKeyText: {
    fontSize: 9.5,
    lineHeight: 1.35,
  },
  answerKeyLabel: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
  },
  // Pair row container
  pairRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 7,
  },
});

// ─── Small-section detection ──────────────────────────────────────────────────

function isSmall(section: NotesheetSection): boolean {
  if (section.type === "warmup_box" || section.type === "fill_blank") {
    return true;
  }
  if (section.type === "numbered_response") {
    const n = section.num_lines ?? 5;
    return n <= 4;
  }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function BlankLines({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={S.blankLine} />
      ))}
    </>
  );
}

function AnswerKey({ label, notes }: { label: string; notes: string }) {
  return (
    <View style={S.answerKey}>
      <Text style={S.answerKeyText}>
        <Text style={S.answerKeyLabel}>{label.toUpperCase()}: </Text>
        {notes}
      </Text>
    </View>
  );
}

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
          <Text style={S.prompt}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey label="Key" notes={section.answer_key_notes} />
          ) : (
            <BlankLines n={paired ? 3 : 4} />
          )}
        </View>
      );

    case "fill_blank":
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey label="Key" notes={section.answer_key_notes} />
          ) : (
            <BlankLines n={paired ? 2 : 3} />
          )}
        </View>
      );

    case "numbered_response": {
      const n = section.num_lines ?? 5;
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey label="Key" notes={section.answer_key_notes} />
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
          <Text style={S.contentText}>{section.content}</Text>
          {isTeacher && (
            <AnswerKey label="Note" notes={section.answer_key_notes} />
          )}
        </View>
      );

    case "two_column_box": {
      const cols = section.columns ?? [
        { header: "Term", width_pct: 35, prefilled: true },
        { header: "Definition", width_pct: 65, prefilled: false },
      ];
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          <View style={S.tableHeaderRow}>
            {cols.map((col, i) => (
              <View
                key={i}
                style={[S.tableHeaderCell, { width: `${col.width_pct}%` }]}
              >
                <Text style={S.tableHeaderText}>{col.header.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: 4 }).map((_, row) => (
            <View key={row} style={S.tableRow}>
              {cols.map((col, colIdx) => (
                <View
                  key={colIdx}
                  style={[S.tableCell, { width: `${col.width_pct}%` }]}
                />
              ))}
            </View>
          ))}
          {isTeacher && <AnswerKey label="Key" notes={section.answer_key_notes} />}
        </View>
      );
    }

    case "drawing_box":
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey label="Expected" notes={section.answer_key_notes} />
          ) : (
            <View style={S.drawArea}>
              <Text style={S.drawLabel}>Draw here</Text>
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
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          <View style={S.tableHeaderRow}>
            {cols.map((col, i) => (
              <View
                key={i}
                style={[S.tableHeaderCell, { width: `${col.width_pct}%` }]}
              >
                <Text style={S.tableHeaderText}>{col.header.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: 3 }).map((_, row) => (
            <View key={row} style={S.tableRow}>
              {cols.map((col, colIdx) => (
                <View
                  key={colIdx}
                  style={[S.tableCell, { width: `${col.width_pct}%` }]}
                />
              ))}
            </View>
          ))}
          {isTeacher && <AnswerKey label="Key" notes={section.answer_key_notes} />}
        </View>
      );
    }

    default:
      return null;
  }
}

function SectionCard({
  section,
  isTeacher,
  paired = false,
}: {
  section: NotesheetSection;
  isTeacher: boolean;
  paired?: boolean;
}) {
  const tokens = SECTION_TOKENS[section.type];
  const baseStyle = paired ? S.sectionPaired : S.section;

  return (
    <View
      style={[
        baseStyle,
        {
          backgroundColor: tokens.bg,
          borderLeftColor: tokens.stripe,
        },
      ]}
      wrap={false}
    >
      {section.heading && (
        <Text style={[S.sectionHeading, { color: tokens.stripe }]}>
          {section.heading.toUpperCase()}
        </Text>
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
        <View style={S.header}>
          <Text style={S.headerTitle}>
            {plan.title}
            {isTeacher ? " — Teacher Key" : ""}
          </Text>
          <Text style={S.headerMeta}>
            {plan.subject} · {plan.grade_band} · {plan.concept}
          </Text>
        </View>

        <View style={S.essentialQuestion}>
          <Text style={S.eqLabel}>ESSENTIAL QUESTION</Text>
          <Text style={S.eqText}>{plan.essential_question}</Text>
        </View>

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
          // Pair row
          return (
            <View key={`pair-${idx}`} style={S.pairRow} wrap={false}>
              <SectionCard
                section={row.left}
                isTeacher={isTeacher}
                paired
              />
              <SectionCard
                section={row.right}
                isTeacher={isTeacher}
                paired
              />
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
