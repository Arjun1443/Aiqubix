import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import "./accounts.css";

export const runtime = "nodejs";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="accounts-shell">
      <header className="academy-topbar">
        <div className="academy-topbar-inner">
          <Link href="/" className="academy-brand">
            <span className="academy-brand-mark" aria-hidden="true">A</span>
            <span><span className="academy-brand-name">AIQUBIX</span><span className="academy-brand-subtitle">ACADEMY</span></span>
          </Link>
          <Link href="/#catalogue" className="academy-home-link">Course catalogue <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>
      <main className="academy-main">{children}</main>
    </div>
  );
}
