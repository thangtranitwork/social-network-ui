"use client";

import Image from "next/image";
import { useState, useRef, useEffect, memo } from "react";
import { Volume2, VolumeX } from "lucide-react";

/* =========================
   Utils
========================= */

const isVideo = (url) =>
    typeof url === "string" && /\.(mp4|webm|ogg)$/i.test(url);

/* =========================
   Reusable Components
========================= */

const Skeleton = () => (
    <div className="absolute inset-0 animate-pulse bg-gray-200" />
);

const MediaFallback = ({ onClick }) => (
    <div
        onClick={onClick}
        className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm cursor-pointer"
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

    // Case: src null / undefined
      if (!src) {
          return (
              <div key={index} className={imageWrapperClass}>
                  <MediaFallback onClick={() => onImageClick()} />
              </div>
          );
      }

    return (
        <div key={index} className={imageWrapperClass}>
          {/* Skeleton */}
          {loadingStates[index] !== false && !hasError && <Skeleton />}

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