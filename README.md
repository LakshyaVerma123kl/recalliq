# RecallIQ — AI-Powered Smart Flashcard Engine

> **Live Demo:** [https://recalliq-five.vercel.app/](https://recalliq-five.vercel.app/)

> **Turn any PDF or notes into smart flashcards with AI. Study with spaced repetition, track your mastery, and retain knowledge long-term.**

![RecallIQ](https://img.shields.io/badge/AI_Powered-Flashcards-6c63ff?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=for-the-badge)

---

## 🎯 What It Does

RecallIQ is a premium AI-powered flashcard engine that transforms educational content into interactive, spaced-repetition-based flashcard decks in seconds.

### Core Features

- **📄 PDF & Text Ingestion** — Upload PDFs or paste notes; AI analyzes the content and generates 15-30 comprehensive flashcards per deck
- **🧠 SM-2 Spaced Repetition** — Industry-standard SuperMemo-2 algorithm schedules reviews at optimal intervals for long-term retention
- **🎴 3D Card Flip Study Sessions** — Immersive study experience with keyboard shortcuts (Space to flip, 1-4 to rate)
- **📊 Mastery Tracking** — Real-time progress rings, streak counters, and per-card mastery percentages
- **🔄 Answer Regeneration** — Regenerate any card's answer with one click for better explanations
- **🎉 Celebration Effects** — Confetti animations when you master a card
- **🔒 Privacy-First** — All data stored locally in your browser (no account required)

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | SSR, API routes, file-based routing |
| **Styling** | Tailwind CSS v4 + Inline Styles | Dark-mode-first glassmorphism design |
| **AI (Primary)** | Groq — Llama 3.3 70B | Fastest inference, structured JSON |
| **AI (Secondary)** | Gemini 2.5 Flash / Pro | Native PDF vision, complex content |
| **AI (Fallback)** | OpenAI GPT-4o | Final fallback |
| **Data** | LocalStorage | Privacy-first, offline-capable, zero setup |
| **Algorithm** | SM-2 (SuperMemo-2) | Gold standard for spaced repetition |

### AI Strategy — Cascading Fallback

```
Text Input → Groq (Llama 3.3 70B) → Gemini Flash → OpenAI → Error
PDF Input  → Gemini Flash (native PDF vision) → Gemini Pro → Error
```

This multi-provider approach ensures **<2s response time** (Groq) with **near-zero downtime** (fallback chain).

---

## 📁 Project Structure

```
recalliq/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout + SEO
│   │   ├── page.js                # Dashboard (deck grid, stats, upload)
│   │   ├── globals.css            # Design system (glassmorphism, animations)
│   │   ├── api/
│   │   │   ├── generate/route.js  # PDF/text → flashcards API
│   │   │   └── regenerate/route.js # Answer regeneration API
│   │   ├── deck/[id]/page.js      # Deck detail (browse, filter, expand)
│   │   └── study/[id]/page.js     # Study session (flip, rate, track)
│   ├── components/
│   │   ├── Header.js              # App header + navigation
│   │   ├── FileUpload.js          # Drag-and-drop PDF + text paste
│   │   ├── DeckCard.js            # Deck preview card
│   │   ├── FlashCard.js           # 3D flip card with accessibility
│   │   ├── ProgressRing.js        # SVG mastery ring
│   │   ├── Confetti.js            # Celebration particles
│   │   └── Toast.js               # Notification system
│   └── lib/
│       ├── ai-client.js           # Multi-provider AI orchestration
│       ├── spaced-repetition.js   # SM-2 algorithm implementation
│       └── storage.js             # LocalStorage CRUD + study queue
├── .env.local                     # API keys (not committed)
├── next.config.mjs
└── package.json
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd recalliq
npm install
```

### 2. Configure API Keys

Create `.env.local`:

```env
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key      # Optional fallback
```

**Minimum requirement:** At least one of `GROQ_API_KEY` or `GEMINI_API_KEY` must be set.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎨 Engineering & Product Decisions

### 1. Algorithm: SM-2 for Proven Learning Science
*Relevance to Core Objective: Optimizing long-term knowledge retention.*
The SuperMemo-2 (SM-2) algorithm is the proven gold standard for spaced repetition (powering engines like Anki). By adapting interval schedules based on a user's recall performance (Easiness Factor), it ensures:
- **Active Recall:** Concepts the user struggles with are surfaced more frequently.
- **Efficiency:** Mastered cards are scheduled further out to test true long-term retention.
- **Why this matters:** True learning isn't just about reading—it's about active recall over optimized intervals. This directly aligns with the core principles of learning science.

### 2. Architecture: Multi-Provider AI Cascade
*Relevance to Core Objective: Flawless user experience & generation speed.*
Instead of relying on a single AI provider, RecallIQ implements a strict, fault-tolerant cascade:
- **Speed First (Groq - Llama 3.3 70B):** Used primarily because it is 10x-50x faster than traditional models. Speed is critical to avoid user drop-off while waiting for deck generation.
- **Specialized (Gemini 2.5 Flash):** Leveraged for PDFs to use its native, multimodal document vision—bypassing the need for error-prone third-party OCR text extraction.
- **Fallback (OpenAI GPT-4o):** Serves as a robust final safety net to guarantee near-zero downtime.

### 3. Data Infrastructure: The LocalStorage Tradeoff
*Relevance to Core Objective: Frictionless onboarding vs. Cross-device sync.*
- **The Decision:** All decks, cards, and SM-2 study histories are stored entirely in the browser's `localStorage`.
- **The "Why":** This guarantees **zero-friction onboarding** (no login wall), **absolute privacy**, and **instant load times**. Providing an immediate, frictionless "time-to-value" experience is crucial for a product demonstration.
- **The Tradeoff:** The clear drawback of this approach is the lack of cross-device syncing or deck sharing. In a production environment, this would instantly be migrated to a Postgres/Supabase backend to enable cloud sync, while keeping the client-side state management for offline study.

---

## 📋 What I'd Improve With More Time

1. **Real database** (Supabase/Planetscale) for cross-device sync
2. **User accounts** with OAuth for persistent data
3. **Deck sharing** via public URLs
4. **Image support** for diagrams/charts in flashcards
5. **Bulk operations** (edit, tag, merge decks)
6. **Analytics dashboard** with study streaks and heatmaps
7. **PWA** for offline mobile experience
8. **Export** to Anki format

---

## 📄 License

MIT
