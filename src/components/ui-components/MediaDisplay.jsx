// components/MediaDisplay.jsx
import Image from "next/image";
import { memo, useState } from "react";

const isVideo = (url = "") => /\.(mp4|webm|ogg)$/i.test(url);

export const MediaDisplay = memo(({ url, alt, className = "" }) => {
    const [hasError, setHasError] = useState(false);

    if (!url || hasError) {
        return (
            <div
                className={`rounded-lg max-h-60 w-full flex items-center justify-center 
        bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm ${className}`}
            >
                Media not available
            </div>
        );
    }

    return isVideo(url) ? (
        <video
            controls
            className={`rounded-lg max-h-60 w-full object-contain ${className}`}
            src={url}
            onError={() => setHasError(true)} // 👈 video lỗi
        />
    ) : (
        <Image
            src={url}
            alt={alt}
            width={300}
            height={200}
            className={`rounded-lg max-h-60 w-auto object-contain ${className}`}
            onError={() => setHasError(true)} // 👈 image lỗi
        />
    );
});

MediaDisplay.displayName = "MediaDisplay";