import type { StudioSlide, TeacherGuide, WorksheetSection } from "./studioTypes";

interface CometEditContext {
  title: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  teachingStyle: string;
  slides: StudioSlide[];
  worksheetSections: WorksheetSection[];
  teacherGuide: TeacherGuide;
}

function stripIds(slides: StudioSlide[]) {
  return slides.map((slide) => ({
    type: slide.type,
    title: slide.title,
    subtitle: slide.subtitle,
    body: slide.body,
    bullets: slide.bullets.map((b) => b.text),
    teacherNotes: slide.teacherNotes,
    studentInstructions: slide.studentInstructions,
    layout: slide.layout,
    timingMinutes: slide.timingMinutes,
    tags: slide.tags,
  }));
}

function stripSectionIds(sections: WorksheetSection[]) {
  return sections.map((section) => ({
    title: section.title,
    directions: section.directions,
    questions: section.questions.map((q) => ({
      prompt: q.prompt,
      type: q.type,
      choices: q.choices,
      correctAnswer: q.correctAnswer,
      points: q.points,
    })),
    responseSpaceLines: section.responseSpaceLines,
    difficulty: section.difficulty,
    readingLevel: section.readingLevel,
  }));
}

export function buildCometEditPrompt(instruction: string, project: CometEditContext): string {
  return `You are Comet, a friendly teaching assistant inside Sinon Learning's Teacher Studio. A teacher is editing a lesson and just asked you to make a change.

Lesson context:
- Title: ${project.title || "Untitled"}
- Subject: ${project.subject || "not specified"}
- Grade level: ${project.gradeLevel || "not specified"}
- Class length: ${project.durationMinutes} minutes
- Teaching style: ${project.teachingStyle}

Current slides (JSON array):
${JSON.stringify(stripIds(project.slides))}

Current worksheet sections (JSON array):
${JSON.stringify(stripSectionIds(project.worksheetSections))}

Current teacher guide (JSON object):
${JSON.stringify(project.teacherGuide)}

The teacher's request: "${instruction}"

Make the requested change(s) to the lesson. Return the FULL updated slides array and worksheet sections array — including every slide/section that you did NOT change, left exactly as it was, plus any you added, removed, or edited.

Respond with ONLY a JSON object in exactly this shape (no markdown fences, no commentary outside the JSON):
{
  "summary": "one short sentence telling the teacher what you changed",
  "slides": [
    {
      "type": "title | content | image | activity | discussion | summary",
      "title": "string",
      "subtitle": "string, optional",
      "body": "string, optional",
      "bullets": ["string", "..."],
      "teacherNotes": "string",
      "studentInstructions": "string",
      "layout": "titleOnly | titleBody | titleBullets | twoColumn | imageFocus",
      "timingMinutes": 5,
      "tags": ["string", "..."]
    }
  ],
  "worksheetSections": [
    {
      "title": "string",
      "directions": "string",
      "questions": [
        { "prompt": "string", "type": "shortAnswer | multipleChoice | trueFalse | vocabulary | constructedResponse", "choices": ["string"], "correctAnswer": "string", "points": 1 }
      ],
      "responseSpaceLines": 3,
      "difficulty": "easy | medium | hard",
      "readingLevel": "below | onLevel | above"
    }
  ],
  "teacherGuide": { "overview": "string", "objectives": ["string"], "materials": ["string"], "timingNotes": "string" }
}

Rules:
- Do not include "id" fields anywhere — the app assigns its own.
- Keep content age-appropriate for the stated grade level.
- Never invent fake citations, statistics, or unsafe content.
- If the request doesn't involve worksheets or the teacher guide, return them unchanged from what was given to you.
- Keep the same general slide/section count unless the request specifically asks to add or remove content.`;
}
