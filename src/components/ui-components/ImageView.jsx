"use client";

import Image from "next/image";
import { useState, useRef, useEffect, memo } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

/* =========================
   Utils
========================= */


const isVideo = (url = "") => {
    if (typeof url !== "string" || !url.trim()) {
        return false;
    }

    try {
        // Parse URL an toàn cho presigned URL
        const pathname = new URL(url).pathname.toLowerCase();
        console.log("pathname", pathname);
        return [
            ".mp4",
            ".webm",
            ".ogg",
            ".mov",
            ".m4v",
        ].some((ext) => pathname.endsWith(ext));
    } catch {
        // Fallback nếu không phải URL hợp lệ
        const cleanUrl = url.split(/[?#]/)[0].trim().toLowerCase();

        return /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl);
    }
};

/* =========================
   Reusable Components
========================= */

const Skeleton = () => (
    <div className="absolute inset-0 skeleton" />
);

const MediaFallback = ({ onClick }) => (
    <div
        onClick={onClick}
        className="absolute inset-0 flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)] text-sm cursor-pointer"
    >
        Media not available
    </div>
);

/* =========================
   Main Component
========================= */

const ImageView = memo(function ImageView({
                                            images = [],
                                            onImageClick = () => {},
                                            isActive = true,
                                            isPriority = false,
                                            highlightedFileId = null,
                                            onSimilarSearch = null,
                                          }) {
  const [mutedVideos, setMutedVideos] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const videoRefs = useRef({});

  const fallbackImage = "/images/media-not-found.png";

  /* =========================
     Reset refs when images change
  ========================= */
  useEffect(() => {
    videoRefs.current = {};
    setMediaErrors({});
    setLoadingStates({});
  }, [images]);

  /* =========================
     Toggle mute
  ========================= */
  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;

    setMutedVideos((prev) => ({
      ...prev,
      [index]: newMuted,
    }));
  };

  /* =========================
     Auto play / pause
  ========================= */
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (!video) return;

      if (isActive) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [isActive]);

  /* =========================
     IntersectionObserver
  ========================= */
  useEffect(() => {
    const observers = [];

    Object.entries(videoRefs.current).forEach(([_, video]) => {
      if (!video) return;

      const observer = new IntersectionObserver(
          ([entry]) => {
            if (!isActive) return;

            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          },
          { threshold: 0.5 }
      );

      observer.observe(video);
      observers.push({ video, observer });
    });

    return () => {
      observers.forEach(({ video, observer }) => {
        if (observer && video) observer.unobserve(video);
      });
    };
  }, [images, isActive]);

  /* =========================
     Render Media
  ========================= */

  const imageWrapperClass =
      "relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-50";

  const renderMedia = (src, index) => {
    const hasError = mediaErrors[index];
    const isVid = isVideo(src);

    const isHighlighted = Boolean(
      highlightedFileId &&
      typeof src === "string" &&
      (src === highlightedFileId ||
       src.includes(highlightedFileId) ||
       (highlightedFileId.length > 8 && src.includes(highlightedFileId.split("/").pop().split("?")[0])))
    );

    const currentWrapperClass = `${imageWrapperClass} ${
      isHighlighted ? "ring-4 ring-indigo-500 ring-offset-2 ring-offset-background shadow-lg shadow-indigo-500/25" : ""
    }`;

    // Case: src null / undefined
    if (!src) {
        return (
            <div key={index} className={currentWrapperClass}>
                <MediaFallback onClick={() => onImageClick()} />
            </div>
        );
    }

    return (
        <div key={index} className={currentWrapperClass}>
          {/* Skeleton */}
          {loadingStates[index] !== false && !hasError && <Skeleton />}

          {/* Highlight Badge */}
          {isHighlighted && (
            <div className="absolute top-2 left-2 z-10 bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
              <Sparkles size={11} className="text-amber-300" />
              <span>Ảnh khớp</span>
            </div>
          )}

          {/* 1-Click Similar Search Button */}
          {onSimilarSearch && !isVid && (
            <button
              type="button"
              title="Tìm ảnh tương tự"
              onClick={(e) => {
                e.stopPropagation();
                onSimilarSearch(src);
              }}
              className={`absolute ${isHighlighted ? "top-2 right-2" : "top-2 right-2"} z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-medium transition-all shadow-md hover:scale-105 active:scale-95`}
            >
              <Sparkles size={12} className="text-amber-400" />
              <span className="hidden sm:inline">Tìm tương tự</span>
            </button>
          )}

          {isVid ? (
              hasError ? (
                  <MediaFallback onClick={() => onImageClick()} />
              ) : (
                  <>
                    <video
                        ref={(el) => {
                          if (el) videoRefs.current[index] = el;
                        }}
                        src={src}
                        className="object-cover w-full h-full"
                        loop
                        muted
                        playsInline
                        autoPlay
                        onClick={() => onImageClick()}
                        onLoadedData={() =>
                            setLoadingStates((prev) => ({
                              ...prev,
                              [index]: false,
                            }))
                        }
                        onError={() =>
                            setMediaErrors((prev) => ({
                              ...prev,
                              [index]: true,
                            }))
                        }
                    />

                    <button
                        onClick={() => toggleMute(index)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      {mutedVideos[index] ? (
                          <VolumeX size={20} />
                      ) : (
                          <Volume2 size={20} />
                      )}
                    </button>
                  </>
              )
          ) : hasError ? (
              <MediaFallback onClick={() => onImageClick()} />
          ) : (
              <Image
                  src={src || fallbackImage}
                  alt={`Post media ${index + 1}`}
                  fill
                  priority={isPriority}
                  className="object-cover"
                  onClick={() => onImageClick()}
                  onLoad={() =>
                      setLoadingStates((prev) => ({
                        ...prev,
                        [index]: false,
                      }))
                  }
                  onError={() =>
                      setMediaErrors((prev) => ({
                        ...prev,
                        [index]: true,
                      }))
                  }
              />
          )}
        </div>
    );
  };

  /* =========================
     Layout Logic
  ========================= */

  if (!Array.isArray(images) || images.length === 0) return null;

  if (images.length === 1) {
    return <div className="mt-2">{renderMedia(images[0], 0)}</div>;
  }

  if (images.length === 2) {
    return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {images.map((src, index) => renderMedia(src, index))}
        </div>
    );
  }

  if (images.length === 3) {
    return (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {images.map((src, index) => renderMedia(src, index))}
        </div>
    );
  }

  if (images.length === 4) {
    return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {images.map((src, index) => renderMedia(src, index))}
        </div>
    );
  }

  if (images.length >= 5) {
    return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {images.slice(0, 3).map((src, index) =>
              renderMedia(src, index)
          )}

          <div className={`${imageWrapperClass} brightness-50`}>
            {renderMedia(images[3], 3)}

            <span
                className="absolute inset-0 flex items-center justify-center text-white font-semibold text-lg bg-black/40"
                onClick={() => onImageClick()}
            >
            +{images.length - 4}
          </span>
          </div>
        </div>
    );
  }

  return null;
});

export default ImageView;