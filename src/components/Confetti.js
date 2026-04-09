"use client";

import { useEffect, useState } from "react";

const CONFETTI_COLORS = ["#6c63ff", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#06b6d4"];

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: `${Math.random() * 1}s`,
        duration: `${2 + Math.random() * 2}s`,
        size: `${6 + Math.random() * 8}px`,
        rotation: Math.random() > 0.5 ? "rotate(45deg)" : "rotate(0deg)",
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => setPieces([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            transform: p.rotation,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </>
  );
}
