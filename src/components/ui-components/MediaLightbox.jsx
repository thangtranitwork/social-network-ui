"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const isVideoUrl = (url = "") => {
  if (typeof url !== "string") return false;
  return /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
};

export default function MediaLightbox({
  isOpen,
  onClose,
  src,
  type,
  alt = "Enlarged media preview",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !src) return null;

  const isVideo = type === "video" || isVideoUrl(src);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Blurred dark backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer transition-opacity"
        onClick={onClose}
      />

      {/* Single clean close button in top right corner */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white transition-all shadow-lg backdrop-blur-sm cursor-pointer"
        aria-label="Close preview"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main media display without thick black box or padding */}
      <div
        className="relative z-10 flex items-center justify-center max-w-[94vw] max-h-[92vh] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-[94vw] max-h-[92vh] rounded-xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-w-[94vw] max-h-[92vh] object-contain select-none rounded-xl shadow-2xl"
          />
        )}
      </div>
    </div>,
    document.body
  );
}
