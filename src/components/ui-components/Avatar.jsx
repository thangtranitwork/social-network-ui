import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";

export default function Avatar({
  src,
  alt = "User avatar",
  width,
  height,
  className = "",
  isGroup = false,
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const previousSrcRef = useRef(src);

  const defaultSrc = "/defaultAvatar.png";

  // A src is only usable if it is an absolute URL, a relative path, or a data URL.
  // Raw storage IDs (e.g. "abc-123.jpg") are NOT valid and must be rejected.
  const isValidSrc = (s) =>
    !!s &&
    (s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("data:") ||
      s.startsWith("/"));

  const validSrc = isValidSrc(src) ? src : null;
  const imageSrc = validSrc || defaultSrc;
  const isExternalUrl =
    imageSrc.startsWith("http://") ||
    imageSrc.startsWith("https://") ||
    imageSrc.startsWith("data:");
  const showGroupFallback = isGroup && !validSrc;

  const finalWidth = width ?? 48;
  const finalHeight = height ?? 48;
  const hasExplicitSize = width !== undefined && height !== undefined;

  // Add fallback class if no size provided via className
  const shouldApplyDefaultSize =
    !className.includes("w-") && !className.includes("h-") && !hasExplicitSize;

  useEffect(() => {
    if (previousSrcRef.current !== src) {
      setHasError(false);
      setImageLoaded(false);

      // Only show loading spinner for valid, non-default srcs
      if (validSrc && validSrc !== defaultSrc) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }

      previousSrcRef.current = src;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setImageLoaded(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageLoaded(true);
  }, []);

  if (showGroupFallback) {
    return (
      <div
        className={clsx(
          "relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 shadow-inner",
          shouldApplyDefaultSize && "w-12 h-12",
          className
        )}
        style={hasExplicitSize ? { width: finalWidth, height: finalHeight } : undefined}
        {...props}
      >
        <svg
          className="w-1/2 h-1/2 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative inline-block rounded-full overflow-hidden bg-gray-100",
        shouldApplyDefaultSize && "w-12 h-12",
        className
      )}
      style={hasExplicitSize ? { width: finalWidth, height: finalHeight } : undefined}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className={clsx(
          "object-cover object-center transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={isExternalUrl}
        priority={finalWidth > 100}
      />

      {!imageLoaded && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
          <svg
            className="w-1/2 h-1/2 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
