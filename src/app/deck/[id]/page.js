"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDeck, getDeckStats, updateCard, editCard } from "@/lib/storage";
import { getMasteryCategory } from "@/lib/spaced-repetition";
import { useToast } from "@/components/Toast";
import ProgressRing from "@/components/ProgressRing";

// Mastery dot component — using inline styles to avoid Tailwind purge
function MasteryDot({ label }) {
  const color =
    label === "Mastered"
      ? "#10b981"
      : label === "Learning"
      ? "#f59e0b"
      : label === "Struggling"
      ? "#f87171"
      : "#64748b";
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function MasteryBadge({ label }) {
  const styles = {
    Mastered: { background: "rgba(16,185,129,0.12)", color: "#10b981" },
    Learning: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    Struggling: { background: "rgba(248,113,113,0.12)", color: "#f87171" },
    New: { background: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  };
  const s = styles[label] || styles.New;
  return (
    <span
      style={{
        ...s,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 8,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// Inline card editor
function CardEditor({ card, deckId, onSave, onCancel }) {
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) return;
    onSave(card.id, { question, answer });
  };

  return (
    <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: "rgba(108,99,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Question
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(108,99,255,0.25)",
              borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "rgba(255,255,255,0.85)",
              outline: "none", resize: "vertical", fontFamily: "inherit",
            }}
          />
        </div>
        <div>
          <p style={{ fontSize: 11, color: "rgba(108,99,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Answer
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(108,99,255,0.25)",
              borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "rgba(255,255,255,0.85)",
              outline: "none", resize: "vertical", fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={!question.trim() || !answer.trim()}
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 18px" }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary"
            style={{ fontSize: 13, padding: "8px 18px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeckDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [deck, setDeck] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const d = getDeck(id);
    if (!d) { router.push("/"); return; }
    setDeck(d);
  }, [id, router]);

  if (!mounted || !deck) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, width: "100%", borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  const stats = getDeckStats(deck);

  const filteredCards = deck.cards.filter((card) => {
    if (filter === "all") return true;
    const category = getMasteryCategory(card);
    if (filter === "new") return category.label === "New";
    if (filter === "learning") return category.label === "Learning" || category.label === "Struggling";
    if (filter === "mastered") return category.label === "Mastered";
    return true;
  });

  const handleRegenerateAnswer = async (card) => {
    try {
      toast?.info("Regenerating answer...");
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: card.question, currentAnswer: card.answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updatedDeck = updateCard(deck.id, card.id, { answer: data.answer });
      if (updatedDeck) {
        setDeck({ ...updatedDeck });
        toast?.success("Answer regenerated!");
      }
    } catch (err) {
      toast?.error("Failed to regenerate: " + err.message);
    }
  };

  const handleSaveEdit = (cardId, { question, answer }) => {
    const updatedDeck = editCard(deck.id, cardId, { question, answer });
    if (updatedDeck) {
      setDeck({ ...updatedDeck });
      setEditingCard(null);
      toast?.success("Card updated!");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      {/* Back */}
      <Link
        href="/"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: 24, transition: "color 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Deck header */}
      <div className="glass scale-in" style={{ borderRadius: 20, padding: 32, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(108,99,255,0.12)", color: "rgba(108,99,255,0.8)", fontWeight: 600 }}>
                {deck.subject || "General"}
              </span>
              
            </div>
            <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, color: "rgba(255,255,255,0.95)", marginBottom: 8, lineHeight: 1.2 }}>
              {deck.title}
            </h1>
            {deck.description && (
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{deck.description}</p>
            )}
          </div>
          <ProgressRing progress={stats.averageMastery} size={96} strokeWidth={7} />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 24 }}>
          {[
            { label: "Total", value: stats.total, color: "rgba(255,255,255,0.6)" },
            { label: "New", value: stats.new, color: "#94a3b8" },
            { label: "Learning", value: stats.learning, color: "#f59e0b" },
            { label: "Mastered", value: stats.mastered, color: "#10b981" },
            { label: "Due", value: stats.dueToday, color: "#6c63ff" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 14, padding: 14, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <Link href={`/study/${deck.id}`} className="btn-primary" style={{ gap: 8, fontSize: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Study Now ({stats.dueToday} due)
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { key: "all", label: `All (${deck.cards.length})` },
          { key: "new", label: `New (${stats.new})` },
          { key: "learning", label: `Learning (${stats.learning})` },
          { key: "mastered", label: `Mastered (${stats.mastered})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s", border: "none",
              background: filter === tab.key ? "rgba(108,99,255,0.15)" : "transparent",
              color: filter === tab.key ? "#6c63ff" : "rgba(255,255,255,0.35)",
              outline: filter === tab.key ? "1px solid rgba(108,99,255,0.25)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredCards.map((card, i) => {
          const mastery = getMasteryCategory(card);
          const isExpanded = expandedCard === card.id;
          const isEditing = editingCard === card.id;

          return (
            <div key={card.id} className="glass animate-in" style={{ borderRadius: 14, overflow: "hidden", animationDelay: `${i * 0.03}s` }}>
              <button
                onClick={() => {
                  if (isEditing) return;
                  setExpandedCard(isExpanded ? null : card.id);
                }}
                style={{
                  width: "100%", padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14,
                  textAlign: "left", background: "transparent", border: "none", cursor: "pointer", color: "inherit",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 3 }}>
                  <MasteryDot label={mastery.label} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                    {card.masteryLevel || 0}%
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{card.question}</p>
                  {card.tags && card.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                      {card.tags.map((tag, j) => (
                        <span key={j} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.035)", color: "rgba(255,255,255,0.25)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <svg
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: "rgba(255,255,255,0.15)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded answer / edit mode */}
              {isExpanded && !isEditing && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ fontSize: 11, color: "rgba(108,99,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Answer</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{card.answer}</p>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                      <MasteryBadge label={mastery.label} />
                      {card.difficulty && (
                        <span style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 8, fontWeight: 600,
                          background: card.difficulty === "easy" ? "rgba(16,185,129,0.12)" : card.difficulty === "hard" ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)",
                          color: card.difficulty === "easy" ? "#10b981" : card.difficulty === "hard" ? "#f87171" : "#f59e0b",
                        }}>
                          {card.difficulty}
                        </span>
                      )}

                      {/* Action buttons */}
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => setEditingCard(card.id)}
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerateAnswer(card)}
                          style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#6c63ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <CardEditor
                  card={card}
                  deckId={deck.id}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingCard(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No cards match this filter</p>
        </div>
      )}
    </div>
  );
}