"use client";

import Link from "next/link";
import ProgressRing from "./ProgressRing";
import { getDeckStats } from "@/lib/storage";

export default function DeckCard({ deck, index = 0, onDelete }) {
  const stats = getDeckStats(deck);

  return (
    <div
      className="glass glass-hover animate-in"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
        position: "relative",
        animationDelay: `${index * 0.05}s`
      }}
    >
      {/* Top Section with beautiful Progress Ring */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <h3 style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            marginBottom: 8,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {deck.title}
          </h3>
          <span style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 8,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}>
            {deck.subject || "Knowledge"}
          </span>
        </div>
        
        {/* The beautiful visual indicator is back */}
        <div style={{ flexShrink: 0 }}>
          <ProgressRing progress={stats.averageMastery} size={50} strokeWidth={4} color="var(--accent)" />
        </div>
      </div>

      {/* Description */}
      {deck.description && (
        <p style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {deck.description}
        </p>
      )}

      {/* Elegant Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{stats.new} New</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{stats.learning} Lrn</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{stats.mastered} Done</span>
        </div>
      </div>

      {/* Due Today Badge (if applicable) */}
      {stats.dueToday > 0 && (
        <div style={{
          background: "rgba(251, 113, 133, 0.1)", /* Rose tint */
          color: "var(--danger)",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          alignSelf: "flex-start"
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
          {stats.dueToday} Cards Due
        </div>
      )}

      {/* Beautiful, inviting actions */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid var(--border)",
        paddingTop: 16,
        marginTop: "auto"
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/study/${deck.id}`}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: 13, gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Study
          </Link>

          <Link
            href={`/deck/${deck.id}`}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: 13, backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--text-muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            Browse
          </Link>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm("Delete this deck? This action cannot be undone.")) onDelete?.(deck.id);
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(251, 113, 133, 0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
          aria-label="Delete deck"
          title="Delete Deck"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}