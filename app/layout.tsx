import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIQUBIX Academy | Learn AI, Build Outcomes",
  description:
    "A role-aware learning space for AI courses, practical projects, mentor guidance, and outcomes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
