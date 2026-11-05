"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import SpatialAtmosphere from "./SpatialAtmosphere";

export default function SpatialViewport({
  theme = "COSMIC_VOID",
  customAccent = "#6366F1",
  camera,
  onCameraChange,
  onCanvasBackgroundClick,
  isBuilderMode = false,
  children,
}) {
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false });

  // Handle Mouse / Touch Panning on Canvas Background
  const handlePointerDown = useCallback(
    (e) => {
      // Only start panning if clicking on the viewport background itself (not inside an interactive node)
      if (e.target.closest("[data-spatial-node='true']") || e.target.closest("[data-spatial-ui='true']")) {
        return;
      }
      if (e.button !== undefined && e.button !== 0 && e.button !== 1) return;

      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: camera.panX,
        panY: camera.panY,
        moved: false,
      };
    },
    [camera.panX, camera.panY]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        panStartRef.current.moved = true;
      }

      const nextPanX = Math.max(-2800, Math.min(2800, panStartRef.current.panX + dx));
      const nextPanY = Math.max(-2800, Math.min(2800, panStartRef.current.panY + dy));
      onCameraChange((prev) => ({
        ...prev,
        panX: nextPanX,
        panY: nextPanY,
      }));
    },
    [isPanning, onCameraChange]
  );

  const handlePointerUp = useCallback(() => {
    if (!isPanning) return;
    const wasMoved = panStartRef.current.moved;
    setIsPanning(false);
    if (!wasMoved && onCanvasBackgroundClick) {
      onCanvasBackgroundClick();
    }
  }, [isPanning, onCanvasBackgroundClick]);

  // Smooth Wheel Zoom around cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // Allow scrolling inside scrollable modals or guestbook lists
      if (e.target.closest("[data-scrollable='true']")) {
        return;
      }
      e.preventDefault();

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      onCameraChange((prev) => {
        const nextZoom = Math.max(0.4, Math.min(1.8, Number((prev.zoom * zoomFactor).toFixed(3))));
        if (nextZoom === prev.zoom) return prev;

        const rect = el.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const cursorOffsetX = e.clientX - rect.left - centerX;
        const cursorOffsetY = e.clientY - rect.top - centerY;

        const ratio = nextZoom / prev.zoom;
        const nextPanX = Math.max(-2800, Math.min(2800, cursorOffsetX - (cursorOffsetX - prev.panX) * ratio));
        const nextPanY = Math.max(-2800, Math.min(2800, cursorOffsetY - (cursorOffsetY - prev.panY) * ratio));

        return {
          panX: nextPanX,
          panY: nextPanY,
          zoom: nextZoom,
        };
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [onCameraChange]);

  const isLightGallery = theme === "ART_GALLERY";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-full h-full overflow-hidden select-none ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      } ${isLightGallery ? "text-stone-900 dark:text-stone-100" : "text-white"}`}
    >
      {/* Dynamic Atmosphere Background */}
      <SpatialAtmosphere
        theme={theme}
        customAccent={customAccent}
        panX={camera.panX}
        panY={camera.panY}
        zoom={camera.zoom}
      />

      {/* Origin (0,0) World Plane */}
      <div
        className="absolute left-1/2 top-1/2 w-0 h-0 will-change-transform"
        style={{
          transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale(${camera.zoom})`,
        }}
      >
        {/* Subtle Origin Axis Marker when in Builder Mode or Blueprint Theme */}
        {(isBuilderMode || theme === "BLUEPRINT_STUDIO") && (
          <div className="pointer-events-none absolute -left-24 -top-24 w-48 h-48 flex items-center justify-center opacity-40">
            <div className="w-full h-[1px] bg-current" />
            <div className="h-full w-[1px] bg-current absolute" />
            <div className="w-16 h-16 rounded-full border border-dashed border-current" />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
