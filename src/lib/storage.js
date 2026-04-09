"use client";

const STORAGE_KEY = "recalliq_decks";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAllDecks() {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getDeck(id) {
  const decks = getAllDecks();
  return decks.find((d) => d.id === id) || null;
}

export function saveDeck(deck) {
  if (!isBrowser()) return deck;
  const decks = getAllDecks();
  const existingIndex = decks.findIndex((d) => d.id === deck.id);
  if (existingIndex >= 0) {
    decks[existingIndex] = deck;
  } else {
    decks.unshift(deck);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  return deck;
}

export function deleteDeck(id) {
  if (!isBrowser()) return;
  const decks = getAllDecks().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function updateCard(deckId, cardId, updates) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
  if (cardIndex < 0) return null;
  deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...updates };
  deck.lastStudied = new Date().toISOString();
  saveDeck(deck);
  return deck;
}

export function editCard(deckId, cardId, { question, answer }) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
  if (cardIndex < 0) return null;
  deck.cards[cardIndex] = {
    ...deck.cards[cardIndex],
    question: question.trim(),
    answer: answer.trim(),
  };
  saveDeck(deck);
  return deck;
}

export function getDeckStats(deck) {
  if (!deck || !deck.cards)
    return {
      total: 0,
      new: 0,
      learning: 0,
      mastered: 0,
      dueToday: 0,
      averageMastery: 0,
    };

  const now = new Date();
  let newCount = 0,
    learningCount = 0,
    masteredCount = 0,
    dueCount = 0,
    totalMastery = 0;

  deck.cards.forEach((card) => {
    totalMastery += card.masteryLevel || 0;
    if (!card.lastReviewed) {
      newCount++;
      dueCount++;
    } else if ((card.masteryLevel || 0) >= 90) {
      masteredCount++;
      if (card.nextReview && new Date(card.nextReview) <= now) dueCount++;
    } else {
      learningCount++;
      if (!card.nextReview || new Date(card.nextReview) <= now) dueCount++;
    }
  });

  return {
    total: deck.cards.length,
    new: newCount,
    learning: learningCount,
    mastered: masteredCount,
    dueToday: dueCount,
    averageMastery:
      deck.cards.length > 0
        ? Math.round(totalMastery / deck.cards.length)
        : 0,
  };
}

export function getStudyQueue(deck, shuffle = false) {
  if (!deck || !deck.cards) return [];
  const now = new Date();

  const dueCards = deck.cards
    .filter((card) => {
      if (!card.lastReviewed) return true;
      if (!card.nextReview) return true;
      return new Date(card.nextReview) <= now;
    })
    .sort((a, b) => {
      if (!a.lastReviewed && b.lastReviewed) return -1;
      if (a.lastReviewed && !b.lastReviewed) return 1;
      if (!a.lastReviewed && !b.lastReviewed) return 0;
      return new Date(a.nextReview) - new Date(b.nextReview);
    });

  if (shuffle) {
    // Fisher-Yates shuffle
    for (let i = dueCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
    }
  }

  return dueCards;
}