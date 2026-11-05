"use client";

import { memo } from "react";

function SpatialAtmosphere({ theme = "COSMIC_VOID", customAccent = "#6366F1", panX = 0, panY = 0, zoom = 1 }) {
  const bgOffsetX = Math.round(panX * 0.25);
  const bgOffsetY = Math.round(panY * 0.25);
  const gridStep = Math.max(24, Math.round(48 * zoom));

  if (theme === "ART_GALLERY") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#F5F2EB] dark:bg-[#141311] transition-colors duration-700">
        {/* Subtle Museum Architectural Grid */}
        <div
          className="absolute inset-0 opacity-35 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(120, 113, 108, 0.14) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(120, 113, 108, 0.14) 1px, transparent 1px)
            `,
            backgroundSize: `${gridStep * 2}px ${gridStep * 2}px`,
            backgroundPosition: `${panX}px ${panY}px`,
          }}
        />
        {/* Warm Gallery Spotlight from Top */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle 900px at calc(50% + ${bgOffsetX}px) calc(40% + ${bgOffsetY}px), ${customAccent}18, transparent 70%)`,
          }}
        />
        {/* Soft vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_160px_rgba(0,0,0,0.65)]" />
      </div>
    );
  }

  if (theme === "BLUEPRINT_STUDIO") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#091426] text-cyan-100 transition-colors duration-700">
        {/* Technical Minor & Major Grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${gridStep}px ${gridStep}px`,
            backgroundPosition: `${panX}px ${panY}px`,
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: `${gridStep * 4}px ${gridStep * 4}px`,
            backgroundPosition: `${panX}px ${panY}px`,
          }}
        />
        {/* Blueprint Glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle 800px at calc(50% + ${bgOffsetX}px) calc(50% + ${bgOffsetY}px), ${customAccent}22, transparent 75%)`,
          }}
        />
      </div>
    );
  }

  if (theme === "ETHEREAL_GLASS") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0F0C1B] transition-colors duration-700">
        {/* Ethereal Mesh Gradients */}
        <div
          className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[130px] opacity-35 transition-transform duration-300"
          style={{
            background: customAccent,
            transform: `translate3d(${bgOffsetX}px, ${bgOffsetY}px, 0)`,
          }}
        />
        <div
          className="absolute -bottom-40 -right-24 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 bg-fuchsia-500 transition-transform duration-300"
          style={{
            transform: `translate3d(${-bgOffsetX}px, ${-bgOffsetY}px, 0)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px)`,
            backgroundSize: `${gridStep}px ${gridStep}px`,
            backgroundPosition: `${panX}px ${panY}px`,
          }}
        />
      </div>
    );
  }

  // Default: COSMIC_VOID
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#06070C] transition-colors duration-700">
      {/* Starfield Dot Matrix */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.24) 1px, transparent 1px)`,
          backgroundSize: `${gridStep}px ${gridStep}px`,
          backgroundPosition: `${panX}px ${panY}px`,
        }}
      />
      {/* Deep Nebula Core Aura */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle 780px at calc(50% + ${bgOffsetX}px) calc(50% + ${bgOffsetY}px), ${customAccent}26, rgba(15, 23, 42, 0.2) 55%, transparent 80%)`,
        }}
      />
      {/* Secondary Distant Nebula */}
      <div
        className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full blur-[130px] opacity-20 bg-cyan-500"
        style={{
          transform: `translate3d(${bgOffsetX * 0.6}px, ${bgOffsetY * 0.6}px, 0)`,
        }}
      />
    </div>
  );
}

export default memo(SpatialAtmosphere);
