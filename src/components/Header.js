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
          {/* RecallIQ SVG Logo Icon */}
          <svg
            width="34"
            height="34"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <defs>
              <linearGradient id="hBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a1035"/>
                <stop offset="100%" stopColor="#0d0820"/>
              </linearGradient>
              <linearGradient id="hIg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c6aef"/>
                <stop offset="100%" stopColor="#c084fc"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#hBg)"/>
            {/* Card outline */}
            <rect x="4.5" y="9" width="23" height="15" rx="3" fill="none" stroke="url(#hIg)" strokeWidth="1.6"/>
            {/* Subtle inner card lines */}
            <rect x="8" y="13.5" width="9" height="1.8" rx="0.9" fill="#9b7df7" opacity="0.4"/>
            <rect x="8" y="17" width="6.5" height="1.5" rx="0.75" fill="#9b7df7" opacity="0.25"/>
            {/* Lightning bolt */}
            <path
              d="M 19 7.5 L 16.2 16 L 18.4 16 L 15.5 24.5 L 23.5 14.5 L 21 14.5 L 24.2 7.5 Z"
              fill="url(#hIg)"
              opacity="0.97"
            />
          </svg>
          {/* Wordmark */}
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
