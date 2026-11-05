"use client";

import { Quote } from "lucide-react";
import { NOTE_COLORS } from "../spatialConstants";

export default function TextNoteNode({ node, customAccent = "#6366F1" }) {
  const text = node?.content?.text || "";
  const colorKey = node?.content?.color || "AMBER";
  const frameStyle = node?.frameStyle || "SERIF_EDITORIAL";
  const palette = NOTE_COLORS[colorKey] || NOTE_COLORS.AMBER;

  if (frameStyle === "MONO_TECH") {
    return (
      <div className="w-[260px] sm:w-[290px] p-5 rounded-xl bg-zinc-950/90 text-cyan-100 border border-cyan-500/30 shadow-[0_18px_45px_rgba(0,0,0,0.5)] font-mono">
        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] uppercase tracking-widest text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>MEMO // LOG</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    );
  }

  if (frameStyle === "HANDWRITTEN") {
    return (
      <div
        className={`relative w-[240px] sm:w-[260px] p-5 rounded-lg border shadow-[0_18px_40px_rgba(0,0,0,0.32)] ${palette.bg} ${palette.border} ${palette.text}`}
      >
        <div
          className="w-3 h-3 rounded-full mx-auto -mt-2 mb-3 shadow-inner"
          style={{ background: palette.dot }}
        />
        <p className="text-sm sm:text-base italic leading-relaxed whitespace-pre-wrap font-serif">
          {text}
        </p>
      </div>
    );
  }

  // Default: SERIF_EDITORIAL
  return (
    <div className="w-[280px] sm:w-[320px] p-6 rounded-2xl bg-zinc-900/75 text-white backdrop-blur-xl border border-white/15 shadow-[0_20px_55px_rgba(0,0,0,0.45)]">
      <Quote size={20} className="mb-3 opacity-80" style={{ color: customAccent }} />
      <p className="font-serif text-base sm:text-lg leading-relaxed tracking-wide whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
