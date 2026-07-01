export interface GameRound {
  id: string;
  probe: string;
  eventType: string;
  targetDimension: string;
}

export interface StudentResponse {
  roundId: string;
  text: string;
  points: number;
  understandingLevel: string;
  misconceptionDetected: boolean;
  misconceptionLabel: string | null;
  feedback: string;
  submittedAt: number;
}

export interface GameStudent {
  id: string;
  name: string;
  responses: StudentResponse[];
  totalPoints: number;
  joinedAt: number;
}

export interface GameSession {
  code: string;
  concept: string;
  subject: string;
  gradeLevel: string;
  sourceContent: string;
  rounds: GameRound[];
  students: Record<string, GameStudent>;
  currentRound: number;
  mode: "teacher-paced" | "student-paced";
  createdAt: number;
}

const sessions = new Map<string, GameSession>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [code, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(code);
  }
}

export function createSession(data: {
  concept: string;
  subject: string;
  gradeLevel: string;
  sourceContent: string;
  rounds: GameRound[];
  mode: "teacher-paced" | "student-paced";
}): string {
  cleanup();
  let code: string;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (sessions.has(code));

  sessions.set(code, {
    ...data,
    code,
    students: {},
    currentRound: 0,
    createdAt: Date.now(),
  });
  return code;
}

export function getSession(code: string): GameSession | undefined {
  return sessions.get(code);
}

export function joinSession(code: string, studentId: string, name: string): GameSession | null {
  const session = sessions.get(code);
  if (!session) return null;
  if (!session.students[studentId]) {
    session.students[studentId] = {
      id: studentId,
      name,
      responses: [],
      totalPoints: 0,
      joinedAt: Date.now(),
    };
  }
  return session;
}

export function recordResponse(code: string, studentId: string, response: StudentResponse): boolean {
  const session = sessions.get(code);
  if (!session || !session.students[studentId]) return false;
  session.students[studentId].responses.push(response);
  session.students[studentId].totalPoints += response.points;
  return true;
}

export function advanceRound(code: string): number | null {
  const session = sessions.get(code);
  if (!session) return null;
  if (session.currentRound < session.rounds.length - 1) {
    session.currentRound += 1;
  }
  return session.currentRound;
}
