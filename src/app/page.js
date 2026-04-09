"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getAllDecks, saveDeck, deleteDeck } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import FileUpload from "@/components/FileUpload";
import DeckCard from "@/components/DeckCard";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDecks(getAllDecks());
  }, []);

  const handleGenerate = useCallback(
    async ({ file, textContent, title }) => {
      setIsGenerating(true);
      try {
        const formData = new FormData();
        if (file) formData.append("file", file);
        if (textContent) formData.append("textContent", textContent);
        if (title) formData.append("title", title);

        const res = await fetch("/api/generate", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");

        const deckId = uuidv4();
        const newDeck = {
          id: deckId,
          title: data.deck.title || "Untitled Deck",
          subject: data.deck.subject || "",
          description: data.deck.description || "",
          provider: data.deck.provider || "unknown",
          createdAt: new Date().toISOString(),
          lastStudied: null,
          cards: (data.deck.cards || []).map((card) => ({
            id: uuidv4(),
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || "medium",
            tags: card.tags || [],
            easinessFactor: 2.5,
            interval: 0,
            repetitions: 0,
            masteryLevel: 0,
            totalReviews: 0,
            correctStreak: 0,
            lastReviewed: null,
            nextReview: null,
          })),
        };

        saveDeck(newDeck);
        setDecks(getAllDecks());
        setShowUpload(false);
        toast?.success(`Beautiful. ${newDeck.cards.length} cards generated.`);
        router.push(`/deck/${deckId}`);
      } catch (err) {
        console.error("Generation error:", err);
        toast?.error(err.message || "Failed to process content.");
      } finally {
        setIsGenerating(false);
      }
    },
    [router, toast]
  );

  const handleDelete = useCallback(
    (id) => {
      deleteDeck(id);
      setDecks(getAllDecks());
      toast?.success("Deck deleted.");
    },
    [toast]
  );

  const filteredDecks = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;

  // ─── LANDING / ONBOARDING (No decks yet) ───
  if (decks.length === 0 && !showUpload) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "80px 24px" }}>
        
        {/* Beautiful Hero */}
        <div className="scale-in" style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 20,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.03em"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Smarter studying
          </div>
          
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.1 }}>
            Master any subject with <br/> <span className="gradient-text">intelligent recall.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
            Upload a PDF or paste notes to instantly generate an elegant, spaced-repetition flashcard deck.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 48 }}>
          <div className="glass animate-in" style={{ padding: 28, animationDelay: "0.1s" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Import</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Drop in class notes, research papers, or study guides and let the engine extract the core concepts.</p>
          </div>
          
          <div className="glass animate-in" style={{ padding: 28, animationDelay: "0.2s" }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Retain</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Track your mastery visually. The SM-2 algorithm ensures you practice at the exact optimal interval.</p>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => setShowUpload(true)} className="btn-primary" style={{ padding: "14px 32px", fontSize: 15, borderRadius: 30 }}>
            Create Your First Deck
          </button>
        </div>
      </div>
    );
  }

  // ─── UPLOAD MODE ───
  if (decks.length === 0 && showUpload) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 12 }}>
            What are we learning?
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Upload reading material or paste raw text. The engine handles the rest.
          </p>
        </div>

        <FileUpload onGenerate={handleGenerate} isGenerating={isGenerating} />

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => setShowUpload(false)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN DASHBOARD ───
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header and Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Collections
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
             You have {decks.length} deck{decks.length !== 1 ? "s" : ""} in your library.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 260 }}>
            <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic or title..."
              style={{
                width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "100px", padding: "10px 16px 10px 40px", fontSize: 14,
                color: "var(--text-primary)", outline: "none", transition: "all 0.2s",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <button onClick={() => setShowUpload(!showUpload)} className="btn-primary" style={{ borderRadius: 100, padding: "10px 24px" }}>
            {showUpload ? "Cancel" : "New Deck"}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="scale-in" style={{ marginBottom: 48, maxWidth: 720, margin: "0 auto 48px auto" }}>
          <FileUpload onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>
      )}

      {/* Deck grid */}
      {filteredDecks.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {filteredDecks.map((deck, i) => (
            <DeckCard key={deck.id} index={i} deck={deck} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>
            No decks matched your search.
          </p>
        </div>
      )}
    </div>
  );
}
