"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import Modal from "@/components/ui-components/Modal";

export default function MediaFrameNode({ node, isBuilderMode = false }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileUrl = node?.content?.fileUrl || "";
  const caption = node?.content?.caption || "";
  const frameStyle = node?.frameStyle || "GALLERY_MATTE";
  const isVideo = fileUrl && /\.(mp4|mov|webm)$/i.test(fileUrl);

  if (!fileUrl) {
    return null;
  }

  const frameClasses = {
    GALLERY_MATTE:
      "bg-[#FAF8F5] text-stone-900 p-4 pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] border-[8px] border-stone-900 dark:border-stone-200 rounded-sm w-[260px] sm:w-[290px]",
    BORDERLESS:
      "bg-transparent p-0 rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)] border border-white/15 w-[260px] sm:w-[290px]",
    TAPE_PIN:
      "bg-[#FBF9F5] text-stone-900 p-3 pb-4 rounded-md shadow-[0_18px_45px_rgba(0,0,0,0.38)] w-[250px] sm:w-[280px]",
  }[frameStyle] || "bg-[#FAF8F5] text-stone-900 p-4 rounded-md shadow-2xl w-[270px]";

  return (
    <>
      <div
        onClick={() => {
          if (!isBuilderMode) setIsLightboxOpen(true);
        }}
        className={`group relative transition-transform duration-300 ${
          !isBuilderMode ? "cursor-pointer hover:scale-[1.02]" : ""
        } ${frameClasses}`}
      >
        {/* Realistic Washi Tape Top Pin */}
        {frameStyle === "TAPE_PIN" && (
          <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-200/75 backdrop-blur-sm border border-amber-300/50 -rotate-2 shadow-sm z-10" />
        )}

        <div className="relative w-full aspect-square overflow-hidden bg-zinc-900 rounded-sm">
          {isVideo ? (
            <video src={fileUrl} muted loop playsInline autoPlay className="w-full h-full object-cover" />
          ) : (
            <img
              src={fileUrl}
              alt={caption || "Artwork"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {!isBuilderMode && (
            <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={13} />
            </div>
          )}
        </div>

        {caption && (
          <p
            className={`mt-2.5 text-center text-xs font-medium tracking-wide ${
              frameStyle === "BORDERLESS"
                ? "absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white py-3 px-3"
                : "text-stone-700"
            }`}
          >
            {caption}
          </p>
        )}
      </div>

      {isLightboxOpen && (
        <Modal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          size="large"
          hideCloseButton={true}
        >
          <div className="relative flex flex-col items-center justify-center p-4 bg-black/95 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-20"
            >
              <X size={18} />
            </button>
            {isVideo ? (
              <video src={fileUrl} controls autoPlay className="max-h-[78vh] max-w-full rounded-lg" />
            ) : (
              <img src={fileUrl} alt={caption || "Artwork"} className="max-h-[78vh] max-w-full object-contain rounded-lg" />
            )}
            {caption && <p className="mt-3 text-sm text-zinc-200 font-medium">{caption}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
