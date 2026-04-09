"use client";

export default function FlashCard({ card, onFlip, isFlipped, showDifficulty = false }) {
  const difficultyColors = {
    easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    hard: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <div
      className={`flip-card w-full max-w-2xl mx-auto ${isFlipped ? "flipped" : ""}`}
      onClick={onFlip}
      style={{ height: "360px" }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Flashcard showing answer. Click to show question." : "Flashcard showing question. Click to reveal answer."}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip?.();
        }
      }}
    >
      <div className="flip-card-inner">
        {/* Front — Question */}
        <div className="flip-card-front glass border border-white/[0.06] bg-gradient-to-br from-white/[0.035] to-white/[0.005]">
          {/* Question label & difficulty badge */}
          <div className="absolute top-5 left-6 flex items-center gap-2">
            <span className="text-[11px] text-[#6c63ff]/50 font-semibold uppercase tracking-widest">
              Question
            </span>
            {showDifficulty && card.difficulty && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${difficultyColors[card.difficulty] || ""}`}>
                {card.difficulty}
              </span>
            )}
          </div>

          {/* Question number indicator */}
          <div className="absolute top-5 right-6">
            <div className="w-8 h-8 rounded-lg bg-[#6c63ff]/8 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          {/* Question text */}
          <p className="text-lg md:text-xl font-medium text-white/90 text-center leading-relaxed px-6 max-h-[200px] overflow-y-auto">
            {card.question}
          </p>

          {/* Hint */}
          <p className="absolute bottom-5 text-[11px] text-white/15 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Tap or press Space to flip
          </p>
        </div>

        {/* Back — Answer */}
        <div className="flip-card-back glass border border-[#6c63ff]/15 bg-gradient-to-br from-[#6c63ff]/[0.05] to-[#a855f7]/[0.02]">
          <div className="absolute top-5 left-6">
            <span className="text-[11px] text-[#6c63ff]/50 font-semibold uppercase tracking-widest">
              Answer
            </span>
          </div>

          {/* Checkmark icon */}
          <div className="absolute top-5 right-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* Answer text */}
          <p className="text-base md:text-lg text-white/80 text-center leading-relaxed px-6 max-h-[200px] overflow-y-auto">
            {card.answer}
          </p>

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="absolute bottom-5 flex items-center gap-1.5 flex-wrap justify-center px-6">
              {card.tags.map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/25 border border-white/[0.04]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
