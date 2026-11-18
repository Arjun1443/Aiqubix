import Image from "next/image";
import Link from "next/link";

export function AcademyLogo() {
  return (
    <Link href="/" className="academy-wordmark" aria-label="AIQUBIX Academy home">
      <Image
        src="/aiqubix-logo.png"
        alt="AIQUBIX — Ideas, Intelligence, Impact"
        width={496}
        height={154}
        sizes="(max-width: 640px) 165px, 205px"
        loading="eager"
      />
    </Link>
  );
}
