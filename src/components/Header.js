"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8, 8, 15, 0.82)",
        backdropFilter: "blur(16px) saturate(1.2)",
        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7c6aef, #9b7df7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.03em",
            }}
          >
            R
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            recall<span style={{ color: "var(--accent)" }}>iq</span>
          </span>
        </Link>

        {/* Right side */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!isHome && (
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Decks
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
