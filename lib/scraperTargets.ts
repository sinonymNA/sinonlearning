import type { Scholarship } from "@/data/scholarships";

export interface ScrapedEntry {
  name: string;
  provider: string;
  amount: number | null;
  amountLabel: string;
  deadline: string | null;
  deadlineLabel: string;
  url: string;
  description: string;
  eligibleGrades: string[];
  tags: string[];
}

export interface ScrapeTarget {
  id: string;
  name: string;
  url: string;
  method: "fetch" | "playwright";
  scope: Scholarship["scope"];
  defaultEstimatedApplicants: number;
  parser: (html: string, baseUrl: string) => ScrapedEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractAmount(text: string): { amount: number | null; label: string } {
  const m = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (!m) return { amount: null, label: "Varies" };
  const amount = parseInt(m[1].replace(/,/g, ""), 10);
  return { amount, label: `$${amount.toLocaleString()}` };
}

function extractDeadline(text: string): { deadline: string | null; label: string } {
  const months =
    /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const pattern = new RegExp(`(${months.source})\\s+(\\d{1,2})[,\\s]+(20\\d{2})`, "i");
  const m = text.match(pattern);
  if (m) {
    try {
      const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
      if (!isNaN(d.getTime())) {
        return {
          deadline: d.toISOString().split("T")[0],
          label: `${m[1]} ${m[2]}, ${m[3]}`,
        };
      }
    } catch {}
  }
  if (/rolling/i.test(text)) return { deadline: null, label: "Rolling" };
  return { deadline: null, label: "See website" };
}

// Remove HTML tags, collapse whitespace
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Generic link-list parser — finds <a> tags with "scholarship" in text or href
function genericScholarshipLinks(
  html: string,
  baseUrl: string,
  provider: string,
  scope: Scholarship["scope"],
  estimatedApplicants: number,
): ScrapedEntry[] {
  const entries: ScrapedEntry[] = [];
  const seen = new Set<string>();

  const linkPattern = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = linkPattern.exec(html)) !== null) {
    const rawHref = m[1];
    const rawText = stripHtml(m[2]).trim();

    if (rawText.length < 5 || rawText.length > 200) continue;
    if (!/scholarship|award|grant|bursary/i.test(rawText + rawHref)) continue;
    if (/login|logout|cookie|privacy|terms/i.test(rawText)) continue;

    let href = rawHref.trim();
    if (href.startsWith("//")) href = "https:" + href;
    else if (href.startsWith("/")) {
      try {
        href = new URL(href, baseUrl).toString();
      } catch {
        continue;
      }
    } else if (!href.startsWith("http")) {
      continue;
    }

    if (seen.has(href)) continue;
    seen.add(href);

    const { amount, label: amountLabel } = extractAmount(rawText);
    const { deadline, label: deadlineLabel } = extractDeadline(rawText);

    entries.push({
      name: rawText,
      provider,
      amount,
      amountLabel,
      deadline,
      deadlineLabel,
      url: href,
      description: `Scholarship listed on ${provider}'s scholarship page. Visit the link for full eligibility requirements and application details.`,
      eligibleGrades: ["11", "12", "college-1", "college-2", "college-3", "college-4"],
      tags: ["georgia", "gwinnett", "local"],
    });
  }

  return entries.slice(0, 30); // cap per target
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    id: "gcps-scholarships",
    name: "Gwinnett County Public Schools — Scholarship List",
    url: "https://www.gcpsk12.org/Page/2875",
    method: "playwright",
    scope: "county",
    defaultEstimatedApplicants: 30,
    parser(html, baseUrl) {
      return genericScholarshipLinks(html, baseUrl, "Gwinnett County Public Schools", "county", 30);
    },
  },

  {
    id: "dacula-hs-counseling",
    name: "Dacula High School — Counseling Scholarships",
    url: "https://daculahs.gcpsk12.org/apps/pages/index.jsp?uREC_ID=2019595&type=d&pREC_ID=2130494",
    method: "playwright",
    scope: "city",
    defaultEstimatedApplicants: 20,
    parser(html, baseUrl) {
      return genericScholarshipLinks(html, baseUrl, "Dacula High School Counseling", "city", 20);
    },
  },

  {
    id: "gwinnett-community-foundation",
    name: "Gwinnett Community Foundation — Scholarships",
    url: "https://www.gcfdn.org/grants-scholarships",
    method: "playwright",
    scope: "county",
    defaultEstimatedApplicants: 22,
    parser(html, baseUrl) {
      const entries = genericScholarshipLinks(
        html,
        baseUrl,
        "Gwinnett Community Foundation",
        "county",
        22,
      );
      // Also look for headings + paragraphs with scholarship info
      const headingPattern = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
      let m: RegExpExecArray | null;
      while ((m = headingPattern.exec(html)) !== null) {
        const text = stripHtml(m[1]).trim();
        if (/scholarship|award/i.test(text) && text.length > 8 && text.length < 120) {
          const { amount, label: amountLabel } = extractAmount(text);
          const { deadline, label: deadlineLabel } = extractDeadline(text);
          const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
          if (!entries.some((e) => e.name === text)) {
            entries.push({
              name: text,
              provider: "Gwinnett Community Foundation",
              amount,
              amountLabel,
              deadline,
              deadlineLabel,
              url: "https://www.gcfdn.org/grants-scholarships",
              description: `Scholarship offered by the Gwinnett Community Foundation for Gwinnett County residents. Visit gcfdn.org for details and application.`,
              eligibleGrades: ["12", "college-1", "college-2", "college-3", "college-4"],
              tags: ["georgia", "gwinnett", "community-foundation", "local"],
            });
          }
        }
      }
      return entries.slice(0, 25);
    },
  },

  {
    id: "gwinnett-tech-foundation",
    name: "Gwinnett Technical College Foundation — Scholarships",
    url: "https://www.gwinnetttech.edu/foundation/scholarships/",
    method: "fetch",
    scope: "county",
    defaultEstimatedApplicants: 15,
    parser(html, baseUrl) {
      return genericScholarshipLinks(
        html,
        baseUrl,
        "Gwinnett Technical College Foundation",
        "county",
        15,
      );
    },
  },

  {
    id: "rotary-6910",
    name: "Rotary District 6910 (North Georgia) — Scholarships",
    url: "https://rotary6910.org/scholarships",
    method: "fetch",
    scope: "regional",
    defaultEstimatedApplicants: 25,
    parser(html, baseUrl) {
      return genericScholarshipLinks(
        html,
        baseUrl,
        "Rotary District 6910 (North Georgia)",
        "regional",
        25,
      );
    },
  },

  {
    id: "georgia-power-foundation",
    name: "Georgia Power Foundation — Education Grants",
    url: "https://www.georgiapower.com/company/community/georgia-power-foundation.html",
    method: "fetch",
    scope: "state",
    defaultEstimatedApplicants: 150,
    parser(html, baseUrl) {
      return genericScholarshipLinks(
        html,
        baseUrl,
        "Georgia Power Foundation",
        "state",
        150,
      );
    },
  },

  {
    id: "gsfc-state-programs",
    name: "Georgia Student Finance Commission — State Programs",
    url: "https://www.gsfc.ga.gov/gsfApps/financialAid/htmls/grant_hope.cfm",
    method: "fetch",
    scope: "state",
    defaultEstimatedApplicants: 40000,
    parser(html, baseUrl) {
      // GSFC lists multiple state programs — extract named programs
      const entries: ScrapedEntry[] = [];
      const text = stripHtml(html);

      const programPattern =
        /(Zell Miller|HOPE|ACCEL|MOVE ON WHEN READY|North Georgia|Teacher)\s+(?:Scholarship|Award|Grant)/gi;
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = programPattern.exec(text)) !== null) {
        const name = m[0].trim();
        if (seen.has(name)) continue;
        seen.add(name);

        const { deadline, label: deadlineLabel } = extractDeadline(text);
        const isHighOdds = /Zell Miller|ACCEL|North Georgia|Teacher/.test(name);

        entries.push({
          name: `Georgia ${name}`,
          provider: "Georgia Student Finance Commission",
          amount: null,
          amountLabel: name.includes("HOPE") || name.includes("Zell")
            ? "Up to full tuition"
            : "Varies",
          deadline,
          deadlineLabel: "Rolling (based on enrollment)",
          url: "https://www.gsfc.ga.gov/gsfApps/financialAid/htmls/grant_hope.cfm",
          description: `State of Georgia financial aid program administered by the Georgia Student Finance Commission. Requires Georgia residency and enrollment in a Georgia college or university.`,
          eligibleGrades: ["12", "college-1", "college-2", "college-3", "college-4"],
          tags: ["georgia", "state", "need-based", "merit"],
        });
      }

      return entries;
    },
  },
];
