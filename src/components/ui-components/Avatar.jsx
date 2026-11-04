import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";

export default function Avatar({
  src,
  alt = "User avatar",
  width,
  height,
  size,
  className = "",
  isGroup = false,
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const previousSrcRef = useRef(src);
  const imgRef = useRef(null);

  const defaultSrc = "/defaultAvatar.png";

  // Normalize src: Handle absolute URL, relative path, data URL, or raw storage/file ID
  const normalizeSrc = (s) => {
    if (!s || typeof s !== "string" || !s.trim()) return null;
    const trimmed = s.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("/")
    ) {
      return trimmed;
    }
    // If raw file ID or storage filename, resolve via API Gateway files route
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:11111";
    return `${apiBase}/v1/files/${trimmed}`;
  };

  const validSrc = normalizeSrc(src);
  const imageSrc = hasError || !validSrc ? defaultSrc : validSrc;
  const isExternalUrl =
    imageSrc.startsWith("http://") ||
    imageSrc.startsWith("https://") ||
    imageSrc.startsWith("data:");
  const showGroupFallback = isGroup && !validSrc;

  // Map size prop if provided
  let sizeWidth = width;
  let sizeHeight = height;
  if (size !== undefined) {
    if (typeof size === "number") {
      sizeWidth = size;
      sizeHeight = size;
    } else if (size === "sm") {
      sizeWidth = 32;
      sizeHeight = 32;
    } else if (size === "md") {
      sizeWidth = 48;
      sizeHeight = 48;
    } else if (size === "lg") {
      sizeWidth = 80;
      sizeHeight = 80;
    } else if (!isNaN(Number(size))) {
      sizeWidth = Number(size);
      sizeHeight = Number(size);
    }
  }

  const finalWidth = sizeWidth ?? 48;
  const finalHeight = sizeHeight ?? 48;
  const hasExplicitSize = sizeWidth !== undefined && sizeHeight !== undefined;

  // Add fallback class if no size provided via className or size prop
  const shouldApplyDefaultSize =
    !className.includes("w-") && !className.includes("h-") && !hasExplicitSize;

  useEffect(() => {
    if (previousSrcRef.current !== src) {
      setHasError(false);
      setImageLoaded(false);

      if (validSrc && validSrc !== defaultSrc) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }

      previousSrcRef.current = src;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Check if browser already loaded the image from cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
      setIsLoading(false);
    }
  }, [imageSrc]);

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

  const isDefault = imageSrc === defaultSrc;

  return (
    <div
      className={clsx(
        "relative inline-block rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800",
        shouldApplyDefaultSize && "w-12 h-12",
        className
      )}
      style={hasExplicitSize ? { width: finalWidth, height: finalHeight } : undefined}
      {...props}
    >
      {isLoading && !isDefault && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] rounded-full z-10">
          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
        </div>
      )}

      <Image
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className="object-cover object-center w-full h-full"
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
    </div>
  );
}
