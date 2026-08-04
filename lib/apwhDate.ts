export function easternDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function displaySchoolDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const today = new Date(`${easternDateString()}T12:00:00Z`).getTime();
  return Math.max(0, Math.ceil((new Date(`${date}T12:00:00Z`).getTime() - today) / 86_400_000));
}
