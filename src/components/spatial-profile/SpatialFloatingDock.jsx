"use client";

import {
  Sparkles,
  LayoutList,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Map,
  Wand2,
  Box,
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
  is3DMode = false,
  onToggle3DMode,
  isOwnProfile = false,
  isBuilderMode = false,
  onToggleBuilderMode,
  visitors = [],
  customAccent = "#6366F1",
  tSpace,
}) {
  return (
    <div
      data-spatial-ui="true"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)] flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-zinc-950/90 text-white border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
    >
      {/* Mobile-Only Live Visitors Presence Badge (Floats gently above the dock) */}
      {viewMode === "SPACE" && visitors.length > 0 && (
        <div className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-amber-500/35 text-amber-300 text-[11px] font-medium shadow-lg backdrop-blur-xl whitespace-nowrap">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
          <span>{visitors.length} bạn đang xem</span>
          <div className="flex -space-x-1 overflow-hidden ml-0.5">
            {visitors.slice(0, 3).map((v) =>
              v.avatar ? (
                <img
                  key={v.userId || v.userName}
                  src={v.avatar}
                  alt={v.userName}
                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-zinc-900 object-cover"
                />
              ) : (
                <div
                  key={v.userId || v.userName}
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-zinc-950 ring-1 ring-zinc-900"
                >
                  {(v.userName || "U")[0].toUpperCase()}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Desktop-Only Live Visitors Presence Badge */}
      {viewMode === "SPACE" && visitors.length > 0 && (
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>{visitors.length} bạn đang xem</span>
            <div className="flex -space-x-1.5 overflow-hidden ml-0.5">
              {visitors.slice(0, 3).map((v) =>
                v.avatar ? (
                  <img
                    key={v.userId || v.userName}
                    src={v.avatar}
                    alt={v.userName}
                    className="inline-block h-4 w-4 rounded-full ring-1 ring-zinc-900 object-cover"
                  />
                ) : (
                  <div
                    key={v.userId || v.userName}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-zinc-950 ring-1 ring-zinc-900"
                  >
                    {(v.userName || "U")[0].toUpperCase()}
                  </div>
                )
              )}
            </div>
          </div>
          <div className="w-[1px] h-5 bg-white/15 mx-1" />
        </div>
      )}

      {/* View Mode Switcher: Space vs Feed */}
      <div className="flex items-center bg-white/10 p-0.5 rounded-full">
        <button
          type="button"
          onClick={() => onViewModeChange("SPACE")}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            viewMode === "SPACE"
              ? "text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          style={viewMode === "SPACE" ? { background: customAccent } : undefined}
          title={tSpace("spaceView")}
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">{tSpace("spaceView")}</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("FEED")}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            viewMode === "FEED"
              ? "text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          style={viewMode === "FEED" ? { background: customAccent } : undefined}
          title={tSpace("feedView")}
        >
          <LayoutList size={13} />
          <span className="hidden sm:inline">{tSpace("feedView")}</span>
        </button>
      </div>

      {/* Spatial Camera Controls */}
      {viewMode === "SPACE" && (
        <>
          <div className="w-[1px] h-5 bg-white/15 mx-0.5 sm:mx-1" />

          {/* Desktop Zoom Stepper */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut size={14} />
            </button>

            <span className="text-[11px] font-mono text-zinc-300 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={onZoomIn}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Phóng to"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={onResetCenter}
            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-white/10 text-xs font-medium text-zinc-200 transition-colors"
            title={tSpace("resetCamera")}
          >
            <Crosshair size={14} />
            <span className="hidden lg:inline">{tSpace("resetCamera")}</span>
          </button>

          {/* 3D Perspective Mode */}
          <button
            type="button"
            onClick={onToggle3DMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              is3DMode
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                : "hover:bg-white/10 text-zinc-300 hover:text-white"
            }`}
            title={tSpace("view3D")}
          >
            <Box size={14} className={is3DMode ? "rotate-12 transition-transform duration-300" : ""} />
            <span>3D</span>
          </button>

          {/* Minimap (Desktop / Tablet) */}
          <button
            type="button"
            onClick={onToggleMinimap}
            className={`p-2 rounded-full transition-colors hidden sm:flex ${
              showMinimap ? "bg-white/15 text-white" : "hover:bg-white/10 text-zinc-400"
            }`}
            title={tSpace("minimap")}
          >
            <Map size={14} />
          </button>

          {/* Builder Mode Toggle */}
          {isOwnProfile && (
            <>
              <div className="w-[1px] h-5 bg-white/15 mx-0.5 sm:mx-1" />
              <button
                type="button"
                onClick={onToggleBuilderMode}
                className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isBuilderMode
                    ? "bg-amber-500 text-zinc-950 shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Wand2 size={13} />
                <span className="hidden sm:inline">{isBuilderMode ? tSpace("exitBuilder") : tSpace("customizeSpace")}</span>
                <span className="sm:hidden">{isBuilderMode ? "Thoát" : "Sửa"}</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
