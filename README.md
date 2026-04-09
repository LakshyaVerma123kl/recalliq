# RecallIQ — AI-Powered Smart Flashcard Engine

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

## 🎨 Design Decisions

### Why LocalStorage?
- **Privacy**: No user data leaves the browser
- **Offline**: Works without internet after initial generation
- **Zero setup**: No database, no auth, no migration headaches
- **Speed**: Instant reads/writes

### Why SM-2?
The SuperMemo-2 algorithm is the proven gold standard for spaced repetition, used by Anki and SuperMemo. It adapts card intervals based on how well you remember:
- **Easiness Factor**: Cards you struggle with get shorter intervals
- **Mastery Level**: Visual progress from 0% → 100%
- **Smart scheduling**: Easy cards reviewed less often, hard cards more frequently

### Why Multi-Provider AI?
- **Groq** is 10-50x faster than OpenAI for text generation
- **Gemini** has native PDF vision (no separate OCR needed)
- **OpenAI** as a reliable fallback if others are down
- Cascading approach = near-zero downtime

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
