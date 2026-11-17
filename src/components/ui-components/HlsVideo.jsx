"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import Hls from "hls.js";

const VIDEO_EXT_RE = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;

function extractFileId(src, explicitFileId) {
  if (explicitFileId) return explicitFileId;
  if (!src || typeof src !== "string") return "";
  if (src.startsWith("blob:") || src.startsWith("data:")) return "";

  try {
    const parsed = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    const last = decodeURIComponent(segments[segments.length - 1]);
    return VIDEO_EXT_RE.test(last) ? last : "";
  } catch {
    return "";
  }
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
}

const HlsVideo = forwardRef(function HlsVideo(
  { src, fileId: explicitFileId, enableHls = true, ...videoProps },
  forwardedRef
) {
  const internalRef = useRef(null);
  useImperativeHandle(forwardedRef, () => internalRef.current);

  const fileId = useMemo(
    () => (enableHls ? extractFileId(src, explicitFileId) : ""),
    [src, explicitFileId, enableHls]
  );

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !src) return;

    let cancelled = false;
    let hlsInstance = null;

    const attachFallback = () => {
      if (cancelled) return;
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      if (video.getAttribute("src") !== src) {
        video.src = src;
      }
    };

    if (!fileId) {
      attachFallback();
      return () => {
        cancelled = true;
      };
    }

    const apiBase = getApiBaseUrl();
    const statusUrl = `${apiBase}/v1/files/${encodeURIComponent(fileId)}/hls-status`;

    fetch(statusUrl, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.status !== "ready" || !data?.masterUrl) {
          attachFallback();
          return;
        }

        const masterUrl = data.masterUrl.startsWith("http")
          ? data.masterUrl
          : `${apiBase}${data.masterUrl}`;

        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });
          hlsInstance.loadSource(masterUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.ERROR, (_, errData) => {
            if (errData?.fatal) {
              attachFallback();
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = masterUrl;
        } else {
          attachFallback();
        }
      })
      .catch(() => {
        attachFallback();
      });

    return () => {
      cancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    };
  }, [src, fileId]);

  return <video ref={internalRef} src={src} {...videoProps} />;
});

export default HlsVideo;
