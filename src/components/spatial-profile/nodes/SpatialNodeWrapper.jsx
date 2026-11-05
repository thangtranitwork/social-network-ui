"use client";

import { useRef, useState, useCallback } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Layers, Palette, Trash2, PlayCircle } from "lucide-react";
import { NODE_FRAME_STYLES } from "../spatialConstants";

export default function SpatialNodeWrapper({
  node,
  zoom = 1,
  theme = "COSMIC_VOID",
  isBuilderMode = false,
  isSelected = false,
  isAutoplayTarget = false,
  onSelect,
  onUpdateNode,
  onBringToFront,
  onToggleAutoplay,
  onDeleteNode,
  tSpace,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, startX: 0, startY: 0, moved: false });

  const handlePointerDown = useCallback(
    (e) => {
      if (!isBuilderMode) return;
      // Ignore clicks on node toolbar buttons
      if (e.target.closest("[data-node-toolbar='true']")) return;

      e.stopPropagation();
      if (onSelect) onSelect(node.id);

      setIsDragging(true);
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startX: node.x,
        startY: node.y,
        moved: false,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [isBuilderMode, node.id, node.x, node.y, onSelect]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || !isBuilderMode) return;
      e.stopPropagation();

      const dx = (e.clientX - dragStartRef.current.clientX) / zoom;
      const dy = (e.clientY - dragStartRef.current.clientY) / zoom;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragStartRef.current.moved = true;
      }

      const nextX = Math.max(-2800, Math.min(2800, Math.round(dragStartRef.current.startX + dx)));
      const nextY = Math.max(-2800, Math.min(2800, Math.round(dragStartRef.current.startY + dy)));

      onUpdateNode(node.id, { x: nextX, y: nextY });
    },
    [isDragging, isBuilderMode, node.id, onUpdateNode, zoom]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
    [isDragging]
  );

  const cycleFrameStyle = (e) => {
    e.stopPropagation();
    const styles = NODE_FRAME_STYLES[node.type] || ["GLASS"];
    const currentIdx = styles.indexOf(node.frameStyle);
    const nextStyle = styles[(currentIdx + 1) % styles.length];
    onUpdateNode(node.id, { frameStyle: nextStyle });
  };

  const adjustScale = (e, delta) => {
    e.stopPropagation();
    const nextScale = Math.max(0.6, Math.min(2.2, Number(((node.scale || 1) + delta).toFixed(2))));
    onUpdateNode(node.id, { scale: nextScale });
  };

  const adjustRotation = (e, delta) => {
    e.stopPropagation();
    const nextRot = Math.max(-45, Math.min(45, Math.round((node.rotation || 0) + delta)));
    onUpdateNode(node.id, { rotation: nextRot });
  };

  return (
    <div
      data-spatial-node="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%) scale(${node.scale || 1}) rotate(${
          node.rotation || 0
        }deg)`,
        zIndex: isSelected ? 900 : node.zIndex || 10,
      }}
      className={`absolute left-0 top-0 transition-shadow duration-200 ${
        isBuilderMode
          ? isDragging
            ? "cursor-grabbing"
            : "cursor-grab"
          : "cursor-default"
      }`}
    >
      {/* Blueprint Coordinate Readout */}
      {(isBuilderMode || theme === "BLUEPRINT_STUDIO") && (
        <div className="pointer-events-none absolute -top-6 left-1 text-[10px] font-mono tracking-wider opacity-60 whitespace-nowrap">
          X:{Math.round(node.x)} Y:{Math.round(node.y)}
        </div>
      )}

      {/* Builder Selection Ring & Context Controls */}
      {isBuilderMode && isSelected && (
        <div
          data-node-toolbar="true"
          className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-900/95 text-white border border-white/15 shadow-2xl backdrop-blur-xl z-50 whitespace-nowrap"
        >
          <button
            type="button"
            onClick={cycleFrameStyle}
            title={tSpace("changeFrame")}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium hover:bg-white/15 transition-colors"
          >
            <Palette size={13} className="text-indigo-400" />
            <span>{tSpace("changeFrame")}</span>
          </button>

          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

          <button
            type="button"
            onClick={(e) => adjustScale(e, -0.1)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => adjustScale(e, 0.1)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
            title="Phóng to"
          >
            <ZoomIn size={13} />
          </button>

          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

          <button
            type="button"
            onClick={(e) => adjustRotation(e, -3)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
            title="Xoay trái"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => adjustRotation(e, 3)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
            title="Xoay phải"
          >
            <RotateCw size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBringToFront(node.id);
            }}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
            title={tSpace("bringFront")}
          >
            <Layers size={13} />
          </button>

          {(node.type === "AUDIO_VINYL" || node.type === "EMBED_IFRAME") && (
            <>
              <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoplay?.(node.id);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isAutoplayTarget
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "hover:bg-white/15 text-zinc-300"
                }`}
                title={isAutoplayTarget ? tSpace("disableAutoplay") : tSpace("enableAutoplay")}
              >
                <PlayCircle size={13} className={isAutoplayTarget ? "text-zinc-950" : "text-amber-400"} />
                <span>{tSpace("autoplayTag")}</span>
              </button>
            </>
          )}

          {node.type !== "IDENTITY_CORE" && (
            <>
              <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="p-1.5 rounded-full text-rose-400 hover:bg-rose-500/20 transition-colors"
                title={tSpace("removeNode")}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Autoplay Badge (Only shown in Builder Mode) */}
      {isBuilderMode && isAutoplayTarget && (
        <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-zinc-950 font-bold text-[10px] shadow-lg tracking-wide z-20 whitespace-nowrap">
          <PlayCircle size={11} />
          <span>{tSpace("autoplayActiveBadge")}</span>
        </div>
      )}

      {/* Node Content Box */}
      <div
        className={`relative transition-all duration-200 ${
          isBuilderMode && isSelected
            ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded-2xl"
            : isBuilderMode
            ? "hover:ring-1 hover:ring-indigo-400/60 rounded-2xl"
            : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
