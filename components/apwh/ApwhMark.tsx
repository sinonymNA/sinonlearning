import Link from "next/link";

export default function ApwhMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/apwh" className="apwh-mark" aria-label="AP World Headquarters home">
      <span className="apwh-mark-globe" aria-hidden="true">
        <span />
        <i />
      </span>
      <span className="apwh-mark-type">
        <strong>AP WORLD</strong>
        {!compact && <small>HEADQUARTERS</small>}
      </span>
    </Link>
  );
}
