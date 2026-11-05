"use client";

import { useState } from "react";
import { Globe, ExternalLink, MousePointer, Lock } from "lucide-react";

/**
 * Normalizes raw user input (iframe HTML snippet, YouTube watch/short/share link,
 * Spotify link, or general website URL) into a safe embeddable URL.
 */
export function normalizeEmbedUrl(rawInput = "", shouldAutoplay = false) {
  const trimmed = String(rawInput).trim();
  if (!trimmed) return "";

  // 1. If user pasted <iframe ... src="..."></iframe>, extract src
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const urlStr = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    // 2. YouTube watch / short / share links -> youtube.com/embed/...
    if (host === "youtube.com" || host === "m.youtube.com") {
      let vid = "";
      if (parsed.pathname === "/watch") {
        vid = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        vid = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        vid = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
      if (vid) {
        const query = shouldAutoplay ? "?autoplay=1&mute=0" : "";
        return `https://www.youtube.com/embed/${vid}${query}`;
      }
    }
    if (host === "youtu.be") {
      const vid = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (vid) {
        const query = shouldAutoplay ? "?autoplay=1&mute=0" : "";
        return `https://www.youtube.com/embed/${vid}${query}`;
      }
    }

    // 3. Spotify links -> open.spotify.com/embed/...
    if (host === "open.spotify.com") {
      if (!parsed.pathname.startsWith("/embed/")) {
        return `https://open.spotify.com/embed${parsed.pathname}`;
      }
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

export default function EmbedIframeNode({
  node,
  isBuilderMode = false,
  customAccent = "#6366F1",
  shouldAutoplay = false,
}) {
  // Interactive toggle so visitors can either pan the canvas or interact directly inside the iframe
  const [isInteractive, setIsInteractive] = useState(true);

  const rawUrl = node?.content?.embedUrl || "";
  const title = node?.content?.title || "";
  const frameStyle = node?.frameStyle || "BROWSER_WINDOW";
  const embedSrc = normalizeEmbedUrl(rawUrl, shouldAutoplay);

  if (!embedSrc) {
    return null;
  }

  let hostname = "embed";
  try {
    hostname = new URL(embedSrc).hostname.replace(/^www\./, "");
  } catch {
    // ignore
  }

  const isYoutube = hostname.includes("youtube.com") || hostname.includes("youtu.be");

  const wrapperClass = {
    BROWSER_WINDOW:
      "bg-zinc-900/95 text-white rounded-2xl border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.65)] overflow-hidden w-[360px] sm:w-[440px]",
    CINEMA_SCREEN:
      "bg-black text-white rounded-2xl border-2 border-indigo-500/40 shadow-[0_0_65px_rgba(99,102,241,0.3)] overflow-hidden w-[380px] sm:w-[460px]",
    GLASS_PORTAL:
      "bg-zinc-900/70 text-white p-2.5 rounded-3xl backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.55)] overflow-hidden w-[360px] sm:w-[440px]",
  }[frameStyle] || "bg-zinc-900/95 text-white rounded-2xl border border-white/15 overflow-hidden w-[380px]";

  return (
    <div className={wrapperClass}>
      {/* Top Window Bar */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-zinc-950/80 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] text-zinc-300 truncate">
            <Globe size={11} style={{ color: customAccent }} className="shrink-0" />
            <span className="truncate">{title || hostname}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isBuilderMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsInteractive((prev) => !prev);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                isInteractive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-white/10 text-zinc-400"
              }`}
              title={isInteractive ? "Đang bật tương tác khung nhúng" : "Đang khóa để kéo không gian"}
            >
              {isInteractive ? <MousePointer size={11} /> : <Lock size={11} />}
            </button>
          )}
          <a
            href={embedSrc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Mở trang gốc"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Embedded Iframe Body */}
      <div className={`relative w-full ${isYoutube ? "aspect-video" : "h-[280px]"} bg-zinc-950`}>
        <iframe
          src={embedSrc}
          title={title || hostname}
          className={`w-full h-full border-0 ${
            isBuilderMode || !isInteractive ? "pointer-events-none" : "pointer-events-auto"
          }`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
