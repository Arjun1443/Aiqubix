import Link from "next/link";
import type { ReactNode } from "react";

export const runtime = "nodejs";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-block font-semibold text-cyan-200">AIQUBIX Academy</Link>
        {children}
      </div>
    </main>
  );
}
