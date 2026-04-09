import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RecallIQ — AI-Powered Smart Flashcards",
  description:
    "Turn any PDF or notes into smart flashcards with AI. Study with spaced repetition, track your mastery, and retain knowledge long-term.",
  keywords: ["flashcards", "spaced repetition", "AI", "study", "learning", "SM-2", "PDF"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-icon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "RecallIQ — AI-Powered Smart Flashcards",
    description: "Turn any PDF into smart flashcards. Study smarter with spaced repetition.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Header />
          <main className="flex-1 relative z-10">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
