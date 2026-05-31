import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const variants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};


const isVideo = (url = "") => {
    if (typeof url !== "string" || !url.trim()) {
        return false;
    }

    try {
        const pathname = new URL(url).pathname.toLowerCase();
        return [
            ".mp4",
            ".webm",
            ".ogg",
            ".mov",
            ".m4v",
        ].some((ext) => pathname.endsWith(ext));
    } catch {
        const cleanUrl = url.split(/[?#]/)[0].trim().toLowerCase();
        return /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl);
    }
};

export default function MediaCarousel({ media, page, setPage }) {
    const t = useTranslations('errors');
    const [touchStartX, setTouchStartX] = useState(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [page.index]);

    const isValidMedia =
        media &&
        Array.isArray(media) &&
        media.length > 0 &&
        media[Math.max(0, Math.min(page.index, media.length - 1))];

    const currentIndex = isValidMedia
        ? Math.max(0, Math.min(page.index, media.length - 1))
        : 0;

    const currentMedia = isValidMedia ? media[currentIndex] : null;

    const showNext = useCallback(() => {
        if (!media) return;
        if (page.index < media.length - 1) {
            setPage({ index: page.index + 1, direction: 1 });
        }
    }, [page.index, media, setPage]);

    const showPrev = useCallback(() => {
        if (!media) return;
        if (page.index > 0) {
            setPage({ index: page.index - 1, direction: -1 });
        }
    }, [page.index, media, setPage]);

    const handleTouchStart = useCallback((e) => {
        setTouchStartX(e.touches[0].clientX);
    }, []);

    const handleTouchEnd = useCallback(
        (e) => {
            if (touchStartX === null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            if (deltaX > 50) showPrev();
            else if (deltaX < -50) showNext();
            setTouchStartX(null);
        },
        [touchStartX, showPrev, showNext]
    );

    return (
        <div
            className="relative bg-black overflow-hidden w-full h-full flex items-center justify-center"
            style={{ minHeight: "400px" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence initial={false} custom={page.direction}>
                <motion.div
                    key={currentIndex}
                    className="absolute inset-0 flex items-center justify-center"
                    custom={page.direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    {!isValidMedia || hasError ? (
                        <p className="text-white">{t('mediaUnavailable')}</p>
                    ) : isVideo(currentMedia) ? (
                        <video
                            autoPlay
                            controls
                            className="max-w-full max-h-full object-contain"
                            style={{ maxHeight: "100%", maxWidth: "100%" }}
                            src={currentMedia}
                            onError={() => setHasError(true)}
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <Image
                                src={currentMedia}
                                alt={`Post media ${currentIndex + 1}`}
                                fill
                                unoptimized
                                className="object-contain"
                                onError={() => setHasError(true)}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {isValidMedia && currentIndex > 0 && (
                <button
                    className="absolute top-1/2 left-2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full z-10"
                    onClick={showPrev}
                >
                    <ChevronLeft />
                </button>
            )}

            {isValidMedia && currentIndex < media.length - 1 && (
                <button
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full z-10"
                    onClick={showNext}
                >
                    <ChevronRight />
                </button>
            )}

            {isValidMedia && media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10">
                    {currentIndex + 1} / {media.length}
                </div>
            )}
        </div>
    );
}