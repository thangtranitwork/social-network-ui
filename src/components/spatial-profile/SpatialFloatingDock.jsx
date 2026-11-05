"use client";

import {
  Sparkles,
  LayoutList,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Map,
  Wand2,
} from "lucide-react";

export default function SpatialFloatingDock({
  viewMode = "SPACE",
  onViewModeChange,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetCenter,
  showMinimap = true,
  onToggleMinimap,
  isOwnProfile = false,
  isBuilderMode = false,
  onToggleBuilderMode,
  customAccent = "#6366F1",
  tSpace,
}) {
  return (
    <div
      data-spatial-ui="true"
      className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-950/85 text-white border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
    >
      {/* View Mode Switcher: Space vs Feed */}
      <div className="flex items-center bg-white/10 p-0.5 rounded-full">
        <button
          type="button"
          onClick={() => onViewModeChange("SPACE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            viewMode === "SPACE"
              ? "text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          style={viewMode === "SPACE" ? { background: customAccent } : undefined}
        >
          <Sparkles size={13} />
          <span>{tSpace("spaceView")}</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("FEED")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            viewMode === "FEED"
              ? "text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          style={viewMode === "FEED" ? { background: customAccent } : undefined}
        >
          <LayoutList size={13} />
          <span>{tSpace("feedView")}</span>
        </button>
      </div>

      {/* Spatial Camera Controls */}
      {viewMode === "SPACE" && (
        <>
          <div className="w-[1px] h-5 bg-white/15 mx-1" />

          <button
            type="button"
            onClick={onZoomOut}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut size={15} />
          </button>

          <span className="text-[11px] font-mono text-zinc-300 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            title="Phóng to"
          >
            <ZoomIn size={15} />
          </button>

          <button
            type="button"
            onClick={onResetCenter}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-white/10 text-xs font-medium text-zinc-200 transition-colors"
            title={tSpace("resetCamera")}
          >
            <Crosshair size={14} />
            <span className="hidden sm:inline">{tSpace("resetCamera")}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMinimap}
            className={`p-2 rounded-full transition-colors hidden sm:flex ${
              showMinimap ? "bg-white/15 text-white" : "hover:bg-white/10 text-zinc-400"
            }`}
            title={tSpace("minimap")}
          >
            <Map size={15} />
          </button>

          {isOwnProfile && (
            <>
              <div className="w-[1px] h-5 bg-white/15 mx-1" />
              <button
                type="button"
                onClick={onToggleBuilderMode}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isBuilderMode
                    ? "bg-amber-500 text-zinc-950 shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Wand2 size={13} />
                <span>{isBuilderMode ? tSpace("exitBuilder") : tSpace("customizeSpace")}</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
