/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Based on the SuperMemo-2 algorithm by Piotr Woźniak.
 * Simplified rating scale: Again (0), Hard (2), Good (4), Easy (5)
 */

export const RATINGS = {
  AGAIN: { value: 0, label: "Again", description: "Complete blackout", color: "text-red-400", bgColor: "bg-red-500/20 hover:bg-red-500/30 border-red-500/30", key: "1" },
  HARD: { value: 2, label: "Hard", description: "Incorrect, but recalled after seeing", color: "text-orange-400", bgColor: "bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30", key: "2" },
  GOOD: { value: 4, label: "Good", description: "Correct with some effort", color: "text-emerald-400", bgColor: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30", key: "3" },
  EASY: { value: 5, label: "Easy", description: "Perfect, effortless recall", color: "text-blue-400", bgColor: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30", key: "4" },
};

/**
 * Process a review using the SM-2 algorithm
 * @param {Object} card - The card being reviewed
 * @param {number} quality - Quality of response (0-5)
 * @returns {Object} Updated card with new SM-2 state
 */
export function processReview(card, quality) {
  let { easinessFactor = 2.5, interval = 0, repetitions = 0, masteryLevel = 0, totalReviews = 0, correctStreak = 0 } = card;

  // Update easiness factor
  const newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easinessFactor = Math.max(1.3, newEF);

  // Update interval and repetitions
  if (quality < 3) {
    // Failed review — reset
    repetitions = 0;
    interval = 1;
    correctStreak = 0;
    // Decrease mastery
    masteryLevel = Math.max(0, masteryLevel - 15);
  } else {
    // Successful review
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
    correctStreak += 1;

    // Increase mastery based on quality
    const masteryGain = quality === 5 ? 20 : quality === 4 ? 12 : 5;
    masteryLevel = Math.min(100, masteryLevel + masteryGain);
  }

  totalReviews += 1;

  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    easinessFactor,
    interval,
    repetitions,
    masteryLevel,
    totalReviews,
    correctStreak,
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
  };
}

/**
 * Get mastery category for a card
 */
export function getMasteryCategory(card) {
  if (!card.lastReviewed) return { label: "New", color: "text-slate-400", bgColor: "bg-slate-500/20", dotColor: "bg-slate-400" };
  if (card.masteryLevel >= 90) return { label: "Mastered", color: "text-emerald-400", bgColor: "bg-emerald-500/20", dotColor: "bg-emerald-400" };
  if (card.masteryLevel >= 50) return { label: "Learning", color: "text-amber-400", bgColor: "bg-amber-500/20", dotColor: "bg-amber-400" };
  return { label: "Struggling", color: "text-red-400", bgColor: "bg-red-500/20", dotColor: "bg-red-400" };
}

/**
 * Format interval for display
 */
export function formatInterval(interval) {
  if (!interval || interval <= 0) return "Now";
  if (interval === 1) return "1 day";
  if (interval < 30) return `${interval} days`;
  if (interval < 365) return `${Math.round(interval / 30)} months`;
  return `${Math.round(interval / 365)} years`;
}

/**
 * Get time until next review for display
 */
export function getTimeUntilReview(nextReview) {
  if (!nextReview) return "Ready now";
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const diffMs = reviewDate - now;

  if (diffMs <= 0) return "Due now";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}
