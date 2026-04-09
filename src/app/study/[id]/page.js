"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDeck, saveDeck, getStudyQueue } from "@/lib/storage";
import {
  processReview,
  RATINGS,
  getMasteryCategory,
  formatInterval,
  getTimeUntilReview,
} from "@/lib/spaced-repetition";
import { useToast } from "@/components/Toast";
import FlashCard from "@/components/FlashCard";
import Confetti from "@/components/Confetti";

export default function StudyPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [deck, setDeck] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const loadDeck = useCallback(
    (shuffleMode = false) => {
      const d = getDeck(id);
      if (!d) {
        router.push("/");
        return;
      }
      setDeck(d);
      const q = getStudyQueue(d, shuffleMode);
      setQueue(q);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionStats({ reviewed: 0, correct: 0, streak: 0, maxStreak: 0 });
      setSessionComplete(q.length === 0);
    },
    [id, router]
  );

  useEffect(() => {
    setMounted(true);
    loadDeck(false);
  }, [loadDeck]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sessionComplete) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        const ratingMap = {
          Digit1: RATINGS.AGAIN,
          Digit2: RATINGS.HARD,
          Digit3: RATINGS.GOOD,
          Digit4: RATINGS.EASY,
        };
        if (ratingMap[e.code]) {
          e.preventDefault();
          handleRating(ratingMap[e.code].value);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleRating = useCallback(
    (quality) => {
      if (!deck || currentIndex >= queue.length) return;
      const currentCard = queue[currentIndex];
      const updatedCard = processReview(currentCard, quality);
      const updatedDeck = { ...deck };
      const cardIdx = updatedDeck.cards.findIndex((c) => c.id === currentCard.id);
      if (cardIdx >= 0) updatedDeck.cards[cardIdx] = updatedCard;
      updatedDeck.lastStudied = new Date().toISOString();
      saveDeck(updatedDeck);
      setDeck(updatedDeck);

      const isCorrect = quality >= 3;
      setSessionStats((prev) => {
        const newStreak = isCorrect ? prev.streak + 1 : 0;
        return {
          reviewed: prev.reviewed + 1,
          correct: prev.correct + (isCorrect ? 1 : 0),
          streak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
        };
      });

      if (updatedCard.masteryLevel >= 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
      }

      if (currentIndex + 1 >= queue.length) {
        setSessionComplete(true);
        toast?.success("Session complete! Great work! 🎉");
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    },
    [deck, currentIndex, queue, toast]
  );

  const handleRestart = () => {
    loadDeck(shuffle);
  };

  const handleToggleShuffle = () => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);
    loadDeck(newShuffle);
  };

  if (!mounted) return null;

  if (!deck) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <div className="skeleton" style={{ height: 300, width: "100%", borderRadius: 20 }} />
      </div>
    );
  }

  // ─── SESSION COMPLETE / ALL CAUGHT UP ───
  if (sessionComplete) {
    const accuracy =
      sessionStats.reviewed > 0
        ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
        : 0;

    // Get upcoming reviews when there's nothing due
    const upcomingCards =
      sessionStats.reviewed === 0
        ? [...(deck.cards || [])]
            .filter((c) => c.nextReview)
            .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
            .slice(0, 5)
        : [];

    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <Confetti active={showConfetti} />
        <div className="glass scale-in" style={{ borderRadius: 24, padding: "40px 32px", textAlign: "center" }}>
          {/* Trophy */}
          <div
            style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
              background: "linear-gradient(135deg,rgba(108,99,255,0.15),rgba(168,85,247,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 36 }}>
              {sessionStats.reviewed === 0
                ? "✨"
                : accuracy >= 80
                ? "🏆"
                : accuracy >= 50
                ? "💪"
                : "📖"}
            </span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>
            {sessionStats.reviewed === 0
              ? "All caught up!"
              : accuracy >= 80
              ? "Outstanding!"
              : accuracy >= 50
              ? "Good progress!"
              : "Keep practicing!"}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>
            {sessionStats.reviewed === 0
              ? "No cards are due right now. Here's what's coming up:"
              : `You reviewed ${sessionStats.reviewed} card${sessionStats.reviewed !== 1 ? "s" : ""} in this session`}
          </p>

          {/* Stats grid */}
          {sessionStats.reviewed > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 32 }}>
              {[
                { label: "Reviewed", value: sessionStats.reviewed, icon: "📝" },
                { label: "Accuracy", value: `${accuracy}%`, icon: "✅" },
                { label: "Best Streak", value: sessionStats.maxStreak, icon: "🔥" },
                { label: "Cards Left", value: Math.max(0, queue.length - sessionStats.reviewed), icon: "📋" },
              ].map((s) => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming reviews */}
          {upcomingCards.length > 0 && (
            <div style={{ marginBottom: 28, textAlign: "left" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Next up for review
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcomingCards.map((card) => (
                  <div
                    key={card.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.025)", borderRadius: 10 }}
                  >
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 12 }}>
                      {card.question}
                    </p>
                    <span style={{ fontSize: 11, color: "#6c63ff", fontWeight: 600, flexShrink: 0 }}>
                      {getTimeUntilReview(card.nextReview)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleRestart} className="btn-secondary">
              Restart Session
            </button>
            <Link href={`/deck/${deck.id}`} className="btn-secondary">
              View Deck
            </Link>
            <Link href="/" className="btn-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE STUDY ───
  const currentCard = queue[currentIndex];
  const mastery = getMasteryCategory(currentCard);
  const progress = (currentIndex / queue.length) * 100;

  const ratingButtons = [
    { ...RATINGS.AGAIN, bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", textColor: "#f87171" },
    { ...RATINGS.HARD, bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", textColor: "#fb923c" },
    { ...RATINGS.GOOD, bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)", textColor: "#34d399" },
    { ...RATINGS.EASY, bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)", textColor: "#60a5fa" },
  ];

  const masteryBgColor =
    mastery.label === "Mastered"
      ? "rgba(16,185,129,0.12)"
      : mastery.label === "Learning"
      ? "rgba(245,158,11,0.12)"
      : mastery.label === "Struggling"
      ? "rgba(248,113,113,0.12)"
      : "rgba(148,163,184,0.12)";
  const masteryTextColor =
    mastery.label === "Mastered"
      ? "#10b981"
      : mastery.label === "Learning"
      ? "#f59e0b"
      : mastery.label === "Struggling"
      ? "#f87171"
      : "#94a3b8";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <Confetti active={showConfetti} />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Link
          href={`/deck/${deck.id}`}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Exit
        </Link>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            {currentIndex + 1} of {queue.length}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{deck.title}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Shuffle toggle */}
          <button
            onClick={handleToggleShuffle}
            title={shuffle ? "Shuffle on" : "Shuffle off"}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8,
              background: shuffle ? "rgba(108,99,255,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${shuffle ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: shuffle ? "#6c63ff" : "rgba(255,255,255,0.25)",
              cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
            </svg>
            Shuffle
          </button>

          {sessionStats.streak > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b" }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{sessionStats.streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: 3, borderRadius: 10, background: "rgba(255,255,255,0.05)", marginBottom: 32, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 10,
            background: "linear-gradient(90deg,#6c63ff,#a855f7)",
            transition: "width 0.5s ease",
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Card */}
      <FlashCard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
        showDifficulty={true}
      />

      {/* Card info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 10, fontWeight: 600, background: masteryBgColor, color: masteryTextColor }}>
          {mastery.label}
        </span>
        {currentCard.totalReviews > 0 && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            Reviewed {currentCard.totalReviews}× · Next: {formatInterval(currentCard.interval)}
          </span>
        )}
      </div>

      {/* Rating buttons */}
      {isFlipped ? (
        <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {ratingButtons.map((rating) => (
            <button
              key={rating.value}
              onClick={() => handleRating(rating.value)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "16px 8px", borderRadius: 14, cursor: "pointer",
                background: rating.bg, border: `1px solid ${rating.border}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 20px ${rating.border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: rating.textColor }}>{rating.label}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>{rating.description}</span>
              <kbd style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 4, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)" }}>
                {rating.key}
              </kbd>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
            Press{" "}
            <kbd style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", margin: "0 4px", fontSize: 11 }}>
              Space
            </kbd>
            or tap the card to flip
          </p>
        </div>
      )}
    </div>
  );
}