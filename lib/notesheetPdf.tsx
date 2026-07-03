import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";

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
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
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
  section: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderStyle: "solid",
    borderRadius: 2,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    marginBottom: 14,
  },
  warmupBg: { backgroundColor: "#faf9f6" },
  contentBg: { backgroundColor: "#f0f4f8", borderColor: "#9999bb" },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    color: "#333333",
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
    borderBottomWidth: 1,
    borderBottomColor: "#aaaaaa",
    borderBottomStyle: "solid",
    height: 24,
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
    borderBottomWidth: 1,
    borderBottomColor: "#aaaaaa",
    borderBottomStyle: "solid",
    height: 22,
  },
  drawArea: {
    borderWidth: 1,
    borderColor: "#999999",
    borderStyle: "dashed",
    height: 130,
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
    backgroundColor: "#eeeeee",
    borderWidth: 1,
    borderColor: "#bbbbbb",
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
    borderWidth: 1,
    borderColor: "#cccccc",
    borderStyle: "solid",
    height: 28,
    backgroundColor: "#fafafa",
  },
  answerKey: {
    marginTop: 8,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "#fffbcc",
    borderWidth: 1,
    borderColor: "#ccaa88",
    borderStyle: "dashed",
    borderRadius: 2,
  },
  answerKeyText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  answerKeyLabel: {
    fontFamily: "Times-Bold",
    fontSize: 8,
  },
});

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
              <View key={i} style={[S.tableHeaderCell, { width: `${col.width_pct}%` }]}>
                <Text style={S.tableHeaderText}>{col.header.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: 6 }).map((_, row) => (
            <View key={row} style={S.tableRow}>
              {cols.map((col, colIdx) => (
                <View key={colIdx} style={[S.tableCell, { width: `${col.width_pct}%` }]} />
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
              <View key={i} style={[S.tableHeaderCell, { width: `${col.width_pct}%` }]}>
                <Text style={S.tableHeaderText}>{col.header.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: 4 }).map((_, row) => (
            <View key={row} style={S.tableRow}>
              {cols.map((col, colIdx) => (
                <View key={colIdx} style={[S.tableCell, { width: `${col.width_pct}%` }]} />
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

function NotesheetSection({
  section,
  isTeacher,
}: {
  section: NotesheetSection;
  isTeacher: boolean;
}) {
  const extraStyle =
    section.type === "warmup_box"
      ? S.warmupBg
      : section.type === "content_box"
      ? S.contentBg
      : undefined;

  return (
    <View style={extraStyle ? [S.section, extraStyle] : S.section} wrap={false}>
      {section.heading && (
        <Text style={S.sectionHeading}>{section.heading.toUpperCase()}</Text>
      )}
      <SectionBody section={section} isTeacher={isTeacher} />
    </View>
  );
}

export default function NotesheetDocument({
  plan,
  mode,
}: {
  plan: NotesheetPlan;
  mode: "student" | "teacher_key";
}) {
  const isTeacher = mode === "teacher_key";

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

        {plan.sections.map((section) => (
          <NotesheetSection key={section.id} section={section} isTeacher={isTeacher} />
        ))}
      </Page>
    </Document>
  );
}
