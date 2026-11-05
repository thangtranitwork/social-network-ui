"use client";

import { useCallback } from "react";

const WORLD_SPAN = 3200; // -1600 to +1600 mapped onto minimap

export default function SpatialMinimap({
  nodes = [],
  camera,
  onJumpTo,
  customAccent = "#6366F1",
}) {
  const mapWidth = 148;
  const mapHeight = 112;

  const worldToMapX = (wx) => {
    const ratio = (wx + WORLD_SPAN / 2) / WORLD_SPAN;
    return Math.max(6, Math.min(mapWidth - 6, ratio * mapWidth));
  };

  const worldToMapY = (wy) => {
    const ratio = (wy + WORLD_SPAN / 2) / WORLD_SPAN;
    return Math.max(6, Math.min(mapHeight - 6, ratio * mapHeight));
  };

  const handleClickMap = useCallback(
    (e) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const worldX = (clickX / mapWidth) * WORLD_SPAN - WORLD_SPAN / 2;
      const worldY = (clickY / mapHeight) * WORLD_SPAN - WORLD_SPAN / 2;

      onJumpTo(-worldX * camera.zoom, -worldY * camera.zoom);
    },
    [camera.zoom, onJumpTo]
  );

  // Current viewport center in world coordinates
  const viewCenterWorldX = -camera.panX / (camera.zoom || 1);
  const viewCenterWorldY = -camera.panY / (camera.zoom || 1);
  const vpBoxW = Math.max(18, Math.min(80, 44 / (camera.zoom || 1)));
  const vpBoxH = Math.max(14, Math.min(60, 32 / (camera.zoom || 1)));

  return (
    <div
      data-spatial-ui="true"
      onClick={handleClickMap}
      className="hidden sm:block fixed bottom-20 right-6 z-30 w-[148px] h-[112px] rounded-2xl bg-zinc-950/80 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden cursor-crosshair"
    >
      {/* Crosshair Axes */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10" />
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10" />

      {/* Nodes Dots */}
      {nodes.map((n) => {
        const mx = worldToMapX(n.x || 0);
        const my = worldToMapY(n.y || 0);
        const isCore = n.type === "IDENTITY_CORE";
        return (
          <div
            key={n.id}
            style={{
              left: `${mx}px`,
              top: `${my}px`,
              background: isCore ? customAccent : "#E4E4E7",
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isCore ? "w-3 h-3 ring-2 ring-white/40" : "w-1.5 h-1.5 opacity-80"
            }`}
          />
        );
      })}

      {/* Viewport Indicator Frame */}
      <div
        style={{
          left: `${worldToMapX(viewCenterWorldX)}px`,
          top: `${worldToMapY(viewCenterWorldY)}px`,
          width: `${vpBoxW}px`,
          height: `${vpBoxH}px`,
          borderColor: customAccent,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 border rounded-sm bg-white/5 pointer-events-none transition-all duration-75"
      />
    </div>
  );
}
