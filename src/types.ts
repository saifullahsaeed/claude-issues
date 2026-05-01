export type Severity = "low" | "medium" | "high" | "critical";

export type Status =
  | "open"
  | "fixed"
  | "wontfix"
  | "superseded"
  | "duplicate";

export interface IssueFrontmatter {
  id: string;
  title: string;
  status: Status;
  severity: Severity;
  files: string[];
  created: string;
  fixed_at: string | null;
  closed_at?: string | null;
  supersedes?: string | null;
  superseded_by?: string | null;
  duplicate_of?: string | null;
  related?: string[];
}

export interface Issue {
  frontmatter: IssueFrontmatter;
  body: string;
  filePath: string;
}

export const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
export const STATUSES: Status[] = [
  "open",
  "fixed",
  "wontfix",
  "superseded",
  "duplicate",
];

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function isOpenStatus(s: Status): boolean {
  return s === "open";
}
export function isClosedStatus(s: Status): boolean {
  return s !== "open";
}
