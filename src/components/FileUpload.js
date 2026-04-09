"use client";

import { useState, useRef, useCallback } from "react";

export default function FileUpload({ onGenerate, isGenerating }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [textMode, setTextMode] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setTextMode(false); }
  }, []);
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setTextMode(false); }
  };
  const handleSubmit = () => {
    if (textMode && textContent.trim().length >= 50)
      onGenerate({ textContent: textContent.trim(), title: customTitle.trim() || undefined });
    else if (file)
      onGenerate({ file, title: customTitle.trim() || undefined });
  };

  const canSubmit = (textMode && textContent.trim().length >= 50) || (!textMode && file);

  return (
    <div className="glass scale-in" style={{ borderRadius: "var(--radius-lg)", padding: "28px 28px 24px" }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", borderRadius: 10, padding: 3 }}>
        {[
          { mode: false, label: "Upload PDF" },
          { mode: true, label: "Paste text" },
        ].map((tab) => (
          <button
            key={String(tab.mode)}
            onClick={() => setTextMode(tab.mode)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s",
              background: textMode === tab.mode ? "var(--accent-soft)" : "transparent",
              color: textMode === tab.mode ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Title input */}
      <input
        type="text"
        value={customTitle}
        onChange={(e) => setCustomTitle(e.target.value)}
        placeholder="Give it a name (optional)"
        style={{
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "11px 16px",
          fontSize: 13,
          color: "var(--text-primary)",
          outline: "none",
          marginBottom: 14,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />

      {!textMode ? (
        /* PDF drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`dropzone ${isDragging ? "active" : ""}`}
          style={{ borderRadius: 16, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 180 }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: "none" }} />

          {file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{file.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{ fontSize: 12, color: "var(--danger)", opacity: 0.6, background: "none", border: "none", cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
                  Drop a PDF here or <span style={{ color: "var(--accent)" }}>browse</span>
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Up to 10 MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Text area */
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste notes, textbook excerpts, or anything you want to learn...&#10;&#10;The more context you provide, the better the cards."
          style={{
            width: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "16px 18px",
            fontSize: 14,
            color: "var(--text-primary)",
            outline: "none",
            minHeight: 180,
            resize: "vertical",
            lineHeight: 1.6,
            transition: "border-color 0.2s",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}

      {textMode && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
          {textContent.length} chars{textContent.length < 50 ? " (min 50)" : " ✓"}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isGenerating}
        className="btn-primary"
        style={{ width: "100%", marginTop: 16, padding: "14px 0", fontSize: 14, gap: 8 }}
      >
        {isGenerating ? (
          <>
            <div className="dot-pulse"><span /><span /><span /></div>
            Analyzing content...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Generate flashcards
          </>
        )}
      </button>
    </div>
  );
}
