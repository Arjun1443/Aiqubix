import Link from "next/link";

export function AcademyLogo() {
  return (
    <Link href="/" className="academy-wordmark" aria-label="AIQUBIX Academy home — Ideas, Intelligence, Impact">
      <span className="academy-wordmark-name" aria-hidden="true">
        <span className="academy-wordmark-a">A</span>I<span className="academy-wordmark-q">Q</span>UBIX
      </span>
      <span className="academy-wordmark-tagline" aria-hidden="true">Ideas <span>|</span> Intelligence <span>|</span> Impact</span>
    </Link>
  );
}
