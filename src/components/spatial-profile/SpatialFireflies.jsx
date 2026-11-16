"use client";

import { memo } from "react";

const FIREFLY_PALETTES = [
  {
    core: "bg-amber-300",
    glowHex: "#F59E0B",
    halo: "bg-amber-400/30",
    border: "border-amber-400/40",
    badgeBg: "bg-amber-950/80",
    text: "text-amber-200",
  },
  {
    core: "bg-cyan-300",
    glowHex: "#06B6D4",
    halo: "bg-cyan-400/30",
    border: "border-cyan-400/40",
    badgeBg: "bg-cyan-950/80",
    text: "text-cyan-200",
  },
  {
    core: "bg-emerald-300",
    glowHex: "#10B981",
    halo: "bg-emerald-400/30",
    border: "border-emerald-400/40",
    badgeBg: "bg-emerald-950/80",
    text: "text-emerald-200",
  },
  {
    core: "bg-fuchsia-300",
    glowHex: "#D946EF",
    halo: "bg-fuchsia-400/30",
    border: "border-fuchsia-400/40",
    badgeBg: "bg-fuchsia-950/80",
    text: "text-fuchsia-200",
  },
  {
    core: "bg-rose-300",
    glowHex: "#F43F5E",
    halo: "bg-rose-400/30",
    border: "border-rose-400/40",
    badgeBg: "bg-rose-950/80",
    text: "text-rose-200",
  },
];

function getPalette(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FIREFLY_PALETTES.length;
  return FIREFLY_PALETTES[index];
}

const SingleFirefly = memo(function SingleFirefly({ visitor }) {
  const palette = getPalette(visitor.userId || visitor.userName || "default");

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 will-change-transform z-30"
      style={{
        transform: `translate3d(${visitor.x}px, ${visitor.y}px, 0)`,
        transition: "transform 140ms cubic-bezier(0.2, 0.8, 0.4, 1)",
      }}
    >
      {/* Bobbing / Floating Animation Wrapper */}
      <div className="relative -left-2 -top-2 animate-[bounce_3s_ease-in-out_infinite]">
        {/* Outer Bioluminescent Halo */}
        <div
          className={`absolute -inset-3 rounded-full ${palette.halo} blur-md animate-pulse pointer-events-none`}
        />

        {/* Expanding Ring Ping */}
        <div
          className={`absolute -inset-1 rounded-full border ${palette.border} animate-ping opacity-40 pointer-events-none`}
        />

        {/* Luminous Firefly Core */}
        <div
          className={`relative w-4 h-4 rounded-full ${palette.core} shadow-[0_0_14px_${palette.glowHex},0_0_28px_${palette.glowHex}] flex items-center justify-center`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
        </div>

        {/* Floating Mini Avatar & Visitor Tag */}
        <div className="absolute left-5 -top-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-950/90 border border-white/20 shadow-xl backdrop-blur-md whitespace-nowrap select-none">
          {visitor.avatar ? (
            <img
              src={visitor.avatar}
              alt={visitor.userName || "visitor"}
              className="w-4 h-4 rounded-full object-cover border border-white/30"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className={`w-4 h-4 rounded-full ${palette.core} text-zinc-950 font-bold text-[9px] flex items-center justify-center`}>
              {(visitor.userName || "U")[0].toUpperCase()}
            </div>
          )}
          <span className={`text-[11px] font-semibold tracking-wide ${palette.text}`}>
            {visitor.userName || "Bạn bè"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default function SpatialFireflies({ visitors = [] }) {
  if (!visitors || visitors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {visitors.map((visitor) => (
        <SingleFirefly key={visitor.userId || visitor.userName} visitor={visitor} />
      ))}
    </div>
  );
}
