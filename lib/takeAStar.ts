export const SCENARIO = {
  dateLabel: "June 1500",
  declination: 21.5,
  expectedLatitude: 12,
  targetAltitude: 80.5,
  destination: "Calicut",
} as const;

export function averageReadings(readings: number[]): number {
  if (!readings.length) return 0;
  return readings.reduce((sum, reading) => sum + reading, 0) / readings.length;
}

export function latitudeFromNoonSun(altitude: number, declination: number): number {
  return altitude + declination - 90;
}

export function readingAccuracy(readings: number[], target = SCENARIO.targetAltitude): number {
  if (!readings.length) return 0;
  const error = Math.abs(averageReadings(readings) - target);
  return Math.max(0, Math.round(100 - error * 22));
}

export function courseResult(course: string): { correct: boolean; message: string } {
  if (course === "east") return { correct: true, message: "You hold the latitude and sail east toward Calicut." };
  if (course === "north-east") return { correct: false, message: "That turn would carry the ship north of the intended latitude." };
  return { correct: false, message: "Sailing south would move the ship away from the latitude you just measured." };
}

export function completionCode(input: { readings: number[]; course: string; response: string }): string {
  const raw = `${input.readings.map((n) => n.toFixed(1)).join(",")}|${input.course}|${input.response.trim().toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `STAR-${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

