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
    fontSize: 11,
    color: "#1a1a1a",
    paddingTop: 54,
    paddingBottom: 54,
    paddingLeft: 54,
    paddingRight: 54,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: "#6d28d9",
    borderBottomStyle: "solid",
    paddingBottom: 8,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: "Times-Bold",
    fontSize: 17,
  },
  headerMeta: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: "#555555",
    marginTop: 3,
  },
  essentialQuestion: {
    backgroundColor: "#f5f3ee",
    borderLeftWidth: 3,
    borderLeftColor: "#333333",
    borderLeftStyle: "solid",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 14,
  },
  eqLabel: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    color: "#333333",
    marginBottom: 3,
    letterSpacing: 0.8,
  },
  eqText: {
    fontFamily: "Times-Italic",
    fontSize: 11,
    lineHeight: 1.4,
  },
  // Base section style — no border; stripe and bg applied dynamically
  section: {
    borderRadius: 4,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    // borderLeftColor set per-type at render time
  },
  sectionPaired: {
    // marginBottom omitted — the pair row View handles spacing
    borderRadius: 4,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 12,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    flex: 1,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    // color set per-type at render time
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  prompt: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 7,
  },
  contentText: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  blankLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
    height: 22,
    marginBottom: 3,
  },
  numberedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  numberLabel: {
    fontSize: 10,
    width: 18,
    color: "#555555",
  },
  numberLine: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
    height: 22,
  },
  drawArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    height: 140,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  drawLabel: {
    color: "#aaaaaa",
    fontSize: 9,
    fontFamily: "Times-Italic",
  },
  tableHeaderRow: { flexDirection: "row" },
  tableHeaderCell: {
    backgroundColor: "#f3f4f6",
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    borderStyle: "solid",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
  },
  tableHeaderText: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    letterSpacing: 0.5,
  },
  tableRow: { flexDirection: "row" },
  tableCell: {
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderStyle: "solid",
    height: 28,
    backgroundColor: "#fafafa",
  },
  answerKey: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 2,
    borderLeftColor: "#fbbf24",
    borderLeftStyle: "solid",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 5,
    paddingBottom: 5,
    marginTop: 8,
  },
  answerKeyText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  answerKeyLabel: {
    fontFamily: "Times-Bold",
    fontSize: 8,
  },
  // Pair row container
  pairRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
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
}: {
  section: NotesheetSection;
  isTeacher: boolean;
}) {
  switch (section.type) {
    case "warmup_box":
      return (
        <View>
          <Text style={S.prompt}>{section.student_prompt}</Text>
          {isTeacher ? (
            <AnswerKey label="Key" notes={section.answer_key_notes} />
          ) : (
            <BlankLines n={5} />
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
            <BlankLines n={3} />
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
          {Array.from({ length: 6 }).map((_, row) => (
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
      <SectionBody section={section} isTeacher={isTeacher} />
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
